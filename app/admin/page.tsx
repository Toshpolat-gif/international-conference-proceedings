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

function OverviewTab({ conferences, articles, unreadMessages, publishedArticles, publishedConferences }: { conferences: Conference[]; articles: Article[]; unreadMessages: number; publishedArticles: number; publishedConferences: number }) {
  const downloads = articles.reduce((sum, article) => sum + (article.downloadCount || 0), 0);
  return <><div className="admin-toolbar"><div><span className="eyebrow">Control center</span><h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Dashboard</h1><p className="muted" style={{ margin: 0 }}>Manage conferences, published papers, proceedings files, posters, and contact messages.</p></div></div><div className="stats-grid"><div className="stat-card"><span>Published conferences</span><strong>{publishedConferences}</strong></div><div className="stat-card"><span>Published articles</span><strong>{publishedArticles}</strong></div><div className="stat-card"><span>PDF downloads</span><strong>{downloads}</strong></div><div className="stat-card"><span>Unread messages</span><strong>{unreadMessages}</strong></div></div><div className="admin-grid"><div className="panel"><h3>Recent conferences</h3>{conferences.slice(0, 5).map((c) => <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}><strong>{c.title}</strong><div className="small muted">{c.status} · {c.conferenceDate || "Date not set"}</div></div>)}</div><div className="panel"><h3>Recent articles</h3>{articles.slice(0, 5).map((a) => <div key={a.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}><strong>{a.title}</strong><div className="small muted">{a.status} · {a.downloadCount || 0} downloads</div></div>)}</div></div></>;
}

type ConferenceForm = Omit<Conference, "id" | "createdAt" | "updatedAt"> & { id?: string };
const blankConference = (): ConferenceForm => ({ title: "", slug: "", acronym: "", theme: "", description: "", conferenceDate: "", location: "International", eventType: "Online", organizers: [""], editors: [""], proceedingsTitle: "International Conference Proceedings", issn: "", isbn: "", volume: "", issue: "", publicationDate: "", posterKey: "", proceedingsKey: "", status: "draft" });

