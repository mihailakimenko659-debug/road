# Steam Community guides on paint-seed (pattern) templates for regular CS2 pistols, SMGs, shotguns and MGs

**Method and limits (read first):**
- I could not load steamcommunity.com or web.archive.org from this environment. WebFetch failed (ENOTFOUND), and curl got a proxy CONNECT 403 for both hosts. **No guide page was opened directly.**
- Everything below comes from WebSearch result titles and snippets, mostly from "extended" mode, which surfaced "Steam Community :: Guide :: …" pages. The snippets were already summarized by the search tool, so seed lists may be truncated and some attributions may be wrong. One conflict is flagged in the Kami/Toxic section.
- Treat every seed as "claimed by the guide, per search snippet". Verify each against the guide page or pattern.wiki before the parser uses it.
- Authors and dates are given only where a snippet showed them. Ages like "~464 days" are relative to the search date of 2026-10-19.
- Many snippets say Steam shows a notice on the page: "This item has been removed from the community because it violates Steam Community & Content Guidelines". The notice may be a crawler artifact, or the guide may really be gone. Flagged per entry.
- **The user's example guide, id 3550106561, was not identified.** Three searches (bare id, full URL, quoted id) returned nothing about it. Its title, skin and seeds are unknown.

## Key Question 1: Which Steam guides exist (URL, title, author, date, language), per weapon?

### Takeaway
Dozens of Steam guides exist for pattern-dependent finishes on regular pistols, SMGs and shotguns. Coverage is uneven:
- **Well covered:** Glock-18 (Fade, Gamma Doppler, Moonrise, High Beam, Reactor, Grinder, Trace Lock, Teal Graf), Desert Eagle (Heat Treated, Sputnik, Serpent Strike, Emerald Jörmungandr), Five-SeveN (Case Hardened, Heat Treated, Berries And Cherries, Kami), MAC-10 (Case Hardened, Fade, Last Dive, Arabesque Mosaic), and XM1014 (Seasons, Zombie Offensive).
- **Sparse:** MAG-7, Negev, M249, MP5-SD, PP-Bizon, Nova and R8 have few or no dedicated guides.

### Cited Findings

**Multi-skin index / umbrella guides (good crawl seeds for the parser)**
- "Pattern Skins - Complete List with Guides" (id 700399956). Lists every skin affected by Pattern ID and rates how much the PatternID matters from I to V, linking community guides per skin. It is old (CS:GO era); one ranking puts MAG-7 Sonar at IV and Nova Windblown at II. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=700399956)
- "A (Not So) Small Guide For Pattern Based Skins" (id 2980292624), ~1,242 days old, with a CS2-incompatibility/removal notice per snippet.
  - Covers USP-S, Glock-18, Desert Eagle, Tec-9, CZ75, P250, Nova, XM1014, MAG-7, Sawed-Off, MP5-SD, UMP-45 and others.
  - Claims "THE XM1014 HAS THE MOST PATTERN BASED SKINS IN THE GAME" and that "MAG-7 has very few notable Pattern based skins besides the Sonar".
  - Also says PP-Bizon has "little to no notable pattern based skins" and Negev has none notable (closest is Negev | Bulkhead).
  - Names seed 235 on P2000 as the "sloth face pattern". — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)
- "CS Special Pistols Patterns" by Potkanec (id 2844559383), with CS2-incompatible/removed notices per snippets. Covers Glock-18, P2000, Dual Berettas, P250, CZ75-Auto, Tec-9 and Five-SeveN; per-skin seeds are listed further down. Many language mirrors exist (`&l=french`, `dutch`, `koreana`, `polish`, `spanish`). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)
- "CS Special Weapons Patterns" (id 2844570170), the same series for non-pistols. Covers Sawed-Off Brake Light (paint seeds for full spiral and full red) and XM1014 Seasons. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844570170)
- "CS2 Rare/Unique Pattern Guide" by Forky and collaborators (id 3613249488), ~325 days old. It covers:
  - Shotguns: Sawed-Off Brake Light, XM Elegant Vines, XM Seasons, XM XOXO, XM Ziggy, Nova Windblown, MAG-7 Sonar.
  - P250 Nevermore, Glock Grinder ("Forky's Guides" listing), and MAC-10 Last Dive. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488)
- "CSPatterns Guides" (id 3300003211), a hub with removal/"Restricted" flags in some entries.
  - Per-skin guides for Glock-18 Fade, R8 Fade, UMP-45 (Fade, Continuum, Moonrise), MP7 Sunbaked, MP9 Mount Fuji, PP-Bizon, MP5-SD, Nova, MAG-7 and CZ75.
  - MP7 Fade and XM1014 Ziggy are marked "Working on it". — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3300003211)
- "CS2 Pattern Guides List" (id 3601330547), a compilation "made by me and my friends" that includes a Negev | Terrain pattern guide. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3601330547)
- Other hubs, contents not visible:
  - "Bubba's CS2 Rare Pattern Guide" (id 3024847977) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3024847977)
  - "CSGO Rare Weapon Pattern Guides" (id 2602936223) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2602936223)
  - "CS2 Rare Patterns Guides (WIP)" (id 3719899241), which covers post-CS2 skins — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3719899241&l=english)
  - "ALL PINK & PURPLE SKINS WITH PATTERNS" by WINTERCALM (id 3387158441, removed notice), which lists Five-SeveN Hyper Beast among others — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3387158441)
- Russian-language hubs, all CS:GO era:
  - "Редкие и красивые паттерны в CS:GO" (id 2289225749): Glock Moonrise, Glock High Beam, CZ75 Polymer, Five-SeveN Kami, blue/orange patterns — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2289225749)
  - "Редкие паттерны скинов cs:go" (id 2429014707) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2429014707)
  - "Редкие паттерны в CS:GO." (id 2892501237): Glock / Tec-9 / Galil Sandstorm family — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2892501237)

**Glock-18**
- Glock-18 Fade:
  - "Glock-18 Fade" (id 3227888401; Danish mirror also exists) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3227888401)
  - "Glock-18 Fade Pattern Guide" (id 3371632578, removed notice) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3371632578)
  - "The Complete Fade Guide" (id 2875620478) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2875620478)
  - "Full Fades - Patterns Guide" (id 2850761694) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2850761694)
  - "CS2 Fade Guide" (id 3288447763) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3288447763)
