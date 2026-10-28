"use strict";

// HouseDeal: a static prototype. There is no backend: the flatmates are invented,
// their replies and votes are simulated with timers, and everything you do is
// saved in localStorage.

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const ME = "you";

// Short stays are the point of the design: most people here leave within months.
const FLATMATES = [
  { id: "you", name: "You", room: "Room 2", since: "2026-09-01", until: null },
  { id: "jonas", name: "Jonas", room: "Room 1", since: "2026-04-01", until: "2027-02-28" },
  { id: "lea", name: "Lea", room: "Room 3", since: "2026-03-01", until: null },
  { id: "mia", name: "Mia", room: "Room 4", since: "2025-10-01", until: "2026-12-31" },
];
const FLATMATES_BY_ID = new Map(FLATMATES.map((f) => [f.id, f]));

// Every chore is a checklist, so a half-done chore shows what is still missing, and
// "clean" means the same to everyone (interview 2: hoovering alone isn't a clean flat).
const CHORES = [
  { id: "kitchen", name: "Kitchen", steps: ["Wipe counters and hob", "Empty the sink", "Clear the table", "Sweep the floor"] },
  { id: "bathroom", name: "Bathroom", steps: ["Toilet, with cleaning product", "Sink and mirror", "Shower", "Mop the floor"] },
  { id: "bins", name: "Bins", steps: ["Rest bin out", "Paper and plastic out", "New bags in"] },
  { id: "hallway", name: "Hallway", steps: ["Hoover", "Mop", "Shoes on the rack", "Dust the surfaces"] },
];
const CHORES_BY_ID = new Map(CHORES.map((c) => [c.id, c]));

// Who has which chore in the first week; it rotates by one person every week.
const ROTATION_START = ["jonas", ME, "lea", "mia"];

// Past weeks for the history view: steps each person got through (missing = all of them).
const SEED_HISTORY = [
  { jonas: 1 },
  {},
  { jonas: 0, mia: 2 },
];

const NUDGE_ITEMS = [
  { id: "dishes", label: "Dishes / pan", chore: "kitchen", ruleTag: "dishes", phrase: "there's a pan and some dishes left in the sink", when: "tonight", sorted: "Pan washed" },
  { id: "bins", label: "Bins", chore: "bins", ruleTag: "bins", phrase: "the bins are full", when: "today", sorted: "Bins taken out" },
  { id: "bathroom", label: "Bathroom", chore: "bathroom", ruleTag: null, phrase: "the bathroom could use a clean", when: "this week", sorted: "Bathroom cleaned" },
  { id: "hood", label: "Cooker hood", chore: null, ruleTag: "hood", phrase: "the flat smelled of cooking again and the cooker hood was off", when: "next time you cook", sorted: null },
  { id: "other", label: "Something else", chore: null, ruleTag: null, phrase: null, when: null, sorted: "Sorted" },
];
const NUDGE_ITEMS_BY_ID = new Map(NUDGE_ITEMS.map((i) => [i.id, i]));
const CHORE_TO_ITEM = { kitchen: "dishes", bins: "bins", bathroom: "bathroom", hallway: "other" };

const REPLIES = {
  jonas: "On it, doing it now",
  lea: "Oh sorry! Doing it right after dinner",
  mia: "My bad, sorting it now",
};

// Your first version of a new rule gets pushback, so agreeing means finding a middle ground.
const PUSHBACK = { who: "jonas", text: "Can we talk about the details first? I'm not sure it works for me as it is." };

const JOIN_URL = "https://eren-kose1.github.io/house-deal/#/join";
const FLAT_CODE = "WESER-3B";
// QR code for JOIN_URL (33 x 33 modules, error correction M), stored as one SVG path
// so the app needs no QR library at runtime. Regenerate it if JOIN_URL changes.
const QR_SIZE = 33;
const QR_PATH = "M0 0h7v1h-7zM8 0h2v1h-2zM12 0h2v1h-2zM16 0h2v1h-2zM19 0h2v1h-2zM23 0h1v1h-1zM26 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM10 1h2v1h-2zM13 1h1v1h-1zM16 1h1v1h-1zM18 1h1v1h-1zM23 1h2v1h-2zM26 1h1v1h-1zM32 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h2v1h-2zM15 2h1v1h-1zM17 2h1v1h-1zM19 2h1v1h-1zM24 2h1v1h-1zM26 2h1v1h-1zM28 2h3v1h-3zM32 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM11 3h1v1h-1zM14 3h1v1h-1zM16 3h1v1h-1zM19 3h2v1h-2zM22 3h3v1h-3zM26 3h1v1h-1zM28 3h3v1h-3zM32 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM12 4h3v1h-3zM17 4h1v1h-1zM20 4h2v1h-2zM24 4h1v1h-1zM26 4h1v1h-1zM28 4h3v1h-3zM32 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h2v1h-2zM13 5h1v1h-1zM18 5h5v1h-5zM24 5h1v1h-1zM26 5h1v1h-1zM32 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h7v1h-7zM8 7h2v1h-2zM11 7h2v1h-2zM14 7h1v1h-1zM17 7h1v1h-1zM20 7h1v1h-1zM22 7h1v1h-1zM24 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM14 8h1v1h-1zM16 8h4v1h-4zM21 8h1v1h-1zM23 8h1v1h-1zM26 8h1v1h-1zM29 8h1v1h-1zM31 8h2v1h-2zM1 9h3v1h-3zM7 9h1v1h-1zM9 9h1v1h-1zM18 9h3v1h-3zM23 9h2v1h-2zM26 9h2v1h-2zM29 9h2v1h-2zM32 9h1v1h-1zM1 10h1v1h-1zM3 10h5v1h-5zM9 10h1v1h-1zM11 10h2v1h-2zM14 10h1v1h-1zM16 10h2v1h-2zM21 10h3v1h-3zM25 10h1v1h-1zM27 10h3v1h-3zM31 10h2v1h-2zM0 11h1v1h-1zM3 11h3v1h-3zM8 11h8v1h-8zM18 11h1v1h-1zM20 11h1v1h-1zM22 11h4v1h-4zM27 11h1v1h-1zM29 11h1v1h-1zM32 11h1v1h-1zM2 12h2v1h-2zM5 12h2v1h-2zM8 12h5v1h-5zM18 12h1v1h-1zM21 12h1v1h-1zM23 12h2v1h-2zM27 12h3v1h-3zM2 13h2v1h-2zM5 13h1v1h-1zM9 13h1v1h-1zM13 13h1v1h-1zM16 13h1v1h-1zM18 13h1v1h-1zM21 13h1v1h-1zM24 13h1v1h-1zM27 13h1v1h-1zM31 13h1v1h-1zM0 14h3v1h-3zM4 14h4v1h-4zM11 14h1v1h-1zM13 14h1v1h-1zM15 14h2v1h-2zM21 14h1v1h-1zM26 14h4v1h-4zM0 15h1v1h-1zM3 15h2v1h-2zM8 15h4v1h-4zM14 15h1v1h-1zM16 15h1v1h-1zM18 15h10v1h-10zM30 15h1v1h-1zM3 16h2v1h-2zM6 16h1v1h-1zM8 16h2v1h-2zM14 16h2v1h-2zM18 16h5v1h-5zM25 16h2v1h-2zM28 16h3v1h-3zM2 17h1v1h-1zM5 17h1v1h-1zM8 17h2v1h-2zM11 17h2v1h-2zM15 17h1v1h-1zM17 17h2v1h-2zM20 17h2v1h-2zM23 17h4v1h-4zM28 17h2v1h-2zM32 17h1v1h-1zM0 18h1v1h-1zM2 18h3v1h-3zM6 18h1v1h-1zM10 18h2v1h-2zM14 18h4v1h-4zM22 18h1v1h-1zM25 18h4v1h-4zM30 18h2v1h-2zM0 19h3v1h-3zM4 19h2v1h-2zM9 19h1v1h-1zM11 19h1v1h-1zM19 19h1v1h-1zM21 19h1v1h-1zM23 19h3v1h-3zM28 19h1v1h-1zM31 19h2v1h-2zM0 20h2v1h-2zM6 20h2v1h-2zM9 20h1v1h-1zM11 20h1v1h-1zM13 20h1v1h-1zM15 20h1v1h-1zM18 20h1v1h-1zM20 20h1v1h-1zM25 20h1v1h-1zM29 20h2v1h-2zM0 21h1v1h-1zM5 21h1v1h-1zM7 21h6v1h-6zM14 21h2v1h-2zM18 21h1v1h-1zM21 21h1v1h-1zM23 21h1v1h-1zM26 21h1v1h-1zM29 21h1v1h-1zM32 21h1v1h-1zM2 22h8v1h-8zM12 22h3v1h-3zM16 22h3v1h-3zM21 22h1v1h-1zM23 22h5v1h-5zM31 22h2v1h-2zM1 23h1v1h-1zM3 23h2v1h-2zM8 23h6v1h-6zM16 23h1v1h-1zM18 23h2v1h-2zM23 23h2v1h-2zM27 23h3v1h-3zM31 23h2v1h-2zM0 24h1v1h-1zM4 24h1v1h-1zM6 24h1v1h-1zM9 24h1v1h-1zM13 24h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1zM22 24h7v1h-7zM31 24h2v1h-2zM8 25h1v1h-1zM12 25h2v1h-2zM15 25h3v1h-3zM19 25h2v1h-2zM23 25h2v1h-2zM28 25h2v1h-2zM31 25h1v1h-1zM0 26h7v1h-7zM8 26h1v1h-1zM10 26h1v1h-1zM13 26h1v1h-1zM16 26h1v1h-1zM19 26h2v1h-2zM22 26h3v1h-3zM26 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM10 27h1v1h-1zM16 27h1v1h-1zM21 27h4v1h-4zM28 27h5v1h-5zM0 28h1v1h-1zM2 28h3v1h-3zM6 28h1v1h-1zM9 28h2v1h-2zM13 28h1v1h-1zM15 28h1v1h-1zM17 28h1v1h-1zM20 28h1v1h-1zM23 28h6v1h-6zM30 28h2v1h-2zM0 29h1v1h-1zM2 29h3v1h-3zM6 29h1v1h-1zM8 29h3v1h-3zM12 29h1v1h-1zM14 29h1v1h-1zM18 29h3v1h-3zM24 29h1v1h-1zM27 29h1v1h-1zM29 29h1v1h-1zM31 29h2v1h-2zM0 30h1v1h-1zM2 30h3v1h-3zM6 30h1v1h-1zM8 30h1v1h-1zM10 30h1v1h-1zM13 30h2v1h-2zM17 30h3v1h-3zM21 30h2v1h-2zM24 30h4v1h-4zM30 30h1v1h-1zM0 31h1v1h-1zM6 31h1v1h-1zM9 31h2v1h-2zM12 31h1v1h-1zM14 31h4v1h-4zM19 31h1v1h-1zM22 31h3v1h-3zM26 31h3v1h-3zM32 31h1v1h-1zM0 32h7v1h-7zM8 32h1v1h-1zM13 32h1v1h-1zM15 32h3v1h-3zM20 32h3v1h-3zM26 32h1v1h-1zM28 32h1v1h-1zM30 32h1v1h-1z";

