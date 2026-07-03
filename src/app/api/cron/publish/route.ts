import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getValidAccessToken,
  isRateLimitError,
  publishPinToPinterest,
} from "@/lib/pinterest";
import type { PinterestAccount, Pin } from "@/types/database";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: pins, error } = await supabase
    .from("pins")
    .select("*, boards(pinterest_board_id)")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pins || pins.length === 0) {
    return NextResponse.json({ processed: 0, results: [] });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const pin of pins as Array<
    Pin & { boards: { pinterest_board_id: string } | null }
  >) {
    const { data: locked } = await supabase
      .from("pins")
      .update({ status: "publishing" })
      .eq("id", pin.id)
      .eq("status", "scheduled")
      .select()
      .single();

    if (!locked) {
      results.push({ id: pin.id, status: "skipped", error: "Already processing" });
      continue;
    }

    if (!pin.boards?.pinterest_board_id) {
      await supabase
        .from("pins")
        .update({
          status: "failed",
          error_message: "No board assigned",
        })
        .eq("id", pin.id);
      results.push({ id: pin.id, status: "failed", error: "No board assigned" });
      continue;
    }

    if (!pin.title || !pin.description) {
      await supabase
        .from("pins")
        .update({
          status: "failed",
          error_message: "Missing title or description",
        })
        .eq("id", pin.id);
      results.push({
        id: pin.id,
        status: "failed",
        error: "Missing title or description",
      });
      continue;
    }

    const { data: account } = await supabase
      .from("pinterest_accounts")
      .select("*")
      .eq("user_id", pin.user_id)
      .single();

    if (!account) {
      await supabase
        .from("pins")
        .update({
          status: "failed",
          error_message: "Pinterest account not connected",
        })
        .eq("id", pin.id);
      results.push({
        id: pin.id,
        status: "failed",
        error: "Pinterest account not connected",
      });
      continue;
    }

    try {
      const accessToken = await getValidAccessToken(account as PinterestAccount);

      const published = await publishPinToPinterest(accessToken, {
        boardId: pin.boards.pinterest_board_id,
        title: pin.title,
        description: pin.description,
        altText: pin.alt_text ?? "",
        link: pin.destination_link,
        imageUrl: pin.image_url,
      });

      await supabase
        .from("pins")
        .update({
          status: "posted",
          pinterest_pin_id: published.id,
          posted_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", pin.id);

      results.push({ id: pin.id, status: "posted" });
    } catch (err) {
      if (isRateLimitError(err)) {
        await supabase
          .from("pins")
          .update({ status: "scheduled" })
          .eq("id", pin.id);
        results.push({ id: pin.id, status: "rate_limited" });
        continue;
      }

      const message = err instanceof Error ? err.message : "Publish failed";

      await supabase
        .from("pins")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", pin.id);

      results.push({ id: pin.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
