# CS2 Fade-type finishes (Fade, Amber Fade, Acid Fade, Marble Fade / Fire & Ice): seed-driven value

> Research date: 2026-10-19. Access limits: the sandbox's network proxy blocked direct fetches of csfloat.com, blog.csfloat.com, csgoskins.gg, csdb.gg, wiki.cs.money, steamanalyst.com, reddit.com, steamcommunity.com and steamdb.com. Only GitHub (raw files), the npm registry and web-search snippets were reachable. So everything about the chescos calculator and the item/wear data was checked first-hand. Everything about Marble Fade tiers and prices comes from **search-engine snippets of those pages** and should be re-checked in a browser before publishing. Marked [snippet] where relevant.

## 1. Which items have Fade / Amber Fade / Acid Fade / Marble Fade, and in which wears

### Takeaway
Knife Fades, knife Marble Fades and the AWP, Glock-18, MAC-10, UMP-45 and M4A1-S Fades all have a float cap of 0.00–0.08, so they exist only in Factory New and Minimal Wear. The exceptions are the MP7 Fade (0–0.25, up to Field-Tested), the R8 Revolver Fade and all six Amber Fades (0–0.40, up to Well-Worn), the SSG 08 Acid Fade (0–0.03, FN only) and the Specialist Gloves Fade and Marble Fade (0.06–0.80, all wears).

### Cited Findings
Source for every row in this table: the ByMykel CSGO-API skins dataset, built from the game files (raw JSON, fetched 2026-10-19) — [ByMykel/CSGO-API skins.json](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json)

| Item | Float range | Wears | Rarity | StatTrak | Collection (dataset) |
|---|---|---|---|---|---|
| ★ Knife Fade: Bayonet, Bowie, Butterfly, Classic, Falchion, Flip, Gut, Huntsman, Karambit, Kukri, M9 Bayonet, Navaja, Nomad, Paracord, Shadow Daggers, Skeleton, Stiletto, Survival, Talon, Ursus | 0.00–0.08 | FN, MW | Covert (★) | yes | case knives |
| ★ Knife Marble Fade: same list **minus Classic Knife and Kukri Knife** (no Marble Fade in the dataset) | 0.00–0.08 | FN, MW | Covert (★) | yes | case knives |
| AWP \| Fade | 0.00–0.08 | FN, MW | Covert | no | The Control Collection |
| M4A1-S \| Fade | 0.00–0.08 | FN, MW | Covert | no | The Sport & Field Collection |
| UMP-45 \| Fade | 0.00–0.08 | FN, MW | Classified | no | The 2021 Dust 2 Collection |
| Glock-18 \| Fade | 0.00–0.08 | FN, MW | Restricted | no | The Assault Collection |
| MAC-10 \| Fade | 0.00–0.08 | FN, MW | Mil-Spec | no | The Chop Shop Collection |
| MP7 \| Fade | 0.00–0.25 | FN, MW, FT | Restricted | no | The 2018 Inferno Collection |
| R8 Revolver \| Fade | 0.00–0.40 | FN–WW | Covert | yes | Revolver Case |
| Amber Fade: AUG (Mil-Spec, 2021 Train), Galil AR (Mil-Spec, 2021 Dust 2), MAC-10 (Mil-Spec, Mirage), Sawed-Off (Mil-Spec, Train), P2000 (Restricted, Dust 2), R8 Revolver (Classified, Dust 2) | 0.00–0.40 | FN–WW | see left | no | see left |
| SSG 08 \| Acid Fade | 0.00–0.03 | FN only | Mil-Spec | no | The Safehouse Collection |
| ★ Specialist Gloves \| Fade and \| Marble Fade | 0.06–0.80 | FN–BS | Extraordinary | no | glove cases |

