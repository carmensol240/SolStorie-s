import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { openCookieSettings } from "@/lib/consent";

const EMAIL = "solstories.nlp@gmail.com";
const TOKEN = /(\*\*[^*]+\*\*|solstories\.nlp@gmail\.com|הגדרות עוגיות|מדיניות הפרטיות|SolStorie's)/g;

function inline(text: string, ctx: { cookieLink?: boolean; privacyLink?: boolean }): ReactNode[] {
  return text.split(TOKEN).filter((p) => p !== "").map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-foreground">{inline(part.slice(2, -2), ctx)}</strong>;
    }
    if (part === EMAIL) {
      return <a key={i} href={`mailto:${EMAIL}`} className="text-primary underline" dir="ltr">{EMAIL}</a>;
    }
    if (part === "הגדרות עוגיות" && ctx.cookieLink) {
      return <button key={i} type="button" onClick={openCookieSettings} className="text-primary underline underline-offset-2">{part}</button>;
    }
    if (part === "מדיניות הפרטיות" && ctx.privacyLink) {
      return <Link key={i} to="/privacy" className="text-primary underline underline-offset-2">{part}</Link>;
    }
    if (part === "SolStorie's") return <span key={i} dir="ltr" className="inline-block">{part}</span>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/** Renders the owner-supplied legal text (simple markdown: #, ##, tables, lists, bold) verbatim. */
const LegalDocument = ({ text, cookieLink, privacyLink }: { text: string; cookieLink?: boolean; privacyLink?: boolean }) => {
  const ctx = { cookieLink, privacyLink };
  const blocks = text.split(/\n\s*\n/);
  let title: ReactNode = null;
  const body: ReactNode[] = [];
  blocks.forEach((raw, i) => {
    const b = raw.trim();
    if (b.startsWith("# ")) { title = <h1 className="text-3xl font-bold text-foreground mb-2">{b.slice(2)}</h1>; return; }
    if (b.startsWith("## ")) { body.push(<h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{inline(b.slice(3), ctx)}</h2>); return; }
    const lines = b.split("\n");
    if (lines[0].startsWith("|")) {
      const [head, , ...rows] = lines;
      body.push(
        <div key={i} className="overflow-x-auto my-3 rounded-lg border">
          <table className="w-full min-w-[560px] text-sm border-collapse">
            <thead className="bg-muted"><tr>{cells(head).map((h, j) => <th key={j} scope="col" className="p-2 text-right font-bold text-foreground border-b">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, k) => <tr key={k} className="border-b last:border-0">{cells(r).map((c, j) => <td key={j} className="p-2 align-top text-muted-foreground">{inline(c, ctx)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      return;
    }
    if (lines.every((l) => l.startsWith("- "))) {
      body.push(<ul key={i} className="list-disc pr-5 space-y-1 text-muted-foreground my-2">{lines.map((l, k) => <li key={k}>{inline(l.slice(2), ctx)}</li>)}</ul>);
      return;
    }
    body.push(<p key={i} className="text-muted-foreground my-2">{inline(b, ctx)}</p>);
  });
  return { title, body } as unknown as JSX.Element;
};

export function renderLegal(text: string, opts: { cookieLink?: boolean; privacyLink?: boolean } = {}) {
  return LegalDocument({ text, ...opts }) as unknown as { title: ReactNode; body: ReactNode[] };
}