- Glock-18 Gamma Doppler:
  - "Glock-18 Gamma Doppler" (id 3534967014, removed notice), on the best Emerald patterns — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3534967014)
  - "Glock-18 Gamma Doppler Phase Guide" (id 3378606246) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3378606246)
  - "Glock-18 Gamma Doppler Phase 2" (id 3404412396) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3404412396)
  - "The Complete Gamma Doppler Guide" (id 3284341165), which carries a "copies of this guide will have DMCA complaints" note — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3284341165)
- Glock-18 Moonrise:
  - "Glock-18 Moonrise: classification of patterns with a star." (id 2230969036) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2230969036)
  - "Glock-18 Moonrise Pattern Guide" (id 3300058702) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3300058702)
  - "Glock-18" (id 2535064032) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2535064032)
- Glock-18 High Beam:
  - "Glock-18 High Beam Pattern Guide" (id 3523707804, ~464 days old) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3523707804)
  - "Glock-18" (id 2970531671), which notes some patterns changed with CS2 — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2970531671)
  - Russian guide "Glock-18" (id 3423297971), on rare-series patterns 511/550/897 — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3423297971)
- Glock-18 Reactor: "Glock-18 Реактор patterns" by RudeCombat (id 2797230453), Russian/English — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797230453)
- Other Glock-18 guides whose skins the snippets name, but whose skin-to-id mapping is **uncertain**: Grinder (dark/"Max Black"), Trace Lock (white), Teal Graf (AI colour-ratio), White Gem (top seed 679, ~254 days old).
  - "Glock-18" (id 2880283225) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2880283225)
  - "Ultimate Guide: Glock-18" (id 3444241476) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3444241476)
  - "The Complete Glock-18" (id 3437732108) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3437732108)
  - "Glock 18" (id 3652609780) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652609780)
  - "Glock-18" (id 3651940255) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3651940255)
  - "Glock-18" (id 3656899678) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3656899678)
  - "Glock-18" (id 3381039570) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3381039570)
- Glock-18 Snack Attack: **no pattern guide found.** "LaNombre's Skins - Glock-18 & USP-S & P2000" (id 2781566664) mentions it only as a wishlist entry ("Snack Attack 0.1337 ST"). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2781566664)

**USP-S**
- "Rare USP-S Ancient Visions Pattern Guide" (id 3581741767) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3581741767)
- "USP-S Tropical Breeze Pattern Guide" (id 3485530849) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3485530849)
- USP-S Alpine Camo, four guides:
  - "USP-S ALPINE CAMO PATTERNS GUIDE" (id 3350374061) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3350374061)
  - "USP-S \"Alpine Camo\"" (id 3353615892) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3353615892)
  - "USP-S ALPINE CAMO + топ паттерны" (id 3642700035, RU) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3642700035)
  - "USP-S" (id 3719774854), probably Sleeping Potion with top seed 727; mapping uncertain — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3719774854)
- USP-S Kill Confirmed: **no Steam pattern guide found** after two targeted searches.

**P2000**
- "P2000 Протравленный patterns" by RudeCombat (id 2797232553). P2000 | Amber Fade (RU "Протравленный") patterns by zone: top, centre, grip. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797232553)

**P250**
- "P250 Nevermore Pattern Guide" (id 3531978335) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3531978335)
- "P250" (id 3703660876), on Constructivist "Disc Pattern" — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3703660876)
- P250 See Ya Later: **no guide found.**

**Five-SeveN**
- Five-SeveN Case Hardened:
  - "Five-Seven Case Hardened Pattern Guide" by Hartwich (id 3464542840) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3464542840)
  - "Five-SeveN Case Hardened Guide" (id 2873225968) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2873225968)
  - "Five-SeveN Case Hardened" by glitchingcore, who looked at all 1001 patterns (id 2948645553) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2948645553)
  - "CS2" (id 3385182187), a Blue Gem tier page — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3385182187)
- Five-SeveN Heat Treated:
  - "Five-Seven Heat Treated Pattern Guide" by Hartwich (id 3464550251). Created April 2025, updated July 2025, removed notice. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3464550251)
  - "Five-SeveN Heat Treated" (id 3343658990) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3343658990)
  - "Five-SeveN Heat Treated patterns" by korenevskiy (id 3368242003) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3368242003)
- "Five-SeveN Berries And Cherries Rare Patterns Guide" by Wide Mao (id 2311884949) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2311884949)
- Five-SeveN Hyper Beast: **no pattern guide found.**

**Tec-9**
- "Tec 9 Ice Cap - Patterns Guide" (id 3043297207), building on a guide by C.Snack — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3043297207)
- "Tec-9 Ice cap patterns \"BLUE ICE\"" (id 2952855343) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2952855343)
- "Tec-9" (id 3095268443), on butterfly placement. The skin is not named in the snippet; likely Tec-9 | Flash Out (unverified). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3095268443)
- Tec-9 Fuel Injector: **no guide found.**

**CZ75-Auto**
- "CZ75-Auto" by bIanco, titled "CZ75-Auto | Polymer - Patterns Guide" in the snippet (id 2954038734, removed notice) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2954038734)
- "РЕДКИЕ ПАТТЕРНЫ НА CZ-75 ПОЛИМЕР" by ЖирVКоте (id 3143446890, RU) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3143446890)

**Desert Eagle**
- Desert Eagle Heat Treated:
  - "Heat Treated Desert Eagle (Case Hardened) Patterns and Tier List" (id 3342295986) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3342295986)
  - "Desert Eagle Heat Treated" (id 3343006125) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3343006125)
  - "Desert Eagle Heat Treated Pattern Guide" by Hartwich (id 3464548304) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3464548304)
  - Snippets also mention a Krieke guide and a WCKD Trade guide by "Q" (Blue Gem / Black Pearl / Gold Gem); ids not matched.
