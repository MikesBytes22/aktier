// ─────────────────────────────────────────────────────────────
//  Aktier – widget til hjemmeskærmen (kører i appen Scriptable)
//  Læser dine aktier og API-nøgle fra config.js på din side,
//  så du skal ikke rette noget her, når du køber eller sælger.
//  Lille widget: samlet værdi + i dag. Mellem/stor: også dine aktier.
// ─────────────────────────────────────────────────────────────
const SITE = "https://mikesbytes22.github.io/aktier/";
const DATA = "https://raw.githubusercontent.com/MikesBytes22/aktier/data/";

const C = {
  bg: Color.dynamic(new Color("#FFFFFF"), new Color("#1C1C1E")),
  fg: Color.dynamic(new Color("#000000"), new Color("#FFFFFF")),
  muted: Color.dynamic(new Color("#6E6E73"), new Color("#8E8E93")),
  accent: Color.dynamic(new Color("#5856D6"), new Color("#7D7AFF")),
  up: Color.dynamic(new Color("#1E8E3E"), new Color("#30D158")),
  down: Color.dynamic(new Color("#D92D20"), new Color("#FF453A")),
};
// faste farver til grafen (billeder kan ikke skifte farve med lys/mørk)
const UPHEX = "#30D158", DOWNHEX = "#FF453A";

