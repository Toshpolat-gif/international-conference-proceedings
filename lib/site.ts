export const siteConfig = {
  name: "International Conference Proceedings",
  shortName: "International Conference Proceedings",
  domain: "conferencepublisher.online",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://conferencepublisher.online",
  email: "info@conferencepublisher.online",
  language: "en",
  description:
    "International Conference Proceedings is a scholarly publishing platform for discovering, reading, and citing conference research papers.",
  location: "International",
  colors: {
    navy: "#102A43",
    tiffany: "#0ABAB5",
    avocado: "#568203",
    mango: "#FFB347",
    ivory: "#F8FAF8"
  }
} as const;

export const navigation = [
  { href: "/conferences", label: "Conferences" },
  { href: "/proceedings", label: "Proceedings" },
  { href: "/articles", label: "Articles" },
  { href: "/authors", label: "Authors" },
  { href: "/for-authors", label: "For Authors" },
  { href: "/about", label: "About" }
] as const;