function ConferencesTab({ conferences, editing, setEditing, refresh, onDelete, setNotice, busy }: { conferences: Conference[]; editing: ConferenceForm | null; setEditing: (value: ConferenceForm | null) => void; refresh: () => Promise<void>; onDelete: (id: string) => Promise<void>; setNotice: (value: string) => void; busy: boolean }) {
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [proceedingsFile, setProceedingsFile] = useState<File | null>(null);
  const form = editing || blankConference();

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

  return <><div className="admin-toolbar"><div><span className="eyebrow">Conference management</span><h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Conferences</h1></div><button className="btn btn-primary" onClick={() => setEditing(blankConference())}>New Conference</button></div>{editing && <div className="panel" style={{ marginBottom: 18 }}><h3>{form.id ? "Edit conference" : "New conference"}</h3><div className="form-grid"><div className="field"><label>Conference title</label><input className="input" value={form.title} onChange={(e) => setEditing({ ...form, title: e.target.value })} /></div><div className="field"><label>Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></div><div className="field"><label>Acronym</label><input className="input" value={form.acronym || ""} onChange={(e) => setEditing({ ...form, acronym: e.target.value })} /></div><div className="field"><label>Theme</label><input className="input" value={form.theme} onChange={(e) => setEditing({ ...form, theme: e.target.value })} /></div><div className="field"><label>Conference date</label><input type="date" className="input" value={form.conferenceDate || ""} onChange={(e) => setEditing({ ...form, conferenceDate: e.target.value })} /></div><div className="field"><label>Location</label><input className="input" value={form.location} onChange={(e) => setEditing({ ...form, location: e.target.value })} /></div><div className="field"><label>Event type</label><select className="select" value={form.eventType || "Online"} onChange={(e) => setEditing({ ...form, eventType: e.target.value as Conference["eventType"] })}><option>Online</option><option>Hybrid</option><option>In-person</option></select></div><div className="field"><label>Status</label><select className="select" value={form.status} onChange={(e) => setEditing({ ...form, status: e.target.value as Conference["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></div><div className="field full"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setEditing({ ...form, description: e.target.value })} /></div><div className="field"><label>Proceedings title</label><input className="input" value={form.proceedingsTitle} onChange={(e) => setEditing({ ...form, proceedingsTitle: e.target.value })} /></div><div className="field"><label>Publication date</label><input type="date" className="input" value={form.publicationDate || ""} onChange={(e) => setEditing({ ...form, publicationDate: e.target.value })} /></div><div className="field"><label>ISSN</label><input className="input" value={form.issn || ""} onChange={(e) => setEditing({ ...form, issn: e.target.value })} /></div><div className="field"><label>ISBN</label><input className="input" value={form.isbn || ""} onChange={(e) => setEditing({ ...form, isbn: e.target.value })} /></div><div className="field"><label>Volume</label><input className="input" value={form.volume || ""} onChange={(e) => setEditing({ ...form, volume: e.target.value })} /></div><div className="field"><label>Issue</label><input className="input" value={form.issue || ""} onChange={(e) => setEditing({ ...form, issue: e.target.value })} /></div><div className="field"><label>Organizers (comma-separated)</label><input className="input" value={form.organizers.join(", ")} onChange={(e) => setEditing({ ...form, organizers: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Editors (comma-separated)</label><input className="input" value={form.editors.join(", ")} onChange={(e) => setEditing({ ...form, editors: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Poster</label><input type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} /></div><div className="field"><label>Proceedings PDF</label><input type="file" accept="application/pdf" className="input" onChange={(e) => setProceedingsFile(e.target.files?.[0] || null)} /></div></div><div className="form-actions"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy}>Save Conference</button></div></div>}<div className="table-wrap"><table className="data-table"><thead><tr><th>Conference</th><th>Date</th><th>Volume</th><th>Status</th><th>Files</th><th>Actions</th></tr></thead><tbody>{conferences.map((c) => <tr key={c.id}><td><strong>{c.title}</strong><br /><span className="small muted">/{c.slug}</span></td><td>{c.conferenceDate || "—"}</td><td>{c.volume || "—"}</td><td><span className={`status ${c.status === "published" ? "status-published" : "status-draft"}`}>{c.status}</span></td><td>{c.posterKey ? "Poster" : "—"} · {c.proceedingsKey ? "Proceedings" : "—"}</td><td><div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-small" onClick={() => setEditing({ ...c })}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDelete(c.id)}>Delete</button></div></td></tr>)}</tbody></table></div></>;
}

type ArticleForm = Omit<Article, "id" | "createdAt" | "updatedAt" | "downloadCount"> & { id?: string };
const blankArticle = (conferenceId = ""): ArticleForm => ({ conferenceId, title: "", slug: "", abstract: "", keywords: [], authors: [{ ...emptyAuthor }], publicationDate: new Date().toISOString().slice(0, 10), pageStart: "", pageEnd: "", doi: "", volume: "", issue: "", license: "CC BY 4.0", language: "en", pdfKey: "", pdfFileName: "", pdfSize: 0, status: "draft" });

function ArticlesTab({ articles, conferences, editing, setEditing, refresh, onDelete, setNotice, busy }: { articles: Article[]; conferences: Conference[]; editing: ArticleForm | null; setEditing: (value: ArticleForm | null) => void; refresh: () => Promise<void>; onDelete: (id: string) => Promise<void>; setNotice: (value: string) => void; busy: boolean }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const conferenceMap = useMemo(() => new Map(conferences.map((c) => [c.id, c.title])), [conferences]);
  const form = editing || blankArticle(conferences[0]?.id || "");

  async function save() {
    if (!form.conferenceId || !form.title || !form.slug || !form.abstract || !form.authors.length) { setNotice("Conference, title, slug, abstract, and at least one author are required."); return; }
    if (!form.authors.every((a) => a.fullName && a.institution && a.country && a.email)) { setNotice("Each author needs full name, institution, country, and email."); return; }
    setNotice("Saving article…");
    try {
      const id = form.id || doc(collection(db, "articles")).id;
      const conference = conferences.find((c) => c.id === form.conferenceId);
      if (!conference) throw new Error("Conference not found.");
      const clean = { ...form, id: undefined, updatedAt: serverTimestamp(), ...(form.id ? {} : { createdAt: serverTimestamp() }) } as Record<string, unknown>;
      delete clean.id;
      if (pdfFile) { clean.pdfKey = await uploadFile(pdfFile, { kind: "article", year: (conference.publicationDate || conference.conferenceDate || new Date().toISOString()).slice(0, 4), conferenceSlug: conference.slug, articleId: id }); clean.pdfFileName = pdfFile.name; clean.pdfSize = pdfFile.size; }
      await setDoc(doc(db, "articles", id), clean, { merge: true });
      setEditing(null); setPdfFile(null); setNotice("Article saved."); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save article."); }
  }

  function updateAuthor(index: number, patch: Partial<Author>) { setEditing({ ...form, authors: form.authors.map((a, i) => i === index ? { ...a, ...patch } : a) }); }
  function addAuthor() { setEditing({ ...form, authors: [...form.authors, { ...emptyAuthor }] }); }
  function removeAuthor(index: number) { setEditing({ ...form, authors: form.authors.filter((_, i) => i !== index) }); }

  return <><div className="admin-toolbar"><div><span className="eyebrow">Article management</span><h1 style={{ margin: "5px 0", color: "var(--navy)" }}>Articles</h1></div><button className="btn btn-primary" onClick={() => setEditing(blankArticle(conferences[0]?.id || ""))}>New Article</button></div>{editing && <div className="panel" style={{ marginBottom: 18 }}><h3>{form.id ? "Edit article" : "New article"}</h3><div className="form-grid"><div className="field"><label>Conference</label><select className="select" value={form.conferenceId} onChange={(e) => setEditing({ ...form, conferenceId: e.target.value })}>{conferences.map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}</select></div><div className="field"><label>Publication status</label><select className="select" value={form.status} onChange={(e) => setEditing({ ...form, status: e.target.value as Article["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select></div><div className="field full"><label>Title</label><input className="input" value={form.title} onChange={(e) => setEditing({ ...form, title: e.target.value })} /></div><div className="field"><label>Slug</label><input className="input" value={form.slug} onChange={(e) => setEditing({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} /></div><div className="field"><label>Publication date</label><input type="date" className="input" value={form.publicationDate || ""} onChange={(e) => setEditing({ ...form, publicationDate: e.target.value })} /></div><div className="field full"><label>Abstract</label><textarea className="textarea" value={form.abstract} onChange={(e) => setEditing({ ...form, abstract: e.target.value })} /></div><div className="field full"><label>Keywords (comma-separated)</label><input className="input" value={form.keywords.join(", ")} onChange={(e) => setEditing({ ...form, keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></div><div className="field"><label>Page start</label><input className="input" value={form.pageStart || ""} onChange={(e) => setEditing({ ...form, pageStart: e.target.value })} /></div><div className="field"><label>Page end</label><input className="input" value={form.pageEnd || ""} onChange={(e) => setEditing({ ...form, pageEnd: e.target.value })} /></div><div className="field"><label>Volume</label><input className="input" value={form.volume || ""} onChange={(e) => setEditing({ ...form, volume: e.target.value })} /></div><div className="field"><label>Issue</label><input className="input" value={form.issue || ""} onChange={(e) => setEditing({ ...form, issue: e.target.value })} /></div><div className="field"><label>DOI</label><input className="input" placeholder="Optional; e.g. 10.xxxx/xxxxx" value={form.doi || ""} onChange={(e) => setEditing({ ...form, doi: e.target.value })} /></div><div className="field"><label>License</label><input className="input" value={form.license || ""} onChange={(e) => setEditing({ ...form, license: e.target.value })} /></div><div className="field full"><label>Final PDF</label><input type="file" accept="application/pdf" className="input" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />{form.pdfFileName && <span className="small muted">Current: {form.pdfFileName}</span>}</div></div><hr className="divider" /><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h3 style={{ margin: 0 }}>Authors</h3><button className="btn btn-ghost btn-small" onClick={addAuthor}>Add author</button></div>{form.authors.map((author, index) => <div className="panel" style={{ marginTop: 12 }} key={index}><div className="admin-toolbar"><strong>Author {index + 1}</strong>{form.authors.length > 1 && <button className="btn btn-danger btn-small" onClick={() => removeAuthor(index)}>Remove</button>}</div><div className="form-grid"><div className="field"><label>Full name</label><input className="input" value={author.fullName} onChange={(e) => updateAuthor(index, { fullName: e.target.value })} /></div><div className="field"><label>Institution</label><input className="input" value={author.institution} onChange={(e) => updateAuthor(index, { institution: e.target.value })} /></div><div className="field"><label>Country</label><input className="input" value={author.country} onChange={(e) => updateAuthor(index, { country: e.target.value })} /></div><div className="field"><label>Email</label><input type="email" className="input" value={author.email} onChange={(e) => updateAuthor(index, { email: e.target.value })} /></div><div className="field"><label>ORCID</label><input className="input" placeholder="0000-0000-0000-0000" value={author.orcid || ""} onChange={(e) => updateAuthor(index, { orcid: e.target.value })} /></div><div className="field" style={{ justifyContent: "end" }}><label><input type="checkbox" checked={author.isCorresponding} onChange={(e) => setEditing({ ...form, authors: form.authors.map((a, i) => ({ ...a, isCorresponding: i === index ? e.target.checked : e.target.checked ? false : a.isCorresponding })) })} /> Corresponding author</label></div></div></div>)}<div className="form-actions"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={busy}>Save Article</button></div></div>}<div className="table-wrap"><table className="data-table"><thead><tr><th>Article</th><th>Conference</th><th>Publication</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead><tbody>{articles.map((a) => <tr key={a.id}><td><strong>{a.title}</strong><br /><span className="small muted">/{a.slug}</span></td><td>{conferenceMap.get(a.conferenceId) || "—"}</td><td>{a.publicationDate || "—"}</td><td>{a.downloadCount || 0}</td><td><span className={`status ${a.status === "published" ? "status-published" : "status-draft"}`}>{a.status}</span></td><td><div style={{ display: "flex", gap: 6 }}><button className="btn btn-ghost btn-small" onClick={() => setEditing({ ...a, authors: a.authors || [{ ...emptyAuthor }] })}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDelete(a.id)}>Delete</button></div></td></tr>)}</tbody></table></div></>;
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
