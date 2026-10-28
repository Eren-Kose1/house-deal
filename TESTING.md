# Prototype testing: HouseDeal v2 → v3

**When and how:** four live demos with classmates at the Week 5 maker fair (27 Oct 2026), using the v2 build. During each demo I noted down the tester's ideas.

**Design goal (from my Week 3 research):** help flatmates who live together for only a few months find house rules that work for both sides and stick to them, so disagreements are settled before they escalate.

## Notes from the demos

Written down during the demos; only capitalisation and spelling were tidied.

**Live demo 1**
- Undone button
- Login page with a QR, so people can join the apartment group
- Cancel proposed ideas

**Live demo 2**
- Send notification when you not complete a task

**Live demo 3**
- The ability to create a simple task like buying toilet paper or kitchen sponge, and when a person clicks done it gets completed, because one person buying is enough
- Add a sublist for every check, so if it's not done you can see it in the app
- Be able to see past weeks' checklist

**Live demo 4**
- Chat system
- Under each rule there could be an anonymous chat system: when a person doesn't follow the rule, you can write a note or message under the post
- Unless four people agree, a rule or task isn't completed. Even if one person disagrees or wants a tweak, the rule is open for "revision", where people have to find the middle ground

## What changed in v3

| Feedback | Demo | Change in v3 |
|---|---|---|
| Undone button | 1 | A chore you marked done shows an **Undo** button for the rest of the week (v2 only offered undo in a short pop-up). |
| Join with a QR | 1 | **Flat → Invite a flatmate** shows a QR code and a flat code. Scanning it opens a welcome page where the new flatmate goes through each house rule and says OK or asks about it; the question is posted under that rule. |
| Cancel proposed ideas | 1 | Your own proposals have **Withdraw this proposal**. |
| Notification when a task isn't done | 2 | A **reminder** at the top of This week while your chore is still open ("due Sunday, 4 days left"), with progress if you started it. It's in the app, not a phone notification, because the prototype has no server. |
| One-off tasks like toilet paper | 3 | New **Supplies** tab: anyone adds what's running low, and the first person who taps **I bought it** completes it for everyone. |
| A sublist for every chore | 3 | Every chore is a **checklist** (e.g. bathroom: toilet, sink and mirror, shower, floor). Everyone can see which steps of a chore are still missing; the chore is done when all steps are ticked. |
| See past weeks | 3 | **Past weeks** (from This week) shows who had which chore in the last three weeks and whether it was finished, or how many steps were done. |
| Chat system | 4 | Not built. |
| Anonymous notes under each rule | 4 | Adapted: every rule has **comments**, but they show the writer's name instead of being anonymous. |
| Four people must agree; a no or tweak means "revision" | 4 | A **No** (with a reason) or a **Tweak** no longer ends a rule: it goes **In revision**, shows everyone's objections, and stays there until all four agree on a version. Anyone can **Suggest a middle ground**, which starts a new round of votes. In the demo, a flatmate now pushes back on your first version of a new rule, so the middle-ground step is visible. |