const STORAGE_KEY = "housedeal.v3";
const OLD_STORAGE_KEYS = ["housedeal.v1"];
const STATE_VERSION = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 14;
const NUDGE_COOLDOWN_MS = 12 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const $ = (selector) => document.querySelector(selector);

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toISODate(date) {
  // Built from local parts: toISOString() would shift to UTC and can land on the wrong day.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysFromToday(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

function addDays(iso, offset) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const today = () => toISODate(new Date());
const monthKey = (date = new Date()) => toISODate(date).slice(0, 7);
const daysBetween = (fromIso, toIso) => Math.round((parseISODate(toIso) - parseISODate(fromIso)) / DAY_MS);

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

const formatShortDate = (iso) => shortDateFormat.format(parseISODate(iso));
const formatTime = (ms) => timeFormat.format(new Date(ms));

function relativeDay(ms) {
  const iso = toISODate(new Date(ms));
  if (iso === today()) return "today";
  if (iso === daysFromToday(-1)) return "yesterday";
  return dayFormat.format(new Date(ms));
}

const nameOf = (id) => FLATMATES_BY_ID.get(id).name;
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

function listNames(ids) {
  const names = ids.map(nameOf);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Chore rota
// ---------------------------------------------------------------------------

const thisWeek = () => toISODate(mondayOf(new Date()));

function rotaFor(weekIso, startWeek = state.rotationStartWeek) {
  const index = Math.round(daysBetween(startWeek, weekIso) / 7);
  const shift = ((index % CHORES.length) + CHORES.length) % CHORES.length;
  const rota = {};
  CHORES.forEach((chore, i) => {
    rota[chore.id] = ROTATION_START[(i - shift + CHORES.length) % CHORES.length];
  });
  return rota;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function seedState() {
  const now = Date.now();
  const monday = mondayOf(new Date());
  const week = toISODate(monday);
  // Clamped to Monday so seeded chores never look done before this week started.
  const doneAgo = (ms) => Math.max(monday.getTime(), now - ms);

  const s = {
    version: STATE_VERSION,
    rotationStartWeek: week,
    // Per week and chore: which checklist steps are ticked, and who finished it when.
    steps: {
      [week]: {
        kitchen: [true, true, false, false],
        bathroom: [false, false, false, false],
        bins: [true, true, true],
        hallway: [true, true, true, true],
      },
    },
    done: {
      [week]: {
        bins: { by: "lea", at: doneAgo(DAY_MS) },
        hallway: { by: "mia", at: doneAgo(2 * DAY_MS) },
      },
    },
    supplies: [
      { id: "s-paper", name: "Toilet paper", addedBy: "lea", addedAt: now - 3 * 60 * 60 * 1000, boughtBy: null, boughtAt: null },
      { id: "s-sponge", name: "Kitchen sponges", addedBy: "mia", addedAt: now - DAY_MS, boughtBy: null, boughtAt: null },
      { id: "s-soap", name: "Dish soap", addedBy: "jonas", addedAt: now - 4 * DAY_MS, boughtBy: "lea", boughtAt: now - 3 * DAY_MS },
    ],
    rules: [
      { id: "r-dishes", text: "Dishes done the same day", tag: "dishes", agreedAt: daysFromToday(-TRIAL_DAYS), checkInAt: today(), changing: null, comments: [] },
      { id: "r-bins", text: "Bins out every Sunday evening", tag: "bins", agreedAt: daysFromToday(-40), checkInAt: daysFromToday(12), changing: null, comments: [] },
      {
        id: "r-hood", text: "Cooker hood on whenever someone cooks", tag: "hood", agreedAt: daysFromToday(-5), checkInAt: daysFromToday(TRIAL_DAYS - 5), changing: null,
        comments: [
          { by: "lea", name: null, text: "The flat smelled of fried onions all Sunday. Please put the hood on, it really helps.", at: now - 2 * DAY_MS },
          { by: "jonas", name: null, text: "Sorry, that was me. I'll put it on next time.", at: now - 2 * DAY_MS + 40 * 60 * 1000 },
        ],
      },
    ],
    // The dishes rule's trial just ended: the flat is voting whether it still works.
    checkins: {
      "r-dishes": {
        votes: { mia: "keep", lea: "keep", jonas: "change" },
        suggestion: { by: "jonas", text: "Dishes done by the next morning" },
      },
    },
    // A rule only counts when all four say OK; any "no" or tweak puts it in revision.
    proposals: [
      {
        id: "p-quiet", text: "Quiet after 22:00 on weekdays", tag: null, by: "mia", createdAt: daysFromToday(-1), version: 1,
        votes: { mia: "ok", lea: "ok", jonas: "tweak" },
        objections: [{ by: "jonas", kind: "tweak", text: "Quiet after 22:00, Sunday to Thursday" }],
        status: "revision", replaces: null,
      },
    ],
    nudges: [],
    // Simulated flatmate actions waiting to happen, saved so a reload doesn't lose them.
    pending: [],
    nextId: 1,
    reminderHiddenOn: null,
    newcomer: null,
  };

  SEED_HISTORY.forEach((pattern, i) => {
    const pastWeek = addDays(week, -7 * (i + 1));
    const rota = rotaFor(pastWeek, week);
    s.steps[pastWeek] = {};
    s.done[pastWeek] = {};
    CHORES.forEach((chore, c) => {
      const who = rota[chore.id];
      const count = pattern[who] ?? chore.steps.length;
      s.steps[pastWeek][chore.id] = chore.steps.map((_, k) => k < count);
      if (count === chore.steps.length) {
        // Spread over Wednesday to Saturday evening so the history reads naturally.
        s.done[pastWeek][chore.id] = { by: who, at: parseISODate(addDays(pastWeek, 2 + c)).getTime() + 18 * 60 * 60 * 1000 };
      }
    });
  });
  return s;
}

function loadState() {
  try {
    OLD_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.version === STATE_VERSION) return saved;
  } catch (err) {
    console.warn("Saved HouseDeal data was unreadable; starting fresh.", err);
  }
  return seedState();
}

let state = loadState();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Private browsing can block storage; the demo still works, it just won't persist.
    console.warn("Could not save HouseDeal data.", err);
  }
}

