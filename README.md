# HouseDeal

House rules your whole flat agreed on: a chore rota, kind nudges and a check-in so rules don't quietly fade.

Built for *GUI Design & Web Optimization*, Cycle 1 (personal product), domain: shared housing.

**Live:** https://eren-kose1.github.io/house-deal/

## Why it exists

Research for this project (two interviews plus desk research) found that in shared flats:

- the flatmates with higher standards notice the mess, the others often don't;
- a flat agrees on a rule (a printed cleaning schedule, no shoes inside), people follow it at first, then it fades, partly because everyone expects to move out within months;
- a kind, direct request about one thing (a pan left in the sink) worked, while taking a conflict outside the flat made it worse.

Design goal: help flatmates who live together for only a few months find house rules that work for both sides and stick to them, so disagreements are settled before they escalate.

## What it does

- **This week:** the chore rota, who is on what, and a tick when it's done. "What counts as done" spells out the standard, and "Done this month" makes it visible who does the work.
- **Something left out?** Send one flatmate a friendly nudge about a pan in the sink, full bins or the cooker hood. The suggested wording points to the rule the flat agreed on, so it's about the rule, not the person.
- **House rules:** a rule only counts when everyone says OK. Flatmates can say OK, suggest a tweak (a middle ground) or say no with a reason.
- **Check-in:** every new rule gets a two-week trial, then the flat votes to keep, change or drop it.

It's a static prototype: the flatmates are invented, their replies and votes are simulated after a few seconds, and everything is saved only in your own browser (localStorage). **Flat > Reset the demo** starts over.

## Run it locally

No build step and no dependencies: open `index.html` in a browser, or serve the folder with any static server.