- Desert Eagle Sputnik:
  - "Desert Eagle \"Sputnik\" Pattern Guide & Tierlist" by CptnKraken (id 2976547776; an earlier copy was removed) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2976547776)
  - "A guide to the desert eagle sputnik and its many patterns." by ArcadiaArcadia, 2022 (id 2791132686) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2791132686)
  - "Desert Eagle Спутник patterns" by RudeCombat (id 2797235103, RU) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797235103)
- Desert Eagle Serpent Strike:
  - "Desert Eagle Serpent Strike Pattern Guide" by Casio, May 2025, removed notice (id 3482175626) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3482175626)
  - "Desert Eagle Serpent Strike maximum orange Pattern" (id 3512364900, EN/RU) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3512364900)
- "Desert Eagle \"Emerald Jörmungandr\" Pattern Guide & Tierlist" (id 2590362336, ~1,725 days old) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2590362336)
- "Desert Eagle" (id 2967257854): all 1001 patterns grouped into alien, arrow, black and grey types. The skin is not named in the snippet. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2967257854)
- Desert Eagle Printstream: **no Steam pattern guide found.**

**Dual Berettas**
- "Dual Berettas" (id 3572597361), a Switch Board tier list — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3572597361)
- Dual Berettas Melondrama: **no guide found.**

**R8 Revolver**
- "R8 Revolver Fade" (id 572437338, CS:GO era) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=572437338)

**MAC-10**
- MAC-10 Case Hardened:
  - "Mac-10 Case Hardened (Blue Gem Guide)" (id 2613326051) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2613326051)
  - "MAC-10 Case Hardened" (id 3087121918) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3087121918)
  - "CS2" (id 3385353358) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3385353358)
- "MAC-10 Fade" (id 3229002296) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3229002296)
- MAC-10 Last Dive:
  - "MAC-10" (id 3648532620), an S-tier guide — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3648532620)
  - "MAC-10" (id 2828020232), probably Scooty's guide; uncertain — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2828020232)
- MAC-10 Arabesque Mosaic:
  - "MAC-10 Arabeque Mosaic" (id 3761794943) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3761794943)
  - "Pattern GUIDE FOR MAC-10" (id 3763449980), on a minaret-and-pyramids template — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3763449980)
- Other MAC-10 guides, skins not named in snippets:
  - "Mac-10" (id 3601296847), centred star, top 279 — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3601296847)
  - "Mac-10" (id 3651847841), white pattern, top 828/309/222 — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3651847841)
- MAC-10 Neon Rider and Disco Tech: **no guide found.**

**MP7 / MP9 / P90 / UMP-45**
- MP7 Amberline:
  - "MP7 Amberline Pattern Tierlist" (id 3684341759, updated 3/18/2026) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3684341759)
  - "MP7 Amberline" (id 3685336438, removed notice), on White Amber / Gold Amber — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3685336438)
- "MP9 Buff Blue" (id 3646427559) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3646427559)
- P90:
  - "P90" (id 3652045951 or 3489413750). One is the Aeolian Light "White Gem" guide (Blizzard + 1, removed notice); the other is a Reef Grief guide by Cable电缆. Mapping uncertain. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652045951); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3489413750)
  - "Verdant Growth Pattern Guide \"Subject to change\"" (id 2983197725) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2983197725)
- UMP-45:
  - "UMP-45" (id 1808559859), Moonrise star / no-moon, removed notice — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=1808559859)
  - "UMP-45 Warm Blooded" by MazaMaker (id 3652352381) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652352381)
- MP9 Starlight Protector: only sticker-craft guides found (ids 3320268065, 3159728056); no pattern guide. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?l=english&id=3320268065)
- P90 Asiimov: **no pattern guide found.** Only unrelated loadout/gen-code guides came up, plus "Blackiimov Guide" (id 1084244413), which is likely about the AWP. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=1084244413)

**Shotguns / MGs**
- XM1014:
  - "XM1014 Seasons Pattern Guide" (id 3569256978) — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3569256978)
  - "XM1014" (id 3681615084), the "XM1014 | Zombie Offensive Pattern Guide" by Augustus — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3681615084)
- M249 and Negev: only the "LaNombre's Skins - Negev & M249" inventory guide (no seeds) and the Negev Terrain entry in the hub 3601330547. — [Source](https://steamcommunity.com/sharedfiles/manageguide/?id=2781569403%2F)

### Inferences
- Almost every skin in the user's example list that is a single fixed custom-paint artwork has **no** Steam pattern guide: Kill Confirmed, Printstream, Neon Rider, Asiimov (P90), Starlight Protector, Snack Attack, Hyper Beast, Fuel Injector, See Ya Later, Disco Tech, Melondrama. Guides exist instead for skins whose texture is offset or rotated per seed (Moonrise, High Beam, Sputnik, Last Dive, Nevermore) and for gradient or anodized finishes (Fade, Gamma Doppler, Case Hardened / Heat Treated).
- Many guide titles on Steam are just the weapon name ("Glock-18", "MAC-10", "P90"). The parser should not assume the title names the skin.

### Gaps
- Id 3550106561 is unidentified. Its title, skin and seeds are unknown.
- The skin-to-id mapping for the generic-titled Glock, MAC-10 and P90 guides is uncertain.
- Exact publish/update dates, authors and view counts are missing for most guides because pages could not be opened.

## Key Question 2: Skin, wears, feature controlled by the seed, and seeds listed

### Takeaway
Seed lists were visible in snippets for about 30 skins. The most consistent across Steam and third-party sources are:
- Glock-18 Fade: 763 > 575 > 897 > 636
- Glock-18 Gamma Doppler Emerald: 452, 534 top
- Glock-18 Moonrise centre star: 58, 59, 66, 90, 102, 224, 601, 628, 694, 706, 837, 864
- Glock-18 High Beam full beam: 302, 511, 550, 897
- Five-SeveN Case Hardened: 278, 690
- Desert Eagle Heat Treated: 490
- P250 Nevermore: 73, 127, 708, 923
- MAC-10 Last Dive: 386, 25
- MAC-10 Case Hardened: 667

Several fixed-art skins are stated by csgoskins.gg / cs.money to have no seed effect at all.

### Cited Findings

**Glock-18 | Fade** (FN/MW only; brief, covered elsewhere)
- 763 is named best ("Max Fade%" in one guide, "Absolute Max" in others), followed by 575, 897 and 636. Another guide lists 33 more "Max Fade%" seeds, including 34, 41 and 87. Tier labels conflict between guides. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3227888401); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3371632578)
- MP7 Fade does not follow the shared Fade seed rules, per two Steam guides. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2850761694); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3145111791)

