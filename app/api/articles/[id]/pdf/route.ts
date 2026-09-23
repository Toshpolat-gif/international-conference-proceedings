import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { createDownloadUrl } from "@/lib/b2";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await getAdminDb().collection("articles").doc(id).get();
    if (!doc.exists || doc.data()?.status !== "published" || !doc.data()?.pdfKey) return new NextResponse("Not found", { status: 404 });
    const data = doc.data()!;
    await getAdminDb().collection("articles").doc(id).update({ downloadCount: FieldValue.increment(1) });
    const download = request.nextUrl.searchParams.get("download") === "1";
    const url = await createDownloadUrl({ key: data.pdfKey as string, downloadName: download ? (data.pdfFileName as string | undefined) : undefined, expiresIn: 900 });
    return NextResponse.redirect(url, 302);
    } catch (error) {
    console.error("PDF ROUTE ERROR:", error);

    return new NextResponse("Unable to open the PDF", {
      status: 500
    });
  }
}
