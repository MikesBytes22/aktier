// ─────────────────────────────────────────────────────────────
//  RET HER, når du køber eller sælger.
//  antal = antal aktier, gak = gennemsnitlig anskaffelseskurs i USD
//  (brug punktum som decimaltegn: 23.29 – ikke 23,29)
// ─────────────────────────────────────────────────────────────
const AKTIER = [
  { navn: "Mobility Global",        ticker: "MBGL", antal: 25, gak: 23.29 },
  { navn: "Resideo Technologies",   ticker: "REZI", antal: 22, gak: 23.14 },
  { navn: "Verizon Communications", ticker: "VZ",   antal: 9,  gak: 42.44 },
];

// ─────────────────────────────────────────────────────────────
//  KØB OG SALG. Én linje pr. handel. De vises som cirkler på graferne
//  (K = køb, S = salg). dato skrives som ÅÅÅÅ-MM-DD, kurs i USD.
//  AKTIER-listen ovenfor skal stadig vise, hvad du ejer LIGE NU.
//  Eksempel:
//  { dato: "2026-10-01", ticker: "VZ", type: "køb", antal: 9, kurs: 42.44 },
// ─────────────────────────────────────────────────────────────
const HANDLER = [
  { dato: "2026-10-09", ticker: "VZ",   navn: "Verizon Communications", type: "køb",  antal: 9,  kurs: 42.44 },
  { dato: "2026-10-14", ticker: "BAC",  navn: "Bank of America",        type: "køb",  antal: 7,  kurs: 49.82 },
  { dato: "2026-11-11", ticker: "BAC",  navn: "Bank of America",        type: "salg", antal: 7,  kurs: 50.74 },
  { dato: "2026-11-12", ticker: "REZI", navn: "Resideo Technologies",   type: "køb",  antal: 22, kurs: 23.08 },
  { dato: "2026-11-13", ticker: "MBGL", navn: "Mobility Global",        type: "køb",  antal: 25, kurs: 23.29 },
];

// Din gratis Finnhub-nøgle (https://finnhub.io → "Get free API key").
// Indsæt den mellem anførselstegnene. Står den tom, spørger appen
// efter nøglen og gemmer den kun på den telefon, du taster den ind på.
const FINNHUB_KEY = "dbtlm5pr01qtr41fh2ggdbtlm5pr01qtr41fh2h0";