**Glock-18 | Gamma Doppler (Emerald)**
- "Rank 1" Emerald = no dark spots. Best 452 and 534, then 152, 391, 456 and 581. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3534967014)
- The same ranking appears on Pricempire, a third-party site. — [Source](https://pricempire.com/guides/glock-18-gamma-doppler-emerald-guide)
- Float range is 0.00–0.50 per search snippet. Wears visible: FN–FT.

**Glock-18 | Moonrise** (star placement on the slide release)
- Tier 1 "center star": 58, 59, 66, 90, 102, 224, 601, 628, 694, 706, 837, 864. This is the consensus of third-party guides. — [Source](https://csgoskins.gg/blog/glock-18-moonrise-guide-rare-star-pattern-seeds)
- The older Steam guide (id 2230969036) puts 958 in Tier 1, and another Steam guide includes 487 in Tier 2. Commenters dispute the tiers. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2230969036)
- Left/front-star examples: 19, 109, 142, 165. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)

**Glock-18 | High Beam** (FN/MW only, float 0.00–0.08)
- "Full beam" (max beams): 302, 511, 550, 897.
- "Blue" (blue inside the handle hole) Tier 1: 8, 166, 259, 264, 274, 332, 351, 378, 452, 454, 457, 490, 653, 780, 822, 832, 966, 988. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3523707804)
- A Russian guide calls 511, 550 and 897 the most valuable and very rare. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3423297971)

**Glock-18 | Reactor**
- "Teeth" pattern: 923, 281, 152, 743.
- RU guide: yellow-reactor seeds including 11, 87, 213, 274, plus a radiation-sign pattern (seeds not visible). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797230453); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)

**Glock-18 | Grinder**
- "Full Black": 916, 384, 811 (Forky listing). The dedicated dark-pattern guide has a removed notice. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488)

**Glock-18 | Trace Lock**
- Best white: 985, 650, 338. The guide says the skin cannot be fully white. Id mapping uncertain. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652609780)

**Glock-18 | Teal Graf**
- AI colour analysis of the playside only. #449 deviates most from average blue/red; #342 is closest to average. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3444241476)

**Glock-18 (White Gem / Max Black guides)**
- White Gem: top seed 679. Max Black: seeds not visible. Skin names not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3437732108)

**USP-S | Ancient Visions** (Xolo head / Step Fret / Glyph Block placement)
- Tier 1: 533 (best: centred Glyph Block above the trigger, Step Fret high on the grip), then 209, 369, 804.
- "Corrupted" (distorted Xolo head): 566, 492.
- The guide says all three elements cannot appear together clearly, only two. cs.money says there are no special variations, which conflicts with the guide. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3581741767)

**USP-S | Tropical Breeze**
- Ranked by yellow coverage (Top 10/50/100/200, plus a "greenest" list). Seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3485530849)

**USP-S | Alpine Camo**
- Ranked by blue on metal parts; "Sky Blue" and "Deep Blue" Tier 1 groups; all 1,000 analysed. Seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3350374061)

**USP-S | Sleeping Potion**
- Max purple, top seed 727. Id mapping uncertain. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3719774854)

**USP-S | Kill Confirmed**
- "Different pattern indexes have no effect on the Kill Confirmed finish" (csgoskins.gg). Seeds not applicable. — [Source](https://csgoskins.gg/items/usp-s-kill-confirmed)

**P2000**
- Oceanic: 857. Granite Marbleized "hamster": 125. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)
- Dispatch "sloth face": 235 (snippet wording is ambiguous; might refer to a different P2000 skin). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)
- Amber Fade (RU "Протравленный"): zones top/centre/grip; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797232553)

**P250 | Nevermore** (centred raven)
- Tier 1: 73, 127, 708, 923 (923 = two ravens).
- Tier 2: 9, 11, 15, 25, 36, 39, 51, 144… (truncated).
- The older Potkanec guide has a "Jesus pattern" list starting 15, 39, 66, 73, 84… (truncated). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3531978335); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)

**P250 | Mint Kimono / Crimson Kimono**
- Mint Kimono: Green Handle, Green Tip and Black-and-white lists; a commenter cites 45 as Green Handle.
- Crimson Kimono: red concentrated at the top of the gun; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)

**P250 | Constructivist** (disc placement)
- Top off-centre: 380, 585, 743, 870. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3703660876)

**P250 | See Ya Later**
- cs.money: "the pattern index does not affect the skin's appearance". — [Source](https://wiki.cs.money/weapons/p250/see-ya-later)

**Five-SeveN | Case Hardened** (brief)
- Hartwich: best 690; Tier 1: 278, 363, 670, 690, 768, 868; Tier 2: 13, 103, 126, 151, 273, 321, 344, 387, 396, 434, 468, 555, 557, 592. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3464542840)
- Guide 3385182187 has Tier 1: 278, 690, 868, 363, 670, 768. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3385182187)
- Another guide lists blue 189 and 648, and Gold Gem 107. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)

**Five-SeveN | Heat Treated**
- Hartwich: best 904; Tier 1: 48, 67, 111, 148, 159, 259, 263, 273, 297, 308, 321, 341, 347, 426, 461, 482, 530, 567, 704, 723, 790, 792. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3464550251)
- korenevskiy: #1 904, #2 148 and 704 (five tiers). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3368242003)

**Five-SeveN | Berries And Cherries**
- Cherry (red) 182, about 85% red. Berry (blue) 449, almost 90% blue. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2311884949)

