"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth-provider";
import { Article, Author, Conference } from "@/types";

type Tab = "overview" | "conferences" | "articles" | "messages";
type Message = { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt?: unknown };

type AuthorForm = Author;

const emptyAuthor: AuthorForm = { fullName: "", institution: "", country: "", email: "", orcid: "", isCorresponding: false };

async function getAdminToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}

async function uploadFile(file: File, input: Record<string, string>) {
  const token = await getAdminToken();
  const response = await fetch("/api/storage/presign-upload", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...input, fileName: file.name, contentType: file.type, size: file.size }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not create upload URL.");
  const upload = await fetch(data.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!upload.ok) throw new Error(`B2 upload failed with status ${upload.status}.`);
  return data.key as string;
}

function toDateString(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: () => Date }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  return "";
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingConference, setEditingConference] = useState<ConferenceForm | null>(null);
  const [editingArticle, setEditingArticle] = useState<ArticleForm | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
    if (!loading && user && !isAdmin) router.replace("/admin/login");
  }, [loading, user, isAdmin, router]);

  async function loadData() {
    if (!user || !isAdmin) return;
    setBusy(true);
    try {
      const [cSnap, aSnap, mSnap] = await Promise.all([
        getDocs(query(collection(db, "conferences"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "articles"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "contactMessages"), orderBy("createdAt", "desc")))
      ]);
      setConferences(cSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conference));
      setArticles(aSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Article));
      setMessages(mSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load dashboard data.");
    } finally { setBusy(false); }
  }

  useEffect(() => { void loadData(); }, [user, isAdmin]);

  if (loading || !user || !isAdmin) return <main className="login-shell"><div className="login-card"><p>Checking administrator access…</p></div></main>;

  const publishedArticles = articles.filter((a) => a.status === "published").length;
  const publishedConferences = conferences.filter((c) => c.status === "published").length;
  const unreadMessages = messages.filter((m) => m.status !== "read").length;

  async function logout() { await signOut(auth); router.replace("/admin/login"); }

  async function deleteConference(id: string) {
    if (!confirm("Delete this conference record? Published content should normally be archived instead.")) return;
    setBusy(true);
    try { await deleteDoc(doc(db, "conferences", id)); setConferences((items) => items.filter((x) => x.id !== id)); setNotice("Conference deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Delete failed."); }
    finally { setBusy(false); }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Delete this article record? The B2 PDF is not automatically deleted by this action.")) return;
    setBusy(true);
    try { await deleteDoc(doc(db, "articles", id)); setArticles((items) => items.filter((x) => x.id !== id)); setNotice("Article record deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Delete failed."); }
    finally { setBusy(false); }
  }

  async function markMessageRead(message: Message) {
    try { await updateDoc(doc(db, "contactMessages", message.id), { status: "read" }); setMessages((items) => items.map((m) => m.id === message.id ? { ...m, status: "read" } : m)); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not update message."); }
  }

  async function deleteMessage(message: Message) {
  if (!confirm("Delete this message permanently?")) return;

  try {
    await deleteDoc(doc(db, "contactMessages", message.id));
    setMessages((items) => items.filter((m) => m.id !== message.id));
    setNotice("Message deleted.");
  } catch (error) {
    setNotice(error instanceof Error ? error.message : "Could not delete message.");
  }
}

  return <div className="admin-shell"><header className="admin-topbar"><div className="container admin-topbar-inner"><div className="admin-brand"><Image src="/site-logo.png" alt="" width={42} height={42} /><div><strong>International Conference Proceedings</strong><span>Admin dashboard</span></div></div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="small">{user.email}</span><button className="btn btn-ghost btn-small" onClick={logout}>Sign out</button></div></div></header><div className="admin-content"><aside className="admin-sidebar"><nav className="admin-nav"><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "conferences" ? "active" : ""} onClick={() => setTab("conferences")}>Conferences</button><button className={tab === "articles" ? "active" : ""} onClick={() => setTab("articles")}>Articles</button><button className={tab === "messages" ? "active" : ""} onClick={() => setTab("messages")}>Messages {unreadMessages ? `(${unreadMessages})` : ""}</button></nav></aside><main className="admin-main">{notice && <div className="notice notice-success">{notice}</div>}{tab === "overview" && <OverviewTab conferences={conferences} articles={articles} unreadMessages={unreadMessages} publishedArticles={publishedArticles} publishedConferences={publishedConferences} />}{tab === "conferences" && <ConferencesTab conferences={conferences} editing={editingConference} setEditing={setEditingConference} refresh={loadData} onDelete={deleteConference} setNotice={setNotice} busy={busy} />}{tab === "articles" && <ArticlesTab articles={articles} conferences={conferences} editing={editingArticle} setEditing={setEditingArticle} refresh={loadData} onDelete={deleteArticle} setNotice={setNotice} busy={busy} />}{tab === "messages" && <MessagesTab messages={messages} markRead={markMessageRead} deleteMessage={deleteMessage} />}</main></div></div>;
}

