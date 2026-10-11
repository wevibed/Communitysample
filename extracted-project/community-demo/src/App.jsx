import React, { useMemo, useState, useCallback, useEffect } from "react";
import site from "./data/site.json";
import catalogue from "./data/products.json";
import Hero from "./components/Hero";
import GlassNav from "./components/GlassNav";
import Reveal from "./components/Reveal";
import Modal from "./components/Modal";
import ProductPhoto from "./components/ProductPhoto";
import Blobs from "./components/Blobs";
import CommunitySignup from "./components/CommunitySignup";
import CommunityDashboard from "./components/CommunityDashboard";
import { waLink, money } from "./lib/whatsapp";

const items = catalogue.items;
const shopName = site.business.name;
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const priceText = (p) => money(p.price, site.currency.symbol, site.currency.ask) + (p.price === null || p.price === undefined ? "" : site.currency.suffix);

function ProductCard({ p, onOpen, showNew }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(p)}
      aria-label={`${p.name}, ${priceText(p)}`}
      className="card-lift glass flex min-w-0 flex-col gap-2 rounded-[22px] p-2.5 text-left"
      style={{ color: "inherit" }}
    >
      <div className="relative">
        <ProductPhoto product={p} ratio="3 / 4" className="rounded-[14px]" />
        {showNew ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-ink">{site.newIn.badge}</span>
        ) : null}
      </div>
      {showNew ? null : <div className="px-1 text-xs uppercase tracking-widest text-muted">{p.category}</div>}
      <div className="px-1 text-base font-bold">{p.name}</div>
      <div className="px-1 pb-1 text-[15px] text-muted">{priceText(p)}</div>
    </button>
  );
}