const newId = (prefix) => `${prefix}-${state.nextId++}`;

// UI-only state: never saved, so a reload starts on a clean screen.
const ui = {
  openForm: null, // { kind, id }
  drafts: {},
  nudge: null, // { item, to, text, edited }
  openChecklists: new Set(),
  openComments: new Set(),
  join: null, // { step: "intro" | number | "done", name, ok, asked, asking }
  needsRender: false,
};

// ---------------------------------------------------------------------------
// Chores
// ---------------------------------------------------------------------------

function stepsFor(weekIso, choreId) {
  return state.steps[weekIso]?.[choreId] ?? CHORES_BY_ID.get(choreId).steps.map(() => false);
}

const doneRecord = (weekIso, choreId) => state.done[weekIso]?.[choreId] ?? null;

// Counted from the chore records themselves, so the tally can never drift from them.
function doneThisMonth(personId) {
  const month = monthKey();
  return Object.values(state.done)
    .flatMap((week) => Object.values(week))
    .filter((d) => d.by === personId && monthKey(new Date(d.at)) === month).length;
}

function setSteps(choreId, steps) {
  const week = thisWeek();
  state.steps[week] ??= {};
  state.done[week] ??= {};
  state.steps[week][choreId] = steps;
  const complete = steps.every(Boolean);
  if (complete && !state.done[week][choreId]) state.done[week][choreId] = { by: ME, at: Date.now() };
  if (!complete) delete state.done[week][choreId];
  return complete;
}

function markDone(choreId) {
  const before = [...stepsFor(thisWeek(), choreId)];
  setSteps(choreId, before.map(() => true));
  save();
  render();
  showToast(`${CHORES_BY_ID.get(choreId).name} marked done`, {
    actionLabel: "Undo",
    onAction: () => {
      setSteps(choreId, before);
      save();
      render();
    },
  });
}

function reopenChore(choreId) {
  setSteps(choreId, stepsFor(thisWeek(), choreId).map(() => false));
  ui.openChecklists.add(choreId);
  save();
  render();
  showToast(`${CHORES_BY_ID.get(choreId).name} is open again`);
}

function toggleStep(choreId, index, checked) {
  const steps = [...stepsFor(thisWeek(), choreId)];
  const wasDone = Boolean(doneRecord(thisWeek(), choreId));
  steps[index] = checked;
  const complete = setSteps(choreId, steps);
  save();
  render();
  if (complete && !wasDone) showToast(`${CHORES_BY_ID.get(choreId).name} done. Thanks!`);
}

// ---------------------------------------------------------------------------
// Shared supplies
// ---------------------------------------------------------------------------

const runningLow = () => state.supplies.filter((s) => !s.boughtBy);

function addSupply(name) {
  const existing = runningLow().find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    showToast(`${existing.name} is already on the list.`);
    return;
  }
  state.supplies.unshift({ id: newId("s"), name, addedBy: ME, addedAt: Date.now(), boughtBy: null, boughtAt: null });
  delete ui.drafts["supply:new"];
  save();
  render();
  showToast(`Added ${name}. Whoever buys it first ticks it off.`);
}

function buySupply(id) {
  const item = state.supplies.find((s) => s.id === id);
  item.boughtBy = ME;
  item.boughtAt = Date.now();
  save();
  render();
  showToast(`${item.name} ticked off. Thanks!`, {
    actionLabel: "Undo",
    onAction: () => {
      item.boughtBy = null;
      item.boughtAt = null;
      save();
      render();
    },
  });
}

// ---------------------------------------------------------------------------
// Rules, proposals and check-ins
// ---------------------------------------------------------------------------

const ruleByTag = (tag) => (tag ? state.rules.find((r) => r.tag === tag) : null);
const isOnTrial = (rule) => today() < addDays(rule.agreedAt, TRIAL_DAYS);
const dueCheckins = () => state.rules.filter((r) => state.checkins[r.id] && r.checkInAt <= today());
const activeProposals = () => state.proposals.filter((p) => p.status === "voting" || p.status === "revision");
const needsMyVote = (p) => p.votes[ME] !== "ok" && p.by !== ME;

function othersNotOk(proposal) {
  return FLATMATES.map((f) => f.id).filter((id) => id !== ME && proposal.votes[id] !== "ok");
}

// Flatmates answer one after another, so the votes visibly come in.
function scheduleVotes(proposal) {
  const pushback = proposal.by === ME && proposal.version === 1 && !proposal.replaces;
  // The flatmate who pushes back answers last, after the others already said OK.
  const voters = othersNotOk(proposal).sort((a, b) => (a === PUSHBACK.who) - (b === PUSHBACK.who));
  voters.forEach((who, i) => {
    const objects = pushback && who === PUSHBACK.who;
    schedule(2000 + i * 1600, {
      kind: "vote", proposalId: proposal.id, version: proposal.version, who,
      value: objects ? "no" : "ok", text: objects ? PUSHBACK.text : null,
    });
  });
}

function cancelVotes(proposalId) {
  state.pending = state.pending.filter((e) => e.proposalId !== proposalId);
  armPending();
}

function agree(proposal) {
  proposal.status = "agreed";
  const rule = {
    id: newId("r"), text: proposal.text, tag: proposal.tag, agreedAt: today(),
    checkInAt: daysFromToday(TRIAL_DAYS), changing: null, comments: [],
  };
  const index = proposal.replaces ? state.rules.findIndex((r) => r.id === proposal.replaces) : -1;
  if (index >= 0) {
    rule.comments = state.rules[index].comments;
    state.rules.splice(index, 1, rule);
  } else {
    state.rules.push(rule);
  }
  showToast(`Everyone agreed: "${proposal.text}". Trial until ${formatShortDate(rule.checkInAt)}.`);
}

// Returns true when the proposal just became a rule.
function refreshStatus(proposal) {
  if (proposal.status !== "voting" && proposal.status !== "revision") return false;
  if (FLATMATES.every((f) => proposal.votes[f.id] === "ok")) {
    agree(proposal);
    return true;
  }
  proposal.status = proposal.objections.length ? "revision" : "voting";
  return false;
}

// A new wording starts a fresh round: earlier votes and objections were about the old one.
function newVersion(proposal, text, votes) {
  cancelVotes(proposal.id);
  proposal.text = text;
  proposal.version += 1;
  proposal.votes = votes;
  proposal.objections = [];
  proposal.status = "voting";
  if (!refreshStatus(proposal)) scheduleVotes(proposal);
}

const findProposal = (id) => state.proposals.find((p) => p.id === id);

function voteOk(id) {
  const p = findProposal(id);
  p.votes[ME] = "ok";
  p.objections = p.objections.filter((o) => o.by !== ME);
  if (!refreshStatus(p)) {
    showToast(p.status === "revision"
      ? "You said OK. It stays in revision until the others agree too."
      : `You said OK. Waiting for ${listNames(othersNotOk(p))}.`);
  }
  save();
  render();
}

function agreeToVersion(id, index) {
  const p = findProposal(id);
  const objection = p.objections[index];
  newVersion(p, objection.text, { [ME]: "ok", [objection.by]: "ok" });
  save();
  render();
  showToast(`You agreed to ${nameOf(objection.by)}'s version. Waiting for ${listNames(othersNotOk(p))}.`);
}

function submitMiddleGround(id, text) {
  const p = findProposal(id);
  newVersion(p, text, { [ME]: "ok" });
  closeForm();
  save();
  render();
  showToast("Your version was sent. Everyone votes on it again.");
}

function submitNo(id, reason) {
  const p = findProposal(id);
  p.votes[ME] = "no";
  p.objections = p.objections.filter((o) => o.by !== ME).concat({ by: ME, kind: "no", text: reason });
  refreshStatus(p);
  closeForm();
  save();
  render();
  showToast(`In revision. ${nameOf(p.by)} and the others see your reason, so you can find a middle ground.`);
}

function withdraw(id) {
  const p = findProposal(id);
  p.status = "withdrawn";
  cancelVotes(id);
  const rule = p.replaces ? state.rules.find((r) => r.id === p.replaces) : null;
  if (rule) {
    rule.changing = null;
    rule.checkInAt = daysFromToday(TRIAL_DAYS);
  }
  save();
  render();
  showToast(`Withdrawn: "${p.text}".`);
}

function submitProposal(text) {
  const p = {
    id: newId("p"), text, tag: null, by: ME, createdAt: today(), version: 1,
    votes: { [ME]: "ok" }, objections: [], status: "voting", replaces: null,
  };
  state.proposals.push(p);
  scheduleVotes(p);
  closeForm();
  save();
  render();
  showToast("Proposed. Your flatmates will vote on it.");
}

