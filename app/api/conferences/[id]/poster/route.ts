import { NextResponse } from "next/server";
import { createInlineDownloadUrl } from "@/lib/b2";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await getAdminDb().collection("conferences").doc(id).get();
    if (!doc.exists || doc.data()?.status !== "published" || !doc.data()?.posterKey) return new NextResponse("Not found", { status: 404 });
    const url = await createInlineDownloadUrl({ key: doc.data()!.posterKey as string, contentType: (doc.data()!.posterContentType as string) || "image/webp", expiresIn: 900 });
    return NextResponse.redirect(url, 302);
  } catch {
    return new NextResponse("Unable to open poster", { status: 500 });
  }
}
