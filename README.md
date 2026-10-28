# HouseDeal

House rules your whole flat agreed on: a chore rota with checklists, kind nudges, shared supplies, and a check-in so rules don't quietly fade.

Built for *GUI Design & Web Optimization*, Cycle 1 (personal product), domain: shared housing.

**Live:** https://eren-kose1.github.io/house-deal/

## Why it exists

Research for this project (two interviews plus desk research) found that in shared flats:

- the flatmates with higher standards notice the mess, the others often don't;
- a flat agrees on a rule (a printed cleaning schedule, no shoes inside), people follow it at first, then it fades, partly because everyone expects to move out within months;
- a kind, direct request about one thing (a pan left in the sink) worked, while taking a conflict outside the flat made it worse.

Design goal: help flatmates who live together for only a few months find house rules that work for both sides and stick to them, so disagreements are settled before they escalate.

Version 3 is based on testing v2 with classmates: see [TESTING.md](TESTING.md) for the notes and what changed.

## What it does

- **This week:** the chore rota, rotating every Monday. Each chore is a checklist, so everyone sees which steps are still missing. A reminder shows while your own chore is open, a done chore can be undone, "Done this month" shows who does the work, and **Past weeks** shows the last three weeks.
- **Something left out?** Send one flatmate a friendly nudge about a pan in the sink, full bins or the cooker hood. The suggested wording points to the rule the flat agreed on, so it's about the rule, not the person.
- **Supplies:** add what's running low (toilet paper, sponges); the first person who buys it ticks it off for everyone.
- **House rules:** a rule only counts when all four flatmates say OK. A "no" (with a reason) or a tweak puts it in revision until everyone agrees on a middle ground. Your own proposals can be withdrawn, and every rule has named comments.
- **Check-in:** every new rule gets a two-week trial, then the flat votes to keep, change or drop it.
- **Joining:** Flat → Invite a flatmate shows a QR code. A new flatmate goes through each house rule and says OK or asks about it before moving in.

It's a static prototype: the flatmates are invented, their replies and votes are simulated after a few seconds, and everything is saved only in your own browser (localStorage). **Flat > Reset the demo** starts over.

## Run it locally

No build step and no dependencies: open `index.html` in a browser, or serve the folder with any static server.
