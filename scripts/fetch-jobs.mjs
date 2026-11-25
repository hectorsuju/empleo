// Fase 1: busca ofertas en APIs oficiales (InfoJobs, Adzuna). Sin scraping.
import { readFile, writeFile } from "node:fs/promises";

const prev = JSON.parse(await readFile("jobs.json", "utf8"));
const roles = prev.roles;
const seen = new Map((prev.jobs || []).map(j => [j.url, j]));
const found = [];

async function getJson(url, headers = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url.split("?")[0]}`);
  return r.json();
}

async function infojobs(role) {
  const { INFOJOBS_ID: id, INFOJOBS_SECRET: sec } = process.env;
  if (!id || !sec) return;
  const auth = "Basic " + Buffer.from(`${id}:${sec}`).toString("base64");
  const q = new URLSearchParams({ q: role, province: "barcelona", order: "updated-desc", maxResults: "30" });
  const d = await getJson(`https://api.infojobs.net/api/9/offer?${q}`, { Authorization: auth });
  for (const o of d.offers || []) {
    found.push({ source: "InfoJobs", role, title: o.title, company: o.author?.name || "",
      place: [o.city, o.province?.value].filter(Boolean).join(", "), remote: false,
      url: o.link, published: o.updated || o.published });
  }
}

async function adzuna(role, remote) {
  const { ADZUNA_ID: id, ADZUNA_KEY: key } = process.env;
  if (!id || !key) return;
  const q = new URLSearchParams({ app_id: id, app_key: key, results_per_page: "30", sort_by: "date",
    what: remote ? `${role} remoto` : role, ...(remote ? {} : { where: "Barcelona" }) });
  const d = await getJson(`https://api.adzuna.com/v1/api/jobs/es/search/1?${q}`);
  for (const o of d.results || []) {
    found.push({ source: "Adzuna", role, title: o.title, company: o.company?.display_name || "",
      place: o.location?.display_name || "", remote, url: o.redirect_url, published: o.created });
  }
}

for (const role of roles) {
  for (const task of [() => infojobs(role), () => adzuna(role, false), () => adzuna(role, true)]) {
    try { await task(); } catch (e) { console.error("Aviso:", e.message); }
  }
}

const now = new Date().toISOString();
for (const j of found) {
  const old = seen.get(j.url);
  seen.set(j.url, { ...j, title: j.title.replace(/<[^>]+>/g, ""), firstSeen: old?.firstSeen || now });
}
const cutoff = Date.now() - 14 * 864e5;
const jobs = [...seen.values()]
  .filter(j => new Date(j.published || j.firstSeen) > cutoff)
  .sort((a, b) => new Date(b.published || b.firstSeen) - new Date(a.published || a.firstSeen))
  .slice(0, 500);

await writeFile("jobs.json", JSON.stringify({ updated: now, roles, jobs }, null, 1));
console.log(`${found.length} encontradas, ${jobs.length} guardadas`);
