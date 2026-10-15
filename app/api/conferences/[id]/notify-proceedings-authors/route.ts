import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { requireAdmin } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://conferencepublisher.online"
).replace(/\/+$/, "");

const SENDING_TIMEOUT_MS = 10 * 60 * 1000;

type EmailAuthor = {
  email?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createHtmlEmail(title: string, proceedingsUrl: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#102A43">
      <h2>International Conference Proceedings</h2>

      <p>Dear Author,</p>

      <p>
        The conference proceedings containing your published article
        are now available online.
      </p>

      <p><strong>Conference:</strong> ${escapeHtml(title)}</p>

      <p>
        You can access the conference proceedings using the link below.
      </p>

      <p>
        <a
          href="${escapeHtml(proceedingsUrl)}"
          style="display:inline-block;padding:12px 18px;background:#102A43;
          color:#ffffff;text-decoration:none;border-radius:6px"
        >
          View Conference Proceedings
        </a>
      </p>

      <p>
        Regards,<br />
        International Conference Proceedings
      </p>
    </div>
  `;
}

function createTextEmail(title: string, proceedingsUrl: string) {
  return `International Conference Proceedings

Dear Author,

The conference proceedings containing your published article are now available online.

Conference: ${title}

View Conference Proceedings:
${proceedingsUrl}

Regards,
International Conference Proceedings`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const db = getAdminDb();

    const conferenceRef = db.collection("conferences").doc(id);
    const conferenceSnap = await conferenceRef.get();

    if (!conferenceSnap.exists) {
      return NextResponse.json(
        { error: "Conference not found." },
        { status: 404 }
      );
    }

    const conference = conferenceSnap.data()!;

    if (conference.status !== "published") {
      return NextResponse.json(
        { error: "Publish the conference before notifying authors." },
        { status: 409 }
      );
    }

    if (!conference.proceedingsKey) {
      return NextResponse.json(
        { error: "Upload the proceedings PDF before notifying authors." },
        { status: 400 }
      );
    }

    if (!conference.slug || !conference.title) {
      return NextResponse.json(
        { error: "Conference title or slug is missing." },
        { status: 400 }
      );
    }

    const articlesSnap = await db
      .collection("articles")
      .where("conferenceId", "==", id)
      .where("status", "==", "published")
      .get();

    const recipients = new Map<string, string>();

    for (const articleDoc of articlesSnap.docs) {
      const authors = articleDoc.data().authors;

      if (!Array.isArray(authors)) continue;

      for (const author of authors as EmailAuthor[]) {
        if (typeof author.email !== "string") continue;

        const email = author.email.trim().toLowerCase();

        if (
          email &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
          recipients.set(email, email);
        }
      }
    }

    if (recipients.size === 0) {
      return NextResponse.json(
        {
          error:
            "No valid author emails were found among published articles for this conference."
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const resend = new Resend(apiKey);
    const proceedingsUrl =
      `${SITE_URL}/conferences/${encodeURIComponent(conference.slug)}`;

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    const errors: string[] = [];

    for (const email of recipients.values()) {
      const emailHash = createHash("sha256")
        .update(email)
        .digest("hex");

      const notificationRef = conferenceRef
        .collection("proceedingsNotifications")
        .doc(emailHash);

      const reservation = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(notificationRef);
        const record = snapshot.data();

        if (record?.status === "sent") {
          return "already-sent" as const;
        }

        const updatedAtMs = record?.updatedAtMs;

        if (
          record?.status === "sending" &&
          typeof updatedAtMs === "number" &&
          Date.now() - updatedAtMs < SENDING_TIMEOUT_MS
        ) {
          return "in-progress" as const;
        }

        transaction.set(
          notificationRef,
          {
            status: "sending",
            email,
            updatedAtMs: Date.now(),
            attempts:
              typeof record?.attempts === "number"
                ? record.attempts + 1
                : 1
          },
          { merge: true }
        );

        return "reserved" as const;
      });

      if (reservation !== "reserved") {
        skipped++;
        continue;
      }

      try {
        const { error } = await resend.emails.send(
          {
            from: "International Conference Proceedings <noreply@conferencepublisher.online>",
            to: [email],
            subject: `Conference proceedings are published — ${conference.title}`,
            html: createHtmlEmail(conference.title, proceedingsUrl),
            text: createTextEmail(conference.title, proceedingsUrl)
          },
          {
            idempotencyKey:
              `proceedings-published/${id}/${emailHash}`
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        await notificationRef.set(
          {
            status: "sent",
            sentAt: new Date().toISOString(),
            updatedAtMs: Date.now(),
            lastError: null
          },
          { merge: true }
        );

        sent++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown email error";

        await notificationRef.set(
          {
            status: "failed",
            updatedAtMs: Date.now(),
            lastError: message
          },
          { merge: true }
        );

        failed++;
        errors.push(`${email}: ${message}`);
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      total: recipients.size,
      sent,
      skipped,
      failed,
      errors
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to notify conference authors."
      },
      { status: 400 }
    );
  }
}