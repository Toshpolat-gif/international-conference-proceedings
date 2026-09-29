import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

import { requireAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

const schema = z.object({
  articleId: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  status: z.enum(["draft", "published"]),
  authorEmails: z.array(z.string().trim().email()).min(1).max(20),
  articleUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const input = schema.parse(await request.json());

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(apiKey);

    const recipients = [...new Set(input.authorEmails)];
    const isPublished = input.status === "published";

    const subject = isPublished
      ? `Your article has been published — ${input.title}`
      : `Your article has been added — ${input.title}`;

    const results = await Promise.all(
  recipients.map(async (email) => {
    const { data, error } = await resend.emails.send(
      {
        from: "International Conference Proceedings <noreply@conferencepublisher.online>",
        to: [email],
        subject,
        html: createHtmlEmail(input.title, input.status, input.articleUrl),
        text: createTextEmail(input.title, input.status, input.articleUrl),
      },
      {
        idempotencyKey: `article-status/${input.articleId}/${input.status}/${email}`,
      }
    );

    if (error) {
      throw new Error(
        `Failed to send notification to ${email}: ${error.message}`
      );
    }

    return data;
  })
);

    return NextResponse.json({
      ok: true,
      sent: recipients.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid article notification data." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send article notification.",
      },
      { status: 400 }
    );
  }
}

function createHtmlEmail(
  title: string,
  status: "draft" | "published",
  articleUrl?: string
) {
  const isPublished = status === "published";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102A43;">
      <h2 style="margin-bottom: 8px;">
        International Conference Proceedings
      </h2>

      <p>Dear Author,</p>

      <p>
        Your article has been added to the
        <strong>International Conference Proceedings</strong>
        publication system.
      </p>

      <p>
        <strong>Article:</strong><br />
        ${escapeHtml(title)}
      </p>

      <p>
        <strong>Status:</strong>
        ${isPublished ? "Published" : "Draft"}
      </p>

      ${
        isPublished && articleUrl
          ? `
            <p>
              Your article is now publicly available online.
            </p>

            <p>
              <a
                href="${escapeHtml(articleUrl)}"
                style="
                  display:inline-block;
                  padding:10px 16px;
                  background:#102A43;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                "
              >
                View Article
              </a>
            </p>
          `
          : `
            <p>
              The article record has been added to our system.
              It is not yet publicly published.
            </p>
          `
      }

      <p>
        Regards,<br />
        International Conference Proceedings
      </p>
    </div>
  `;
}

function createTextEmail(
  title: string,
  status: "draft" | "published",
  articleUrl?: string
) {
  if (status === "published") {
    return `International Conference Proceedings

Dear Author,

Your article has been published.

Article: ${title}
Status: Published

View article:
${articleUrl || "Available through the publication platform."}

Regards,
International Conference Proceedings`;
  }

  return `International Conference Proceedings

Dear Author,

Your article has been added to our publication system.

Article: ${title}
Status: Draft

The article record has been added to our system. It is not yet publicly published.

Regards,
International Conference Proceedings`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}