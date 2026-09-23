"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { navigation, siteConfig } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className={`header ${open ? "open" : ""}`}>
      <div className="container header-inner">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <Image src="/site-logo.png" alt={siteConfig.name} width={54} height={54} priority />
          <span className="brand-copy">
            <span className="brand-name">{siteConfig.name}</span><br></br>
            <span className="brand-subtitle">Scholarly publishing platform</span>
          </span>
        </Link>
        <button className="nav-toggle" aria-label="Toggle navigation" onClick={() => setOpen((v) => !v)}>☰</button>
        <nav className="nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
