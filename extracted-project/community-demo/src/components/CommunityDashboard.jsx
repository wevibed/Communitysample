import React, { useCallback, useEffect, useMemo, useState } from "react";
import { clearAll, deleteContact, downloadCSV, eligible, listContacts, loadSamples, setOptOut } from "../lib/community";
import Blobs from "./Blobs";

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

// What the business owner sees. In real mode this sits behind a login and reads from the WiFive API.
export default function CommunityDashboard({ business, community }) {
  const id = community.businessId;
  const [list, setList] = useState(() => listContacts(id));
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const refresh = useCallback(() => setList(listContacts(id)), [id]);

  // Pick up signups made in another tab
  useEffect(() => {
    const on = () => refresh();
    window.addEventListener("storage", on);
    window.addEventListener("focus", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("focus", on);
    };
  }, [refresh]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...list]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((c) => (filter === "all" || c.status === filter) && (!term || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(term)));
  }, [list, q, filter]);

  const active = eligible(list).length;
  const optedOut = list.filter((c) => c.status === "opted_out").length;
  const week = list.filter((c) => Date.now() - new Date(c.createdAt).getTime() < 7 * 864e5).length;
  const pill = (on) => (on ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined);

  return (
    <>
      <Blobs />
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 pb-16 pt-8">
        <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-6 py-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.14em] text-accent">Business view (demo)</div>
            <h1 className="text-2xl font-extrabold">{business.name}: customer community</h1>
          </div>
          <a href="#/" className="btn" style={{ padding: "12px 22px" }}>Back to the website</a>
        </div>

        <div className="glass-dark rounded-2xl px-5 py-3 text-sm" role="note">
          Demo only. Contacts shown here are saved in this browser, on this device. Nothing is sent to a server, and no WhatsApp messages are sent. In the real system this page is behind a login and each business sees only its own list.
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {[
            ["Subscribers", list.length],
            ["Can receive offers", active],
            ["Opted out", optedOut],
            ["Joined, last 7 days", week],
          ].map(([label, n]) => (
            <div key={label} className="glass rounded-[22px] p-5">
              <div className="text-xs uppercase tracking-widest text-muted">{label}</div>
              <div className="font-display text-4xl font-extrabold">{n}</div>
            </div>
          ))}
        </div>

        <div className="glass flex flex-col gap-4 rounded-[28px] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="cq" className="sr-only">Search contacts</label>
            <input id="cq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number or email" className="min-w-0 flex-1 rounded-full border border-white/80 bg-white/60 px-[18px] py-3 text-base text-ink" style={{ flexBasis: 220 }} />
            {[["all", "All"], ["active", "Active"], ["opted_out", "Opted out"]].map(([k, label]) => (
              <button key={k} type="button" className="chip min-h-[44px] px-[18px] font-bold" aria-pressed={filter === k} style={pill(filter === k)} onClick={() => setFilter(k)}>{label}</button>
            ))}
            <button type="button" className="btn" style={{ padding: "12px 20px" }} disabled={!list.length} onClick={() => downloadCSV(list, `${community.businessId}-customers.csv`)}>
              Export CSV
            </button>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-6 text-muted">
              <p>No subscribers yet. Join from the website, or load a few sample people to see how the list looks.</p>
              <button type="button" className="chip min-h-[44px] px-5 font-bold" onClick={() => { loadSamples(id, community.consentText); refresh(); }}>Load sample contacts</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-muted">
                    <th className="p-2.5 font-bold">Name</th>
                    <th className="p-2.5 font-bold">WhatsApp</th>
                    <th className="p-2.5 font-bold">Email</th>
                    <th className="p-2.5 font-bold">Joined</th>
                    <th className="p-2.5 font-bold">Status</th>
                    <th className="p-2.5 font-bold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.id} className="border-t border-white/60">
                      <td className="p-2.5">{c.name || <span className="text-muted">No name</span>}</td>
                      <td className="p-2.5 tabular-nums">+{c.phone}</td>
                      <td className="p-2.5">{c.email || <span className="text-muted">None</span>}</td>
                      <td className="p-2.5">{fmt(c.createdAt)}</td>
                      <td className="p-2.5">
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={c.status === "active" ? { background: "var(--accent)", color: "var(--accent-ink)" } : { background: "rgba(0,0,0,.08)" }}>
                          {c.status === "active" ? "Active" : "Opted out"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-2.5 text-right">
                        <button type="button" className="chip min-h-[40px] px-3.5 font-bold" onClick={() => { setOptOut(id, c.id, c.status === "active"); refresh(); }}>
                          {c.status === "active" ? "Mark opted out" : "Re-enable"}
                        </button>{" "}
                        <button type="button" className="chip min-h-[40px] px-3.5 font-bold" onClick={() => { if (window.confirm("Delete this contact? This cannot be undone.")) { deleteContact(id, c.id); refresh(); } }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 ? <p className="py-4 text-muted">No contacts match.</p> : null}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
            <span>Only "Active" contacts could ever receive offers. Opted-out numbers are always excluded.</span>
            {list.length ? (
              <button type="button" className="chip px-3.5 py-2" onClick={() => { if (window.confirm("Remove every contact from this demo?")) { clearAll(id); refresh(); } }}>Clear demo data</button>
            ) : null}
          </div>
        </div>

        <div className="glass rounded-[28px] p-6">
          <h2 className="text-xl font-extrabold">Coming later</h2>
          <ul className="mt-3 grid gap-2 text-muted" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <li>Send new-stock and offer messages through the official WhatsApp Business Platform</li>
            <li>Campaigns with delivery and reply counts</li>
            <li>Enquiry and sales tracking</li>
          </ul>
        </div>
      </div>
    </>
  );
}
