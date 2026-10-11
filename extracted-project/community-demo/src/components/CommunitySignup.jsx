import React, { useId, useState } from "react";
import { addContact, validateSignup } from "../lib/community";

// One-step signup. Reusable: everything comes from the `community` block of site.json.
export default function CommunitySignup({ business, community, onJoined }) {
  const uid = useId();
  const [v, setV] = useState({ name: "", phone: "", email: "", agreed: false, company_website: "" });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: "idle" });
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  function submit(e) {
    e.preventDefault();
    if (v.company_website) return; // honeypot: real people never see this field
    const found = validateSignup(v, community.countryCode);
    setErrors(found);
    if (Object.keys(found).length) return;
    const res = addContact(community.businessId, {
      name: v.name,
      phone: v.phone,
      email: v.email,
      consentText: community.consentText,
      countryCode: community.countryCode,
    });
    if (!res.ok) {
      setState({ status: "failed", reason: res.reason });
      return;
    }
    setState({ status: "done", duplicate: res.duplicate });
    onJoined?.();
  }

  if (state.status === "done") {
    return (
      <div className="flex flex-col items-start gap-3" role="status">
        <h3 className="text-2xl font-extrabold">{state.duplicate ? community.successRepeatTitle : community.successTitle}</h3>
        <p className="max-w-[48ch] text-muted">{community.successBody}</p>
        <button type="button" className="chip min-h-[44px] px-5 font-bold" onClick={() => { setV({ name: "", phone: "", email: "", agreed: false, company_website: "" }); setState({ status: "idle" }); }}>
          Add another number
        </button>
      </div>
    );
  }

  const field = "mt-1.5 w-full rounded-2xl border border-white/80 bg-white/65 px-4 py-3.5 text-base text-ink placeholder:text-muted";
  const err = (k) => (errors[k] ? <p id={`${uid}-${k}-err`} className="mt-1.5 text-sm font-semibold" style={{ color: "#B3261E" }}>{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label={`Join ${business.name}`}>
      <div>
        <label htmlFor={`${uid}-phone`} className="text-sm font-bold">WhatsApp number <span className="text-muted font-normal">(required)</span></label>
        <input id={`${uid}-phone`} type="tel" inputMode="tel" autoComplete="tel" required placeholder="077 123 4567" value={v.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? `${uid}-phone-err` : undefined} className={field} />
        {err("phone")}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <label htmlFor={`${uid}-name`} className="text-sm font-bold">Name <span className="text-muted font-normal">(optional)</span></label>
          <input id={`${uid}-name`} type="text" autoComplete="given-name" placeholder="Your first name" value={v.name} onChange={(e) => set("name", e.target.value)} className={field} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="text-sm font-bold">Email <span className="text-muted font-normal">(optional)</span></label>
          <input id={`${uid}-email`} type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.email ? true : undefined} className={field} />
          {err("email")}
        </div>
      </div>

      {/* Honeypot, hidden from people and screen readers */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={v.company_website} onChange={(e) => set("company_website", e.target.value)} /></label>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
          <input type="checkbox" checked={v.agreed} onChange={(e) => set("agreed", e.target.checked)} aria-invalid={errors.agreed ? true : undefined} className="mt-0.5 h-6 w-6 shrink-0" style={{ accentColor: "var(--accent)" }} />
          <span>{community.consentText}</span>
        </label>
        {err("agreed")}
      </div>

      <button type="submit" className="btn self-start" style={{ padding: "16px 28px" }}>{community.submitLabel}</button>
      {state.status === "failed" ? (
        <p className="text-sm font-semibold" style={{ color: "#B3261E" }} role="alert">
          {state.reason === "storage_blocked" ? "Your browser blocked saving in this demo. Try a normal (non-private) window." : "Could not save that number."}
        </p>
      ) : null}
      <p className="text-[13px] text-muted">{community.privacyNote}</p>
    </form>
  );
}