/* ---------- dansk talformat ---------- */
function fmt(v, d) {
  const neg = v < 0, x = Math.abs(v).toFixed(d), [i, f] = x.split(".");
  return (neg ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (f ? "," + f : "");
}
const sign = v => v > 0 ? "+" : v < 0 ? "−" : "";
const kr = v => fmt(Math.round(v), 0) + " kr";
const skr = v => sign(Math.round(v)) + fmt(Math.abs(Math.round(v)), 0) + " kr";
const pct = v => sign(+v.toFixed(2)) + fmt(Math.abs(v), 2) + " %";
const col = v => v >= 0 ? C.up : C.down;

/* ---------- hent data ---------- */
async function json(url) { const r = new Request(url); r.timeoutInterval = 15; return await r.loadJSON(); }
async function text(url) { const r = new Request(url); r.timeoutInterval = 15; return await r.loadString(); }

async function load() {
  const cfgTxt = await text(SITE + "config.js?t=" + Date.now());
  const cfg = new Function(cfgTxt + "\nreturn { AKTIER: AKTIER, KEY: FINNHUB_KEY };")();
  const key = (cfg.KEY || "").trim();
  if (!key) throw new Error("Mangler FINNHUB_KEY i config.js");
  let fx;
  try { fx = (await json("https://api.frankfurter.dev/v1/latest?base=USD&symbols=DKK")).rates.DKK; }
  catch (e) { fx = (await json("https://open.er-api.com/v6/latest/USD")).rates.DKK; }
  const rows = await Promise.all(cfg.AKTIER.map(async a => {
    const q = await json(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(a.ticker)}&token=${encodeURIComponent(key)}`);
    let h = null;
    try { h = (await json(`${DATA}${encodeURIComponent(a.ticker)}.json?t=${Date.now()}`)).serier.d1; } catch (e) {}
    return { a, q, h };
  }));
  let value = 0, cost = 0, dayUsd = 0, prevUsd = 0;
  for (const r of rows) {
    value += r.a.antal * r.q.c * fx; cost += r.a.antal * r.a.gak * fx;
    dayUsd += r.a.antal * (r.q.d || 0); prevUsd += r.a.antal * (r.q.pc || r.q.c);
    r.retPct = (r.q.c / r.a.gak - 1) * 100;
  }
  // dagens kurve for hele porteføljen (kun tidspunkter, hvor alle aktier har en kurs)
  const sum = {};
  for (const r of rows) if (r.h) r.h.t.forEach((t, i) => { (sum[t] = sum[t] || { v: 0, n: 0 }); sum[t].v += r.a.antal * r.h.c[i]; sum[t].n++; });
  const curve = Object.keys(sum).map(Number).sort((x, y) => x - y).filter(t => sum[t].n === rows.length).map(t => sum[t].v);
  if (curve.length) curve.push(dayUsd + prevUsd);
  return { rows, value, ret: value - cost, retPct: cost ? (value - cost) / cost * 100 : 0, dayKr: dayUsd * fx, dayPct: prevUsd ? dayUsd / prevUsd * 100 : 0, base: prevUsd, curve };
}

/* ---------- lille graf ---------- */
function sparkImage(curve, base, up, w, h) {
  const dc = new DrawContext();
  dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;
  const vals = curve.concat(base);
  let lo = Math.min(...vals), hi = Math.max(...vals); if (hi === lo) { hi += 1; lo -= 1; }
  const n = Math.max(curve.length, 79), Y = v => 3 + (1 - (v - lo) / (hi - lo)) * (h - 6), X = i => i / (n - 1) * w;
  const bl = new Path(); bl.move(new Point(0, Y(base))); bl.addLine(new Point(w, Y(base)));
  dc.addPath(bl); dc.setStrokeColor(new Color("#8E8E93", 0.5)); dc.setLineWidth(1); dc.strokePath();
  const p = new Path(); p.addLines(curve.map((v, i) => new Point(X(i), Y(v))));
  dc.addPath(p); dc.setStrokeColor(new Color(up ? UPHEX : DOWNHEX)); dc.setLineWidth(2.4); dc.strokePath();
  return dc.getImage();
}

/* ---------- widget ---------- */
function txt(stack, s, font, color) { const t = stack.addText(s); t.font = font; t.textColor = color; t.lineLimit = 1; t.minimumScaleFactor = 0.6; return t; }

function build(d, fam) {
  const w = new ListWidget();
  w.backgroundColor = C.bg; w.url = SITE;
  w.setPadding(14, 14, 12, 14);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const big = fam !== "small";
  const main = w.addStack(); main.layoutHorizontally();
  const left = main.addStack(); left.layoutVertically();

  txt(left, "MINE AKTIER", Font.semiboldSystemFont(10), C.muted);
  left.addSpacer(2);
  txt(left, kr(d.value), Font.boldRoundedSystemFont(big ? 28 : 24), C.fg);
  txt(left, `${skr(d.dayKr)}  ${pct(d.dayPct)}`, Font.semiboldRoundedSystemFont(12), col(d.dayKr));
  left.addSpacer(6);
  if (d.curve.length > 1) {
    const img = left.addImage(sparkImage(d.curve, d.base, d.dayKr >= 0, big ? 150 : 130, 34));
    img.imageSize = new Size(big ? 150 : 130, 34);
  }
  left.addSpacer();
  txt(left, `Afkast ${skr(d.ret)} · ${pct(d.retPct)}`, Font.mediumRoundedSystemFont(10), col(d.ret));

  if (big) {
    main.addSpacer(14);
    const right = main.addStack(); right.layoutVertically();
    const rows = d.rows.slice(0, fam === "large" ? 8 : 4);
    for (const r of rows) {
      const row = right.addStack(); row.layoutHorizontally(); row.centerAlignContent();
      const nm = row.addStack(); nm.layoutVertically();
      txt(nm, r.a.navn, Font.semiboldSystemFont(12), C.fg);
      txt(nm, `${r.a.ticker} · ${fmt(r.q.c, 2)} USD`, Font.systemFont(9.5), C.muted);
      row.addSpacer();
      txt(row, pct(r.q.dp || 0), Font.boldRoundedSystemFont(13), col(r.q.dp || 0));
      right.addSpacer(rows.length > 3 ? 4 : 7);
    }
    right.addSpacer();
  }
  w.addSpacer(4);
  const now = new Date(), foot = w.addStack();
  txt(foot, `Opdateret ${now.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`, Font.systemFont(9), C.muted);
  return w;
}

function errWidget(msg) {
  const w = new ListWidget();
  w.backgroundColor = C.bg; w.url = SITE;
  txt(w, "MINE AKTIER", Font.semiboldSystemFont(10), C.muted);
  w.addSpacer(6);
  const t = w.addText("Kunne ikke hente kurser"); t.font = Font.semiboldSystemFont(13); t.textColor = C.fg;
  const e = w.addText(String(msg)); e.font = Font.systemFont(10); e.textColor = C.muted;
  w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
  return w;
}

const fam = config.widgetFamily || "medium";
let widget;
try { widget = build(await load(), fam); } catch (e) { widget = errWidget(e.message || e); }
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