**Five-SeveN | Kami**
- 909 ("P*ssy"), 662 ("Naked Lady"); a "Best pos Birds" pattern is mentioned with seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)
- Skinscanner gives Tier 1 as 909, 590, 662 and watch seeds 906, 887, 403. — [Source](https://skinscanner.gg/blog/five-seven-kami-pattern-guide)
- **Conflict:** one search summary attributed 909/662 to Tec-9 | Toxic (with 537 "Happy Face"). Two other snippets place 909/662 on the Kami, so the Toxic attribution is probably a summarizer error. Verify before use.

**Five-SeveN | Hyper Beast**
- "Different pattern indexes have no effect" (csgoskins.gg); cs.money says the same. — [Source](https://csgoskins.gg/items/five-seven-hyper-beast)

**Tec-9 | Ice Cap**
- "Blue ice" Tier 1 = perfectly blue body. Tier 2 = one light spot, Tier 3 = several, Tier 4 = a large break. Seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3043297207); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2952855343)

**Tec-9 (butterfly guide)**
- SSS centred butterfly: up 736, down 534. Skin name not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3095268443)

**Tec-9 | Opal**
- 823. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)

**Tec-9 | Fuel Injector**
- No guide and no claim found. Only a 2017 forum speculation, about the AK-47 version.

**CZ75-Auto | Polymer** (full blue/cyan)
- Potkanec: 411, 842; a commenter corrects to 843 and adds 699. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)
- bIanco: cyan SSS 329 (only SSS); tiers SSS>SS>S>A>B>C>D. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2954038734)
- RU guide: "ideal" blue 45, 81, 90, 102… (truncated). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3143446890)

**Desert Eagle | Heat Treated** (brief)
- 490 is the consensus best. The Steam guide lists it in Tier 1 at 75.09% blue; it also includes 370 in Tier 1.
- Lower group per third-party sources: 148, 69, 704.
- Krieke's guide: 37 patterns with 80%+ blue. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3342295986); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3343006125)

**Desert Eagle | Serpent Strike**
- Casio guide: Tier 1/Top 10 includes 425; separate "Max Black" ranking; ranked lists 1–500 and 501–1000. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3482175626)
- Max orange: 174 best, 594 second, then 698 and 100. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3512364900)
- Non-Steam X post: red 120, 771, 874, 934; max black 748; orange 174, 425, 775, 953. — [Source](https://x.com/WantedByStar/status/1909026047128903892?lang=en)

**Desert Eagle | Sputnik**
- Categories: star tip, star grip, spiked tip (CptnKraken); "two Sputniks", "circle", "cut-off Sputnik" (RudeCombat). Seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2976547776); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2797235103)

**Desert Eagle | Emerald Jörmungandr**
- Serpent placement: tip, grip, sticker position. Seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2590362336)

**Desert Eagle | Printstream**
- "Pattern index does not affect the skin's appearance" (cs.money); Daddyskins says the same. — [Source](https://wiki.cs.money/weapons/desert-eagle/printstream)

**Dual Berettas**
- Colony "Jesus": 937. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383)
- Another guide says #80 is the Dual Berettas "LOL pattern" (skin not visible) and that after CS2 the "Jesus" look may have changed. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)
- Switch Board: SSS 493, SS 94 (by "000" digit position). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3572597361)
- Melondrama: "no effect" per csgoskins.gg. — [Source](https://csgoskins.gg/items/dual-berettas-melondrama)

**R8 Revolver | Fade**
- Same Fade order: 763 (100%), 575, 897, 636. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=572437338)

**MAC-10 | Case Hardened** (brief)
- Guide 2613326051: Tier 1 top 95, then 19 and 251. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2613326051)
- Guide 3087121918: 667 top, then 406 and 239. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3087121918)
- Guide 3385353358: 667 first, with a different Tier 1 set. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3385353358)
- Guides conflict.

**MAC-10 | Fade**
- 763, 575, 897, 636 are highest purple; 1,001 seeds ranging 80–100%. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3229002296)

**MAC-10 | Last Dive**
- S-tier: 386 (centred skull), 25 (skull + snake).
- Others: 407 (skull + diver), 509 (skull + diver + shell), 748 (tree). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3648532620); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2828020232)

**MAC-10 | Arabesque Mosaic**
- Golden Pyramids and Golden Crescent groups, four tiers each; the author argues 575 deserves its own top tier. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3761794943)
- Third-party (white.market) Tier 1 tower: 28, 68, 180, 370, 399, 618, 635, 808. — [Source](https://white.market/blog/skins/mac-10-arabesque-mosaic-pattern-guide-every-rare-seed-explained-cs2-2026)

**MAC-10 (other guides)**
- Centred star: 279 top. White: 828, 309, 222. Skin names not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3601296847); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3651847841)

**MAC-10 | Neon Rider / Disco Tech**
- "No effect" (csgoskins.gg / cs.money). — [Source](https://csgoskins.gg/items/mac-10-neon-rider); [Source](https://wiki.cs.money/weapons/mac-10/disco-tech)

**MP7 | Amberline**
- Least orange / body placement; #890 top. White Amber and Gold Amber tiers exist (seeds not visible). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3684341759)

**MP7 | Fade**
- Third-party "Absolute Fade": 80, 449, 576. — [Source](https://lis-skins.com/blog/the-best-mp7-fade-patterns/)

**MP9 | Buff Blue**
- Max blue: #77 (~39.75%), then #159 and #995. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3646427559)

**MP9 | Starlight Protector**
- "Pattern index doesn't affect appearance" (cs.money / csgoskins.gg). — [Source](https://csgoskins.gg/items/mp9-starlight-protector)

**P90**
- Verdant Growth: 816, 556, 750, 388 (WIP). — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2983197725)
- Aeolian Light "White Gem" / Whiteout / Black Gem: seeds not visible. Reef Grief max blue-green / max white coral: seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652045951)
- P90 Asiimov: cs.money says no pattern difference. — [Source](https://wiki.cs.money/weapons/p90/asiimov)

**UMP-45**
- Moonrise: star pattern seeds 0–1000 and no-moon seeds; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=1808559859)
- Warm Blooded: Tier 1–3 for Tiger, Turtle and Snake Scales; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3652352381)

**XM1014 | Seasons**
- Blue leaf: 26, 78, 115, 130, 182, 234, 286, 334, 338, 390, 442, 494, 546, 598, 605, 650, 659, 698, 955. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3569256978)

