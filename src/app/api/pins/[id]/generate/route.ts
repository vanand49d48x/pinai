import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePinMetadata } from "@/lib/anthropic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pin, error: fetchError } = await supabase
    .from("pins")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !pin) {
    return NextResponse.json({ error: "Pin not found" }, { status: 404 });
  }

  if (!["draft", "ready", "failed"].includes(pin.status)) {
    return NextResponse.json(
      { error: `Cannot generate metadata for pin with status: ${pin.status}` },
      { status: 400 }
    );
  }

  await supabase
    .from("pins")
    .update({ status: "generating" })
    .eq("id", id);

  try {
    const metadata = await generatePinMetadata(
      pin.image_url,
      pin.topic,
      pin.keywords
    );

    const { data: updated, error: updateError } = await supabase
      .from("pins")
      .update({
        title: metadata.title,
        description: metadata.description,
        alt_text: metadata.alt_text,
        status: "ready",
        error_message: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ pin: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";

    await supabase
      .from("pins")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