function Shop() {
  const [cat, setCat] = useState(site.shop.categories[0]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [size, setSize] = useState(null);
  const [colour, setColour] = useState(null);

  const open = useCallback((p) => {
    setSel(p);
    setSize(p.sizes?.[0] ?? "");
    setColour(p.colours?.[0] ?? "");
  }, []);
  const close = useCallback(() => setSel(null), []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (cat === site.shop.categories[0] || p.category === cat) &&
        (!term || `${p.name} ${p.category} ${(p.colours || []).join(" ")}`.toLowerCase().includes(term))
    );
  }, [cat, q]);

  const newItems = items.filter((p) => p.isNew);
  const count = `${shown.length} ${shown.length === 1 ? site.shop.countOne : site.shop.countMany}${cat === site.shop.categories[0] ? "" : ` ${site.shop.countIn} ${cat}`}`;
  const navMessage = fill(site.nav.message, { shop: shopName });
  const pill = (active) => (active ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined);

  return (
    <>
      <Blobs />
      <div className="mx-auto flex max-w-[1280px] flex-col">
        <GlassNav site={site} links={site.nav.links} cta={site.nav.cta} message={navMessage} />

        <Hero site={site}>
          <a href={site.hero.primaryCta.href} className="btn" style={{ background: "#fff", color: "var(--ink)", padding: "16px 28px" }}>
            {site.hero.primaryCta.label}
          </a>
          <a href={site.hero.secondaryCta.href} className="btn glass-dark" style={{ padding: "16px 28px" }}>
            {site.hero.secondaryCta.label}
          </a>
        </Hero>

        <Reveal as="section" className="flex flex-col gap-5 px-6 pb-6 pt-16" id="new">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-4xl font-extrabold">{site.newIn.title}</h2>
            <a href="#shop" className="font-bold text-accent">{site.newIn.linkLabel}</a>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {newItems.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard p={p} onOpen={open} showNew />
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="grid gap-4 px-6 py-10" id="collections" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {site.collections.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <a
                href="#shop"
                onClick={() => {
                  setCat(c.category);
                  setQ("");
                }}
                className="card-lift glass flex min-h-[220px] flex-col justify-end gap-1.5 rounded-[28px] p-8"
              >
                <span className="text-xs font-bold uppercase tracking-[.14em] text-accent">{c.label}</span>
                <span className="font-display text-3xl font-extrabold">{c.title}</span>
              </a>
            </Reveal>
          ))}
        </Reveal>

        <Reveal as="section" className="flex flex-col gap-5 px-6 pb-14 pt-6" id="shop">
          <h2 className="text-4xl font-extrabold">{site.shop.title}</h2>
          <div className="glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[28px] p-3.5">
            <label htmlFor="q" className="sr-only">{site.shop.searchLabel}</label>
            <input
              id="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={site.shop.searchPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/60 px-[18px] py-3 text-base text-ink"
              style={{ flexBasis: 240 }}
            />
            <div className="flex flex-wrap gap-2">
              {site.shop.categories.map((c) => (
                <button key={c} type="button" className="chip min-h-[44px] px-[18px] font-bold" aria-pressed={cat === c} style={pill(cat === c)} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted" aria-live="polite">{count}</div>
          <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
            {shown.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard p={p} onOpen={open} />
              </Reveal>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="glass flex flex-col items-center gap-4 rounded-3xl p-10 text-center text-muted">
              <p>{site.shop.empty}</p>
              <a className="btn" href={waLink(site.contact.whatsapp, fill(site.shop.emptyMessage, { shop: shopName }))} target="_blank" rel="noopener noreferrer">
                {site.shop.emptyCta}
              </a>
            </div>
          ) : null}
        </Reveal>

        {site.community?.enabled ? (
          <Reveal as="section" className="glass mx-4 mb-6 flex flex-wrap gap-10 rounded-[36px] px-7 py-12" id="join">
            <div className="flex min-w-0 flex-col gap-4" style={{ flex: "1 1 300px" }}>
              <span className="text-xs font-bold uppercase tracking-[.14em] text-accent">{site.community.eyebrow}</span>
              <h2 className="text-3xl font-extrabold md:text-4xl">{site.community.title}</h2>
              <p className="max-w-[44ch] leading-relaxed text-muted">{site.community.body}</p>
              <ul className="grid gap-2 text-[15px]">
                {site.community.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0" style={{ flex: "1 1 340px" }}>
              <CommunitySignup business={site.business} community={site.community} />
            </div>
          </Reveal>
        ) : null}

        <Reveal as="section" className="glass mx-4 mb-6 flex flex-wrap gap-8 rounded-[36px] px-7 py-12" id="visit">
          <div className="flex min-w-0 flex-col gap-3" style={{ flex: "1 1 300px" }}>
            <h2 className="text-3xl font-extrabold">{site.visit.title}</h2>
            <p className="max-w-[44ch] leading-relaxed text-muted">{site.visit.address}</p>
          </div>
          <dl className="grid min-w-0 grid-cols-2 gap-4 text-[15px]" style={{ flex: "1 1 300px" }}>
            {site.visit.details.map((d) => (
              <div key={d.label}>
                <dt className="mb-1.5 text-xs uppercase tracking-widest text-muted">{d.label}</dt>
                <dd className="m-0">{d.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 px-6 pb-8 pt-4 text-[13px] text-muted">
          <span>{site.footer.left}</span>
          <span>
            {site.community?.enabled ? (
              <a href="#/business" className="font-bold text-accent">See the business view (demo)</a>
            ) : null}{" "}
            {site.footer.right}
          </span>
        </footer>
      </div>

      <Modal open={!!sel} onClose={close} label={site.product.dialogLabel}>
        {sel ? (
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="min-w-0" style={{ flex: "1 1 280px", maxHeight: 520 }}>
              <ProductPhoto product={sel} ratio="3 / 4" className="rounded-[20px]" />
            </div>
            <div className="flex min-w-0 flex-col gap-4" style={{ flex: "1 1 300px" }}>
              <span className="text-xs uppercase tracking-widest text-muted">{sel.category}</span>
              <h3 className="text-3xl font-extrabold">{sel.name}</h3>
              <div className="text-[22px] font-bold">{priceText(sel)}</div>
              <p className="leading-relaxed text-muted">{sel.description}</p>
              {sel.sizes?.length ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{site.product.sizeLabel}</span>
                  <div className="flex flex-wrap gap-2">
                    {sel.sizes.map((s) => (
                      <button key={s} type="button" className="chip min-h-[44px] min-w-[48px] px-3.5 font-bold" aria-pressed={size === s} style={pill(size === s)} onClick={() => setSize(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {sel.colours?.length ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold">{site.product.colourLabel}</span>
                  <div className="flex flex-wrap gap-2">
                    {sel.colours.map((k) => (
                      <button key={k} type="button" className="chip min-h-[44px] px-4 font-bold" aria-pressed={colour === k} style={pill(colour === k)} onClick={() => setColour(k)}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <a
                className="btn"
                target="_blank"
                rel="noopener noreferrer"
                href={waLink(site.contact.whatsapp, fill(site.product.message, { shop: shopName, product: sel.name, colour, size, price: priceText(sel) }))}
              >
                {site.product.cta}
              </a>
              <span className="text-[13px] text-muted">{site.product.note}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

const isBusinessView = () => window.location.hash === "#/business";

export default function App() {
  const [business, setBusiness] = useState(isBusinessView);
  useEffect(() => {
    const on = () => {
      setBusiness(isBusinessView());
      if (isBusinessView()) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  if (business && site.community?.enabled) return <CommunityDashboard business={site.business} community={site.community} />;
  return <Shop />;
}