**XM1014 | Zombie Offensive**
- Zombie Chicken: #1 369, #2 977; Tier 2: 319, 11, 57, 30, 281, 377, 831.
- Witch Tier 1: 692 (#1), 666, 448, 698; Witch Tier 2: 331, 131, 179, 209, 291, 491, 582.
- Tank: seeds not visible.
- An older workshop discussion says 628 = centred chicken and 704 = four chickens. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3681615084)

**Sawed-Off | Brake Light**
- Blue Tier 1: 146, 261, 760, 910, 916, 774. Red "Hot Rod": 22, 29. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488)

**Nova | Windblown**
- About 50 patterns show the bird on the gun; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)

**MAG-7 | Sonar**
- Listed as the only notable MAG-7 pattern skin; seeds not visible. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624)

**Negev / M249**
- Only the Negev Terrain guide is referenced (seeds not visible). Pattern.wiki has seed browsers for Negev Dazzle and M249 Shipping Forecast, which are not guides. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3601330547)

### Inferences
- Some seeds are shared across Fade skins (763/575/897/636 for Glock, R8 and MAC-10 Fade). MP7 Fade is the documented exception. The parser can apply one Fade seed list to those three skins but not to MP7.
- Seed 909/662 is attached to both Kami and Toxic in different summaries, which shows snippet-derived seeds need page verification before use.

### Gaps
- Seeds are not visible for:
  - Desert Eagle: Sputnik, Emerald Jörmungandr
  - Tec-9 Ice Cap
  - USP-S: Tropical Breeze, Alpine Camo
  - P90: Aeolian Light, Reef Grief
  - UMP-45: Moonrise, Warm Blooded
  - Nova Windblown, MAG-7 Sonar, Negev Terrain
  - MP7 Amberline (White/Gold variants), Glock Max Black
- Wear visibility per seed was rarely stated, except Glock High Beam (FN/MW only) and Gamma Doppler (0–0.50).
- Many lists are truncated ("…") in snippets.

## Key Question 3: Claimed premiums and evidence of actual sales

### Takeaway
Steam guides almost never cite prices or sales. Price claims come from third-party blogs, are mostly vague or estimated, and none are verified sales records. The parser must establish real premiums itself.

