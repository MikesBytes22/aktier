// Henter kurshistorik til graferne og gemmer én JSON-fil pr. aktie.
// Køres automatisk af GitHub (se .github/workflows/historik.yml).
// Tickers læses fra AKTIER-listen i config.js – der skal ikke rettes noget her.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] || "out";
const gammel = process.argv[3] || "";            // adresse til de senest gemte filer (bruges hvis en hentning fejler)
const cfg = readFileSync(new URL("../config.js", import.meta.url), "utf8");
// alle tickers i AKTIER og HANDLER (også solgte aktier), uden kommentarlinjer
const blok = cfg.split("\n").filter(l => !l.trim().startsWith("//")).join("\n");
const tickers = [...new Set([...blok.matchAll(/ticker:\s*"([A-Za-z0-9.\-]+)"/g)].map(m => m[1]))];

// navn i filen: [periode, opløsning]
const SERIER = { d1: ["1d", "5m"], d5: ["5d", "15m"], m1: ["1mo", "60m"], y5: ["5y", "1d"], max: ["max", "1wk"] };
const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" };

async function hentSerie(ticker, periode, interval) {
  let fejl;
  for (const host of ["query1", "query2", "query1"]) {
    try {
      const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${periode}&interval=${interval}&includePrePost=false`, { headers: UA });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const res = (await r.json()).chart.result[0];
      const ts = res.timestamp || [], cl = res.indicators.quote[0].close || [];
      const t = [], c = [];
      for (let i = 0; i < ts.length; i++) if (cl[i] != null) { t.push(ts[i]); c.push(Math.round(cl[i] * 10000) / 10000); }
      if (!t.length) throw new Error("ingen punkter");
      return { t, c, prev: res.meta.chartPreviousClose ?? null };
    } catch (e) { fejl = e; await new Promise(r => setTimeout(r, 1500)); }
  }
  throw fejl;
}

mkdirSync(out, { recursive: true });
let ok = 0;
for (const ticker of tickers) {
  try {
    const serier = {};
    for (const [navn, [periode, interval]] of Object.entries(SERIER)) serier[navn] = await hentSerie(ticker, periode, interval);
    writeFileSync(`${out}/${ticker}.json`, JSON.stringify({ ticker, hentet: Math.floor(Date.now() / 1000), serier }));
    console.log(ticker, "ok", Object.entries(serier).map(([k, v]) => `${k}:${v.t.length}`).join(" "));
    ok++;
  } catch (e) {
    console.log(ticker, "FEJL:", e.message);
    if (gammel) try {
      const r = await fetch(`${gammel}${ticker}.json`);
      if (r.ok) { writeFileSync(`${out}/${ticker}.json`, await r.text()); console.log(ticker, "beholder den gamle fil"); }
    } catch {}
  }
}
if (!ok) { console.error("Ingen historik hentet."); process.exit(1); }
