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

// "Done means" spells out the standard, because a vacuumed floor is not a clean flat
// to everyone (interview 2: dusting, cleaning products and mopping were a surprise).
const CHORES = [
  { id: "kitchen", name: "Kitchen", doneMeans: "Counters and hob wiped, sink empty, table cleared, floor swept." },
  { id: "bathroom", name: "Bathroom", doneMeans: "Toilet, sink and shower cleaned with product, mirror wiped, floor mopped." },
  { id: "bins", name: "Bins", doneMeans: "Rest, paper and plastic taken out, new bags in." },
  { id: "hallway", name: "Hallway", doneMeans: "Hoovered and mopped, shoes on the rack, surfaces dusted." },
];
const CHORES_BY_ID = new Map(CHORES.map((c) => [c.id, c]));

// Who has which chore in the first week; it rotates by one person every week.
const ROTATION_START = ["jonas", ME, "lea", "mia"];

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

const STORAGE_KEY = "housedeal.v1";
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

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

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
// State
// ---------------------------------------------------------------------------

function seedState() {
  const now = Date.now();
  const monday = mondayOf(new Date());
  const week = toISODate(monday);
  // Clamped to Monday so seeded chores never look done before this week started.
  const doneAgo = (ms) => Math.max(monday.getTime(), now - ms);
  return {
    version: 1,
    rotationStartWeek: week,
    done: {
      [week]: {
        bins: { by: "lea", at: doneAgo(DAY_MS) },
        hallway: { by: "mia", at: doneAgo(2 * DAY_MS) },
      },
    },
    tally: { [monthKey()]: { you: 3, lea: 3, mia: 2, jonas: 1 } },
    rules: [
      { id: "r-dishes", text: "Dishes done the same day", tag: "dishes", agreedAt: daysFromToday(-TRIAL_DAYS), checkInAt: today(), changing: null },
      { id: "r-bins", text: "Bins out every Sunday evening", tag: "bins", agreedAt: daysFromToday(-40), checkInAt: daysFromToday(12), changing: null },
      { id: "r-hood", text: "Cooker hood on whenever someone cooks", tag: "hood", agreedAt: daysFromToday(-5), checkInAt: daysFromToday(TRIAL_DAYS - 5), changing: null },
    ],
    // The dishes rule's trial just ended: the flat is voting whether it still works.
    checkins: {
      "r-dishes": {
        votes: { mia: "keep", lea: "keep", jonas: "change" },
        suggestion: { by: "jonas", text: "Dishes done by the next morning" },
      },
    },
    proposals: [
      {
        id: "p-quiet", text: "Quiet after 22:00 on weekdays", tag: null, by: "mia", createdAt: daysFromToday(-1),
        votes: { mia: "ok", lea: "ok", jonas: "tweak" },
        tweak: { by: "jonas", text: "Quiet after 22:00, Sunday to Thursday" },
        status: "open", reason: null, replaces: null,
      },
    ],
    nudges: [],
    // Simulated flatmate actions waiting to happen, saved so a reload doesn't lose them.
    pending: [],
    nextId: 1,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.version === 1) return saved;
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
  openForm: null, // { kind: "tweak" | "no" | "change" | "propose", id }
  drafts: {},
  nudge: null, // { item, to, text, edited }
  needsRender: false,
};

// ---------------------------------------------------------------------------
// Chore rota
// ---------------------------------------------------------------------------

const thisWeek = () => toISODate(mondayOf(new Date()));

function weekIndex(weekIso) {
  return Math.round((parseISODate(weekIso) - parseISODate(state.rotationStartWeek)) / (7 * DAY_MS));
}

function rotaFor(weekIso) {
  const shift = ((weekIndex(weekIso) % CHORES.length) + CHORES.length) % CHORES.length;
  const rota = {};
  CHORES.forEach((chore, i) => {
    rota[chore.id] = ROTATION_START[(i - shift + CHORES.length) % CHORES.length];
  });
  return rota;
}

function doneThisWeek(choreId) {
  return state.done[thisWeek()]?.[choreId] ?? null;
}

function bumpTally(personId, delta) {
  const month = monthKey();
  state.tally[month] ??= {};
  state.tally[month][personId] = Math.max(0, (state.tally[month][personId] ?? 0) + delta);
}

