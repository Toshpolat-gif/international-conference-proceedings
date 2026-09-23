import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug } from "@/lib/public-data";
import { createDownloadUrl } from "@/lib/b2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article || article.status !== "published" || !article.pdfKey) {
      return new NextResponse("Not found", { status: 404 });
    }

    const download =
      request.nextUrl.searchParams.get("download") === "1";

    const url = await createDownloadUrl({
      key: article.pdfKey,
      downloadName: download
        ? article.pdfFileName || "article.pdf"
        : undefined,
      expiresIn: 900,
    });

    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error("ARTICLE PDF ROUTE ERROR:", error);

    return new NextResponse("Unable to open the PDF", {
      status: 500,
    });
  }
}