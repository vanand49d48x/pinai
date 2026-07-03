import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bulkPinSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bulkPinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name")
    .eq("user_id", user.id);

  const boardMap = new Map(
    (boards ?? []).map((b) => [b.name.toLowerCase(), b.id])
  );

  const inserts = parsed.data.pins.map((pin) => {
    let boardId: string | null = null;
    if (pin.board_name) {
      boardId = boardMap.get(pin.board_name.toLowerCase()) ?? null;
    }

    let scheduledAt: string | null = null;
    if (pin.scheduled_at) {
      const date = new Date(pin.scheduled_at);
      if (!isNaN(date.getTime())) {
        scheduledAt = date.toISOString();
      }
    }

    return {
      user_id: user.id,
      image_url: pin.image_url,
      topic: pin.topic,
      keywords: pin.keywords,
      destination_link: pin.destination_link ?? null,
      board_id: boardId,
      scheduled_at: scheduledAt,
      status: scheduledAt ? "scheduled" : "draft",
    };
  });

  const { data, error } = await supabase
    .from("pins")
    .insert(inserts)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pins: data, count: data.length }, { status: 201 });
}