function OverviewTab({
  conferences,
  articles,
  unreadMessages,
  publishedArticles,
  publishedConferences,
}: {
  conferences: Conference[];
  articles: Article[];
  unreadMessages: number;
  publishedArticles: number;
  publishedConferences: number;
}) {
  const downloads = articles.reduce(
    (sum, article) => sum + (article.downloadCount || 0),
    0,
  );

  const draftArticles = articles.filter(
    (article) => article.status === "draft",
  ).length;

  const draftConferences = conferences.filter(
    (conference) => conference.status === "draft",
  ).length;

  const monthlyPublicationData = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setHours(12, 0, 0, 0);
      date.setMonth(date.getMonth() - (5 - index));

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;

      const count = articles.filter(
        (article) =>
          article.status === "published" &&
          String(article.publicationDate || "").slice(0, 7) === key,
      ).length;

      return {
        key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        count,
      };
    },
  );

  const maxMonthlyCount = Math.max(
    1,
    ...monthlyPublicationData.map((month) => month.count),
  );

  const topDownloadedArticles = [...articles]
    .sort(
      (a, b) =>
        (b.downloadCount || 0) - (a.downloadCount || 0),
    )
    .slice(0, 5);

  const maxArticleDownloads = Math.max(
    1,
    ...topDownloadedArticles.map(
      (article) => article.downloadCount || 0,
    ),
  );

  const articlePublishedPercent = articles.length
    ? (publishedArticles / articles.length) * 100
    : 0;

  const articleDraftPercent = articles.length
    ? (draftArticles / articles.length) * 100
    : 0;

  const conferencePublishedPercent = conferences.length
    ? (publishedConferences / conferences.length) * 100
    : 0;

  const conferenceDraftPercent = conferences.length
    ? (draftConferences / conferences.length) * 100
    : 0;

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Control center</span>
          <h1 style={{ margin: "5px 0", color: "var(--navy)" }}>
            Dashboard
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Manage conferences, published papers, proceedings files,
            posters, and contact messages.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Published conferences</span>
          <strong>{publishedConferences}</strong>
        </div>

        <div className="stat-card">
          <span>Published articles</span>
          <strong>{publishedArticles}</strong>
        </div>

        <div className="stat-card">
          <span>PDF downloads</span>
          <strong>{downloads}</strong>
        </div>

        <div className="stat-card">
          <span>Unread messages</span>
          <strong>{unreadMessages}</strong>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="panel analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Monthly published articles</h3>
              <p>Publication-date distribution over six months</p>
            </div>
            <span className="analytics-unit">Articles</span>
          </div>

          <div
            className="monthly-chart"
            role="img"
            aria-label="Published article counts by month over the last six months"
          >
            {monthlyPublicationData.map((month) => {
              const height =
                month.count === 0
                  ? 0
                  : Math.max(
                      5,
                      (month.count / maxMonthlyCount) * 100,
                    );

              return (
                <div className="month-chart-column" key={month.key}>
                  <span className="month-chart-count">
                    {month.count}
                  </span>

                  <div className="month-chart-track">
                    <div
                      className="month-chart-bar"
                      style={{ height: `${height}%` }}
                    />
                  </div>

                  <span className="month-chart-label">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="chart-note">
            Counts include published articles whose publication dates
            fall within the displayed months.
          </p>
        </section>

        <section className="panel analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Publication status</h3>
              <p>Published and draft records</p>
            </div>
          </div>

          <div className="status-donut-grid">
  <div className="status-donut-card">
    <div
      className="status-donut"
      role="img"
      aria-label={`${publishedArticles} published articles and ${draftArticles} draft articles`}
      style={{
        background: `conic-gradient(
          #102a43 0% ${articlePublishedPercent}%,
          #9aabbd ${articlePublishedPercent}% 100%
        )`,
      }}
    >
      <div className="status-donut-hole">
        <strong>{articles.length}</strong>
        <span>Total</span>
      </div>
    </div>

    <div className="status-donut-details">
      <h4>Articles</h4>
      <div className="status-donut-row">
        <span><i className="legend-published" /> Published</span>
        <strong>{publishedArticles}</strong>
      </div>
      <div className="status-donut-row">
        <span><i className="legend-draft" /> Draft</span>
        <strong>{draftArticles}</strong>
      </div>
    </div>
  </div>

  <div className="status-donut-card">
    <div
      className="status-donut"
      role="img"
      aria-label={`${publishedConferences} published conferences and ${draftConferences} draft conferences`}
      style={{
        background: `conic-gradient(
          #102a43 0% ${conferencePublishedPercent}%,
          #9aabbd ${conferencePublishedPercent}% 100%
        )`,
      }}
    >
      <div className="status-donut-hole">
        <strong>{conferences.length}</strong>
        <span>Total</span>
      </div>
    </div>

    <div className="status-donut-details">
      <h4>Conferences</h4>
      <div className="status-donut-row">
        <span><i className="legend-published" /> Published</span>
        <strong>{publishedConferences}</strong>
      </div>
      <div className="status-donut-row">
        <span><i className="legend-draft" /> Draft</span>
        <strong>{draftConferences}</strong>
      </div>
    </div>
  </div>
</div>
        </section>
      </div>

      <section className="panel analytics-panel analytics-wide">
        <div className="analytics-panel-heading">
          <div>
            <h3>Most downloaded articles</h3>
            <p>Ranked by recorded PDF downloads</p>
          </div>
        </div>

        {topDownloadedArticles.length ? (
          <div className="admin-download-list">
            {topDownloadedArticles.map((article, index) => {
              const count = article.downloadCount || 0;
              const width = (count / maxArticleDownloads) * 100;

              return (
                <div className="admin-download-item" key={article.id}>
                  <div className="download-row-heading">
                    <span className="download-rank">
                      {index + 1}
                    </span>

                    <span className="download-article-title">
                      {article.title}
                    </span>

                    <strong className="download-count">
                      {count}
                    </strong>
                  </div>

                  <div className="download-row-track">
                    <div
                      className="download-row-fill"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            No article download data is available yet.
          </p>
        )}
      </section>

      <div className="admin-grid">
        <div className="panel">
          <h3>Recent conferences</h3>

          {conferences.slice(0, 5).map((conference) => (
            <div
              key={conference.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <strong>{conference.title}</strong>
              <div className="small muted">
                {conference.status} ·{" "}
                {conference.conferenceDate || "Date not set"}
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Recent articles</h3>

          {articles.slice(0, 5).map((article) => (
            <div
              key={article.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <strong>{article.title}</strong>
              <div className="small muted">
                {article.status} · {article.downloadCount || 0} downloads
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

type ConferenceForm = Omit<Conference, "id" | "createdAt" | "updatedAt"> & { id?: string };
const blankConference = (): ConferenceForm => ({ title: "", slug: "", acronym: "", theme: "", description: "", conferenceDate: "", location: "International", eventType: "Online", organizers: [""], editors: [""], proceedingsTitle: "International Conference Proceedings", issn: "", isbn: "", volume: "", issue: "", publicationDate: "", posterKey: "", proceedingsKey: "", status: "draft" });

function ConferencesTab({ conferences, editing, setEditing, refresh, onDelete, setNotice, busy }: { conferences: Conference[]; editing: ConferenceForm | null; setEditing: (value: ConferenceForm | null) => void; refresh: () => Promise<void>; onDelete: (id: string) => Promise<void>; setNotice: (value: string) => void; busy: boolean }) {
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [proceedingsFile, setProceedingsFile] = useState<File | null>(null);
  const form = editing || blankConference();
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [conferenceSearch, setConferenceSearch] = useState("");

  const [conferenceStatusFilter, setConferenceStatusFilter] =
    useState<"all" | "published" | "draft">("all");

  const [conferencePosterFilter, setConferencePosterFilter] =
    useState<"all" | "uploaded" | "missing">("all");

  const [conferencePdfFilter, setConferencePdfFilter] =
    useState<"all" | "uploaded" | "missing">("all");

  const filteredConferences = useMemo(() => {
    const term = conferenceSearch.trim().toLowerCase();

    return conferences.filter((conference) => {
      const searchableText = [
        conference.title,
        conference.slug,
        conference.acronym || "",
        conference.theme,
        conference.description,
      ]
        .join(" ")
        .toLowerCase();

      const hasPoster = Boolean(conference.posterKey);
      const hasProceedingsPdf = Boolean(conference.proceedingsKey);

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesStatus =
        conferenceStatusFilter === "all" ||
        conference.status === conferenceStatusFilter;

      const matchesPoster =
        conferencePosterFilter === "all" ||
        (conferencePosterFilter === "uploaded"
          ? hasPoster
          : !hasPoster);

      const matchesPdf =
        conferencePdfFilter === "all" ||
        (conferencePdfFilter === "uploaded"
          ? hasProceedingsPdf
          : !hasProceedingsPdf);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPoster &&
        matchesPdf
      );
    });
  }, [
    conferences,
    conferenceSearch,
    conferenceStatusFilter,
    conferencePosterFilter,
    conferencePdfFilter,
  ]);
  async function notifyAuthors(conference: Conference) {
    if (conference.status !== "published" || !conference.proceedingsKey) {
      setNotice("Publish the conference and upload its proceedings PDF first.");
      return;
    }

    const confirmed = confirm(
      `Send proceedings publication emails to authors of published articles in "${conference.title}"?`
    );

    if (!confirmed) return;

    setNotifyingId(conference.id);
    setNotice("");

    try {
      const token = await getAdminToken();

      const response = await fetch(
        `/api/conferences/${encodeURIComponent(conference.id)}/notify-proceedings-authors`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to notify authors.");
      }

      if (data.failed > 0) {
        setNotice(
          `Proceedings notification: ${data.sent} sent, ${data.skipped} skipped, ${data.failed} failed.`
        );
        return;
      }

      setNotice(
        `Proceedings notification completed: ${data.sent} sent, ${data.skipped} skipped, ${data.total} total authors.`
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to notify conference authors."
      );
    } finally {
      setNotifyingId(null);
    }
  }
  async function save() {
    setNotice("");
    if (!form.title || !form.slug || !form.theme || !form.description) { setNotice("Title, slug, theme, and description are required."); return; }
    setNotice("Saving conference…");
    try {
      const id = form.id || doc(collection(db, "conferences")).id;
      const clean = { ...form, id: undefined, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } as Record<string, unknown>;
      delete clean.id;
      if (posterFile) { clean.posterKey = await uploadFile(posterFile, { kind: "poster", year: (form.conferenceDate || form.publicationDate || new Date().toISOString()).slice(0, 4), conferenceSlug: form.slug }); clean.posterContentType = posterFile.type; }
      if (proceedingsFile) clean.proceedingsKey = await uploadFile(proceedingsFile, { kind: "proceedings", year: (form.conferenceDate || form.publicationDate || new Date().toISOString()).slice(0, 4), conferenceSlug: form.slug });
      if (form.id) { await setDoc(doc(db, "conferences", id), clean, { merge: true }); } else { await setDoc(doc(db, "conferences", id), clean); }
      setEditing(null); setPosterFile(null); setProceedingsFile(null); setNotice("Conference saved."); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save conference."); }
  }

  return <><div className="admin-toolbar"><div><span className="eyebrow">Conference management</span><h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Conferences</h1></div>
  <button className="btn btn-primary" onClick={() => setEditing(blankConference())}>New Conference</button></div>{editing && <div className="panel" style={{ marginBottom: 18 }}><h3>{form.id ? "Edit conference" : "New conference"}</h3><div className="form-grid"><div className="field"><label>Conference title</label><input className="input" value={form.title} onChange={(e) => setEditing({ ...form, title: e.target.value })} /></div><div className="field"><label>Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></div><div className="field"><label>Acronym</label><input className="input" value={form.acronym || ""} onChange={(e) => setEditing({ ...form, acronym: e.target.value })} /></div><div className="field"><label>Theme</label><input className="input" value={form.theme} onChange={(e) => setEditing({ ...form, theme: e.target.value })} /></div><div className="field"><label>Conference date</label><input type="date" className="input" value={form.conferenceDate || ""} onChange={(e) => setEditing({ ...form, conferenceDate: e.target.value })} /></div><div className="field"><label>Location</label><input className="input" value={form.location} onChange={(e) => setEditing({ ...form, location: e.target.value })} /></div><div className="field"><label>Event type</label><select className="select" value={form.eventType || "Online"} onChange={(e) => setEditing({ ...form, eventType: e.target.value as Conference["eventType"] })}><option>Online</option><option>Hybrid</option><option>In-person</option></select></div><div className="field"><label>Status</label><select className="select" value={form.status} onChange={(e) => setEditing({ ...form, status: e.target.value as Conference["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></div><div className="field full"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setEditing({ ...form, description: e.target.value })} /></div><div className="field"><label>Proceedings title</label><input className="input" value={form.proceedingsTitle} onChange={(e) => setEditing({ ...form, proceedingsTitle: e.target.value })} /></div><div className="field"><label>Publication date</label><input type="date" className="input" value={form.publicationDate || ""} onChange={(e) => setEditing({ ...form, publicationDate: e.target.value })} /></div><div className="field"><label>ISSN</label><input className="input" value={form.issn || ""} onChange={(e) => setEditing({ ...form, issn: e.target.value })} /></div><div className="field"><label>ISBN</label><input className="input" value={form.isbn || ""} onChange={(e) => setEditing({ ...form, isbn: e.target.value })} /></div><div className="field"><label>Volume</label><input className="input" value={form.volume || ""} onChange={(e) => setEditing({ ...form, volume: e.target.value })} /></div><div className="field"><label>Issue</label><input className="input" value={form.issue || ""} onChange={(e) => setEditing({ ...form, issue: e.target.value })} /></div><div className="field"><label>Organizers (comma-separated)</label><input className="input" value={form.organizers.join(", ")} onChange={(e) => setEditing({ ...form, organizers: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Editors (comma-separated)</label><input className="input" value={form.editors.join(", ")} onChange={(e) => setEditing({ ...form, editors: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Poster</label><input type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} /></div><div className="field"><label>Proceedings PDF</label><input type="file" accept="application/pdf" className="input" onChange={(e) => setProceedingsFile(e.target.files?.[0] || null)} /></div></div><div className="form-actions"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy}>Save Conference</button></div></div>}
  <div className="conference-filterbar">
    <div className="field conference-search">
      <label htmlFor="conference-search">
        Search conferences
      </label>
      <input
        id="conference-search"
        className="input"
        value={conferenceSearch}
        onChange={(e) => setConferenceSearch(e.target.value)}
        placeholder="Title, slug, theme..."
      />
    </div>

    <div className="field">
      <label htmlFor="conference-status-filter">
        Publication status
      </label>
      <select
        id="conference-status-filter"
        className="select"
        value={conferenceStatusFilter}
        onChange={(e) =>
          setConferenceStatusFilter(
            e.target.value as "all" | "published" | "draft"
          )
        }
      >
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
    </div>

    <div className="field">
      <label htmlFor="conference-poster-filter">
        Conference poster
      </label>
      <select
        id="conference-poster-filter"
        className="select"
        value={conferencePosterFilter}
        onChange={(e) =>
          setConferencePosterFilter(
            e.target.value as "all" | "uploaded" | "missing"
          )
        }
      >
        <option value="all">All records</option>
        <option value="uploaded">Poster uploaded</option>
        <option value="missing">Missing poster</option>
      </select>
    </div>

    <div className="field">
      <label htmlFor="conference-pdf-filter">
        Proceedings PDF
      </label>
      <select
        id="conference-pdf-filter"
        className="select"
        value={conferencePdfFilter}
        onChange={(e) =>
          setConferencePdfFilter(
            e.target.value as "all" | "uploaded" | "missing"
          )
        }
      >
        <option value="all">All records</option>
        <option value="uploaded">PDF uploaded</option>
        <option value="missing">Missing PDF</option>
      </select>
    </div>

    <div className="conference-filter-summary">
      <span>
        Showing <strong>{filteredConferences.length}</strong> of{" "}
        <strong>{conferences.length}</strong> conferences
      </span>

      <button
        type="button"
        className="btn btn-ghost btn-small"
        onClick={() => {
          setConferenceSearch("");
          setConferenceStatusFilter("all");
          setConferencePosterFilter("all");
          setConferencePdfFilter("all");
        }}
      >
        Reset filters
      </button>
    </div>
  </div>
  <div className="table-wrap"><table className="data-table"><thead><tr><th>Conference</th><th>Date</th><th>Volume</th><th>Status</th><th>Files</th><th>Actions</th></tr></thead><tbody>{filteredConferences.map((c) => <tr key={c.id}><td><strong>{c.title}</strong><br /><span className="small muted">/{c.slug}</span></td><td>{c.conferenceDate || "—"}</td><td>{c.volume || "—"}</td><td><span className={`status ${c.status === "published" ? "status-published" : "status-draft"}`}>{c.status}</span></td><td>{c.posterKey ? "Poster" : "—"} · {c.proceedingsKey ? "Proceedings" : "—"}</td><td><div style={{ display: "flex", gap: 6 }}>
    <button
      className="btn btn-ghost btn-small"
      onClick={() => void notifyAuthors(c)}
      disabled={
        notifyingId !== null ||
        c.status !== "published" ||
        !c.proceedingsKey
      }
    >
      {notifyingId === c.id ? "Sending..." : "Notify Authors"}
    </button>
    <button className="btn btn-ghost btn-small" onClick={() => setEditing({ ...c })}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDelete(c.id)}>Delete</button></div></td></tr>)}</tbody></table></div></>;
}

type ArticleForm = Omit<Article, "id" | "createdAt" | "updatedAt" | "downloadCount"> & { id?: string };
const blankArticle = (conferenceId = ""): ArticleForm => ({ conferenceId, title: "", slug: "", abstract: "", keywords: [], authors: [{ ...emptyAuthor }], publicationDate: new Date().toISOString().slice(0, 10), pageStart: "", pageEnd: "", doi: "", volume: "", issue: "", license: "CC BY 4.0", language: "en", pdfKey: "", pdfFileName: "", pdfSize: 0, status: "draft" });

function ArticlesTab({ articles, conferences, editing, setEditing, refresh, onDelete, setNotice, busy }: { articles: Article[]; conferences: Conference[]; editing: ArticleForm | null; setEditing: (value: ArticleForm | null) => void; refresh: () => Promise<void>; onDelete: (id: string) => Promise<void>; setNotice: (value: string) => void; busy: boolean }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

const [articleSearch, setArticleSearch] = useState("");
const [articleStatusFilter, setArticleStatusFilter] =
  useState<"all" | "published" | "draft">("all");
const [articleConferenceFilter, setArticleConferenceFilter] =
  useState("all");
const [articleDoiFilter, setArticleDoiFilter] =
  useState<"all" | "assigned" | "missing">("all");
const [articlePdfFilter, setArticlePdfFilter] =
  useState<"all" | "uploaded" | "missing">("all");

const conferenceMap = useMemo(
  () => new Map(conferences.map((c) => [c.id, c.title])),
  [conferences],
);

const form = editing || blankArticle(conferences[0]?.id || "");

const filteredArticles = useMemo(() => {
  const term = articleSearch.trim().toLowerCase();

  return articles.filter((article) => {
    const conferenceTitle =
      conferenceMap.get(article.conferenceId) || "";

    const authorNames = (article.authors || [])
      .map((author) => author.fullName)
      .join(" ");

    const searchableText = [
      article.title,
      article.slug,
      article.abstract,
      authorNames,
      article.doi || "",
      conferenceTitle,
    ]
      .join(" ")
      .toLowerCase();

    const hasDoi = Boolean(article.doi?.trim());
    const hasPdf = Boolean(article.pdfKey);

    const matchesSearch =
      !term || searchableText.includes(term);

    const matchesStatus =
      articleStatusFilter === "all" ||
      article.status === articleStatusFilter;

    const matchesConference =
      articleConferenceFilter === "all" ||
      article.conferenceId === articleConferenceFilter;

    const matchesDoi =
      articleDoiFilter === "all" ||
      (articleDoiFilter === "assigned" ? hasDoi : !hasDoi);

    const matchesPdf =
      articlePdfFilter === "all" ||
      (articlePdfFilter === "uploaded" ? hasPdf : !hasPdf);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesConference &&
      matchesDoi &&
      matchesPdf
    );
  });
}, [
  articles,
  conferenceMap,
  articleSearch,
  articleStatusFilter,
  articleConferenceFilter,
  articleDoiFilter,
  articlePdfFilter,
]);

 async function save() {
  if (
    !form.conferenceId ||
    !form.title ||
    !form.slug ||
    !form.abstract ||
    !form.authors.length
  ) {
    setNotice(
      "Conference, title, slug, abstract, and at least one author are required."
    );
    return;
  }

  if (
    !form.authors.every(
      (a) => a.fullName && a.institution && a.country && a.email
    )
  ) {
    setNotice(
      "Each author needs full name, institution, country, and email."
    );
    return;
  }

  setNotice("Saving article…");

  try {
    const id = form.id || doc(collection(db, "articles")).id;

    const conference = conferences.find(
      (c) => c.id === form.conferenceId
    );

    if (!conference) {
      throw new Error("Conference not found.");
    }

    const existingArticle = form.id
      ? articles.find((a) => a.id === form.id)
      : undefined;

    const previousStatus = existingArticle?.status;

    const shouldNotify =
      !form.id ||
      previousStatus !== form.status;

    const clean = {
      ...form,
      id: undefined,
      updatedAt: serverTimestamp(),
      ...(form.id ? {} : { createdAt: serverTimestamp() }),
    } as Record<string, unknown>;

    delete clean.id;

    if (pdfFile) {
      clean.pdfKey = await uploadFile(pdfFile, {
        kind: "article",
        year: (
          conference.publicationDate ||
          conference.conferenceDate ||
          new Date().toISOString()
        ).slice(0, 4),
        conferenceSlug: conference.slug,
        articleId: id,
      });

      clean.pdfFileName = pdfFile.name;
      clean.pdfSize = pdfFile.size;
    }

    await setDoc(doc(db, "articles", id), clean, { merge: true });

    let notificationSent = false;

    if (shouldNotify) {
      try {
        const token = await getAdminToken();

        const authorEmails = [
          ...new Set(
            form.authors
              .map((author) => author.email.trim())
              .filter(Boolean)
          ),
        ];

        const articleUrl =
          form.status === "published"
            ? `${window.location.origin}/articles/${form.slug}`
            : undefined;

        const response = await fetch("/api/article-status-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            articleId: id,
            title: form.title,
            status: form.status,
            authorEmails,
            articleUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to send article notification."
          );
        }

        notificationSent = true;
      } catch (error) {
        console.error("Article notification failed:", error);
      }
    }

    setEditing(null);
    setPdfFile(null);

    if (shouldNotify && !notificationSent) {
      setNotice(
        form.status === "published"
          ? "Article published, but the author notification could not be sent."
          : "Article saved as draft, but the author notification could not be sent."
      );
    } else if (form.status === "published") {
      setNotice("Article published and author notification sent.");
    } else {
      setNotice("Article saved as draft and author notification sent.");
    }

    await refresh();
  } catch (error) {
    setNotice(
      error instanceof Error
        ? error.message
        : "Unable to save article."
    );
  }
}

  function updateAuthor(index: number, patch: Partial<Author>) { setEditing({ ...form, authors: form.authors.map((a, i) => i === index ? { ...a, ...patch } : a) }); }
  function addAuthor() { setEditing({ ...form, authors: [...form.authors, { ...emptyAuthor }] }); }
  function removeAuthor(index: number) { setEditing({ ...form, authors: form.authors.filter((_, i) => i !== index) }); }

  return <><div className="admin-toolbar"><div><span className="eyebrow">Article management</span><h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Articles</h1></div><button className="btn btn-primary" onClick={() => setEditing(blankArticle(conferences[0]?.id || ""))}>New Article</button></div>{editing && <div className="panel" style={{ marginBottom: 18 }}><h3>{form.id ? "Edit article" : "New article"}</h3><div className="form-grid"><div className="field"><label>Conference</label><select className="select" value={form.conferenceId} onChange={(e) => setEditing({ ...form, conferenceId: e.target.value })}>{conferences.map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}</select></div><div className="field"><label>Publication status</label><select className="select" value={form.status} onChange={(e) => setEditing({ ...form, status: e.target.value as Article["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></div><div className="field full"><label>Title</label><input className="input" value={form.title} onChange={(e) => setEditing({ ...form, title: e.target.value })} /></div><div className="field"><label>Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></div><div className="field"><label>Publication date</label><input type="date" className="input" value={form.publicationDate || ""} onChange={(e) => setEditing({ ...form, publicationDate: e.target.value })} /></div><div className="field full"><label>Abstract</label><textarea className="textarea" value={form.abstract} onChange={(e) => setEditing({ ...form, abstract: e.target.value })} /></div><div className="field full"><label>Keywords (comma-separated)</label><input className="input" value={form.keywords.join(", ")} onChange={(e) => setEditing({ ...form, keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Page start</label><input className="input" value={form.pageStart || ""} onChange={(e) => setEditing({ ...form, pageStart: e.target.value })} /></div><div className="field"><label>Page end</label><input className="input" value={form.pageEnd || ""} onChange={(e) => setEditing({ ...form, pageEnd: e.target.value })} /></div><div className="field"><label>Volume</label><input className="input" value={form.volume || ""} onChange={(e) => setEditing({ ...form, volume: e.target.value })} /></div><div className="field"><label>Issue</label><input className="input" value={form.issue || ""} onChange={(e) => setEditing({ ...form, issue: e.target.value })} /></div><div className="field"><label>DOI</label><input className="input" placeholder="Optional; e.g. 10.xxxx/xxxxx" value={form.doi || ""} onChange={(e) => setEditing({ ...form, doi: e.target.value })} /></div><div className="field"><label>License</label><input className="input" value={form.license || ""} onChange={(e) => setEditing({ ...form, license: e.target.value })} /></div><div className="field full"><label>Final PDF</label><input type="file" accept="application/pdf" className="input" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />{form.pdfFileName && <span className="small muted">Current: {form.pdfFileName}</span>}</div></div><hr className="divider" /><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h3 style={{ margin: 0 }}>Authors</h3><button className="btn btn-ghost btn-small" onClick={addAuthor}>Add author</button></div>{form.authors.map((author, index) => <div className="panel" style={{ marginTop: 12 }} key={index}><div className="admin-toolbar"><strong>Author {index + 1}</strong>{form.authors.length > 1 && <button className="btn btn-danger btn-small" onClick={() => removeAuthor(index)}>Remove</button>}</div><div className="form-grid"><div className="field"><label>Full name</label><input className="input" value={author.fullName} onChange={(e) => updateAuthor(index, { fullName: e.target.value })} /></div><div className="field"><label>Institution</label><input className="input" value={author.institution} onChange={(e) => updateAuthor(index, { institution: e.target.value })} /></div><div className="field"><label>Country</label><input className="input" value={author.country} onChange={(e) => updateAuthor(index, { country: e.target.value })} /></div><div className="field"><label>Email</label><input type="email" className="input" value={author.email} onChange={(e) => updateAuthor(index, { email: e.target.value })} /></div><div className="field"><label>ORCID</label><input className="input" placeholder="0000-0000-0000-0000" value={author.orcid || ""} onChange={(e) => updateAuthor(index, { orcid: e.target.value })} /></div><div className="field" style={{ justifyContent: "end" }}><label><input type="checkbox" checked={author.isCorresponding} onChange={(e) => setEditing({ ...form, authors: form.authors.map((a, i) => ({ ...a, isCorresponding: i === index ? e.target.checked : e.target.checked ? false : a.isCorresponding })) })} /> Corresponding author</label></div></div></div>)}<div className="form-actions"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy}>Save Article</button></div></div>}
  <div className="admin-filterbar">
  <div className="field admin-filter-search">
    <label htmlFor="article-search">Search articles</label>
    <input
      id="article-search"
      className="input"
      value={articleSearch}
      onChange={(e) => setArticleSearch(e.target.value)}
      placeholder="Title, author, DOI, abstract..."
    />
  </div>

  <div className="field">
    <label htmlFor="article-status-filter">Publication status</label>
    <select
      id="article-status-filter"
      className="select"
      value={articleStatusFilter}
      onChange={(e) =>
        setArticleStatusFilter(
          e.target.value as "all" | "published" | "draft"
        )
      }
    >
      <option value="all">All statuses</option>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </select>
  </div>

  <div className="field">
    <label htmlFor="article-conference-filter">Conference</label>
    <select
      id="article-conference-filter"
      className="select"
      value={articleConferenceFilter}
      onChange={(e) => setArticleConferenceFilter(e.target.value)}
    >
      <option value="all">All conferences</option>
      {conferences.map((conference) => (
        <option key={conference.id} value={conference.id}>
          {conference.title}
        </option>
      ))}
    </select>
  </div>

  <div className="field">
    <label htmlFor="article-doi-filter">DOI</label>
    <select
      id="article-doi-filter"
      className="select"
      value={articleDoiFilter}
      onChange={(e) =>
        setArticleDoiFilter(
          e.target.value as "all" | "assigned" | "missing"
        )
      }
    >
      <option value="all">All records</option>
      <option value="assigned">DOI assigned</option>
      <option value="missing">Missing DOI</option>
    </select>
  </div>

  <div className="field">
    <label htmlFor="article-pdf-filter">Final PDF</label>
    <select
      id="article-pdf-filter"
      className="select"
      value={articlePdfFilter}
      onChange={(e) =>
        setArticlePdfFilter(
          e.target.value as "all" | "uploaded" | "missing"
        )
      }
    >
      <option value="all">All records</option>
      <option value="uploaded">PDF uploaded</option>
      <option value="missing">Missing PDF</option>
    </select>
  </div>

  <div className="admin-filter-summary">
    <span>
      Showing <strong>{filteredArticles.length}</strong> of{" "}
      <strong>{articles.length}</strong> articles
    </span>

    <button
      type="button"
      className="btn btn-ghost btn-small"
      onClick={() => {
        setArticleSearch("");
        setArticleStatusFilter("all");
        setArticleConferenceFilter("all");
        setArticleDoiFilter("all");
        setArticlePdfFilter("all");
      }}
    >
      Reset filters
    </button>
  </div>
</div>
  <div className="table-wrap"><table className="data-table"><thead><tr><th>Article</th><th>Conference</th><th>Publication</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredArticles.map((a) => <tr key={a.id}><td><strong>{a.title}</strong><br /><span className="small muted">/{a.slug}</span></td><td>{conferenceMap.get(a.conferenceId) || "—"}</td><td>{a.publicationDate || "—"}</td><td>{a.downloadCount || 0}</td><td><span className={`status ${a.status === "published" ? "status-published" : "status-draft"}`}>{a.status}</span></td><td><div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-small" onClick={() => setEditing({ ...a, authors: a.authors || [{ ...emptyAuthor }] })}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDelete(a.id)}>Delete</button></div></td></tr>)}</tbody></table></div></>;
}

function MessagesTab({
  messages,
  markRead,
  deleteMessage
}: {
  messages: Message[];
  markRead: (message: Message) => Promise<void>;
  deleteMessage: (message: Message) => Promise<void>;
}) {
  return (
    <>
      <div className="admin-toolbar">
        <div>
          <span className="eyebrow">Publisher correspondence</span>
          <h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Messages</h1>
          <p className="muted" style={{ margin: 0 }}>
            Messages submitted through the hidden contact page.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>From</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {messages.map((m) => (
              <tr
                key={m.id}
                className={m.status !== "read" ? "message-unread" : ""}
              >
                <td>
                  <span className="status">{m.status}</span>
                </td>

                <td>
                  <strong>{m.name}</strong>
                  <br />
                  <a className="link" href={`mailto:${m.email}`}>
                    {m.email}
                  </a>
                </td>

                <td>{m.subject}</td>

                <td style={{ maxWidth: 460 }}>
                  {m.message}
                </td>

                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {m.status !== "read" && (
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => markRead(m)}
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => deleteMessage(m)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
