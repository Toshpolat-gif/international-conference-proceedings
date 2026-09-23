import { getAdminDb } from "@/lib/firebase-admin";
import { Article, Conference } from "@/types";
import { serializeFirestore } from "@/lib/serialize";

export async function getPublishedConferences(limit = 50): Promise<Conference[]> {
  const snap = await getAdminDb()
    .collection("conferences")
    .where("status", "==", "published")
    .orderBy("conferenceDate", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => serializeFirestore({ id: doc.id, ...doc.data() }) as Conference);
}

export async function getConferenceBySlug(slug: string): Promise<Conference | null> {
  const snap = await getAdminDb()
    .collection("conferences")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return serializeFirestore({ id: doc.id, ...doc.data() }) as Conference;
}

export async function getPublishedArticles(limit = 100): Promise<Article[]> {
  const snap = await getAdminDb()
    .collection("articles")
    .where("status", "==", "published")
    .orderBy("publicationDate", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => serializeFirestore({ id: doc.id, ...doc.data() }) as Article);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const snap = await getAdminDb()
    .collection("articles")
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return serializeFirestore({ id: doc.id, ...doc.data() }) as Article;
}

export async function getArticlesForConference(conferenceId: string): Promise<Article[]> {
  const snap = await getAdminDb()
    .collection("articles")
    .where("conferenceId", "==", conferenceId)
    .where("status", "==", "published")
    .orderBy("publicationDate", "desc")
    .limit(100)
    .get();

  return snap.docs.map((doc) => serializeFirestore({ id: doc.id, ...doc.data() }) as Article);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const doc = await getAdminDb().collection("articles").doc(id).get();
  if (!doc.exists) return null;
  return serializeFirestore({ id: doc.id, ...doc.data() }) as Article;
}

export async function getAllAuthors() {
  const articles = await getPublishedArticles(500);
  const map = new Map<string, { fullName: string; institution: string; country: string; orcid?: string; count: number }>();

  for (const article of articles) {
    for (const author of article.authors || []) {
      const key = `${author.fullName}|${author.institution}|${author.country}`.toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        fullName: author.fullName,
        institution: author.institution,
        country: author.country,
        orcid: author.orcid,
        count: (existing?.count ?? 0) + 1
      });
    }
  }

  return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getConferenceMap() {
  const snap = await getAdminDb().collection("conferences").get();
  return new Map(snap.docs.map((doc) => [doc.id, doc.data().title as string]));
}