function markDone(choreId) {
  const week = thisWeek();
  state.done[week] ??= {};
  state.done[week][choreId] = { by: ME, at: Date.now() };
  bumpTally(ME, 1);
  save();
  render();
  showToast(`${CHORES_BY_ID.get(choreId).name} marked done`, {
    actionLabel: "Undo",
    onAction: () => {
      delete state.done[week][choreId];
      bumpTally(ME, -1);
      save();
      render();
      showToast(`${CHORES_BY_ID.get(choreId).name} is open again`);
    },
  });
}

// ---------------------------------------------------------------------------
// Rules, proposals and check-ins
// ---------------------------------------------------------------------------

const ruleByTag = (tag) => (tag ? state.rules.find((r) => r.tag === tag) : null);
const isOnTrial = (rule) => today() < addDays(rule.agreedAt, TRIAL_DAYS);
const dueCheckins = () => state.rules.filter((r) => state.checkins[r.id] && r.checkInAt <= today());
const openProposals = () => state.proposals.filter((p) => p.status === "open");
const needsMyVote = (p) => p.status === "open" && p.votes[ME] !== "ok";

function othersNotOk(proposal) {
  return FLATMATES.map((f) => f.id).filter((id) => id !== ME && proposal.votes[id] !== "ok");
}

// Flatmates answer one after another, so the votes visibly come in.
function scheduleOkVotes(proposal) {
  othersNotOk(proposal).forEach((who, i) => {
    schedule(2000 + i * 1600, { kind: "vote", proposalId: proposal.id, who });
  });
}

function maybeAgree(proposal) {
  const allOk = FLATMATES.every((f) => proposal.votes[f.id] === "ok");
  if (!allOk || proposal.status !== "open") return false;

  proposal.status = "agreed";
  const rule = {
    id: newId("r"), text: proposal.text, tag: proposal.tag, agreedAt: today(),
    checkInAt: daysFromToday(TRIAL_DAYS), changing: null,
  };
  if (proposal.replaces) {
    const index = state.rules.findIndex((r) => r.id === proposal.replaces);
    if (index >= 0) state.rules.splice(index, 1, rule);
    else state.rules.push(rule);
  } else {
    state.rules.push(rule);
  }
  showToast(`Everyone agreed: "${proposal.text}". Trial until ${formatShortDate(rule.checkInAt)}.`);
  return true;
}

function voteOk(proposalId) {
  const p = state.proposals.find((x) => x.id === proposalId);
  p.votes[ME] = "ok";
  if (!maybeAgree(p)) {
    if (p.tweak) showToast(`You said OK. ${nameOf(p.tweak.by)} still wants a tweak.`);
    else {
      scheduleOkVotes(p);
      showToast("You said OK. Waiting for the others.");
    }
  }
  save();
  render();
}

function agreeToTweak(proposalId) {
  const p = state.proposals.find((x) => x.id === proposalId);
  const tweakBy = p.tweak.by;
  p.text = p.tweak.text;
  p.votes = { [ME]: "ok", [tweakBy]: "ok" };
  p.tweak = null;
  scheduleOkVotes(p);
  save();
  render();
  showToast(`You agreed to ${nameOf(tweakBy)}'s version. Waiting for ${listNames(othersNotOk(p))}.`);
}

function submitTweak(proposalId, text) {
  const p = state.proposals.find((x) => x.id === proposalId);
  p.text = text;
  p.votes = { [ME]: "ok" };
  p.tweak = null;
  scheduleOkVotes(p);
  closeForm();
  save();
  render();
  showToast("Your version was sent. Everyone votes on it again.");
}

function submitNo(proposalId, reason) {
  const p = state.proposals.find((x) => x.id === proposalId);
  p.status = "declined";
  p.reason = reason;
  closeForm();
  save();
  render();
  showToast(`Not agreed. ${nameOf(p.by)} can see your reason.`);
}

function submitProposal(text) {
  const p = {
    id: newId("p"), text, tag: null, by: ME, createdAt: today(),
    votes: { [ME]: "ok" }, tweak: null, status: "open", reason: null, replaces: null,
  };
  state.proposals.push(p);
  scheduleOkVotes(p);
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
    id: newId("p"), text, tag: rule.tag, by: ME, createdAt: today(),
    votes, tweak: null, status: "open", reason: null, replaces: rule.id,
  };
  state.proposals.push(p);
  rule.changing = p.id;
  delete state.checkins[ruleId];
  scheduleOkVotes(p);
  closeForm();
  save();
  render();
  showToast("Change sent to the flat. The old rule stays until everyone agrees.");
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
    const p = state.proposals.find((x) => x.id === event.proposalId);
    if (!p || p.status !== "open") return;
    p.votes[event.who] = "ok";
    if (!maybeAgree(p)) showToast(`${nameOf(event.who)} said OK to "${p.text}"`);
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

