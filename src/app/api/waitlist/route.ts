import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ email: parsed.data.email.toLowerCase() });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: true, message: "You're already on the list!" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
