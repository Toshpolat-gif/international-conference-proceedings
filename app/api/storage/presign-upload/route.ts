import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { createUploadUrl } from "@/lib/b2";

const schema = z.object({
  fileName: z.string().trim().min(1).max(220),
  contentType: z.string().trim().min(1).max(120),
  size: z.number().int().positive(),
  kind: z.enum(["article", "poster", "proceedings"]),
  year: z.string().regex(/^20\d{2}$/),
  conferenceSlug: z.string().trim().min(1).max(160),
  articleId: z.string().trim().min(1).max(120).optional()
});

const MAX_PDF = 35 * 1024 * 1024;
const MAX_POSTER = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const input = schema.parse(await request.json());

    const isPdf = input.contentType === "application/pdf";
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(input.contentType);
    if (input.kind === "poster" && (!isImage || input.size > MAX_POSTER)) {
      return NextResponse.json({ error: "Poster must be JPG, PNG, or WebP and smaller than 12 MB." }, { status: 400 });
    }
    if (input.kind !== "poster" && (!isPdf || input.size > MAX_PDF)) {
      return NextResponse.json({ error: "PDF must be smaller than 35 MB." }, { status: 400 });
    }

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
    let key = `${input.kind === "article" ? "articles" : input.kind === "poster" ? "posters" : "proceedings"}/${input.year}/${input.conferenceSlug}/`;
    key += input.kind === "article" ? `${input.articleId || crypto.randomUUID()}-${safeName}` : safeName;

    const url = await createUploadUrl({ key, contentType: input.contentType, contentLength: input.size, expiresIn: 900 });
    return NextResponse.json({ key, url, expiresIn: 900 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create upload URL." }, { status: 401 });
  }
}