function checkinVote(ruleId, choice) {
  const rule = state.rules.find((r) => r.id === ruleId);
  const checkin = state.checkins[ruleId];
  checkin.votes[ME] = choice;
  const count = (value) => Object.values(checkin.votes).filter((v) => v === value).length;
  const majority = Math.floor(FLATMATES.length / 2) + 1;

  delete state.checkins[ruleId];
  if (choice === "drop" && count("drop") >= majority) {
    state.rules = state.rules.filter((r) => r.id !== ruleId);
    showToast(`Dropped: "${rule.text}".`);
  } else if (count("keep") >= majority) {
    // A rule that survived its trial is checked less often.
    rule.checkInAt = daysFromToday(28);
    showToast(`Kept. Next check-in on ${formatShortDate(rule.checkInAt)}.`);
  } else {
    rule.checkInAt = daysFromToday(TRIAL_DAYS);
    showToast(`Most of the flat wants to keep it, so it stays. It comes up again on ${formatShortDate(rule.checkInAt)}.`);
  }
  save();
  render();
}

function submitChange(ruleId, text) {
  const rule = state.rules.find((r) => r.id === ruleId);
  const suggestion = state.checkins[ruleId]?.suggestion;
  const votes = { [ME]: "ok" };
  // If you send the version a flatmate suggested, they have already said OK to it.
  if (suggestion && suggestion.text === text) votes[suggestion.by] = "ok";

  const p = {
    id: newId("p"), text, tag: rule.tag, by: ME, createdAt: today(), version: 1,
    votes, objections: [], status: "voting", replaces: rule.id,
  };
  state.proposals.push(p);
  rule.changing = p.id;
  delete state.checkins[ruleId];
  scheduleVotes(p);
  closeForm();
  save();
  render();
  showToast("Change sent to the flat. The old rule stays until everyone agrees.");
}

function postComment(ruleId, text) {
  const rule = state.rules.find((r) => r.id === ruleId);
  rule.comments.push({ by: ME, name: null, text, at: Date.now() });
  delete ui.drafts[`comment:${ruleId}`];
  save();
  render();
  showToast("Comment posted. Everyone in the flat can see it.");
}

// ---------------------------------------------------------------------------
// Kind nudges
// ---------------------------------------------------------------------------

function defaultRecipient(itemId) {
  const item = NUDGE_ITEMS_BY_ID.get(itemId);
  return item.chore ? rotaFor(thisWeek())[item.chore] : null;
}

function nudgeText(itemId, to) {
  const item = NUDGE_ITEMS_BY_ID.get(itemId);
  if (!to || to === ME) return "";
  const name = nameOf(to);
  if (!item.phrase) return `Hey ${name}, `;
  // Pointing to the rule everyone agreed on keeps it about the flat, not about the person.
  const rule = ruleByTag(item.ruleTag);
  const agreed = rule ? ` We agreed: ${lowerFirst(rule.text)}.` : "";
  return `Hey ${name}, ${item.phrase}.${agreed} Could you sort it ${item.when}? Thanks!`;
}

function startNudge(itemId, to) {
  const item = NUDGE_ITEMS_BY_ID.has(itemId) ? itemId : "dishes";
  const recipient = FLATMATES_BY_ID.has(to) && to !== ME ? to : defaultRecipient(item);
  ui.nudge = { item, to: recipient === ME ? null : recipient, text: "", edited: false };
  ui.nudge.text = nudgeText(item, ui.nudge.to);
}

function recentNudge(to, itemId) {
  return state.nudges.find((n) => n.to === to && n.item === itemId && Date.now() - n.sentAt < NUDGE_COOLDOWN_MS);
}

function sendNudge() {
  const { item, to, text } = ui.nudge;
  const nudge = { id: newId("n"), item, to, text: text.trim(), sentAt: Date.now(), reply: null, sortedAt: null };
  state.nudges.push(nudge);
  schedule(3000, { kind: "reply", nudgeId: nudge.id });
  if (NUDGE_ITEMS_BY_ID.get(item).sorted) schedule(8000, { kind: "sorted", nudgeId: nudge.id });
  ui.nudge = null;
  save();
  location.hash = `#/sent/${nudge.id}`;
}

// ---------------------------------------------------------------------------
// Joining the flat
// ---------------------------------------------------------------------------

function startJoin() {
  ui.join = { step: "intro", name: "", ok: 0, asked: 0, asking: false };
}

