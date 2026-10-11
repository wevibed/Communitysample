// WiFive community, DEMO MODE.
// Contacts are kept in THIS browser's localStorage so the idea can be tried with no backend.
// Real mode (later) replaces `store` with calls to the WiFive API (Cloudflare Worker + D1).
// The rules below (one contact per business and number, consent recorded, opt-outs kept) are the
// same rules the real backend will enforce.

const PREFIX = "wifive:v1:";
const key = (businessId) => `${PREFIX}${businessId}:contacts`;

function read(businessId) {
  try {
    const raw = window.localStorage.getItem(key(businessId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function write(businessId, list) {
  try {
    window.localStorage.setItem(key(businessId), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

// "077 123 4567" / "+263 77 123 4567" / "263771234567" -> "263771234567". Returns null if not plausible.
export function normalizePhone(input, countryCode = "263") {
  let d = String(input ?? "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = countryCode + d.slice(1);
  else if (!d.startsWith(countryCode) && d.length <= 10) d = countryCode + d;
  if (!/^\d{8,15}$/.test(d)) return null;
  return d;
}

export function validateSignup({ name, phone, email, agreed }, countryCode) {
  const errors = {};
  if (!normalizePhone(phone, countryCode)) errors.phone = "Enter a valid WhatsApp number, for example 077 123 4567.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = "That email does not look right.";
  if (name && name.length > 80) errors.name = "Name is too long.";
  if (!agreed) errors.agreed = "Please tick the box if you want to receive updates.";
  return errors;
}

export function listContacts(businessId) {
  return read(businessId);
}

// Adds a contact. Duplicates (same business + number) are merged, never doubled.
export function addContact(businessId, { name, phone, email, consentText, source = "website", countryCode }) {
  const number = normalizePhone(phone, countryCode);
  if (!number) return { ok: false, reason: "invalid_phone" };
  const list = read(businessId);
  const now = new Date().toISOString();
  const consent = { event: "granted", at: now, text: consentText, page: window.location.pathname, source };
  const existing = list.find((c) => c.phone === number);
  if (existing) {
    existing.name = existing.name || name?.trim() || "";
    existing.email = existing.email || email?.trim() || "";
    existing.consents.push(consent);
    if (existing.status === "opted_out") {
      existing.status = "active"; // they signed up again on purpose
      existing.optedOutAt = null;
    }
    write(businessId, list);
    return { ok: true, duplicate: true };
  }
  list.push({
    id: `c_${Math.random().toString(36).slice(2, 10)}`,
    phone: number,
    name: name?.trim() || "",
    email: email?.trim() || "",
    status: "active",
    source,
    createdAt: now,
    optedOutAt: null,
    consents: [consent],
  });
  const saved = write(businessId, list);
  return saved ? { ok: true, duplicate: false } : { ok: false, reason: "storage_blocked" };
}

export function setOptOut(businessId, id, optedOut) {
  const list = read(businessId);
  const c = list.find((x) => x.id === id);
  if (!c) return;
  const now = new Date().toISOString();
  c.status = optedOut ? "opted_out" : "active";
  c.optedOutAt = optedOut ? now : null;
  c.consents.push({ event: optedOut ? "revoked" : "granted", at: now, text: optedOut ? "Opted out (business view)" : "Re-enabled (business view)", source: "dashboard" });
  write(businessId, list);
}

export function deleteContact(businessId, id) {
  write(businessId, read(businessId).filter((c) => c.id !== id));
}

export function clearAll(businessId) {
  write(businessId, []);
}

// Contacts the business may send marketing to: active only. Opted-out numbers are always excluded.
export const eligible = (list) => list.filter((c) => c.status === "active");

const csvCell = (v, raw = false) => {
  let s = String(v ?? "");
  if (!raw && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(list) {
  const head = ["name", "phone", "email", "status", "joined", "opted_out_at", "source", "consent_text"];
  const rows = list.map((c) => [c.name, `+${c.phone}`, c.email, c.status, c.createdAt, c.optedOutAt ?? "", c.source, c.consents[0]?.text ?? ""]);
  return [head, ...rows].map((r, i) => r.map((v, col) => csvCell(v, i > 0 && col === 1)).join(",")).join("\r\n");
}

export function downloadCSV(list, filename) {
  const blob = new Blob(["﻿", toCSV(list)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A few sample people so the business view is not empty in a demo.
export function loadSamples(businessId, consentText) {
  const samples = [
    ["Tendai M.", "0772 000 101", "tendai@example.com"],
    ["Rudo C.", "0773 000 102", ""],
    ["", "0712 000 103", ""],
    ["Farai N.", "0782 000 104", "farai@example.com"],
    ["Chipo K.", "0774 000 105", ""],
  ];
  for (const [name, phone, email] of samples) addContact(businessId, { name, phone, email, consentText, source: "sample" });
}