### Cited Findings
- Five-SeveN Case Hardened #278: one search snippet says a FN 278 "sold for $10,000", another says "~$1,800 for Tier 1 pattern 278". The result set mixed csdb/skinport/profilerr/hellcase/csboard, so the specific source is unattributed and unverified. — [Source](https://csgoskins.gg/blog/five-seven-case-hardened-blue-gem-seed-patterns); [Source](https://hellcase.com/blog/skinopedia/five-seven-blue-gem-patterns/)
- Five-SeveN Kami Tier 1 (909, 590, 662): an estimate of "$250-350+" from the skinscanner blog, which is not a sales record. — [Source](https://skinscanner.gg/blog/five-seven-kami-pattern-guide)
- Glock-18 Moonrise (skin.land):
  - Tier 3 (right star) "starts at about $50"
  - Tier 1/2 "from $100" — [Source](https://skin.land/blog/full-glock-18-moonrise-patterns-guide/)
- MAC-10 Last Dive: the Steam S-tier guide claims pattern 25 exists in FN only 168 times, 20 of them StatTrak. That is a scarcity claim with no price. Skin.land says the skin is "not especially expensive". — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3648532620); [Source](https://skin.land/blog/full-mac-10-last-dive-pattern-guide/)
- Glock-18 Gamma Doppler: Emerald is described as the most desired phase, and Phase 2 as the most desirable non-Emerald (closest to the Emerald look). No numbers given. — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3378606246); [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3404412396)
- High Beam: "most valuable" are 511, 550, 897 (cs.money / Steam RU guide). No price given. — [Source](https://wiki.cs.money/weapons/glock-18/high-beam)
- Subjectivity disclaimers appear in the Steam guides themselves:
  - Last Dive: "based on my personal opinion"
  - USP-S Sleeping Potion: "not an official or comprehensive tier list"
  - Glock Grinder: not certified
  - Deagle Heat Treated: subjective tiers — [Source](https://steamcommunity.com/sharedfiles/filedetails/?id=3648532620)

### Inferences
- The parser should focus on high-consensus seeds where several independent sources agree: Glock Fade 763; Gamma Doppler Emerald 452/534; Moonrise centre-star set; High Beam 511/550/897 (+302); Five-SeveN CH 278/690; Five-SeveN HT 904; Deagle HT 490; MAC-10 CH 667; MAC-10 Last Dive 386/25; P250 Nevermore 73/127/708/923.
- Low-volume skins (Sawed-Off Brake Light, XM1014 Zombie Offensive, Tec-9 butterfly) probably have too few listings for a statistically meaningful premium test.
- The parser can use the "no-effect" fixed-art skins (Kill Confirmed, Printstream, P90 Asiimov, Neon Rider, Starlight Protector, Snack Attack, Hyper Beast, See Ya Later, Disco Tech, Melondrama) as **negative controls**: any seed-price correlation found there would be noise.

### Gaps
- No verified sale (marketplace transaction with seed) was found for any regular pistol/SMG/shotgun pattern in this research.
- Price claims are dated loosely or not at all.

```csv
item,feature,seeds,wear_visible,source_url,source_title,date,claimed_premium,notes
"Glock-18 | Fade","max/absolute max fade %","763;575;897;636 (+33 Max Fade% incl 34;41;87)","FN;MW","https://steamcommunity.com/sharedfiles/filedetails/?id=3227888401","Glock-18 Fade","unknown","yes (top tier most valuable)","tier labels conflict with id 3371632578 (removed notice); snippet-only"
"Glock-18 | Gamma Doppler (Emerald)","no dark spots (Rank 1)","452;534;152;391;456;581","FN;MW;FT (float 0-0.50)","https://steamcommunity.com/sharedfiles/filedetails/?id=3534967014","Glock-18 Gamma Doppler","unknown","yes (Emerald most desired)","removed notice; same list on pricempire"
"Glock-18 | Moonrise","centre star on slide release","58;59;66;90;102;224;601;628;694;706;837;864","all","https://steamcommunity.com/sharedfiles/filedetails/?id=2230969036","Glock-18 Moonrise: classification of patterns with a star.","old (CS:GO)","T1/T2 from ~$100; T3 ~$50 (skin.land)","Steam guide also lists 958 T1; consensus list from csgoskins.gg blog; left star 19;109;142;165"
"Glock-18 | High Beam","full beam (max beams)","302;511;550;897","FN;MW","https://steamcommunity.com/sharedfiles/filedetails/?id=3523707804","Glock-18 High Beam Pattern Guide","~2025-07 (~464 days)","yes (511/550/897 most valuable)","blue-in-handle T1: 8;166;259;264;274;332;351;378;452;454;457;490;653;780;822;832;966;988"
"Glock-18 | Reactor","teeth pattern","923;281;152;743","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2797230453","Glock-18 Реактор patterns","~2022","not stated","yellow reactor seeds incl 11;87;213;274; also in id 2844559383"
"Glock-18 | Grinder","full black","916;384;811","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488","CS2 Rare/Unique Pattern Guide","~2025-11","not stated","dedicated dark-pattern guide removed"
"Glock-18 | Trace Lock","max white","985;650;338","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3652609780","Glock 18","unknown","not stated","id-to-skin mapping uncertain"
"Glock-18 | Teal Graf","colour ratio blue/red","449 (most deviant);342 (closest to average)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3444241476","Ultimate Guide: Glock-18","~2025-03","not stated","AI analysis playside only; id mapping uncertain"
"USP-S | Ancient Visions","Xolo head/Step Fret/Glyph Block placement","533 (best);209;369;804","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3581741767","Rare USP-S Ancient Visions Pattern Guide","unknown","not stated","corrupted: 566;492; cs.money says no special variations"
"USP-S | Tropical Breeze","max yellow / greenest","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3485530849","USP-S Tropical Breeze Pattern Guide","unknown","not stated","Top10/50/100/200 lists"
"USP-S | Alpine Camo","blue on metal parts","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3350374061","USP-S ALPINE CAMO PATTERNS GUIDE","unknown","not stated","also ids 3353615892; 3642700035 (RU)"
"USP-S | Sleeping Potion","max purple","727","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3719774854","USP-S","unknown","not stated","id mapping uncertain"
"USP-S | Kill Confirmed","none","n/a","n/a","https://csgoskins.gg/items/usp-s-kill-confirmed","csgoskins.gg item page","n/a","no","no Steam guide found; pattern has no effect; negative control"
"P2000 | Oceanic","special pattern","857","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated","CS2-incompatible notice"
"P2000 | Granite Marbleized","hamster face","125","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated",""
"P2000 | Dispatch","sloth face","235","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624","A (Not So) Small Guide For Pattern Based Skins","~2023","not stated","skin attribution ambiguous in snippet"
"P2000 | Amber Fade","fade zone top/centre/grip","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2797232553","P2000 Протравленный patterns","~2022","not stated","RU"
"P250 | Nevermore","centred raven / double raven","73;127;708;923","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3531978335","P250 Nevermore Pattern Guide","unknown","not stated","T2: 9;11;15;25;36;39;51;144... (truncated); 923 = two ravens"
"P250 | Mint Kimono","green handle/green tip/black-white","45 (green handle, commenter)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated","other lists not visible"
"P250 | Constructivist","disc placement","380;585;743;870","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3703660876","P250","unknown","not stated","top off-centre disc seeds"
"P250 | See Ya Later","none","n/a","n/a","https://wiki.cs.money/weapons/p250/see-ya-later","cs.money wiki","n/a","no","pattern has no effect; negative control"
"Five-SeveN | Case Hardened","blue gem","278;363;670;690;768;868","all","https://steamcommunity.com/sharedfiles/filedetails/?id=3464542840","Five-Seven Case Hardened Pattern Guide","2025","FN 278 'sold $10,000' / '~$1,800' (unverified)","best 690 per Hartwich; T2 13;103;126;151;273;321;344;387;396;434;468;555;557;592"
"Five-SeveN | Heat Treated","blue gem","904;148;704","all","https://steamcommunity.com/sharedfiles/filedetails/?id=3464550251","Five-Seven Heat Treated Pattern Guide","created 2025-04, updated 2025-07","not stated","T1 also 48;67;111;159;259;263;273;297;308;321;341;347;426;461;482;530;567;723;790;792; removed notice"
"Five-SeveN | Berries And Cherries","max red / max blue","182 (red ~85%);449 (blue ~90%)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2311884949","Five-SeveN Berries And Cherries Rare Patterns Guide","~2020","not stated",""
"Five-SeveN | Kami","explicit-figure patterns","909;662;590","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","$250-350+ T1 (skinscanner estimate)","one summary assigned 909/662 to Tec-9 Toxic - verify"
"Five-SeveN | Hyper Beast","none","n/a","n/a","https://csgoskins.gg/items/five-seven-hyper-beast","csgoskins.gg item page","n/a","no","negative control"
"Tec-9 | Ice Cap","blue ice (solid dark blue)","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3043297207","Tec 9 Ice Cap - Patterns Guide","~2023","not stated","also id 2952855343"
"Tec-9 | (butterfly skin, unnamed)","centred butterfly","736 (up SSS);534 (down SSS)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3095268443","Tec-9","unknown","not stated","skin name not visible (possibly Flash Out)"
"Tec-9 | Opal","special pattern","823","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated",""
"Tec-9 | Toxic","happy face / figures","537 (909;662 disputed)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated","attribution conflict with Five-SeveN Kami"
"Tec-9 | Fuel Injector","none found","n/a","n/a","","","n/a","no","no guide found"
"CZ75-Auto | Polymer","full blue/cyan","329 (SSS);411;842/843;699;45;81;90;102","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2954038734","CZ75-Auto (Polymer - Patterns Guide)","~2023","not stated","also ids 2844559383; 3143446890 (RU); removed notice"
"Desert Eagle | Heat Treated","blue gem","490;148;69;704;370","all","https://steamcommunity.com/sharedfiles/filedetails/?id=3342295986","Heat Treated Desert Eagle (Case Hardened) Patterns and Tier List","~2024-10","yes (490 best)","also ids 3343006125; 3464548304"
"Desert Eagle | Serpent Strike","max orange / red / max black","174;594;698;100 (orange);425 (top10)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3512364900","Desert Eagle Serpent Strike maximum orange Pattern","~2025","not stated","Casio guide id 3482175626 (May 2025, removed notice); X post red 120;771;874;934 black 748"
"Desert Eagle | Sputnik","star tip/star grip/spiked tip/two sputniks/circle","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2976547776","Desert Eagle ""Sputnik"" Pattern Guide & Tierlist","~2023-05","not stated","also ids 2791132686; 2797235103 (RU)"
"Desert Eagle | Emerald Jörmungandr","serpent placement tip/grip","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2590362336","Desert Eagle ""Emerald Jörmungandr"" Pattern Guide & Tierlist","~2021","not stated",""
"Desert Eagle | Printstream","none","n/a","n/a","https://wiki.cs.money/weapons/desert-eagle/printstream","cs.money wiki","n/a","no","negative control"
"Dual Berettas | Colony","Jesus pattern","937","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2844559383","CS Special Pistols Patterns","~2022","not stated","may look different after CS2"
"Dual Berettas | Switch Board","000 digit position","493 (SSS);94 (SS)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3572597361","Dual Berettas","~2025","not stated",""
"Dual Berettas | Melondrama","none","n/a","n/a","https://csgoskins.gg/items/dual-berettas-melondrama","csgoskins.gg item page","n/a","no","negative control"
"R8 Revolver | Fade","fade %","763;575;897;636","FN;MW","https://steamcommunity.com/sharedfiles/filedetails/?id=572437338","R8 Revolver Fade","~2015-16","not stated","shared Fade seed order"
"MAC-10 | Case Hardened","blue gem","667;114;406;239 / 95;19;251","all","https://steamcommunity.com/sharedfiles/filedetails/?id=3087121918","MAC-10 Case Hardened","unknown","not stated","guides conflict (id 2613326051 top 95); also id 3385353358"
"MAC-10 | Fade","fade %","763;575;897;636","FN;MW","https://steamcommunity.com/sharedfiles/filedetails/?id=3229002296","MAC-10 Fade","~2024","not stated",""
"MAC-10 | Last Dive","centred skull / skull+snake / diver / shell","386;25;407;509;748","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3648532620","MAC-10","unknown","no price; 25 FN only 168x (20 ST)","subjective; also id 2828020232"
"MAC-10 | Arabesque Mosaic","golden pyramids/crescent/tower","575 (author top);28;68;180;370;399;618;635;808 (third-party)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3761794943","MAC-10 Arabeque Mosaic","~2026","not stated","also id 3763449980; white.market list"
"MAC-10 | Neon Rider","none","n/a","n/a","https://csgoskins.gg/items/mac-10-neon-rider","csgoskins.gg item page","n/a","no","negative control"
"MAC-10 | Disco Tech","none","n/a","n/a","https://wiki.cs.money/weapons/mac-10/disco-tech","cs.money wiki","n/a","no","negative control"
"MP7 | Amberline","least orange / body placement","890","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3684341759","MP7 Amberline Pattern Tierlist","updated 2026-03-18","not stated","White/Gold Amber tiers in id 3685336438 (removed notice)"
"MP7 | Fade","absolute fade (MP7-specific)","80;449;576","FN;MW","https://lis-skins.com/blog/the-best-mp7-fade-patterns/","lis-skins blog (not Steam)","unknown","not stated","MP7 Fade does not follow shared Fade seeds"
"MP9 | Buff Blue","max blue","77 (~39.75%);159;995","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3646427559","MP9 Buff Blue","~2026","not stated",""
"MP9 | Starlight Protector","none","n/a","n/a","https://csgoskins.gg/items/mp9-starlight-protector","csgoskins.gg item page","n/a","no","negative control"
"P90 | Verdant Growth","special pattern","816;556;750;388","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2983197725","Verdant Growth Pattern Guide ""Subject to change""","~2023","not stated","WIP"
"P90 | Aeolian Light","white gem / black gem","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3652045951","P90","~2026-03","not stated","id mapping uncertain (vs 3489413750 Reef Grief)"
"P90 | Asiimov","none","n/a","n/a","https://wiki.cs.money/weapons/p90/asiimov","cs.money wiki","n/a","no","negative control"
"UMP-45 | Moonrise","star / no moon","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=1808559859","UMP-45","~2019","not stated","removed notice"
"UMP-45 | Warm Blooded","tiger/turtle/snake scales","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3652352381","UMP-45 Warm Blooded","~2026","not stated",""
"XM1014 | Seasons","blue leaf","26;78;115;130;182;234;286;334;338;390;442;494;546;598;605;650;659;698;955","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3569256978","XM1014 Seasons Pattern Guide","~2025","not stated",""
"XM1014 | Zombie Offensive","zombie chicken / witch / tank","369;977 (chicken);692;666;448;698 (witch)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3681615084","XM1014 (Zombie Offensive Pattern Guide)","~2026","not stated","chicken T2 319;11;57;30;281;377;831; witch T2 331;131;179;209;291;491;582; tank not visible"
"Sawed-Off | Brake Light","blue / red hot rod","146;261;760;910;916;774 (blue);22;29 (red)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3613249488","CS2 Rare/Unique Pattern Guide","~2025-11","not stated","also id 2844570170"
"Nova | Windblown","bird on gun","seeds not visible (~50 seeds)","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624","A (Not So) Small Guide For Pattern Based Skins","~2023","not stated",""
"MAG-7 | Sonar","pattern-based","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=2980292624","A (Not So) Small Guide For Pattern Based Skins","~2023","not stated","only notable MAG-7 pattern skin"
"Negev | Terrain","pattern","seeds not visible","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3601330547","CS2 Pattern Guides List","~2025","not stated",""
"UNKNOWN (user example)","unknown","unknown","unknown","https://steamcommunity.com/sharedfiles/filedetails/?id=3550106561","not found","unknown","unknown","could not identify via search; Steam blocked"
```
