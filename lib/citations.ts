import { Article, Conference } from "@/types";

type EditorValue = string | string[] | undefined;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeYear(value: unknown): string {
  const raw = clean(value);

  if (!raw) return "n.d.";

  const match = raw.match(/\b(19|20)\d{2}\b/);

  return match?.[0] || raw;
}

function normalizeDoi(value: unknown): string {
  let doi = clean(value);

  if (!doi) return "";

  doi = doi
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[<>\s]+$/g, "")
    .trim();

  if (
    !doi ||
    /^coming soon$/i.test(doi) ||
    /^not assigned$/i.test(doi) ||
    /^n\/a$/i.test(doi)
  ) {
    return "";
  }

  return doi;
}

function doiUrl(value: unknown): string {
  const doi = normalizeDoi(value);

  return doi ? `https://doi.org/${doi}` : "";
}

function articleUrl(article: Article): string {
  return `https://conferencepublisher.online/articles/${article.slug}`;
}

function pageRange(article: Article): string {
  const start = clean(article.pageStart);
  const end = clean(article.pageEnd);

  if (!start && !end) return "";

  if (start && end) return `${start}–${end}`;
  if (start) return start;

  return end;
}

function apaAuthor(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");

  return `${surname}, ${initials}`;
}

function ieeeAuthor(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const surname = parts[parts.length - 1];

  const initials = parts
    .slice(0, -1)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");

  return `${initials} ${surname}`;
}

function invertName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return fullName.trim();
  }

  const surname = parts[parts.length - 1];
  const givenNames = parts.slice(0, -1).join(" ");

  return `${surname}, ${givenNames}`;
}

function mlaAuthorList(authors: Article["authors"]): string {
  if (!authors.length) return "Author";

  if (authors.length === 1) {
    return invertName(authors[0].fullName);
  }

  if (authors.length === 2) {
    return `${invertName(authors[0].fullName)}, and ${authors[1].fullName.trim()}`;
  }

  return `${invertName(authors[0].fullName)}, et al.`;
}

function chicagoAuthorList(authors: Article["authors"]): string {
  if (!authors.length) return "Author";

  if (authors.length === 1) {
    return invertName(authors[0].fullName);
  }

  if (authors.length === 2) {
    return `${invertName(authors[0].fullName)}, and ${authors[1].fullName.trim()}`;
  }

  if (authors.length <= 6) {
    const names = authors.map((author) => author.fullName.trim());

    return `${invertName(names[0])}, ${names
      .slice(1, -1)
      .join(", ")}, and ${names[names.length - 1]}`;
  }

  return `${invertName(authors[0].fullName)}, et al.`;
}

function ieeeAuthorList(authors: Article["authors"]): string {
  if (!authors.length) return "Author";

  return authors
    .map((author) => ieeeAuthor(author.fullName))
    .join(", ");
}

function apaAuthorList(authors: Article["authors"]): string {
  if (!authors.length) return "Author";

  const formatted = authors
    .map((author) => apaAuthor(author.fullName))
    .filter(Boolean);

  if (formatted.length === 0) return "Author";

  // APA 7: up to 20 authors are listed normally.
  if (formatted.length <= 20) {
    if (formatted.length === 1) {
      return formatted[0];
    }

    if (formatted.length === 2) {
      return `${formatted[0]}, & ${formatted[1]}`;
    }

    return `${formatted.slice(0, -1).join(", ")}, & ${
      formatted[formatted.length - 1]
    }`;
  }

  // APA 7: first 19 authors, ellipsis, final author.
  return `${formatted.slice(0, 19).join(", ")}, …, ${
    formatted[formatted.length - 1]
  }`;
}

function getEditors(conference?: Conference | null): string[] {
  const value = (conference as Conference & {
    editors?: EditorValue;
  } | null | undefined)?.editors;

  if (Array.isArray(value)) {
    return value
      .map((editor) => clean(editor))
      .filter(Boolean);
  }

  return clean(value)
    .split(",")
    .map((editor) => editor.trim())
    .filter(Boolean);
}

function editorApaText(conference?: Conference | null): string {
  const editors = getEditors(conference);

  if (!editors.length) return "";

  if (editors.length === 1) {
    return `${apaAuthor(editors[0])} (Ed.)`;
  }

  if (editors.length === 2) {
    return `${apaAuthor(editors[0])} & ${apaAuthor(editors[1])} (Eds.)`;
  }

  return `${apaAuthor(editors[0])} et al. (Eds.)`;
}

function escapeBibTeX(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/[{}]/g, (char) => `\\${char}`)
    .replace(/\r?\n/g, " ");
}

