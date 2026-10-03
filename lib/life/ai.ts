import type { LifeStore } from "./store";

// The AI switch. Off by default: nothing calls Anthropic (and nothing costs money) until he turns
// it on in settings, even when an API key is set in Vercel. With it off, the rules engine answers.

type AiDoc = { enabled: boolean };

export function hasAiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** The agents may run: a key is set and the switch is on. */
export async function aiEnabled(store: LifeStore) {
  return hasAiKey() && Boolean((await store.getDoc<AiDoc>("ai"))?.enabled);
}

export async function aiSwitch(store: LifeStore) {
  return { enabled: await aiEnabled(store), has_key: hasAiKey() };
}

export async function setAiEnabled(store: LifeStore, enabled: boolean) {
  if (enabled && !hasAiKey()) throw new Error("אין מפתח Anthropic ב־Vercel (ANTHROPIC_API_KEY), אז אי אפשר להדליק.");
  await store.saveDoc<AiDoc>("ai", { enabled });
  return aiSwitch(store);
}