function joinAnswer(asked, question) {
  const j = ui.join;
  const rule = state.rules[j.step];
  if (asked) {
    rule.comments.push({ by: null, name: j.name, text: question, at: Date.now() });
    j.asked += 1;
  } else {
    j.ok += 1;
  }
  j.asking = false;
  if (j.step + 1 < state.rules.length) {
    j.step += 1;
  } else {
    j.step = "done";
    state.newcomer = { name: j.name, ok: j.ok, asked: j.asked, rules: state.rules.length };
  }
  save();
  render();
  $("#main h1, #main h2")?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Simulated flatmates
// ---------------------------------------------------------------------------

let pendingTimer = null;

function schedule(delayMs, event) {
  state.pending.push({ ...event, dueAt: Date.now() + delayMs });
  armPending();
}

function applyEvent(event) {
  if (event.kind === "reply") {
    const n = state.nudges.find((x) => x.id === event.nudgeId);
    if (!n) return;
    const reply = n.item === "hood" ? "Sorry, I forgot. I'll put it on next time" : REPLIES[n.to];
    n.reply = { text: reply, at: event.dueAt };
    showToast(`${nameOf(n.to)} replied: "${reply}"`);
  } else if (event.kind === "sorted") {
    const n = state.nudges.find((x) => x.id === event.nudgeId);
    if (!n) return;
    n.sortedAt = event.dueAt;
    showToast(`${NUDGE_ITEMS_BY_ID.get(n.item).sorted} by ${nameOf(n.to)}`);
  } else if (event.kind === "vote") {
    const p = findProposal(event.proposalId);
    // A vote on an older wording no longer counts.
    if (!p || p.version !== event.version || (p.status !== "voting" && p.status !== "revision")) return;
    p.votes[event.who] = event.value;
    if (event.value === "no") p.objections.push({ by: event.who, kind: "no", text: event.text });
    if (refreshStatus(p)) return;
    showToast(event.value === "no"
      ? `${nameOf(event.who)} wants to talk about "${p.text}". It's in revision now.`
      : `${nameOf(event.who)} said OK to "${p.text}"`);
  }
}

function runPending() {
  const now = Date.now();
  state.pending.sort((a, b) => a.dueAt - b.dueAt);
  let changed = false;
  while (state.pending.length && state.pending[0].dueAt <= now) {
    applyEvent(state.pending.shift());
    changed = true;
  }
  if (changed) {
    save();
    renderUnlessTyping();
  }
  armPending();
}

function armPending() {
  clearTimeout(pendingTimer);
  if (!state.pending.length) return;
  const next = Math.min(...state.pending.map((e) => e.dueAt));
  pendingTimer = setTimeout(runPending, Math.max(0, next - Date.now()) + 20);
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;
let toastAction = null;

function showToast(text, { actionLabel, onAction } = {}) {
  const toast = $("#toast");
  const action = $("#toast-action");
  $("#toast-text").textContent = text;
  toastAction = onAction ?? null;
  action.hidden = !actionLabel;
  action.textContent = actionLabel ?? "";
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 6000 : 4000);
}

function hideToast() {
  $("#toast").hidden = true;
  toastAction = null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const VIEWS = ["week", "history", "nudge", "sent", "supplies", "rules", "flat", "invite", "join"];
const TAB_FOR_VIEW = { history: "week", nudge: "week", sent: "week", invite: "flat", join: "flat" };

function route() {
  const [view, ...args] = location.hash.replace(/^#\/?/, "").split("/");
  return { view: VIEWS.includes(view) ? view : "week", args };
}

function isTyping() {
  const el = document.activeElement;
  return Boolean(el && $("#main").contains(el) && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text")));
}

// A simulated reply must not wipe out text someone is in the middle of typing.
function renderUnlessTyping() {
  if (isTyping()) ui.needsRender = true;
  else render();
}

function render() {
  ui.needsRender = false;
  const { view, args } = route();
  const views = {
    week: renderWeek, history: renderHistory, nudge: renderNudge, sent: renderSent, supplies: renderSupplies,
    rules: renderRules, flat: renderFlat, invite: renderInvite, join: renderJoin,
  };
  $("#main").innerHTML = views[view](args);

  const activeTab = TAB_FOR_VIEW[view] ?? view;
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === activeTab) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  setBadge("#rules-badge", dueCheckins().length + activeProposals().filter(needsMyVote).length);
  setBadge("#supplies-badge", runningLow().length);
}

function setBadge(selector, count) {
  const badge = $(selector);
  badge.hidden = count === 0;
  badge.textContent = count;
}

function chip(text, tone) {
  return `<span class="chip chip-${tone}">${escapeHtml(text)}</span>`;
}

function checklist(chore, steps, editable) {
  const items = chore.steps.map((label, i) => editable
    ? `<li><label class="check"><input type="checkbox" data-step="${chore.id}:${i}"${steps[i] ? " checked" : ""}><span>${escapeHtml(label)}</span></label></li>`
    : `<li class="check-static${steps[i] ? " is-ticked" : ""}"><span class="visually-hidden">${steps[i] ? "Done: " : "Not done: "}</span>${escapeHtml(label)}</li>`).join("");
  return `<ul class="checklist">${items}</ul>`;
}

function reminderBanner(rota) {
  const mine = CHORES.find((c) => rota[c.id] === ME);
  if (!mine || doneRecord(thisWeek(), mine.id) || state.reminderHiddenOn === today()) return "";
  const left = daysBetween(today(), addDays(thisWeek(), 6));
  const due = left <= 0 ? "due today" : left === 1 ? "due tomorrow" : `due Sunday, ${left} days left`;
  const steps = stepsFor(thisWeek(), mine.id);
  const progress = steps.some(Boolean) ? ` ${steps.filter(Boolean).length} of ${steps.length} steps done.` : "";
  return `
    <aside class="reminder${left <= 1 ? " is-urgent" : ""}" aria-label="Reminder">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
      <p><strong>The ${mine.name.toLowerCase()} is still open</strong>, ${due}.${progress}</p>
      <button type="button" class="reminder-hide" data-action="hide-reminder">Hide</button>
    </aside>`;
}

function renderWeek() {
  const week = thisWeek();
  const rota = rotaFor(week);
  const nextRota = rotaFor(addDays(week, 7));
  const myNext = CHORES.find((c) => nextRota[c.id] === ME);

  const rows = CHORES.map((chore) => {
    const who = rota[chore.id];
    const mine = who === ME;
    const steps = stepsFor(week, chore.id);
    const ticked = steps.filter(Boolean).length;
    const done = doneRecord(week, chore.id);
    let status;
    let action;
    if (done) {
      status = `<span class="done-mark" aria-hidden="true"></span>Done by ${escapeHtml(done.by === ME ? "you" : nameOf(done.by))}, ${relativeDay(done.at)}`;
      action = mine ? `<button type="button" class="btn btn-small btn-quiet" data-action="reopen" data-chore="${chore.id}">Undo</button>` : "";
    } else {
      status = ticked ? `${ticked} of ${steps.length} steps done` : mine ? "Your turn this week" : "Not started yet";
      action = mine
        ? `<button type="button" class="btn btn-small" data-action="mark-done" data-chore="${chore.id}">Mark done</button>`
        : `<a class="btn btn-small btn-quiet" href="#/nudge/${CHORE_TO_ITEM[chore.id]}/${who}">Nudge</a>`;
    }
    return `
      <li class="chore${done ? " is-done" : ""}${mine ? " is-mine" : ""}">
        <div class="chore-main">
          <p class="chore-title">${chore.name}<span class="chore-who">${escapeHtml(nameOf(who))}</span></p>
          <p class="chore-status">${status}</p>
          <details class="chore-details" data-chore="${chore.id}"${ui.openChecklists.has(chore.id) ? " open" : ""}>
            <summary>Checklist, ${ticked} of ${steps.length} done</summary>
            ${checklist(chore, steps, mine)}
          </details>
        </div>
        ${action}
      </li>`;
  }).join("");

  const bars = [...FLATMATES]
    .map((f) => ({ f, n: doneThisMonth(f.id) }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...bars.map((b) => b.n));
  const barRows = bars.map(({ f, n }) => `
    <li class="bar-row">
      <span class="bar-name">${escapeHtml(f.name)}</span>
      <span class="bar-track"><span class="bar-fill" style="width: ${(n / max) * 100}%"></span></span>
      <span class="bar-count">${n}<span class="visually-hidden"> chores</span></span>
    </li>`).join("");

  const due = dueCheckins().length;
  const votes = activeProposals().filter(needsMyVote).length;
  const rulesSummary = [
    `${state.rules.length} agreed`,
    votes ? `${votes} waiting for your vote` : null,
    due ? `${due} check-in due` : null,
  ].filter(Boolean).join(", ");

  return `
    <section class="view">
      ${reminderBanner(rota)}
      <h1 tabindex="-1">This week</h1>
      <ul class="chores">${rows}</ul>
      <a class="btn btn-primary btn-block" href="#/nudge">Something left out?</a>
      <p class="hint after-cta">Chores rotate every Monday.${myNext ? ` Next week you have the ${myNext.name.toLowerCase()}.` : ""}</p>

      <div class="section-head">
        <h2>Done this month</h2>
        <a href="#/history">Past weeks</a>
      </div>
      <ul class="bars" aria-label="Chores done this month">${barRows}</ul>

      <h2>House rules</h2>
      <a class="summary-link" href="#/rules">
        <span>${escapeHtml(rulesSummary)}</span>
        <span class="summary-go">Open rules</span>
      </a>
    </section>`;
}

function renderHistory() {
  const weeks = [1, 2, 3, 4]
    .map((k) => addDays(thisWeek(), -7 * k))
    .filter((w) => state.steps[w]);

  const sections = weeks.map((w) => {
    const rota = rotaFor(w);
    const doneCount = CHORES.filter((c) => doneRecord(w, c.id)).length;
    const rows = CHORES.map((chore) => {
      const who = rota[chore.id];
      const done = doneRecord(w, chore.id);
      const steps = stepsFor(w, chore.id);
      const ticked = steps.filter(Boolean).length;
      const status = done
        ? chip(`Done ${weekdayFormat.format(new Date(done.at))}`, "ok")
        : chip(ticked ? `${ticked} of ${steps.length} steps` : "Not done", ticked ? "warn" : "no");
      return `<li class="rule"><span><strong>${chore.name}</strong>, ${escapeHtml(nameOf(who))}</span>${status}</li>`;
    }).join("");
    return `
      <div class="section-head">
        <h2>Week of ${formatShortDate(w)}</h2>
        <span class="meta">${doneCount} of ${CHORES.length} done</span>
      </div>
      <ul class="rules">${rows}</ul>`;
  }).join("");

  return `
    <section class="view">
      <a class="back" href="#/week">Back</a>
      <h1 tabindex="-1">Past weeks</h1>
      <p class="lede">Who had what, and whether it got done.</p>
      ${sections || `<p class="empty">No past weeks yet.</p>`}
    </section>`;
}

function renderNudge(args) {
  if (!ui.nudge || args.length) {
    startNudge(args[0], args[1]);
    if (args.length) history.replaceState(null, "", "#/nudge");
  }
  const { item, to, text, edited } = ui.nudge;
  const itemDef = NUDGE_ITEMS_BY_ID.get(item);
  const rule = ruleByTag(itemDef.ruleTag);
  const duty = itemDef.chore ? rotaFor(thisWeek())[itemDef.chore] : null;
  const recent = to ? recentNudge(to, item) : null;
  const canSend = Boolean(to) && text.trim().length > `Hey ${to ? nameOf(to) : ""}, `.trim().length;

  const itemChips = NUDGE_ITEMS.map((i) => `
    <label class="pick">
      <input type="radio" name="item" value="${i.id}"${i.id === item ? " checked" : ""}>
      <span>${i.label}</span>
    </label>`).join("");

  const people = FLATMATES.filter((f) => f.id !== ME).map((f) => `
    <option value="${f.id}"${f.id === to ? " selected" : ""}>${escapeHtml(f.name)}${f.id === duty ? ` (on ${itemDef.chore} duty)` : ""}</option>`).join("");

  let dutyNote = "";
  if (duty === ME) dutyNote = `<p class="hint">You're on ${itemDef.chore} duty this week. Pick who left it out.</p>`;
  else if (duty) dutyNote = `<p class="hint">${escapeHtml(nameOf(duty))} is on ${itemDef.chore} duty this week.</p>`;

  return `
    <section class="view">
      <a class="back" href="#/week">Back</a>
      <h1 tabindex="-1">Something left out?</h1>
      <p class="lede">Send one person a friendly note. Only they see it.</p>

      <form id="nudge-form" class="stack" novalidate>
        <fieldset>
          <legend>What is it?</legend>
          <div class="picks">${itemChips}</div>
        </fieldset>

        <label class="field">
          <span>Send to</span>
          <select name="to">
            <option value=""${to ? "" : " selected"} disabled>Choose a flatmate</option>
            ${people}
          </select>
        </label>
        ${dutyNote}

        <label class="field">
          <span>Message</span>
          <textarea name="text" rows="5" maxlength="280">${escapeHtml(text)}</textarea>
        </label>
        <p class="hint">${rule ? `It points to the rule you all agreed on: "${escapeHtml(rule.text)}".` : "No house rule covers this yet. If it keeps happening, propose one."}</p>
        ${edited ? `<button type="button" class="link-btn" data-action="reset-wording">Use the suggested wording</button>` : ""}
        ${recent ? `<p class="notice">You already nudged ${escapeHtml(nameOf(to))} about this at ${formatTime(recent.sentAt)}. Give it some time, or talk in person.</p>` : ""}

        <button type="submit" class="btn btn-primary btn-block"${canSend ? "" : " disabled"}>Send nudge</button>
      </form>
    </section>`;
}

function renderSent(args) {
  const n = state.nudges.find((x) => x.id === args[0]) ?? state.nudges[state.nudges.length - 1];
  if (!n) {
    return `
      <section class="view">
        <h1 tabindex="-1">No nudges yet</h1>
        <p class="lede">When something is left out, send a friendly nudge instead of a note on the fridge.</p>
        <a class="btn btn-primary btn-block" href="#/nudge">Something left out?</a>
      </section>`;
  }
  const name = escapeHtml(nameOf(n.to));
  const item = NUDGE_ITEMS_BY_ID.get(n.item);
  const steps = [
    `<li class="step is-done"><span class="step-time">${formatTime(n.sentAt)}</span>Sent to ${name}</li>`,
    n.reply
      ? `<li class="step is-done"><span class="step-time">${formatTime(n.reply.at)}</span>${name} replied: "${escapeHtml(n.reply.text)}"</li>`
      : `<li class="step is-waiting"><span class="step-time">...</span>Waiting for ${name} to reply</li>`,
  ];
  if (item.sorted) {
    steps.push(n.sortedAt
      ? `<li class="step is-done"><span class="step-time">${formatTime(n.sortedAt)}</span>${item.sorted} by ${name}</li>`
      : `<li class="step is-waiting"><span class="step-time">...</span>Not sorted yet</li>`);
  }

  return `
    <section class="view">
      <h1 tabindex="-1">Nudge sent</h1>
      <p class="lede">To ${name}, ${relativeDay(n.sentAt)} at ${formatTime(n.sentAt)}</p>
      <blockquote class="note">${escapeHtml(n.text)}</blockquote>
      <ol class="steps">${steps.join("")}</ol>
      <p class="hint">If it keeps happening, talk in person first, then bring it up at the next check-in.</p>
      <a class="btn btn-primary btn-block" href="#/week">Back to this week</a>
    </section>`;
}

function renderSupplies() {
  const low = runningLow();
  const bought = state.supplies
    .filter((s) => s.boughtBy)
    .sort((a, b) => b.boughtAt - a.boughtAt)
    .slice(0, 5);
  const who = (id) => escapeHtml(id === ME ? "you" : nameOf(id));

  const lowRows = low.map((s) => `
    <li class="supply">
      <span><strong>${escapeHtml(s.name)}</strong><br><span class="meta">Added by ${who(s.addedBy)}, ${relativeDay(s.addedAt)}</span></span>
      <button type="button" class="btn btn-small" data-action="buy" data-id="${s.id}">I bought it</button>
    </li>`).join("");
  const boughtRows = bought.map((s) => `
    <li class="supply is-bought">
      <span><strong>${escapeHtml(s.name)}</strong><br><span class="meta">Bought by ${who(s.boughtBy)}, ${relativeDay(s.boughtAt)}</span></span>
      <span class="done-mark" aria-hidden="true"></span>
    </li>`).join("");

  return `
    <section class="view">
      <h1 tabindex="-1">Shared supplies</h1>
      <p class="lede">When something runs out, add it. The first person who buys it ticks it off, so it's only bought once.</p>

      <form class="add-row" data-form="supply" data-id="new" novalidate>
        <label class="visually-hidden" for="supply-name">Item</label>
        <input id="supply-name" type="text" name="text" maxlength="40" placeholder="e.g. Toilet paper" autocomplete="off" data-draft="supply:new" value="${escapeHtml(ui.drafts["supply:new"] ?? "")}">
        <button type="submit" class="btn btn-primary">Add</button>
      </form>

      <h2>Running low</h2>
      <ul class="supplies">${lowRows || `<li class="empty">Nothing is running low.</li>`}</ul>

      ${boughtRows ? `<h2>Bought recently</h2><ul class="supplies">${boughtRows}</ul>` : ""}
    </section>`;
}

function votesList(votes, labels) {
  return `<ul class="votes">${FLATMATES.map((f) => {
    const [text, tone] = labels[votes[f.id]] ?? ["Not voted yet", "muted"];
    return `<li><span>${escapeHtml(f.id === ME ? "You" : f.name)}</span>${chip(text, tone)}</li>`;
  }).join("")}</ul>`;
}

function inlineForm({ kind, id, label, placeholder, submit, value = "", hint = "", maxlength = 80 }) {
  const key = `${kind}:${id}`;
  const draft = ui.drafts[key] ?? value;
  return `
    <form class="inline-form" data-form="${kind}" data-id="${id}" novalidate>
      <label class="field">
        <span>${label}</span>
        <textarea name="text" rows="2" maxlength="${maxlength}" placeholder="${escapeHtml(placeholder)}" data-draft="${key}">${escapeHtml(draft)}</textarea>
      </label>
      ${hint ? `<p class="hint">${hint}</p>` : ""}
      <div class="row">
        <button type="submit" class="btn btn-primary">${submit}</button>
        <button type="button" class="btn btn-quiet" data-action="close-form" data-kind="${kind}" data-id="${id}">Cancel</button>
      </div>
    </form>`;
}

const formIsOpen = (kind, id) => ui.openForm?.kind === kind && ui.openForm?.id === id;

function renderCheckin(rule) {
  const c = state.checkins[rule.id];
  const labels = { keep: ["Keep", "ok"], change: ["Change", "warn"], drop: ["Drop", "no"] };
  const suggestion = c.suggestion
    ? `<p class="suggestion">${escapeHtml(nameOf(c.suggestion.by))} suggests: "${escapeHtml(c.suggestion.text)}"</p>`
    : "";
  const body = formIsOpen("change", rule.id)
    ? inlineForm({
      kind: "change", id: rule.id, label: "New wording", placeholder: "e.g. Dishes done by the next morning",
      submit: "Send to the flat", value: c.suggestion?.text ?? rule.text,
      hint: "Everyone votes on the new wording. The old rule stays until they all agree.",
    })
    : `
      <div class="row row-3">
        <button type="button" class="btn btn-primary" data-action="checkin" data-rule="${rule.id}" data-choice="keep">Keep</button>
        <button type="button" class="btn" data-action="open-form" data-kind="change" data-id="${rule.id}">Change</button>
        <button type="button" class="btn" data-action="checkin" data-rule="${rule.id}" data-choice="drop">Drop</button>
      </div>`;

  return `
    <article class="card card-checkin">
      <p class="card-kicker">Trial over: is it still working?</p>
      <h3>${escapeHtml(rule.text)}</h3>
      <p class="meta">Agreed ${formatShortDate(rule.agreedAt)}. Two weeks later, the flat checks it still makes sense.</p>
      ${votesList(c.votes, labels)}
      ${suggestion}
      ${body}
    </article>`;
}

function renderProposal(p) {
  const labels = { ok: ["OK", "ok"], tweak: ["Wants a tweak", "warn"], no: ["Said no", "no"] };
  const mine = p.by === ME;
  const replacing = p.replaces ? state.rules.find((r) => r.id === p.replaces) : null;

  const objections = p.objections.map((o, i) => `
    <li class="objection">
      <p><strong>${escapeHtml(o.by === ME ? "You" : nameOf(o.by))}</strong> ${o.kind === "tweak" ? "suggests" : "said no"}: "${escapeHtml(o.text)}"</p>
      ${o.kind === "tweak" && o.by !== ME ? `<button type="button" class="btn btn-small btn-primary" data-action="agree-version" data-id="${p.id}" data-index="${i}">Agree to ${escapeHtml(nameOf(o.by))}'s version</button>` : ""}
    </li>`).join("");

  let body;
  if (formIsOpen("middle", p.id)) {
    body = inlineForm({
      kind: "middle", id: p.id, label: "Your version", placeholder: "A wording that works for everyone",
      submit: "Send my version", value: p.text, hint: "Everyone votes again on your version.",
    });
  } else if (formIsOpen("no", p.id)) {
    body = inlineForm({
      kind: "no", id: p.id, label: "Why not?", placeholder: "e.g. I work late shifts on Thursdays",
      submit: "Say no", hint: "Saying no doesn't end it: the rule goes into revision until you find a middle ground.",
    });
  } else {
    const status = p.status === "revision"
      ? `<p class="status">In revision: not everyone agrees yet. Agree to a suggested version, or suggest a middle ground.</p>`
      : `<p class="status">${p.votes[ME] === "ok" ? `You said OK. Waiting for ${escapeHtml(listNames(othersNotOk(p)))}.` : "Waiting for your vote."}</p>`;
    const vote = p.votes[ME] !== "ok" && !mine
      ? `
        <div class="row row-3">
          <button type="button" class="btn" data-action="vote-ok" data-id="${p.id}">OK</button>
          <button type="button" class="btn" data-action="open-form" data-kind="middle" data-id="${p.id}">Tweak</button>
          <button type="button" class="btn" data-action="open-form" data-kind="no" data-id="${p.id}">No</button>
        </div>`
      : p.status === "revision"
        ? `<button type="button" class="btn btn-block" data-action="open-form" data-kind="middle" data-id="${p.id}">Suggest a middle ground</button>`
        : "";
    const withdrawBtn = mine ? `<button type="button" class="link-btn" data-action="withdraw" data-id="${p.id}">Withdraw this proposal</button>` : "";
    body = `${status}${vote}${withdrawBtn}`;
  }

  return `
    <article class="card${p.status === "revision" ? " card-revision" : ""}">
      ${p.status === "revision" ? `<p class="card-kicker">In revision</p>` : ""}
      <h3>${escapeHtml(p.text)}</h3>
      <p class="meta">${replacing ? `Would replace "${escapeHtml(replacing.text)}". ` : ""}Proposed by ${escapeHtml(mine ? "you" : nameOf(p.by))}, ${relativeDay(parseISODate(p.createdAt).getTime())}.${p.version > 1 ? ` Version ${p.version}.` : ""}</p>
      ${votesList(p.votes, labels)}
      ${objections ? `<ul class="objections">${objections}</ul>` : ""}
      ${body}
    </article>`;
}

function commentAuthor(c) {
  if (c.by) return c.by === ME ? "You" : nameOf(c.by);
  return `${c.name} (moving in)`;
}

function renderRuleItem(r) {
  let status;
  if (r.changing && findProposal(r.changing)?.status === "voting") status = chip("Change being voted on", "warn");
  else if (r.changing && findProposal(r.changing)?.status === "revision") status = chip("Change in revision", "warn");
  else if (state.checkins[r.id] && r.checkInAt <= today()) status = chip("Check-in due", "warn");
  else if (isOnTrial(r)) status = chip(`Trial until ${formatShortDate(r.checkInAt)}`, "trial");
  else status = chip(`Next check-in ${formatShortDate(r.checkInAt)}`, "muted");

  const open = ui.openComments.has(r.id);
  const label = r.comments.length ? `Comments (${r.comments.length})` : "Comment";
  const thread = open ? `
    <ul class="comments">${r.comments.map((c) => `
      <li class="comment"><p><strong>${escapeHtml(commentAuthor(c))}</strong> <span class="meta">${relativeDay(c.at)}</span></p><p>${escapeHtml(c.text)}</p></li>`).join("")}
    </ul>
    ${inlineForm({
      kind: "comment", id: r.id, label: "Your comment", placeholder: "e.g. The hood was off again last night",
      submit: "Post", hint: "Everyone sees your name. Say it like you would in person.", maxlength: 280,
    })}` : "";

  return `
    <li class="rule rule-block">
      <div class="rule-head"><span class="rule-text">${escapeHtml(r.text)}</span>${status}</div>
      <button type="button" class="link-btn" data-action="toggle-comments" data-id="${r.id}" aria-expanded="${open}">${open ? "Hide comments" : label}</button>
      ${thread}
    </li>`;
}

function renderRules() {
  const due = dueCheckins();
  const revision = state.proposals.filter((p) => p.status === "revision");
  const voting = state.proposals.filter((p) => p.status === "voting");

  const propose = formIsOpen("propose", "new")
    ? inlineForm({
      kind: "propose", id: "new", label: "Your rule", placeholder: "e.g. Guests staying over: tell the flat a day before",
      submit: "Propose", hint: "Keep it short and specific. It starts with a two-week trial once everyone says OK.",
    })
    : `<button type="button" class="btn btn-block" data-action="open-form" data-kind="propose" data-id="new">Propose a rule</button>`;

  return `
    <section class="view">
      <h1 tabindex="-1">House rules</h1>
      <p class="lede">A rule only counts when all four of you say OK. If anyone says no or wants a tweak, it goes into revision until you find a middle ground.</p>

      ${due.length ? `<h2>Check-in due</h2>${due.map(renderCheckin).join("")}` : ""}
      ${revision.length ? `<h2>In revision</h2>${revision.map(renderProposal).join("")}` : ""}
      ${voting.length ? `<h2>Being voted on</h2>${voting.map(renderProposal).join("")}` : ""}

      <h2>Agreed</h2>
      <ul class="rules">${state.rules.map(renderRuleItem).join("") || `<li class="empty">No rules yet. Propose the first one.</li>`}</ul>
      ${propose}
    </section>`;
}

function renderFlat() {
  const people = FLATMATES.map((f) => {
    const stay = f.until
      ? `Moved in ${monthFormat.format(parseISODate(f.since))}, moving out ${monthFormat.format(parseISODate(f.until))}`
      : `Moved in ${monthFormat.format(parseISODate(f.since))}`;
    return `<li class="person"><span class="avatar" aria-hidden="true">${escapeHtml(f.name.charAt(0))}</span><span><strong>${escapeHtml(f.name)}</strong>, ${f.room}<br><span class="meta">${stay}</span></span></li>`;
  });
  const n = state.newcomer;
  if (n) {
    people.push(`<li class="person"><span class="avatar avatar-new" aria-hidden="true">${escapeHtml(n.name.charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(n.name)}</strong>, moving in<br><span class="meta">Said OK to ${n.ok} of ${n.rules} rules${n.asked ? `, asked about ${n.asked}` : ""}</span></span></li>`);
  }

  return `
    <section class="view">
      <h1 tabindex="-1">Flat 3B</h1>
      <p class="lede">Four people, two of them moving out within months.</p>
      <ul class="people">${people.join("")}</ul>
      <a class="btn btn-block" href="#/invite">Invite a flatmate</a>

      <h2>How it works here</h2>
      <ol class="how">
        <li>Anyone can propose a rule. It only counts when everyone says OK. A no or a tweak puts it in revision.</li>
        <li>Every new rule gets a two-week trial, then the flat checks it still works.</li>
        <li>When someone moves in, they go through the rules and say OK to each one, or ask about it.</li>
      </ol>

      <h2>Demo</h2>
      <p class="hint">This is a prototype. Flatmates are invented and their replies are simulated. Your changes are saved in this browser only.</p>
      <button type="button" class="btn btn-block" data-action="reset">Reset the demo</button>
    </section>`;
}

function renderInvite() {
  const pad = 4;
  const box = QR_SIZE + pad * 2;
  return `
    <section class="view">
      <a class="back" href="#/flat">Back</a>
      <h1 tabindex="-1">Invite a flatmate</h1>
      <p class="lede">They scan this, go through the house rules and say OK to each one before they move in.</p>
      <figure class="qr-card">
        <svg class="qr" viewBox="${-pad} ${-pad} ${box} ${box}" role="img" aria-label="QR code for ${JOIN_URL}, the HouseDeal welcome page">
          <rect x="${-pad}" y="${-pad}" width="${box}" height="${box}" fill="#ffffff" />
          <path d="${QR_PATH}" fill="#17232c" shape-rendering="crispEdges" />
        </svg>
        <figcaption>Or join with the code <strong class="flat-code">${FLAT_CODE}</strong></figcaption>
      </figure>
      <p class="hint">Prototype: scanning opens the welcome page on any phone, but nobody is added to a real flat.</p>
      <a class="btn btn-primary btn-block" href="#/join">Preview the welcome page</a>
    </section>`;
}

function renderJoin() {
  if (!ui.join) startJoin();
  const j = ui.join;
  const total = state.rules.length;

  if (j.step === "intro") {
    return `
      <section class="view">
        <h1 tabindex="-1">Welcome to Flat 3B</h1>
        <p class="lede">Jonas, Lea and Mia agreed on ${total} house rules. Go through them before you move in: say OK, or ask about one.</p>
        <form class="stack" data-form="join-name" data-id="intro" novalidate>
          <label class="field">
            <span>Your first name</span>
            <input type="text" name="text" maxlength="24" autocomplete="given-name" data-draft="join:name" value="${escapeHtml(ui.drafts["join:name"] ?? "")}">
          </label>
          <button type="submit" class="btn btn-primary btn-block">See the house rules</button>
        </form>
      </section>`;
  }

  if (j.step === "done") {
    return `
      <section class="view">
        <h1 tabindex="-1">You're in, ${escapeHtml(j.name)}</h1>
        <p class="lede">You said OK to ${j.ok} of ${total} rules${j.asked ? ` and asked about ${j.asked}. Your flatmates answer under each rule` : ""}.</p>
        <p class="hint">Every rule gets a check-in, so if one stops working for you, you can change it with the others.</p>
        <a class="btn btn-primary btn-block" href="#/week">Open the flat</a>
        <button type="button" class="btn btn-block" data-action="join-restart">Start again</button>
      </section>`;
  }

  const rule = state.rules[j.step];
  const dots = state.rules.map((_, i) => `<span class="dot${i < j.step ? " is-past" : i === j.step ? " is-current" : ""}"></span>`).join("");
  const ask = j.asking
    ? inlineForm({ kind: "join-ask", id: rule.id, label: "Your question", placeholder: "e.g. Does this include breakfast dishes?", submit: "Send question", maxlength: 280 })
    : `
      <div class="row">
        <button type="button" class="btn btn-primary" data-action="join-ok">OK</button>
        <button type="button" class="btn" data-action="join-ask">Ask about this</button>
      </div>`;

  return `
    <section class="view">
      <p class="card-kicker">Rule ${j.step + 1} of ${total}</p>
      <div class="dots" aria-hidden="true">${dots}</div>
      <article class="card join-card">
        <h1 tabindex="-1">${escapeHtml(rule.text)}</h1>
        <p class="meta">Agreed by everyone on ${formatShortDate(rule.agreedAt)}.${rule.comments.length ? ` ${rule.comments.length} comments.` : ""}</p>
        ${ask}
      </article>
    </section>`;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function openForm(kind, id) {
  ui.openForm = { kind, id };
  render();
  const field = $(`[data-form="${kind}"] textarea`);
  if (field) {
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }
}

function closeForm() {
  if (ui.openForm) delete ui.drafts[`${ui.openForm.kind}:${ui.openForm.id}`];
  ui.openForm = null;
}

function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const { action, id } = el.dataset;
  if (action === "mark-done") markDone(el.dataset.chore);
  else if (action === "reopen") reopenChore(el.dataset.chore);
  else if (action === "hide-reminder") {
    state.reminderHiddenOn = today();
    save();
    render();
  } else if (action === "buy") buySupply(id);
  else if (action === "vote-ok") voteOk(id);
  else if (action === "agree-version") agreeToVersion(id, Number(el.dataset.index));
  else if (action === "withdraw") withdraw(id);
  else if (action === "checkin") checkinVote(el.dataset.rule, el.dataset.choice);
  else if (action === "open-form") openForm(el.dataset.kind, id);
  else if (action === "close-form") {
    if (ui.join?.asking) ui.join.asking = false;
    if (el.dataset.kind === "comment") {
      ui.openComments.delete(id);
      delete ui.drafts[`comment:${id}`];
    }
    closeForm();
    render();
  } else if (action === "toggle-comments") {
    if (ui.openComments.has(id)) ui.openComments.delete(id);
    else ui.openComments.add(id);
    render();
  } else if (action === "join-ok") joinAnswer(false);
  else if (action === "join-ask") {
    ui.join.asking = true;
    ui.openForm = { kind: "join-ask", id: state.rules[ui.join.step].id };
    render();
    $("[data-form=join-ask] textarea")?.focus();
  } else if (action === "join-restart") {
    startJoin();
    render();
  } else if (action === "reset-wording") {
    ui.nudge.text = nudgeText(ui.nudge.item, ui.nudge.to);
    ui.nudge.edited = false;
    render();
  } else if (action === "reset") {
    if (!confirm("Reset the demo? Your chores, nudges and votes will be cleared.")) return;
    state = seedState();
    Object.assign(ui, { openForm: null, drafts: {}, nudge: null, join: null });
    ui.openChecklists.clear();
    ui.openComments.clear();
    save();
    armPending();
    location.hash = "#/week";
    render();
    showToast("Demo reset");
  }
}

function onSubmit(event) {
  const form = event.target;
  event.preventDefault();

  if (form.id === "nudge-form") {
    if (ui.nudge.to && ui.nudge.text.trim()) sendNudge();
    return;
  }

  const text = form.elements.text.value.trim().replace(/\s+/g, " ");
  const { form: kind, id } = form.dataset;
  const minLength = kind === "supply" || kind === "join-name" ? 2 : 4;
  if (text.length < minLength) {
    showToast(kind === "join-name" ? "Write your first name first." : "Write a few words first.");
    form.elements.text.focus();
    return;
  }
  if (kind === "middle") submitMiddleGround(id, text);
  else if (kind === "no") submitNo(id, text);
  else if (kind === "propose") submitProposal(text);
  else if (kind === "change") submitChange(id, text);
  else if (kind === "comment") postComment(id, text);
  else if (kind === "supply") addSupply(text);
  else if (kind === "join-name") {
    ui.join.name = text;
    ui.join.step = 0;
    render();
    $("#main h1")?.focus({ preventScroll: true });
  } else if (kind === "join-ask") {
    closeForm();
    joinAnswer(true, text);
  }
}

function onInput(event) {
  const el = event.target;
  if (el.dataset.draft) {
    ui.drafts[el.dataset.draft] = el.value;
    return;
  }
  if (!ui.nudge || !el.closest("#nudge-form")) return;

  if (el.name === "text") {
    ui.nudge.text = el.value;
    ui.nudge.edited = true;
    // Only the send button depends on the text, so avoid a re-render that would steal focus.
    const send = $("#nudge-form [type=submit]");
    send.disabled = !(ui.nudge.to && el.value.trim().length > `Hey ${nameOf(ui.nudge.to)},`.length);
    return;
  }
  if (el.name === "item") {
    ui.nudge.item = el.value;
    const duty = defaultRecipient(el.value);
    if (duty && duty !== ME) ui.nudge.to = duty;
  } else if (el.name === "to") {
    ui.nudge.to = el.value;
  }
  if (!ui.nudge.edited) ui.nudge.text = nudgeText(ui.nudge.item, ui.nudge.to);
  render();
  // The form was rebuilt, so put keyboard focus back on the control that changed.
  $(el.name === "item" ? "#nudge-form [name=item]:checked" : "#nudge-form [name=to]")?.focus();
}

function onChange(event) {
  const el = event.target;
  if (!el.dataset.step) return;
  const [choreId, index] = el.dataset.step.split(":");
  toggleStep(choreId, Number(index), el.checked);
  $(`[data-step="${el.dataset.step}"]`)?.focus();
}

// <details> keeps its open state in the DOM, which a re-render throws away.
function onToggle(event) {
  const details = event.target;
  if (!details.matches?.(".chore-details")) return;
  if (details.open) ui.openChecklists.add(details.dataset.chore);
  else ui.openChecklists.delete(details.dataset.chore);
}

function onRouteChange() {
  const { view } = route();
  if (view !== "nudge") ui.nudge = null;
  if (view !== "join") ui.join = null;
  ui.openForm = null;
  render();
  window.scrollTo(0, 0);
  $("#main h1")?.focus({ preventScroll: true });
}

function init() {
  $("#today").textContent = dayFormat.format(new Date());
  const main = $("#main");
  main.addEventListener("click", onClick);
  main.addEventListener("submit", onSubmit);
  main.addEventListener("input", onInput);
  main.addEventListener("change", onChange);
  main.addEventListener("toggle", onToggle, true); // toggle doesn't bubble, so listen while capturing
  // Deferred so a click on a button that caused the blur still lands before re-rendering.
  main.addEventListener("focusout", () => setTimeout(() => {
    if (ui.needsRender && !isTyping()) render();
  }, 300));
  $("#toast-action").addEventListener("click", () => {
    const action = toastAction;
    hideToast();
    action?.();
  });
  window.addEventListener("hashchange", onRouteChange);

  render();
  runPending();
}

init();
