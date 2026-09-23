import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(5000),
  website: z.string().optional().default("")
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    if (input.website) return NextResponse.json({ ok: true });

    await getAdminDb().collection("contactMessages").add({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: "unread",
      createdAt: new Date()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Please check the form fields." : "Unable to save the message.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