function route() {
  const [view, ...args] = location.hash.replace(/^#\/?/, "").split("/");
  return { view: ["week", "nudge", "sent", "rules", "flat"].includes(view) ? view : "week", args };
}

function isTyping() {
  const el = document.activeElement;
  return Boolean(el && $("#main").contains(el) && (el.tagName === "TEXTAREA" || el.tagName === "INPUT"));
}

// A simulated reply must not wipe out text someone is in the middle of typing.
function renderUnlessTyping() {
  if (isTyping()) ui.needsRender = true;
  else render();
}

function render() {
  ui.needsRender = false;
  const { view, args } = route();
  const views = { week: renderWeek, nudge: renderNudge, sent: renderSent, rules: renderRules, flat: renderFlat };
  $("#main").innerHTML = views[view](args);

  const activeTab = view === "nudge" || view === "sent" ? "week" : view;
  document.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === activeTab) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });

  const badgeCount = dueCheckins().length + openProposals().filter(needsMyVote).length;
  const badge = $("#rules-badge");
  badge.hidden = badgeCount === 0;
  badge.textContent = badgeCount;
}

function chip(text, tone) {
  return `<span class="chip chip-${tone}">${escapeHtml(text)}</span>`;
}

function renderWeek() {
  const week = thisWeek();
  const rota = rotaFor(week);
  const nextRota = rotaFor(addDays(week, 7));
  const myNext = CHORES.find((c) => nextRota[c.id] === ME);

  const rows = CHORES.map((chore) => {
    const who = rota[chore.id];
    const done = doneThisWeek(chore.id);
    let status;
    let action = "";
    if (done) {
      status = `<span class="done-mark" aria-hidden="true"></span>Done by ${escapeHtml(done.by === ME ? "you" : nameOf(done.by))}, ${relativeDay(done.at)}`;
    } else if (who === ME) {
      status = "Your turn this week";
      action = `<button type="button" class="btn btn-small" data-action="mark-done" data-chore="${chore.id}">Mark done</button>`;
    } else {
      status = "Not done yet";
      action = `<a class="btn btn-small btn-quiet" href="#/nudge/${CHORE_TO_ITEM[chore.id]}/${who}">Nudge</a>`;
    }
    return `
      <li class="chore${done ? " is-done" : ""}${who === ME ? " is-mine" : ""}">
        <div class="chore-main">
          <p class="chore-title">${chore.name}<span class="chore-who">${escapeHtml(nameOf(who))}</span></p>
          <p class="chore-status">${status}</p>
          <details class="chore-details">
            <summary>What counts as done</summary>
            <p>${chore.doneMeans}</p>
          </details>
        </div>
        ${action}
      </li>`;
  }).join("");

  const tally = state.tally[monthKey()] ?? {};
  const max = Math.max(1, ...FLATMATES.map((f) => tally[f.id] ?? 0));
  const bars = [...FLATMATES]
    .sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))
    .map((f) => {
      const n = tally[f.id] ?? 0;
      return `
        <li class="bar-row">
          <span class="bar-name">${escapeHtml(f.name)}</span>
          <span class="bar-track"><span class="bar-fill" style="width: ${(n / max) * 100}%"></span></span>
          <span class="bar-count">${n}<span class="visually-hidden"> chores</span></span>
        </li>`;
    }).join("");

  const due = dueCheckins().length;
  const votes = openProposals().filter(needsMyVote).length;
  const rulesSummary = [
    `${state.rules.length} agreed`,
    votes ? `${votes} waiting for your vote` : null,
    due ? `${due} check-in due` : null,
  ].filter(Boolean).join(", ");

  return `
    <section class="view">
      <h1 tabindex="-1">This week</h1>
      <p class="lede">Chores rotate every Monday.${myNext ? ` Next week you have the ${myNext.name.toLowerCase()}.` : ""}</p>

      <ul class="chores">${rows}</ul>
      <a class="btn btn-primary btn-block" href="#/nudge">Something left out?</a>

      <h2>Done this month</h2>
      <ul class="bars" aria-label="Chores done this month">${bars}</ul>

      <h2>House rules</h2>
      <a class="summary-link" href="#/rules">
        <span>${escapeHtml(rulesSummary)}</span>
        <span class="summary-go">Open rules</span>
      </a>
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

function votesList(votes, labels) {
  return `<ul class="votes">${FLATMATES.map((f) => {
    const v = votes[f.id];
    const [text, tone] = labels[v] ?? ["Not voted yet", "muted"];
    return `<li><span>${escapeHtml(f.id === ME ? "You" : f.name)}</span>${chip(text, tone)}</li>`;
  }).join("")}</ul>`;
}

function inlineForm({ kind, id, label, placeholder, submit, value = "", hint = "" }) {
  const key = `${kind}:${id}`;
  const draft = ui.drafts[key] ?? value;
  return `
    <form class="inline-form" data-form="${kind}" data-id="${id}" novalidate>
      <label class="field">
        <span>${label}</span>
        <textarea name="text" rows="2" maxlength="80" placeholder="${escapeHtml(placeholder)}" data-draft="${key}">${escapeHtml(draft)}</textarea>
      </label>
      ${hint ? `<p class="hint">${hint}</p>` : ""}
      <div class="row">
        <button type="submit" class="btn btn-primary">${submit}</button>
        <button type="button" class="btn btn-quiet" data-action="close-form">Cancel</button>
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
  const labels = { ok: ["OK", "ok"], tweak: ["Wants a tweak", "warn"] };
  const okCount = FLATMATES.filter((f) => p.votes[f.id] === "ok").length;
  const replacing = p.replaces ? state.rules.find((r) => r.id === p.replaces) : null;

  let body;
  if (formIsOpen("tweak", p.id)) {
    body = inlineForm({ kind: "tweak", id: p.id, label: "Your version", placeholder: "Change the wording so it works for you", submit: "Send my version", value: p.text });
  } else if (formIsOpen("no", p.id)) {
    body = inlineForm({ kind: "no", id: p.id, label: "Why not?", placeholder: "e.g. I work late shifts on Thursdays", submit: "Say no", hint: `${escapeHtml(nameOf(p.by))} sees your reason, so you can find a middle ground.` });
  } else if (p.votes[ME] === "ok") {
    const waitingFor = othersNotOk(p);
    body = p.tweak
      ? `<p class="status">${okCount} of ${FLATMATES.length} agree. ${escapeHtml(nameOf(p.tweak.by))} asked for a tweak: agree to that version, or talk it through.</p>
         <button type="button" class="btn btn-primary btn-block" data-action="agree-tweak" data-id="${p.id}">Agree to ${escapeHtml(nameOf(p.tweak.by))}'s version</button>`
      : `<p class="status">You said OK. Waiting for ${escapeHtml(listNames(waitingFor))}.</p>`;
  } else {
    body = `
      ${p.tweak ? `<button type="button" class="btn btn-primary btn-block" data-action="agree-tweak" data-id="${p.id}">Agree to ${escapeHtml(nameOf(p.tweak.by))}'s version</button>` : ""}
      <div class="row row-3">
        <button type="button" class="btn${p.tweak ? "" : " btn-primary"}" data-action="vote-ok" data-id="${p.id}">OK</button>
        <button type="button" class="btn" data-action="open-form" data-kind="tweak" data-id="${p.id}">Tweak</button>
        <button type="button" class="btn" data-action="open-form" data-kind="no" data-id="${p.id}">No</button>
      </div>`;
  }

  return `
    <article class="card">
      <h3>${escapeHtml(p.text)}</h3>
      <p class="meta">${replacing ? `Would replace "${escapeHtml(replacing.text)}". ` : ""}Proposed by ${escapeHtml(p.by === ME ? "you" : nameOf(p.by))}, ${relativeDay(parseISODate(p.createdAt).getTime())}.</p>
      ${votesList(p.votes, labels)}
      ${p.tweak ? `<p class="suggestion">${escapeHtml(nameOf(p.tweak.by))} suggests: "${escapeHtml(p.tweak.text)}"</p>` : ""}
      ${body}
    </article>`;
}

function renderRules() {
  const due = dueCheckins();
  const open = openProposals();
  const declined = state.proposals.filter((p) => p.status === "declined");

  const agreed = state.rules.map((r) => {
    let status;
    if (r.changing && state.proposals.find((p) => p.id === r.changing)?.status === "open") status = chip("Change being voted on", "warn");
    else if (state.checkins[r.id] && r.checkInAt <= today()) status = chip("Check-in due", "warn");
    else if (isOnTrial(r)) status = chip(`Trial until ${formatShortDate(r.checkInAt)}`, "trial");
    else status = chip(`Next check-in ${formatShortDate(r.checkInAt)}`, "muted");
    return `<li class="rule"><span class="rule-text">${escapeHtml(r.text)}</span>${status}</li>`;
  }).join("");

  const propose = formIsOpen("propose", "new")
    ? inlineForm({
      kind: "propose", id: "new", label: "Your rule", placeholder: "e.g. Guests staying over: tell the flat a day before",
      submit: "Propose", hint: "Keep it short and specific. It starts with a two-week trial once everyone says OK.",
    })
    : `<button type="button" class="btn btn-block" data-action="open-form" data-kind="propose" data-id="new">Propose a rule</button>`;

  return `
    <section class="view">
      <h1 tabindex="-1">House rules</h1>
      <p class="lede">A rule only counts when everyone says OK. New rules get a two-week trial, then a check-in.</p>

      ${due.length ? `<h2>Check-in due</h2>${due.map(renderCheckin).join("")}` : ""}
      ${open.length ? `<h2>Being voted on</h2>${open.map(renderProposal).join("")}` : ""}

      <h2>Agreed</h2>
      <ul class="rules">${agreed || `<li class="empty">No rules yet. Propose the first one.</li>`}</ul>
      ${propose}

      ${declined.length ? `
        <h2>Not agreed</h2>
        <ul class="rules">${declined.map((p) => `<li class="rule rule-declined"><span class="rule-text">${escapeHtml(p.text)}</span><span class="meta">You said no: ${escapeHtml(p.reason)}</span></li>`).join("")}</ul>` : ""}
    </section>`;
}

function renderFlat() {
  const people = FLATMATES.map((f) => {
    const stay = f.until
      ? `Moved in ${monthFormat.format(parseISODate(f.since))}, moving out ${monthFormat.format(parseISODate(f.until))}`
      : `Moved in ${monthFormat.format(parseISODate(f.since))}`;
    return `<li class="person"><span class="avatar" aria-hidden="true">${escapeHtml(f.name.charAt(0))}</span><span><strong>${escapeHtml(f.name)}</strong>, ${f.room}<br><span class="meta">${stay}</span></span></li>`;
  }).join("");

  return `
    <section class="view">
      <h1 tabindex="-1">Flat 3B</h1>
      <p class="lede">Four people, two of them moving out within months.</p>
      <ul class="people">${people}</ul>

      <h2>How it works here</h2>
      <ol class="how">
        <li>Anyone can propose a rule. It only counts when everyone says OK, or agrees to a tweak.</li>
        <li>Every new rule gets a two-week trial, then the flat checks it still works.</li>
        <li>When someone moves in, they go through the rules and say OK to each one.</li>
      </ol>

      <h2>Demo</h2>
      <p class="hint">This is a prototype. Flatmates are invented and their replies are simulated. Your changes are saved in this browser only.</p>
      <button type="button" class="btn btn-block" data-action="reset">Reset the demo</button>
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
  const { action } = el.dataset;
  if (action === "mark-done") markDone(el.dataset.chore);
  else if (action === "vote-ok") voteOk(el.dataset.id);
  else if (action === "agree-tweak") agreeToTweak(el.dataset.id);
  else if (action === "checkin") checkinVote(el.dataset.rule, el.dataset.choice);
  else if (action === "open-form") openForm(el.dataset.kind, el.dataset.id);
  else if (action === "close-form") {
    closeForm();
    render();
  } else if (action === "reset-wording") {
    ui.nudge.text = nudgeText(ui.nudge.item, ui.nudge.to);
    ui.nudge.edited = false;
    render();
  } else if (action === "reset") {
    if (!confirm("Reset the demo? Your chores, nudges and votes will be cleared.")) return;
    state = seedState();
    ui.openForm = null;
    ui.drafts = {};
    ui.nudge = null;
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
  if (text.length < 4) {
    showToast("Write a few words first.");
    form.elements.text.focus();
    return;
  }
  const { form: kind, id } = form.dataset;
  if (kind === "tweak") submitTweak(id, text);
  else if (kind === "no") submitNo(id, text);
  else if (kind === "propose") submitProposal(text);
  else if (kind === "change") submitChange(id, text);
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

function onRouteChange() {
  const { view } = route();
  if (view !== "nudge") ui.nudge = null;
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
