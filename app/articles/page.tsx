import { PublicShell } from "@/components/public-shell";
import { ArticleSearch } from "@/components/search-results";
import { getPublishedArticles, getPublishedConferences } from "@/lib/public-data";

export const revalidate = 60;

export default async function ArticlesPage() {
  const [articles, conferences] = await Promise.all([
    getPublishedArticles(200).catch(() => []),
    getPublishedConferences(200).catch(() => [])
  ]);
  return <PublicShell><section className="page-head container"><span className="eyebrow">Research archive</span><h1>Articles</h1><p>Find published conference papers by title, author, keywords, abstract, or conference.</p></section><section className="section"><div className="container"><ArticleSearch articles={articles} conferences={conferences} /></div></section></PublicShell>;
}
