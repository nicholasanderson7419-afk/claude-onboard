# claude-onboard — Monetization Scoping (2026-06-08)

## The hard constraint
The **install is commoditized + free** — Claude Code Launchpad (free, open-source) and Anthropic's own Desktop app already do "install Claude with no terminal." We can't charge for "installs Claude." Anything we charge for must be the **curated value on top**: the second brain, concierge tailoring, skill packs, themes, updates, support.

## Market reference (researched)
- "Vibe coding" starter kits sell **~$30–40 one-time on Gumroad**, usually with a **free edition as a lead magnet** (e.g. Vibe Coding Builder Kit ~$38).
- Team dev tools (e.g. env managers) run **~$19/mo** — subscriptions fit *ongoing* value, not a one-shot installer.
- One-time pricing is rarer in 2026 but **works for niche pro audiences used to buying** — which "vibe coders setting up Claude" are.
- Freemium works here because our free tier costs us ~nothing to serve (a script + GitHub) and the install is naturally shareable.

## Three models
**A. Freemium: free installer (lead magnet) + Pro one-time (~$39)  — RECOMMENDED**
- Free: one-line installer, core plugins, basic vault, concierge. Drives the waitlist/audience + word of mouth.
- Pro (~$39 one-time): the premium layer — full second brain (all 5 Obsidian plugins + templates + themes), advanced/trading skill packs, priority updates, a support channel.
- Matches the market, uses the free install as distribution, charges for the moat.

**B. Free everything → higher-ticket backend (course / community / consulting)**
- Free product builds the list; money comes from a paid community or course ("vibe-coding mastery") or done-for-you setup. More upside, much more ongoing work.

**C. Pure one-time ($39): stripped free edition + paid full**
- Simplest. Free = bare installer; $39 = the whole curated thing. Less list-building leverage than A.

## Recommendation
**Model A.** Tiers: **Free** / **Pro $39 one-time** (add **Team $99** later if orgs bite). Revisit a subscription only if we add recurring value (monthly skill packs, hosted updates, cloud sync).

## Proposed Free vs Pro line
- **Free:** installer + 6 core plugins + basic vault + memory + search + concierge (goal + theme).
- **Pro:** trading/advanced skill packs, full Obsidian power-setup (5 plugins + templates + premium themes), priority updates, support/Discord.
- NOTE: today the installer bundles *everything* free. Pro requires gating some assets behind a license — that's the build, deferred until demand shows.

## Payment rails
- **Gumroad** for MVP — zero infra, handles tax/delivery/license keys, built for one-time digital. (Stripe Payment Links later if we outgrow it.)

## Sequence (don't build payment before demand)
1. **Validate** — waitlist is live (needs your Formspree ID to capture). Watch signups.
2. If demand → build the **Pro gate** (license check + pro-only assets) + Gumroad product.
3. Launch Pro to the waitlist.

## Decisions for Nick
- Which model (A / B / C)?
- Pro price ($29 / $39 / $49)?
- Free vs Pro line (does trading + full-Obsidian go behind Pro, or stay free)?
- Payment rail (Gumroad vs Stripe)?

## DECISIONS (Nick, 2026-06-08)
- **Price:** $39 one-time base fee.
- **Now:** keep EVERYTHING free — no paywall/gating yet. Pure lead magnet to validate demand via the waitlist.
- **Model:** undecided — wants more research + real demand signal before committing. Leaning "charge a base fee" (one-time) rather than gated freemium.
- **Idea to develop:** the concierge INTERVIEW can power a "Pro level" — a deeper/smarter tailoring pass as the upsell (e.g., Pro = a richer interview + a fuller custom setup). Park until demand shows.
- **Next:** validate first (waitlist needs Formspree ID). Don't build payment until signups prove interest.
