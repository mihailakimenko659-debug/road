# CS2 paint seeds in practice: reading the pattern, trade-up seed odds, charm patterns, honest presentation

Research date: 2026-10-19. Method note: in this session, direct page fetches (WebFetch/curl) were blocked by the network environment (DNS failures / proxy 403 for counter-strike.net, steampowered.com, csdb.gg, skinbase.io, dust2.us, pricempire.com). **All findings below come from web-search result snippets and summaries, not from full page reads.** I could not open Valve's patch-notes pages myself. Claims that only rest on third-party guides are marked that way. Wherever a primary Valve source turned up in search results, it is cited.

## 1. How users see the pattern number (paint seed / "Pattern Template")

### Takeaway
In 2026, a skin's paint seed shows up as **"Pattern Template"** in three places. The first is the CS2 inspect / item-details panel. The second is the Steam Community Market: listings have shown pattern template, float and charm template since the Market overhaul, which Valve enabled for all users on **May 12, 2026**. The third is third-party inspect-link tools (CSFloat, SteamAnalyst, csmarketcap, etc.). The seed range is usually quoted as 0–999 for drops. CSFloat says 0–1000, with seed 1000 possible only from a trade-up. That claim dates from the CS:GO era and is unverified for CS2.

### Cited Findings
- Valve's Steam announcement "Steam Community Market Updates" says the Market beta is enabled for everyone, with an opt-out button at the top of item and search pages. It also says listings can now show "callouts for listing-specific information such as wear/float, pattern template, applied accessories, etc.", and it names pattern template, wear/float and charm template as CS2 examples. — [Steam News: Steam Community Market Updates](https://steamcommunity.com/games/593110/announcements/detail/673994309884707671) (date per press coverage: enabled for all on May 12, 2026, see [skinbase.io](https://skinbase.io/blog/steam-community-market-update-cs2-may-2026))
- Press coverage: on CS2 gun-skin listings "you can see the pattern template, exact level of wear, and all attached charms or stickers", with links out to listings for the attached stickers/charms. — [PCGamesN](https://www.pcgamesn.com/steam/community-market-update)
- Valve reportedly generated more than 27 million unique images to backfill existing CS2 listings, so buyers no longer need to launch the game to inspect an item. The images reflect the specific item. — [BigGo Finance](https://finance.biggo.com/news/202605150136_valve-overhauls-steam-community-market); [TalkEsport](https://www.talkesport.com/news/cs2/cs2-steam-market-update-inspect-skin-wear-float/); [esports.gg](https://esports.gg/news/counter-strike-2/steam-marketplace-trading-affected/); [GamesRadar](https://www.gamesradar.com/games/valve-cant-stop-winning-new-steam-update-revamps-community-market-with-bigger-better-listings-and-more-much-to-counter-strike-2-fans-delight/)
- The new Market adds slider-based wear filters, and games that use Steam Inventory get dynamic filters from item data automatically. — [skinbase.io](https://skinbase.io/blog/steam-community-market-update-cs2-may-2026); [egw.news](https://egw.news/gaming/news/34726/steam-community-market-has-a-major-updates-UHGhFVzrV)
- Before the overhaul, a Steam Community Market discussion (roughly two years old) noted that there was no Market filter for charm templates, so users had to inspect listings one by one. — [Steam Community Market discussion](https://steamcommunity.com/groups/community_market/discussions/0/4697910068985834153/)
- In-game: a 2026 guide says the inspect view's item details list the wear (float) and the "Pattern Template" (the pattern index), a value from 0 to 1000 that decides which part of the texture lands on the weapon. — [lis-skins blog (2026)](https://lis-skins.com/blog/kak-posmotret-pattern-skina-v-ks2/)
- Another guide says the "i" icon shows Finish Style, Finish Catalog, Pattern Template (paint seed), Exterior and the exact float. — [blix.gg](https://blix.gg/blog/news/cs-2/how-to-inspect-cs2-in-game-skins/)
- Conflict: an older pricempire guide describes the in-game method as showing "no pattern index", which suggests the in-game display came later. — [pricempire pattern guide](https://pricempire.com/guides/cs2-pattern-guide)
- The October 2, 2025 CS2 patch notes reportedly include: "the in-game loadout of a spectated player will now show wear and pattern of gloves". — [Sportskeeda, CS2 patch notes Oct 2, 2025](https://www.sportskeeda.com/esports/cs2-patch-notes-october-2-2025-new-armory-update-gameplay-changes)
- Third-party inspect-link viewers that show float, pattern seed and a 3D view: [csmarketcap inspect](https://csmarketcap.com/inspect), [SteamAnalyst inspect](https://www.steamanalyst.com/inspect), [skinflow pattern checker](https://skinflow.gg/pattern-checker), [SteamAnalyst pattern checker](https://www.steamanalyst.com/tools/pattern-checker), [swapcs pattern checker](https://swapcs.com/tools/pattern-checker).
- CSFloat listings show the float, a "Rank on FloatDB" link, a "Show In-Game Screenshot" option, and for Case Hardened, front/back blue, purple and gold percentages. Example: "Front / Back Blue: 71.28% / 0.1%". — [CSFloat item listing (Talon Knife)](https://csfloat.com/item/743832209793878354); [CSFloat item listing (Karambit)](https://csfloat.com/item/739909946451296583)
- Seed range:
  - CSFloat's CS:GO-era analysis of about 50,000 items treats seeds as 0–1000. It says "a 1000 paint seed is only possible if it originated from a trade-up", and that seeds look uniformly distributed ("a 456 is as probable as a 964"). — [CSFloat blog: Analysis of Float Value and Paint Seed Distribution in CS:GO](https://blog.csfloat.com/analysis-of-float-value-and-paint-seed-distribution-in-cs-go/)
  - Other guides say 0–999 or 1–999/1–1000. — Summarised from [p2trades](https://p2trades.com/guides/pattern-index), [cs2skins.space](https://cs2skins.space/guides/paint-seed-and-pattern-index-explained), [SteamAnalyst paint seed guide](https://www.steamanalyst.com/guides/paint-seed-explained)
- The seed seeds the engine's pseudo-random generator, which sets texture offset, rotation and scale. The same seed always gives the same transformation for the same skin. — [isitabluegem.com insights](https://www.isitabluegem.com/insights); [cs2skins.space](https://cs2skins.space/guides/paint-seed-and-pattern-index-explained)
- On ranking: CSDB ranks each seed's blue coverage "out of 1,000". — [CSDB pattern database](https://csdb.gg/pattern-database/)

### Inferences
- For a non-programmer site owner, the simplest guidance is this. "Pattern Template" on Steam or in-game is the paint seed, and the user can read it without any third-party tool since the May 2026 Market update.
- The 0–999 vs 0–1000 difference only matters at the margin. The site should say "about 1,000 possible patterns (0–999, plus 1000 reportedly possible from trade-ups)" rather than assert one number.

### Gaps
- I could not find the exact CS2 patch date when "Pattern Template" first appeared in the in-game inspect/details panel. Guides treat it as standard in 2025–2026, but no dated Valve note turned up. The only related dated note is the Oct 2, 2025 glove pattern/wear display for spectated players.
- I could not open Valve's Market announcement directly to confirm its date and exact label wording; the date comes from press.
- I found no CS2-era evidence that confirms or refutes CSFloat's CS:GO-era claim that "seed 1000 only comes from trade-ups".
- Buff163 and cs.money specifics were not checked, because both sites were unreachable in this session.

## 2. Trade-up contracts: seed assignment, float formula, 2025–2026 rules, odds of a specific seed

### Takeaway
Nothing a player does in a trade-up affects the output's paint seed. No source describes a mechanism for it, and guides agree it is pure RNG. Assuming the uniform distribution observed by CSFloat, a specific seed has about **1/1000** odds (1/1001 if 1000 is a possible trade-up seed). A set of N "good" seeds has about **N/1000** (N/1001). Since **October 22–23, 2025**, 5 Covert items (same StatTrak status) can be traded up into a knife or gloves from one input's collection. The output float averages each input's float after normalizing it within that skin's own float range, then maps the average onto the output skin's range.

### Cited Findings
- Rule change: the patch notes, as quoted by HLTV, describe an "extension of the Trade Up Contract to allow exchanging 5 items of Covert quality". Five Covert items yield a knife or gloves "from a collection of one of the items provided". StatTrak Covert inputs yield a StatTrak knife. — [HLTV: Knife trade-ups and return of retakes headline CS2 update](https://www.hltv.org/news/43004/knife-trade-ups-and-return-of-retakes-headline-cs2-update); [esports.gg](https://esports.gg/news/counter-strike-2/knives-trade-up-contracts-cs2-update/)
- Date: most sources say October 23, 2025; csdb.gg says October 22, 2025, probably the same release in a different time zone. — [csdb.gg knife trade-ups](https://csdb.gg/guides/cs2-knife-trade-ups/); [Sportskeeda market crash Oct 23, 2025](https://www.sportskeeda.com/esports/why-cs2-skins-market-crash-today-october-23-2025-nearly-2-billion-market-cap-loss-explained); [Refrag blog, Oct 25, 2025](https://refrag.gg/blog/cs2-skins-update-trade-ups); [skinbase.io](https://skinbase.io/blog/october-2025-cs2-trade-up-knives-gloves)
- StatTrak and regular inputs can't be mixed. Knives and gloves received carry a seven-day trade hold, per skin.club. One summary says StatTrak gloves are not available this way, so a StatTrak contract yields only knives; that is unverified against Valve's text. — [skin.club trade-up guide (2026)](https://community.skin.club/en/articles/trade-up-contracts-guide-cs2); [esports.gg](https://esports.gg/news/counter-strike-2/knives-trade-up-contracts-cs2-update/)
- Earlier rule, still in force for lower tiers: 10 skins of one rarity produce 1 skin of the next rarity, and Covert couldn't be traded up before October 2025. — [esports.gg](https://esports.gg/news/counter-strike-2/knives-trade-up-contracts-cs2-update/)
- Valve does not publish official trade-up odds. — [skin.club](https://community.skin.club/en/articles/trade-up-contracts-guide-cs2)
- Market impact: trackers estimated very different market-cap losses, from roughly $609M to $337M in hours (csmarketcap) up to "nearly $2 billion" (Sportskeeda). Knife and glove prices fell while Covert prices rose. — [csmarketcap blog](https://csmarketcap.com/zh/blog/market-insights/cs2-knife-trade-up-update-the-272m-market-crash); [Sportskeeda](https://www.sportskeeda.com/esports/why-cs2-skins-market-crash-today-october-23-2025-nearly-2-billion-market-cap-loss-explained); [esports.net](https://www.esports.net/wiki/guides/cs2-knives-skin-market-crash/)
- Float formula (third-party guides; not confirmed in Valve text):
  - normalized_i = (float_i − min_i) / (max_i − min_i)
  - avg = mean(normalized_i)
  - output float = out_min + avg × (out_max − out_min)
  — [skinory.io](https://skinory.io/en/guides/trade-up-contracts); [mansone.com](https://mansone.com/blog/cs2-trade-up-guide-float-formula); [money4gamers.nl](https://www.money4gamers.nl/the-new-cs2-tradeup-algorithm/); [TradeUpSpy guide](https://www.tradeupspy.com/tools/trade-up-guide); [Steam guide "[NEW] Trade ups & Floats Guide for CS2"](https://steamcommunity.com/sharedfiles/filedetails/?id=3594575259); [game-wisdom](https://game-wisdom.com/?p=34386)
- Date conflict on the normalization: most guides tie it to the October 23, 2025 update. One source attributes it to an October 2024 update. One blog alleges Valve left the change out of its patch notes, which is unverified. — [pirateswap blog](https://pirateswap.com/blog/article/cs2-trade-up-changes-october-profit); [money4gamers.nl](https://www.money4gamers.nl/the-new-cs2-tradeup-algorithm/)
- Example effect of normalization: a 0.10 float on a 0.06–0.80 skin counts as about 5.4% of its range, versus 10% on a 0.00–1.00 skin. — [skinory.io](https://skinory.io/en/guides/trade-up-contracts) / [mansone.com](https://mansone.com/blog/cs2-trade-up-guide-float-formula) (snippet; exact page attribution uncertain)
- CSDelta (July 2026) notes that "weighted/normalized average" and "plain average" floats differ, so calculators may display either. — [CSDelta blog](https://csdelta.com/blog/cs2-weighted-float-vs-normal-average-trade-ups-2026)
- Old CS:GO-era behaviour, from before normalization: trade-up outputs skewed toward low floats because many skins have max float < 1. — [CSFloat blog](https://blog.csfloat.com/analysis-of-float-value-and-paint-seed-distribution-in-cs-go/)
- The CSFloat trade-up calculator was reportedly updated in October 2025 for the new mechanics. — search summary referencing CSFloat; no direct page fetched (see [CSFloat blog](https://blog.csfloat.com/how-floatdb-tracks-items/))
- Seed: the paint seed is assigned at creation (unbox, drop or trade-up) and is then fixed. "Trade-up contracts produce random pattern seeds — you cannot control or predict which pattern you'll receive", and "pattern farming" through repeated trade-ups is usually unprofitable. — [cs2floatchecker rare patterns guide](https://cs2floatchecker.com/blog/cs2-rare-patterns-guide); [p2trades](https://p2trades.com/guides/pattern-index); [steamanalyst paint seed guide](https://www.steamanalyst.com/guides/paint-seed-explained)
- Uniform seed distribution, observed in a sample of about 50,000 CS:GO items. — [CSFloat blog](https://blog.csfloat.com/analysis-of-float-value-and-paint-seed-distribution-in-cs-go/)

### Inferences
- Probability math for the site, assuming a uniform seed (supported only by CSFloat's CS:GO data):
  - P(a specific seed) = 1/1000 = 0.1% (or 1/1001 ≈ 0.0999%).
  - P(one of N good seeds) = N/1000. Examples: 10 tier-1 blue-gem seeds give 1%; 50 seeds give 5%.
  - This must be multiplied by the chance of hitting the right output skin at all. In a Covert→knife contract, that means the chance of getting the specific knife type and finish from the input collections. A specific knife + finish + seed is therefore far rarer than N/1000.
- Chance of at least one hit in k independent contracts = 1 − (1 − p)^k. For p = 1/1000 and k = 100, that is about 9.5%. This is pure arithmetic and is not sourced.
- Seeds don't interact with floats, so no input choice changes seed odds. Inputs only change which collection/skin you get and the float.
- The seed is only one part of an item's "pattern value". Fade %, blue % and similar metrics also depend on the skin's own texture, so the same seed number means different things on different skins.

### Gaps
- I couldn't read Valve's own October 2025 patch-note text, so the exact wording on StatTrak gloves and on float normalization is unconfirmed by me.
- No official Valve statement on seed RNG or distribution exists. Uniformity rests on CSFloat's CS:GO-era sample.
- I found no CS2 rule changes to trade-ups after October 2025, as of October 2026, but I didn't confirm that their absence is real.
- The exact output-selection probabilities for knife/glove contracts (per-collection weighting) were not covered in this scope.

## 3. Charms (keychains): template range, what it changes, premium patterns, display

### Takeaway
Charms came with the Armory update (October 2, 2024). Each has a **charm template** (pattern number), reportedly about 0/1–100,000, a much larger space than skin seeds. For several charms the template changes the color (Die-Cast AK, Baby Karat, Big Kev, Lil' Squirt highlights), and collectors pay premiums for specific bands (gold Die-Cast AK at low templates, gold Baby Karat at high ones). Since May 2026, Steam listings call out the "charm template". Separately, Austin 2025 Major **Souvenir Highlight charms** carry a match video clip rather than a meaningful color pattern.

### Cited Findings
- Charms were introduced in 2024 as small 3D danglers attached to weapons. The template works like a skin's pattern seed but has a much larger range; one guide gives 1–100,000. — [SteamAnalyst: Charms explained](https://www.steamanalyst.com/guides/charms-explained); [Sportskeeda: CS2 patch notes Oct 2, 2024 (The Armory)](https://www.sportskeeda.com/esports/cs2-patch-notes-october-2-2024-the-armory-map-fixes)
- In-game label: "Charm Template", also called charm pattern or pattern index. It determines how the charm's pattern/colors are generated. — [daddyskins CS2 charm patterns guide (2026)](https://daddyskins.com/blog/best-cs-skins/best-cs-charms-best-cs-skins/cs2-charm-patterns/)
- Valve's Market announcement names "charm template" among the CS2 listing callouts. — [Steam News: Steam Community Market Updates](https://steamcommunity.com/games/593110/announcements/detail/673994309884707671)
- Baby Karat (CT/T): "various shades of bronze between charm templates 0 to 50,000, after which it becomes golden". Another source says the rarest CT "gold" is template 92432. — [SteamAnalyst](https://www.steamanalyst.com/guides/charms-explained); [Hotspawn rarest charm patterns](https://www.hotspawn.com/counter-strike/news/best-rarest-cs2-charm-patterns-explained)
- Big Kev: pink to purple at about template 65,000, then cyan blue at about 85,000 and above. — [SteamAnalyst](https://www.steamanalyst.com/guides/charms-explained)
- Die-Cast AK: the colour runs through bands across the range, and sources conflict on where they fall:
  - one gives gold ~0–10K, orange 10K–20K, red 20K–24K, pink 24K–35K, violet 35K–75K, blue 87K–100K;
  - another gives gold 1–10,000, orange 10,000–20,000, red 20,000–25,000, pink 25,000–60,000, purple 60,000–87,000, blue 87,000–98,000.
  — [Hotspawn](https://www.hotspawn.com/counter-strike/news/best-rarest-cs2-charm-patterns-explained); [Steam guide "SUPREME CS2 CHARMS GUIDE"](https://steamcommunity.com/sharedfiles/filedetails/?id=3385308903); [esportfire](https://esportfire.com/article/the-complete-and-ultimate-guide-to-counter-strike-2-weapon-charms)
- csdb.gg says the best Die-Cast AK is the gold one, around template 5000. — [csdb.gg best charm patterns](https://csdb.gg/the-best-cs2-charm-patterns)
- Lil' Squirt: the template changes the colour of the water gun's highlights; no detailed band map was found. — [Hotspawn](https://www.hotspawn.com/counter-strike/news/best-rarest-cs2-charm-patterns-explained); [hellcase charms guide](https://hellcase.com/blog/skinopedia/cs2-weapon-charms-guide/)
- A charm browser shows sample templates per charm, for example Die-Cast AK at 1, 15000, 30000, 50000, 75000 and 90000. — [cs2inspects charms](https://cs2inspects.com/charms)
- Claims that extreme templates (1–1000 or 99000–100000) command hundreds of dollars come from low-quality, spam-like pages. They are unverified, and a studentbridge page's "gold 1–100 / Perfect Red 21500, 23385" conflicts with the better-established guides. — [studentbridge page (low reliability)](https://slbubble.studentbridge.com/celebnews228/the-ultimate-die-cast-ak-charm-pattern-guide-finding-the-rare-gold-and-ruby-red-templates-in-cs2-af2v6.html); [bo3.gg best charms (mirrored, partly mistranslated)](https://bo3.gg/tl/articles/best-cs2-charms)
- Souvenir Highlight charms (BLAST.tv Austin Major 2025):
  - Opening a Playoff Stage Souvenir package automatically attached a charm holding a video clip from the playoff map the buyer chose. The clip is viewable in the Steam inventory or while spectating.
  - There are almost 500 different highlights, released in early July 2025, and they became tradeable/marketable on July 11, 2025.
  - Example price snapshot: "Strikes Back" charm $6.97, all-time high $118 on July 3, 2025.
  — [HLTV: Souvenir Highlight Packages](https://www.hltv.org/news/41803/valve-introduces-souvenir-highlight-packages-for-austin-major); [Esports News UK, Jul 3, 2025](https://esports-news.co.uk/2025/07/03/cs2-releases-highlight-souvenir-charms-but-some-arent-exactly-highlights/); [Escorenews](https://escorenews.com/en/csgo/news/70065-valve-reveals-when-highlight-charms-will-become-marketable-and-tradeable-in-cs2); [csgoskins.gg item](https://csgoskins.gg/items/charm-austin-2025-highlight-strikes-back); [GamerPay blog](https://www.blog.gamerpay.gg/blog/highlight-souvenir-charms-austin-2025-cs2-major)

### Inferences
- Charms are not part of weapon trade-up contracts in any source found. A trade-up calculator only needs charm info as background, for example in a "what does the number on Steam mean" explainer.
- With templates up to about 100,000, a "1 in 1000" intuition doesn't carry over. If gold Die-Cast AK really is ~0–10K, that band is about 10% of templates, not a rare 0.1%. Premium value may sit in a narrower "best shade" sub-band, but no reliable source quantifies one.

### Gaps
- I found no Valve-official statement of the charm template range (0–100,000 vs 1–100,000).
- It's unconfirmed whether the template also affects charm position, rotation or attachment. Sources found only describe colour and shade effects; the attachment offset seems player-chosen when applying, but I found no source.
- There is no reliable, consistent band map for Die-Cast AK; the sources conflict.
- No reliable charm-pattern price data was found.

## 4. Ideas for honest pattern presentation on a trade-up calculator site, and pitfalls

### Takeaway
Reputable marketplaces show the seed number together with **item-specific images** (in-game screenshots or rendered previews), **objective metrics** (fade %, front/back blue %), and links to a **pattern database rank**. Scams rely on screenshots, recycled images and inspect-link misdirection. An honest calculator should present seed odds as plain N/1000 math, separate them from skin and float odds, and warn users to verify items in-client or on Steam.

### Cited Findings
- CSFloat example listings show an in-game screenshot option, the float, a FloatDB rank link, and front/back blue, purple and gold percentages for Case Hardened; CSFloat also offers fade % and blue % filters. — [CSFloat Talon Knife listing](https://csfloat.com/item/743832209793878354); [CSFloat Karambit listing](https://csfloat.com/item/739909946451296583)
- Pattern databases rank seeds by measured metrics: CSDB ranks blue coverage out of 1,000 seeds, measured from the paint kit's own texture, and Clash.gg sources its data from CSBlueGem. — [CSDB pattern database](https://csdb.gg/pattern-database/); [Clash.gg pattern data](https://stash.clash.gg/bluegem)
- Fade percentages are typically quoted between 80% and 100% and are tied to the seed. One guide lists, for example, seed 412 at 100.0000% as the top full fade (for a specific skin). — [cs2floatchecker pattern guide](https://cs2floatchecker.com/blog/pattern-guide); [Skinport fade % calculation update](https://skinport.com/blog/csgo-fade-percentage-update)
- Different sites compute fade % differently; Skinport published an update to its fade-percentage calculation. — [Skinport blog](https://skinport.com/blog/csgo-fade-percentage-update) (title only; contents not read)
- Steam Market images now reflect the exact listed item. That gives an official, verifiable preview source. — [TalkEsport](https://www.talkesport.com/news/cs2/cs2-steam-market-update-inspect-skin-wear-float/); [BigGo](https://finance.biggo.com/news/202605150136_valve-overhauls-steam-community-market)
- Scam pitfalls:
  - Don't trust screenshots alone, especially cropped or "clean-looking" ones; scammers manipulate inspect screenshots. — [cs2bonus fake low-float scams](https://cs2bonus.com/articles/cs2-fake-low-float-knife-scams); [Steam guide: avoid being scammed in CS2](https://steamcommunity.com/sharedfiles/filedetails/?id=3592113314)
  - Images from legit trades get recycled to push fake items, a reported problem with Case Hardened Blue Gems. — [cs2bonus](https://cs2bonus.com/articles/cs2-fake-low-float-knife-scams)
  - Inspect misdirection: the scammer asks you to inspect the "prize" while the trade offer actually sends your own skins out. Never evaluate a trade offer with a CS2 inspect window open; insist on in-client inspection or the trade-window preview. — [tradeupacademy safety guide](https://tradeupacademy.org/articles/cs2-skin-trading-safety-avoid-scams); [csboard scam prevention 2026](https://csboard.com/en/blog/cs2-trade-scam-prevention-2026); [rapidskins](https://www.rapidskins.com/blog/how-to-avoid-cs2-skin-scams)
  - Fake "staff" DMs and phishing login pages, plus fake trade URLs. — [blix.gg fake trade URLs](https://blix.gg/news/cs-2/how-to-recognize-fake-trade-urls-and-avoid-scams-when-buying-cs2-skins/); [csboard](https://csboard.com/en/blog/cs2-trade-scam-prevention-2026)
- Most pattern-value and scam sources are vendor or marketplace blogs with commercial incentives. Their "rare seed" lists are community opinion, not Valve data. — noted across [cs2floatchecker](https://cs2floatchecker.com/blog/cs2-rare-patterns-guide), [csdb](https://csdb.gg/pattern-database/)

### Inferences (ideas for the site; my synthesis, not sourced practice)
- Show seed odds explicitly as "≈ N in 1000 per contract, if you get this exact skin". Also show a combined line: P(skin) × N/1000. Include a "chance in k contracts" helper, 1 − (1 − p)^k, to counter the gambler's fallacy.
- State plainly that nothing in a trade-up influences the pattern seed, citing guides and the absence of any mechanism. Never sell "seed-targeting" tricks.
- Present float as the deterministic part, using the normalized formula, and the seed as the random part. Label which float formula the calculator uses, since CSDelta notes calculators differ.
- For "good seed" lists, cite the database (CSDB, CSBlueGem, FloatDB) and the metric (blue %, fade %). Show an image per seed, and add a disclaimer that tiers and prices are community-defined and change.
- Link to Steam Market listings or official inspect, which now show Pattern Template and item-specific images, instead of hosting unverifiable screenshots. Add a short "verify before buying" box: check Pattern Template on Steam or in-client, ignore screenshots, never inspect during a pending trade offer.
- Avoid "rare pattern!" badges unless they're tied to a published, sourced list, and avoid unverified charm price claims.

### Gaps
- I could not read CSFloat's, Buff's or cs.money's own docs on how they compute blue/fade % or render screenshots; those sites were unreachable here.
- No quantitative data was found on the prevalence of fake rare-pattern listings or losses.
- I found no source on any regulatory or Steam policy that requires gambling-style odds disclosure for calculator sites; this was not researched in depth.
