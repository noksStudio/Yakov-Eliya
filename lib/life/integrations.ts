import type { LifeStore } from "./store";
import { safeEqual } from "./telegram";

// API keys for connected systems (Bossi, and later others) that send leads and activity to
// /api/intake. Each system has its own key: shown once when created, stored only as a hash,
// revocable on its own. A key can only send leads and calls; it cannot read anything.

export type IntegrationKey = {
  id: string;
  /** Shown in the app and stamped on its leads as their source ("bossi"). */
  name: string;
  source: string;
  /** First characters, to tell keys apart without keeping them. */
  prefix: string;
  hash: string;
  created_at: string;
  last_used_at: string | null;
};

export type IntakeEvent = { at: string; source: string; type: string; result: string; detail?: string };

type IntegrationsDoc = { keys: IntegrationKey[] };
type IntakeLog = { seen: string[]; recent: IntakeEvent[] };

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** "Bossi" → "bossi"; a name without latin letters gets a short generated one. */
export function sourceSlug(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return slug || `src-${crypto.randomUUID().slice(0, 6)}`;
}

export async function loadIntegrations(store: LifeStore) {
  return (await store.getDoc<IntegrationsDoc>("integrations"))?.keys ?? [];
}

/** Creates a key; the returned `key` is the only time it is ever shown. */
export async function createIntegrationKey(store: LifeStore, name: string) {
  const keys = await loadIntegrations(store);
  const source = sourceSlug(name);
  const key = `lk_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const entry: IntegrationKey = {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 40),
    source,
    prefix: key.slice(0, 10),
    hash: await sha256(key),
    created_at: new Date().toISOString(),
    last_used_at: null,
  };
  await store.saveDoc<IntegrationsDoc>("integrations", { keys: [...keys, entry] });
  return { key, entry };
}

export async function revokeIntegrationKey(store: LifeStore, id: string) {
  const keys = await loadIntegrations(store);
  const next = keys.filter((k) => k.id !== id);
  await store.saveDoc<IntegrationsDoc>("integrations", { keys: next });
  return next.length < keys.length;
}

/** The key's integration, or null. Records when it was last used. */
export async function verifyIntegrationKey(store: LifeStore, key: string) {
  if (!key.startsWith("lk_")) return null;
  const hash = await sha256(key);
  const keys = await loadIntegrations(store);
  const match = keys.find((k) => safeEqual(k.hash, hash));
  if (!match) return null;
  match.last_used_at = new Date().toISOString();
  await store.saveDoc<IntegrationsDoc>("integrations", { keys });
  return match;
}

/** True if this event id was already handled (a retry); otherwise remembers it. */
export async function seenBefore(store: LifeStore, eventId: string | undefined) {
  if (!eventId) return false;
  const log = (await store.getDoc<IntakeLog>("intake_log")) ?? { seen: [], recent: [] };
  if (log.seen.includes(eventId)) return true;
  await store.saveDoc<IntakeLog>("intake_log", { ...log, seen: [...log.seen, eventId].slice(-500) });
  return false;
}

/** The last events received, for the settings screen (to see a connection working). */
export async function logIntake(store: LifeStore, event: Omit<IntakeEvent, "at">) {
  const log = (await store.getDoc<IntakeLog>("intake_log")) ?? { seen: [], recent: [] };
  await store.saveDoc<IntakeLog>("intake_log", { ...log, recent: [{ at: new Date().toISOString(), ...event }, ...log.recent].slice(0, 20) });
}

export async function recentIntake(store: LifeStore) {
  return (await store.getDoc<IntakeLog>("intake_log"))?.recent ?? [];
}
