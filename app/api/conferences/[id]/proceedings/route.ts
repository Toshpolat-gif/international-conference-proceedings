import { NextRequest, NextResponse } from "next/server";
import { createInlineDownloadUrl, createDownloadUrl } from "@/lib/b2";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await getAdminDb().collection("conferences").doc(id).get();
    if (!doc.exists || doc.data()?.status !== "published" || !doc.data()?.proceedingsKey) return new NextResponse("Not found", { status: 404 });
    const data = doc.data()!;
    const download = request.nextUrl.searchParams.get("download") === "1";
    const url = download
      ? await createDownloadUrl({ key: data.proceedingsKey as string, downloadName: "proceedings.pdf", expiresIn: 900 })
      : await createInlineDownloadUrl({ key: data.proceedingsKey as string, contentType: "application/pdf", expiresIn: 900 });
    return NextResponse.redirect(url, 302);
  } catch {
    return new NextResponse("Unable to open proceedings", { status: 500 });
  }
}