- Glock-18 Gamma Doppler (0–0.5, FN–BS, Covert, 2021 Train) is a Doppler-type finish, not a Fade. Gamma Doppler on knives has phases/gems rather than a fade percentage, so it is out of scope here — [ByMykel skins.json](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json)
- Amber Fade is on six weapons: AUG, Galil AR, MAC-10, P2000, R8 Revolver and Sawed-Off. A search summary said the P2000 is Restricted, the R8 Classified and the other four Mil-Spec, which matches the dataset [snippet] — [wiki.cs.money Amber Fade series](https://wiki.cs.money/series/amber-fade); [Steam guide "Amber Fade, full guide, all skins – Fade % list"](https://steamcommunity.com/sharedfiles/filedetails/?id=3103781277)
- Sources disagree on the P2000 Amber Fade's origin: one page says the Berlin 2019 Dust II souvenir package, another the Dust 2 Collection [snippet] — [csgoskins.gg P2000 Amber Fade](https://csgoskins.gg/items/p2000-amber-fade); [cs.trade P2000 Amber Fade](https://cs.trade/cs2/skins/p2000/amber-fade)

### Inferences
- For a trade-up calculator, every knife Fade/Marble Fade and the AWP, M4A1-S, UMP-45, Glock and MAC-10 Fades have a float range narrow enough that output wear is always FN or MW. The output float follows the usual formula (average input wear fraction mapped into 0–0.08).
- The MP7 Fade, R8 Fade and Amber Fades can come out in worse wears, and the fade percentage does not depend on wear.

### Gaps
- I could not confirm that the ByMykel dataset includes every Fade-family skin added in 2025–2026 collections, because I did not check the repo's last-update date. Re-check against the current game files or the CSFloat database.

## 2. Fade %: how it is computed, the chescos calculator, and how sources differ

### Takeaway
The fade percentage is not stored by the game. It is a community convention: the paint seed feeds Valve's open-sourced RNG to produce a texture offset and rotation, and that raw value is rescaled so the best seed for a weapon = 100% and the worst = 80%. chescos' MIT-licensed npm package does this. Skinport, CSGOSKINS.GG, CSFloat, DMarket, SkinBid, BitSkins, GamerPay, SkinsMonkey and C5GAME all use the same values. CS.MONEY, BUFF163, BUFF Market, BroSkins and CS.DEALS use their own (probably image-based) methods and **can disagree** about which seed is which percentage.

### Cited Findings
**What the repository says (verified on GitHub, 2026-10-19)**
- Purpose: compute the Fade percentage of a CS2 skin from its paint seed. It covers all Fade skins except gloves, plus Amber Fade and Acid Fade. There are three modules (Fade, Amber Fade, Acid Fade), and each can return one seed's value, all values for a weapon, all weapons, or the supported-weapons list. A pre-generated JSON file with all values is included — [chescos/csgo-fade-percentage-calculator README](https://github.com/chescos/csgo-fade-percentage-calculator)
- Method, as the README describes it: the paint seed (0–1000, "pattern index") sets the pattern's X offset, Y offset and rotation through an algorithm Valve open-sourced. Most Fades share the same X/Y offset, so only rotation changes. The package maps each rotation to a value between 80% (worst) and 100% (best). It calls this more accurate, reproducible and faster than image/pixel analysis — [README](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/README.md)
- The README's FAQ states that "fade percentages don't really exist in CS2 itself". They are a community value that used to be computed by analysing screenshots, and the only assumption here is the 80–100% range — [README](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/README.md)
- Gloves are not supported because glove patterns "shift more unpredictably, similar to Case Hardened" — [README](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/README.md)
- Credits: inspired by Step7750's research on how paint seeds work. Step7750's Go port of Valve's uniform random number generator was ported to TypeScript — [README](https://github.com/chescos/csgo-fade-percentage-calculator); [Step7750/UniformRandom](https://github.com/Step7750/UniformRandom)
- Platforms the README lists as sharing its values: Skinport, CSGOSKINS.GG, SkinsMonkey, SkinBid, BitSkins, CSFloat, GamerPay, DMarket, C5GAME. Platforms it lists as using their own (likely image-analysis) algorithms that "come to different conclusions": CS.MONEY, BUFF163, BUFF Market, BroSkins, CS.DEALS — [README](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/README.md)
- **License: MIT.** I checked the LICENSE file text directly. It is the standard MIT License, "Copyright (c) 2022 chescos". package.json also says `"license": "MIT"` — [LICENSE](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/LICENSE); [package.json](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/package.json). MIT allows commercial use, modification and redistribution as long as the copyright and permission notice are kept, and comes with no warranty.
- Repository stats at fetch time: 89 stars, 16 forks, 142 commits — [GitHub page](https://github.com/chescos/csgo-fade-percentage-calculator)
- npm release history: 1.1.2 (2023-05-14), 1.1.3 (2023-07-19), 1.1.4 (2024-02-08), 1.1.5 (2024-10-04), 1.1.6 (2024-10-05), **2.0.0 (2025-10-26, latest)** — [npm registry](https://registry.npmjs.org/csgo-fade-percentage-calculator)

**How the code works, in my own words (read from the source, nothing copied)**
- For each seed, it seeds Valve's RNG and draws in order: an X offset, a Y offset and a rotation, each from a per-weapon range. Default range: offset fixed at −0.7 and rotation between −55° and −65°. The raw score is:
  - rotation alone for most weapons;
  - rotation × X offset for weapons where both vary (the MP7);
  - X offset alone where rotation is fixed (the M4A1-S).
  The raw scores are then rescaled linearly so the best is 100% and the worst 80%. For the AWP, Karambit, MP7, Talon Knife (Fade) and SSG 08 (Acid Fade), "best" is the opposite end of the scale. The code also returns a "ranking" (distance from the best or worst end) — [BaseCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/BaseCalculator.ts); [FadeCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/FadeCalculator.ts)
- Supported Fade weapons in v2.0.0: AWP, Glock-18, M4A1-S, MAC-10, MP7, R8 Revolver, UMP-45, and the knives Bayonet, Bowie, Butterfly, Classic, Falchion, Flip, Gut, Huntsman, Karambit, Kukri, M9 Bayonet, Navaja, Nomad, Paracord, Shadow Daggers, Skeleton, Stiletto, Survival, Talon, Ursus. Amber Fade: AUG, Galil AR, MAC-10, P2000, R8 Revolver, Sawed-Off. Acid Fade: SSG 08 — [FadeCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/FadeCalculator.ts); [AmberFadeCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/AmberFadeCalculator.ts); [AcidFadeCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/AcidFadeCalculator.ts)
- The code has a list of "trade-up weapons" that get seeds 0–1000; any other weapon gets 0–999. In v2.0.0 every knife is on that list. The committed `generated/fade-percentages.json` still has only seeds 0–999 for knives (1,000 entries), while the published 2.0.0 package returns 1,001 entries (0–1000) — checked by me on 2026-10-19 — [generated JSON](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/generated/fade-percentages.json); [npm 2.0.0 tarball](https://registry.npmjs.org/csgo-fade-percentage-calculator/-/csgo-fade-percentage-calculator-2.0.0.tgz)
- Which seed is 100%, according to the package (my own run of v2.0.0):
  - 763 for most knives and for the Glock-18, MAC-10, R8 and UMP-45 Fades and all Amber Fades;
  - 412 for the AWP, Karambit and Talon (the "reversed" weapons);
  - 374 for the M4A1-S and 80 for the MP7.
  - Separately, a search snippet from csgoskins.gg's Skeleton Knife Fade page lists 763 as a top 100% seed [snippet] — [csgoskins.gg Skeleton Knife Fade](https://csgoskins.gg/items/skeleton-knife-fade)

**Differences between sources**
- The chescos README says CS.MONEY/BUFF163/BUFF Market/BroSkins/CS.DEALS reach different seed→% results because of pixel analysis — [README](https://github.com/chescos/csgo-fade-percentage-calculator). cs2floatchecker.com repeats this and calls image-based estimates "not very accurate and prone to errors" [snippet] — [cs2floatchecker fade guide](https://cs2floatchecker.com/blog/fade-guide)
- csgoskins.gg has a blog post explaining its seed-based method [snippet] — [csgoskins.gg blog: Finding Fade Percentage Values](https://csgoskins.gg/blog/finding-fade-percentage-values-of-csgo-skins)
- I found no source that publishes a seed-by-seed comparison of CS.MONEY or BUFF fade % against CSFloat.

### Inferences
- A calculator site can use the chescos package or its JSON (MIT; keep the copyright notice) and get the same numbers CSFloat/Skinport/csgoskins.gg show. It should label the values as "community convention (seed-based, chescos algorithm)" and warn that BUFF and CS.MONEY can show a different % for the same seed.
- Because the scale is defined relative to each weapon's own seed range, 80% is not "20% worse" in any physical sense. It just marks the worst rotation for that weapon.

### Gaps
- BUFF163 and CS.MONEY do not document their exact algorithms. I could not fetch their pages to compare specific seeds.
- I could not get the GitHub last-commit date (API access refused). npm shows 2.0.0 published 2025-10-26.

## 3. Marble Fade: Fire & Ice, Fake FI, tricolor, tiers and best seeds

### Takeaway
Marble Fade has no percentage. Value depends on the seed's colour layout on the play side.
- **Fire & Ice (FI)**: only red and blue, no yellow.
- **Fake FI (FFI)**: mostly red/blue with a little yellow, usually at the tip or edge.
- **Tricolor**: clearly red, yellow and blue.
- **Max blue / max red**: one colour dominates.
For the Karambit, the community consensus is **seed 412 = "1st Max" FI** and ten "2nd Max" seeds (16, 146, 241, 359, 393, 541, 602, 649, 688, 701). Lower tiers vary between sites, and SteamAnalyst warns against copying one knife's seed list to other knives.

### Cited Findings
- FI is the unofficial name for a Marble Fade pattern whose play side shows only red and blue with no yellow. Any yellow on the play side pushes it to FFI or Tricolor depending on how much [snippet] — [SteamAnalyst Fire & Ice guide](https://www.steamanalyst.com/guides/fire-ice); [CS-Resource Marble Fade guide](https://cs-resource.com/en/marble-fade-guide/); [cs2.eu Marble Fade](https://cs2.eu/guides/skins/marble-fade)
- SteamDB's definition: red (fire) and blue (ice) meet directly on the play side with little or no yellow between them. It also says Marble Fade has no fade percentage and is judged only by its seed-determined swirl [snippet] — [SteamDB Marble Fade skins](https://steamdb.com/en/skins/cs2/cs2-marble-fade-skins); [SteamDB Marble Fade & FI seeds](https://steamdb.com/en/skins/cs2/patterns/marble-fade)
- Sources disagree on which knives can have a true FI. One source says only the Karambit, Flip, Bayonet and Gut have FI "without a drop of yellow on the playside". Talon and other knives still have their own FI guides with tiers [snippet] — [SteamAnalyst FI guide](https://www.steamanalyst.com/guides/fire-ice); [skin.land Talon FI tier list](https://skin.land/blog/marble-fade-talon-knife-fire-and-ice-pattern-tier-list/); [Steam guide: Talon Knife FI](https://steamcommunity.com/sharedfiles/filedetails/?id=3527966448); [Steam guide: Flip Knife FI](https://steamcommunity.com/sharedfiles/filedetails/?id=3137162447); [Steam guide: Gut Knife FI](https://steamcommunity.com/sharedfiles/filedetails/?id=3137163506); [pricempire Flip FI guide](https://pricempire.com/guides/flip-knife-fire-ice-guide)
- Tiering is by "Max" rank: 1st Max = the most red with no yellow, then decreasing red. One source frames it as Max 4 (least red) to Max 1 (most red) [snippet] — [skin.land Gut Knife guide](https://skin.land/blog/gut-knife-marble-fade-patterns-guide/)
- Karambit seed lists [snippet]:
  - 1st Max: 412 alone.
  - 2nd Max: 16, 146, 241, 359, 393, 541, 602, 649, 688, 701 ("may show very slight yellow").
  - 3rd Max: 152, 281, 292, 344, 628, 673, 743, 777, 792, 994.
  - 4th Max: 48, 126, 129, 332, 780, 787, 874, 908, 918, 923.
  - Tiers 5–10 move towards more blue and some yellow. Some say 8th–10th Max should not count as FI because they already have yellow patches.
  — [csdb.gg Karambit MF FI seeds](https://csdb.gg/karambit-marble-fade-fire-and-ice-seed-patterns); [profilerr Karambit FI](https://profilerr.net/karambit-fire-and-ice-iconic-cs2-knife-skin/); [sellyourskins Karambit FI seeds](https://sellyourskins.com/blog/karambit-marble-fade-fire-and-ice-patterns-seeds/); [shadowpay Karambit FI](https://shadowpay.com/blog/skins/cs2-karambit-marble-fade-fire-ice-patterns-rarity-value/); [pattern.wiki Karambit Marble Fade](https://pattern.wiki/skin/am_marble_fade/weapon_knife_karambit/)
- Disagreement: SteamAnalyst does not publish per-knife seed lists because it has not verified them. It warns against tables claiming a few seeds ("412 and 413 are the usual suspects") are the top pattern on every knife [snippet] — [SteamAnalyst FI guide](https://www.steamanalyst.com/guides/fire-ice)
- Disagreement: one Gut Knife guide puts seeds 412 **and 756** in the 1st Max tier, so the top tier differs from the Karambit's [snippet] — [skin.land Gut Knife guide](https://skin.land/blog/gut-knife-marble-fade-patterns-guide/); [csdb.gg Gut Knife FI seeds](https://csdb.gg/gut-knife-marble-fade-fire-and-ice-seed-patterns)
- Fake FI: seeds with slightly visible yellow at the blade's pointed tip, or yellow on the ring or blade edge, are listed separately as FFI [snippet] — [csdb.gg Karambit FI](https://csdb.gg/karambit-marble-fade-fire-and-ice-seed-patterns); [SteamDB Karambit Marble Fade](https://steamdb.com/en/skins/cs2/knives/karambit-marble-fade)
- The Marble Fade seed is assigned at creation and never changes. Seed range quoted as 0/1–1000 [snippet] — [SteamDB patterns](https://www.steamdb.com/en/skins/cs2/patterns); [SteamAnalyst paint seed explained](https://www.steamanalyst.com/guides/paint-seed-explained)
- CS:GO-era references, still cited: the "Complete Fire & Ice Guide" Steam guides (id 675516392, older; id 3137170442, newer) — [Steam guide 675516392](https://steamcommunity.com/sharedfiles/filedetails/?id=675516392); [Steam guide 3137170442](https://steamcommunity.com/sharedfiles/filedetails/?id=3137170442)

### Inferences
- Seed 412 shows up both as the 100% Fade seed for the Karambit, Talon and AWP in the chescos calculator and as the 1st Max FI Karambit seed. The same seed produces the same texture placement through Valve's RNG, so an extreme placement can be best for both finishes. This is my inference; no source states it.
- A pattern page should treat FI tier lists as per-knife and community-maintained, cite which list it uses (csdb/pattern.wiki/Steam guide), and note that lists disagree beyond the top two tiers.

### Gaps
- I could not open pattern.wiki, csdb.gg or SteamAnalyst directly to check full tier lists for knives other than the Karambit, or the CS2-era tier boundaries.
- I found no dataset giving the total number of FI or FFI seeds per knife.

## 4. Real completed sales and premiums (100% Fade, Fire & Ice)

### Takeaway
Openly available **sales-based** premium data is thin. The best I found is SteamAnalyst's analysis of CSFloat sales from September 2026 (Fade knives FN):
- 99–100% sold at a median **+17%** over an ordinary copy (93 sales);
- 96–99% at **+9%** (164 sales);
- 93–96% at **+2%**;
- below 93% at about the base price.
For Fire & Ice there is **no verified, linkable record sale of Karambit seed 412** in open sources, only estimates ($6k–$19k). Most "price tiers" on blogs are listing- or estimate-based.

### Cited Findings
**Sales-based figures (CSFloat sales, analysed by SteamAnalyst, data from September 2026) [snippet]**
- All FN Fade knives:
  - 99–100% fade: median +17% vs an ordinary copy (93 sales).
  - 96–99%: +9% (164 sales).
  - 93–96%: +2%.
  - Below ~93%: about the normal price.
  — [SteamAnalyst CS2 Fade % guide](https://www.steamanalyst.com/guides/fade)
- Karambit Fade FN: 99–100% median +37% (only 4 sales); 96–99% +15% (4 sales) — [SteamAnalyst Karambit Fade](https://www.steamanalyst.com/skin/karambit-fade)
- M9 Bayonet Fade FN: 99–100% median +24% (5 sales); 96–99% +14% (10 sales). A later version of the page shows 1 sale in the 99–100% band at $976 and a 40-sale median of +9.8% for 95–99% (date of the $976 sale not shown in the snippet) — [SteamAnalyst M9 Bayonet Fade](https://www.steamanalyst.com/skin/m9-bayonet-fade)
- white.market repeats the same September 2026 figures (+17% / +9%) but also gives a broader +20–50% table for 95–100% that is not clearly based on sales — [white.market Fade guide](https://white.market/blog/guides/cs2-fade-skins-guide)

**Listing, estimate or rule-of-thumb figures (NOT sales)**
- Karambit Fade: SteamDB page (updated 2026-06-26) showed a lowest CSFloat listing of $1,799 (~173 offers) [snippet] — [SteamDB Karambit Fade](https://steamdb.com/en/skins/cs2/knives/karambit-fade). SteamAnalyst FN median about $2,027.65, date unknown [snippet] — [SteamAnalyst Karambit Fade FN](https://www.steamanalyst.com/skin/karambit-fade/factory-new)
- Butterfly Fade claims:
  - "+20–50% or more" for 100% vs 85–90% fades;
  - "+20–40%" over lower fades;
  - up to $9,700 for a 100% copy vs about $3,200 for 90–94%;
  - $4,500–$6,000 for 98–99% copies that look like 100%.
  None of these come with dated sale links [snippet] — [hellcase Butterfly Fade guide](https://hellcase.com/blog/skinopedia/butterfly-knife-fade-patterns/); [shadowpay Butterfly Fade](https://shadowpay.com/blog/skins/butterfly-knife-fade-price-patterns-fade-percentage-in-cs2/); [Hotspawn Butterfly Fade](https://www.hotspawn.com/counter-strike/news/butterfly-knife-fade-patterns-percentage-and-seeds-guide); [profilerr Butterfly Fade patterns](https://profilerr.net/butterfly-fade-patterns/)
- AWP Fade: CSBoard says a true 100% has a 40–60% premium over an 80% copy. That compares against the bottom of the range and is not a sales study [snippet] — [CSBoard AWP Fade guide](https://csboard.com/en/blog/awp-fade-cs2-trading-guide-float-caps-and-2026-price-ranges)
- Karambit Marble Fade FN, SteamAnalyst approximate levels [snippet] — [SteamAnalyst FI guide](https://www.steamanalyst.com/guides/fire-ice):
  - standard copy about $800;
  - True FI $2,500–$5,000;
  - Max FI $6,000–$15,000+.
- Karambit 412 (1st Max): estimates of about $12k–$19k / $13k–$19k depending on StatTrak and float. SteamAnalyst's "most expensive" list marks it as an estimate with no recorded sale [snippet] — [SteamAnalyst most expensive skins](https://www.steamanalyst.com/guides/most-expensive-cs2-skins); [profilerr Karambit FI](https://profilerr.net/karambit-fire-and-ice-iconic-cs2-knife-skin/)
- Another snippet cites about $7,000 (MW) and $9,999 (FN) for 412 as market figures, not confirmed sales [snippet] — [csdb.gg Karambit FI seeds](https://csdb.gg/karambit-marble-fade-fire-and-ice-seed-patterns)
- A "single listed sale" of Karambit 2nd Max seed 241 at about $4,500, with no date in the snippet [snippet] — [profilerr Karambit FI](https://profilerr.net/karambit-fire-and-ice-iconic-cs2-knife-skin/)
- Karambit Marble Fade FN: CSFloat listings started around $887.74 (date unknown). SteamAnalyst's FN sales log shows a best copy at $2,250, pattern not identified [snippet] — [SteamAnalyst Karambit MF FN](https://www.steamanalyst.com/skin/karambit-marble-fade/factory-new)
- Another site's table lists True FI Karambit FN at $600–1,200 vs Tricolor FN at $340–380, undated and probably out of date [snippet] — [eatingwithkirby Marble Fade guide](https://eatingwithkirby.com/news/marble_fade_guide_cs2.html)
- CS:GO-era anecdotes: a 2017 Steam discussion cited "max FFI" Flip knives at about 90–95 keys, and a 2022 Steam comment told someone not to sell an FI-type Karambit under $2,650. Neither is a verified sale [snippet] — [Steam discussion](https://steamcommunity.com/app/730/discussions/0/1489987634002717366)

**Market context**
- The October 2025 knife trade-up update caused a sharp drop in knife prices. One outlet estimated about $1.75B in lost market value, another nearly 25% in one day [snippet] — [prosettings.net](https://prosettings.net/blog/covert-skins-trade-up-to-knives-and-gloves/); [skinbase.io](https://skinbase.io/blog/october-2025-cs2-trade-up-knives-gloves). Any pre-October-2025 (CS:GO-era or early CS2) price is not comparable to current prices.

### Inferences
- The site should display "typical premium" as a sales-based median (for example SteamAnalyst's +17% for 99–100% knife Fades, Sept 2026, n=93) rather than the +20–50% blog figures, and label anything else as listings or estimates.
- For Marble Fade FI, the honest statement is that no openly verifiable record sale of Karambit 412 exists, and estimates range from about $6k to $19k.

### Gaps
- I could not open CSFloat sale-history pages, BUFF sale records or Reddit sale confirmations: the proxy blocked them, and CSFloat sale history may need a login. So I have **no first-hand, dated, linkable individual sale** for a 100% Fade or a 1st/2nd Max FI. The SteamAnalyst medians were seen only in search snippets.
- I found nothing on Amber Fade or gun Fade (Glock/MAC-10/UMP/MP7/R8) premiums. These are cheap skins, and any fade premium is likely small, but that is unquantified.

## 5. Can high fade or FI come out of a trade-up? Probabilities

### Takeaway
Yes. Since the October 2025 CS2 update (22/23 Oct 2025), five Covert skins from the same case can be traded up into that case's knife or gloves, and five StatTrak Coverts give a StatTrak knife (no StatTrak gloves). Gun Fades (AWP, M4A1-S, UMP-45, Glock, MAC-10, MP7, R8, Amber Fades, SSG Acid Fade) were already trade-up outputs from their collections. You cannot choose the finish or the seed, so a high fade % or FI seed is luck.

If the output seed is uniform over 0–1000, the chescos values give these odds for most knives and guns:
- P(≥99%) ≈ 6.2%
- P(≥98%) ≈ 10.9%
- P(≥95%) ≈ 26%
- P(≥90%) ≈ 50%
- P(exactly the 100% seed) ≈ 0.1%
For Karambit Marble Fade, P(1st Max 412) ≈ 0.1%, and P(top-4 FI tiers, about 31 listed seeds) ≈ 3%.

### Cited Findings
- October 2025 update: five Covert skins → one knife or gloves from the inputs' case. StatTrak Covert → StatTrak knife, but no StatTrak gloves. You cannot pick the model or finish. Most sources date it October 23, Dust2/Skinbase October 22 [snippet] — [prosettings.net](https://prosettings.net/blog/covert-skins-trade-up-to-knives-and-gloves/); [csdb.gg knife trade-ups](https://csdb.gg/guides/cs2-knife-trade-ups/); [refrag.gg](https://refrag.gg/blog/cs2-skins-update-trade-ups); [dust2.us](https://www.dust2.us/news/66919/retakes-and-a-new-way-to-get-knives-debut-in-october-22nd-counter-strike-2-update); [skinbase.io](https://skinbase.io/blog/october-2025-cs2-trade-up-knives-gloves)
- The chescos package v2.0.0 (published 2025-10-26, three days after the update) treats every knife as a possible trade-up output with seeds 0–1000. Non-trade-up items get 0–999 — [FadeCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/FadeCalculator.ts); [BaseCalculator.ts](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/src/modules/BaseCalculator.ts); [npm](https://registry.npmjs.org/csgo-fade-percentage-calculator)
- The paint seed is set at item creation (0–1000) and is permanent [snippet] — [SteamDB patterns](https://www.steamdb.com/en/skins/cs2/patterns)

Distribution of fade % across seeds 0–1000, from my own run of the chescos v2.0.0 package (1,001 seeds per weapon):

| Weapon group | 100% seed | ≥99% | ≥98% | ≥97% | ≥95% | ≥90% |
|---|---|---|---|---|---|---|
| Most knives, Glock-18, MAC-10, R8, UMP-45 (Fade) and all 6 Amber Fades | 763 | 62 (6.2%) | 109 (10.9%) | 162 (16.2%) | 261 (26.1%) | 501 (50.0%) |
| AWP, Karambit, Talon (reversed scale) | 412 | 49 (4.9%) | 106 (10.6%) | 153 (15.3%) | 252 (25.2%) | 500 (50.0%) |
| M4A1-S | 374 | 35 (3.5%) | 102 (10.2%) | 151 (15.1%) | 228 (22.8%) | 473 (47.3%) |
| MP7 | 80 | 22 (2.2%) | 78 (7.8%) | 141 (14.1%) | 232 (23.2%) | 506 (50.5%) |

(Mean fade % ≈ 90% for all.) — computed from [npm csgo-fade-percentage-calculator 2.0.0](https://registry.npmjs.org/csgo-fade-percentage-calculator/-/csgo-fade-percentage-calculator-2.0.0.tgz)

### Inferences
- These probabilities assume the trade-up output seed is uniformly random over 0–1000. No source I found confirms Valve's seed distribution for trade-up outputs. The chescos 0–1000 range implies it but does not prove uniformity.
- Getting a knife Fade from a knife trade-up also means: the right case → that case's knife pool → that knife model → the Fade finish (versus the other finishes in the case) → a good seed. So the overall chance of "100% Fade Karambit" from one contract is far below 0.1%. Case knife-pool odds are outside this note's scope.
- For Marble Fade, the 31 seeds in the Karambit top-4 FI lists (1 + 10 + 10 + 10 from the csdb/profilerr snippets) are about 3.1% of 1,001 seeds. Including FFI and lower tiers would raise this, but the lists are not consistent.

### Gaps
- No official Valve statement on how seeds are generated for trade-up outputs (uniform or not, 0–999 or 0–1000).
- No source gives the share of FI or FFI seeds per knife. My ~3% for the Karambit top-4 rests on unverified snippet lists.

### How to check (practical)
- Read the paint seed from the inspect link with a float checker (for example the CSFloat extension or site) or from Buff listings. Then look up the % with the chescos package/JSON, or with sites that use the same values (CSFloat, Skinport, csgoskins.gg, cs2floatchecker). Expect BUFF and CS.MONEY to show different numbers [snippet] — [SteamAnalyst paint seed explained](https://www.steamanalyst.com/guides/paint-seed-explained); [cs2floatchecker fade calculator](https://cs2floatchecker.com/tools/fade-calculator); [README](https://github.com/chescos/csgo-fade-percentage-calculator)
- For Marble Fade, check the seed against a per-knife FI list and confirm visually in game (inspect), because tier lists disagree and seller labels are unreliable [snippet] — [SteamDB Marble Fade seeds](https://steamdb.com/en/skins/cs2/patterns/marble-fade); [SteamAnalyst FI guide](https://www.steamanalyst.com/guides/fire-ice)