function escapeRis(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

export function getCitationData(
  article: Article,
  conference?: Conference | null
) {
  const authors = article.authors || [];

  const year = normalizeYear(article.publicationDate);

  const title = clean(article.title) || "Untitled article";

  const proceedingsTitle =
    clean(conference?.proceedingsTitle) ||
    "International Conference Proceedings";

  const volume = clean(conference?.volume);
  const issue = clean(conference?.issue);

  const pages = pageRange(article);

  const doi = normalizeDoi(article.doi);
  const doiLink = doiUrl(article.doi);

  const stableUrl = articleUrl(article);

  /*
   * --------------------------------------------------------
   * APA 7
   * --------------------------------------------------------
   *
   * The platform treats proceedings as a serial publication
   * because it exposes volume/issue/page metadata.
   */
  const apaContainer =
  `${proceedingsTitle}${
    volume
      ? `, ${volume}${issue ? `(${issue})` : ""}`
      : issue
        ? `, (${issue})`
        : ""
  }`;

  const apaPagePart = pages ? `, ${pages}` : "";

  const apaLocation = doiLink || stableUrl;

  const apa = `${apaAuthorList(authors)} (${year}). ${title}. ${apaContainer}${apaPagePart}.${apaLocation ? ` ${apaLocation}` : ""}`
    .replace(/\s+/g, " ")
    .trim();

  /*
   * --------------------------------------------------------
   * MLA 9
   * --------------------------------------------------------
   */

  const mlaParts = [
    `${mlaAuthorList(authors)}.`,
    `"${title}."`,
    proceedingsTitle + ",",
    volume ? `vol. ${volume},` : "",
    issue ? `no. ${issue},` : "",
    year + ",",
    pages ? `pp. ${pages},` : "",
    doiLink || stableUrl,
  ].filter(Boolean);

  const mla = mlaParts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  /*
   * --------------------------------------------------------
   * Chicago 18 — author-date style
   * --------------------------------------------------------
   */

  const chicagoParts = [
  `${chicagoAuthorList(authors)}.`,
  `${year}.`,
  `"${title}."`,
  proceedingsTitle,
  volume ? `${volume}` : "",
  issue ? `(${issue})` : "",
  pages ? `: ${pages}.` : "",
  doiLink || stableUrl,
  ].filter(Boolean);

  const chicago = chicagoParts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .trim();
  /*
   * --------------------------------------------------------
   * Harvard — generic author-date variant
   * --------------------------------------------------------
   */

  const harvardParts = [
    `${authors.map((a) => a.fullName.trim()).join(", ") || "Author"} (${year})`,
    `'${title}'`,
    proceedingsTitle + ",",
    volume ? `vol. ${volume},` : "",
    issue ? `no. ${issue},` : "",
    pages ? `pp. ${pages},` : "",
    doiLink ? `doi: ${doiLink}` : `Available at: ${stableUrl}`,
  ].filter(Boolean);

  const harvard = harvardParts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  /*
   * --------------------------------------------------------
   * IEEE
   * --------------------------------------------------------
   */

  const ieeeParts = [
    `${ieeeAuthorList(authors)},`,
    `"${title},"`,
    "in",
    proceedingsTitle + ",",
    volume ? `vol. ${volume},` : "",
    issue ? `no. ${issue},` : "",
    pages ? `pp. ${pages},` : "",
    year + ".",
    doiLink ? `doi: ${doi}.` : "",
  ].filter(Boolean);

  const ieee = ieeeParts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  /*
   * --------------------------------------------------------
   * BibTeX
   * --------------------------------------------------------
   */

  const citationKeyBase =
    authors[0]?.fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "author";

  const slugKey =
    clean(article.slug)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 24) || "article";

  const citationKey = `${citationKeyBase}${year}${slugKey}`;

  const editors = getEditors(conference);

  const bibtexFields = [
  `  title = {${escapeBibTeX(title)}}`,
  `  author = {${authors
    .map((author) => escapeBibTeX(author.fullName.trim()))
    .join(" and ")}}`,
  `  booktitle = {${escapeBibTeX(proceedingsTitle)}}`,
  `  year = {${escapeBibTeX(year)}}`,
];

if (editors.length) {
  bibtexFields.push(
    `  editor = {${editors
      .map((editor) => escapeBibTeX(editor))
      .join(" and ")}}`
  );
}

if (volume) {
  bibtexFields.push(`  volume = {${escapeBibTeX(volume)}}`);
}

if (issue) {
  bibtexFields.push(`  number = {${escapeBibTeX(issue)}}`);
}

if (article.pageStart && article.pageEnd) {
  bibtexFields.push(
    `  pages = {${escapeBibTeX(article.pageStart)}--${escapeBibTeX(
      article.pageEnd
    )}}`
  );
} else if (pages) {
  bibtexFields.push(`  pages = {${escapeBibTeX(pages)}}`);
}

if (doi) {
  bibtexFields.push(`  doi = {${escapeBibTeX(doi)}}`);
} else {
  bibtexFields.push(`  url = {${escapeBibTeX(stableUrl)}}`);
}

const bibtex = `@inproceedings{${citationKey},
${bibtexFields
  .map((field, index) =>
    index < bibtexFields.length - 1 ? `${field},` : field
  )
  .join("\n")}
}`;

  /*
   * --------------------------------------------------------
   * RIS
   * --------------------------------------------------------
   */

  const risLines = [
    "TY  - CONF",
    ...authors.map(
      (author) => `AU  - ${escapeRis(author.fullName)}`
    ),
    `TI  - ${escapeRis(title)}`,
    `T2  - ${escapeRis(proceedingsTitle)}`,
    `PY  - ${escapeRis(year)}`,
  ];

  if (volume) {
    risLines.push(`VL  - ${escapeRis(volume)}`);
  }

  if (issue) {
    risLines.push(`IS  - ${escapeRis(issue)}`);
  }

  if (article.pageStart) {
    risLines.push(`SP  - ${escapeRis(article.pageStart)}`);
  }

  if (article.pageEnd) {
    risLines.push(`EP  - ${escapeRis(article.pageEnd)}`);
  }

  editors.forEach((editor) => {
    risLines.push(`ED  - ${escapeRis(editor)}`);
  });

  if (doi) {
    risLines.push(`DO  - ${escapeRis(doi)}`);
  } else {
    risLines.push(`UR  - ${escapeRis(stableUrl)}`);
  }

  risLines.push("ER  -");

  const ris = risLines.join("\n");

  return {
    APA: apa,
    MLA: mla,
    Chicago: chicago,
    Harvard: harvard,
    IEEE: ieee,
    BibTeX: bibtex,
    RIS: ris,
  };
}