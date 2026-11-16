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

// Din gratis Finnhub-nøgle (https://finnhub.io → "Get free API key").
// Indsæt den mellem anførselstegnene. Står den tom, spørger appen
// efter nøglen og gemmer den kun på den telefon, du taster den ind på.
const FINNHUB_KEY = "";
