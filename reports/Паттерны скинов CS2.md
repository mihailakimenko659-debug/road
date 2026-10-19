# Как номер рисунка меняет цену скинов CS2

**Краткое резюме (10 строк)**

1. Номер рисунка (paint seed, в Steam «Pattern Template», 0–1000) сильно влияет на цену только у нескольких отделок: Case Hardened/Heat Treated, Marble Fade (Fire & Ice), Doppler P2/P4, Crimson Web, Slaughter и части перчаток. У Fade влияние умеренное.
2. Самая крупная сделка, где цену определил номер: StatTrak AK-47 | Case Hardened #661 FN, «более $1 млн», 5 июня 2024. Точная сумма не раскрыта.
3. Известные «$1,5 млн» за Karambit | Case Hardened #387 FN — это отклонённое предложение 2021 года (эпоха CS:GO). Продажи не было.
4. По реальным продажам на CSFloat (разбор SteamAnalyst, сентябрь 2026) ножи Fade 99–100% продаются в среднем всего на +17% дороже обычных, 96–99% — на +9%.
5. Фаза Doppler (Ruby, Sapphire, Black Pearl, Emerald) — это отдельный код отделки, а не номер рисунка. Камни стоят примерно в 2–6 раз дороже обычных фаз, но это цены трекеров, а не отдельные сделки.
6. Для Fire & Ice, Crimson Web, Slaughter и перчаток публичных сделок с датой и конкретным номером не найдено. Есть только медианы трекеров, выставленные цены и оценки.
7. Номер видно в игре при осмотре («Pattern Template»), на витрине Steam с мая 2026 и в инспект-ссылке. С марта 2026 такую ссылку можно расшифровать без ботов.
8. С 22–23 октября 2025 пять Covert-предметов можно скрафтить в нож или перчатки. Номер результата случаен: около 0,1% на конкретный номер, и это ещё умножается на шанс получить сам предмет.
9. Процент Fade сайт может считать сам по открытому коду chescos (лицензия MIT), процент синего — брать из готовых MIT-данных. Базы SteamDB, CSFloat, csdb.gg, pattern.wiki и Buff копировать нельзя, на них можно только ссылаться.
10. Сеть в среде исследования блокировала почти все сайты, поэтому большинство фактов взято из фрагментов поисковой выдачи. Перед публикацией их нужно перепроверить в браузере.

> **Как собраны данные. Прочитать до использования.** Сеть в среде исследования (19.10.2026) не открывала страницы большинства сайтов: steamdb, csfloat, pattern.wiki, csdb.gg, csbluegem, wiki.cs.money, Buff, Skinport docs, steamcommunity, Reddit, HLTV, Dexerto и другие. Пробиться удалось только к GitHub и реестру npm. Поэтому **почти все цены, тир-листы и условия сайтов взяты из фрагментов поисковой выдачи (сниппетов)**. Сами страницы целиком не открывались. Перед публикацией каждую цифру нужно открыть по ссылке и сверить.
>
> **Проверено по оригинальным файлам** (метка **[файл]**):
> - лицензии и README репозиториев на GitHub (chescos fade и blue gem, ByMykel, csfloat/inspect, cs-inspect-serializer, GameTracking-CS2, Valve Source SDK);
> - исходный код калькулятора fade от chescos и прогон его версии 2.0.0 из npm (таблица распределения процентов ниже — наш собственный расчёт);
> - данные ByMykel CSGO-API (диапазоны float у Fade-отделок);
> - содержимое файла items_game.txt.
>
> Всё без метки взято из сниппетов.
>
> **Метки цен:**
> - **СДЕЛКА** — завершённая частная сделка, о которой объявили названные посредники и написали крупные издания;
> - **СДЕЛКА-трекер** — продажа на площадке по данным трекера;
> - **СООБЩАЛОСЬ** — о продаже сообщали, но её завершение или цена под вопросом;
> - **ПРЕДЛОЖЕНИЕ** — от предложения отказались;
> - **ЛИСТИНГ/ОЦЕНКА** — выставленная цена, снимок трекера или мнение гайда.
>
> Метка **(CS:GO)** означает событие до выхода CS2 в сентябре 2023.
>
> **Важный контекст рынка.** Обновление 22–23 октября 2025 разрешило крафт ножей и перчаток. После него ножи и перчатки подешевели примерно на 20–50%, по отдельным оценкам до 70% ([csmarketcap](https://csmarketcap.com/blog/market-insights/cs2-knife-trade-up-update-the-272m-market-crash), [skinrave](https://skinrave.gg/en/blog/valve-cs2-tradeups-and-market-crash)). Цены на ножи до октября 2025 нельзя напрямую сравнивать с нынешними.

---

## Семейства скинов: где номер стоит денег, а где нет

**Общие правила для всех таблиц.**

**Номер и износ.** Номер (seed) задаётся при создании предмета и потом не меняется. Он сдвигает и поворачивает текстуру, поэтому у каждого номера свой фиксированный рисунок ([SteamAnalyst](https://www.steamanalyst.com/guides/paint-seed-explained)). Износ (float: FN, MW, FT, WW, BS) — отдельное число. Он отвечает за потёртости и почти не влияет на расположение цветов.

**«Лучшие номера» придумало сообщество.** Официального списка у Valve нет. Тир-листы в основном пишут маркетплейсы, у которых свой коммерческий интерес, и списки у них расходятся. Один и тот же номер на разных моделях даёт разную картинку, поэтому список ведут отдельно для каждой модели.

**Как узнать номер.** Есть три способа:
- в игре: осмотр предмета, кнопка «i», строка «Pattern Template» ([lis-skins](https://lis-skins.com/blog/kak-posmotret-pattern-skina-v-ks2/), [blix.gg](https://blix.gg/blog/news/cs-2/how-to-inspect-cs2-in-game-skins/));
- на витрине Steam: после обновления рынка (для всех с 12 мая 2026) в листингах CS2 показаны pattern template, float и шаблон брелока, у каждого предмета своя картинка ([анонс Steam](https://steamcommunity.com/games/593110/announcements/detail/673994309884707671), [PCGamesN](https://www.pcgamesn.com/steam/community-market-update));
- на площадках и в просмотрщиках инспект-ссылок: CSFloat, csmarketcap, SteamAnalyst, Skinflow. CSFloat у Case Hardened дополнительно показывает процент синего спереди и сзади ([пример листинга CSFloat](https://csfloat.com/item/743832209793878354)).

**Как работает крафт (с 22–23.10.2025).** Пять Covert-предметов меняются на нож или перчатки из коллекции одного из этих предметов ([HLTV](https://www.hltv.org/news/43004/knife-trade-ups-and-return-of-retakes-headline-cs2-update)). Пять StatTrak Covert дают StatTrak-нож. StatTrak-перчаток не бывает, а смешивать StatTrak и обычные предметы нельзя. Пушки, как и раньше, получаются обычным контрактом из 10 предметов своей коллекции.

**Чем управляет игрок.** Износ результата предсказуем: по описаниям гайдов, это нормированное среднее износов входных предметов ([skinory](https://skinory.io/en/guides/trade-up-contracts)). Номер результата игрок не выбирает и не может на него повлиять ([cs2floatchecker](https://cs2floatchecker.com/blog/cs2-rare-patterns-guide)).

**Как считать шанс.** Шанс = (шанс получить нужный предмет и отделку) × (число хороших номеров / 1001). Здесь мы предполагаем, что номер распределён равномерно. Это предположение опирается только на выборку CSFloat из примерно 50 000 предметов эпохи CS:GO ([блог CSFloat](https://blog.csfloat.com/analysis-of-float-value-and-paint-seed-distribution-in-cs-go/)). Valve официально этого не подтверждала. Диапазон номеров у ножей — 0–1000: так его задаёт код chescos v2.0.0 для предметов, которые можно получить крафтом **[файл]**.

**Шансы на нож никто официально не публикует.** Модели расчёта спорят между собой. По skin.club каждому входу достаётся по 20% ([skin.club](https://community.skin.club/en/articles/trade-up-contracts-guide-cs2)). У steamdb.com формула взвешена по коллекциям ([steamdb.com](https://steamdb.com/en/articles/cs2-trade-up-contract-guide)).

### Case Hardened (blue gem)

| Пункт | Что известно |
|---|---|
| Предметы и износы | 24 предмета: 20 ножей (включая Kukri), AK-47, Five-SeveN, MAC-10 и перчатки Hydra Gloves ([Steam-гайд](https://steamcommunity.com/sharedfiles/filedetails/?id=3090086681), [dmarket](https://dmarket.com/blog/cs2-case-hardened-skins-guide/)). Износ не стирает синий, но меняет базовую цену. Например, самые дешёвые Hydra CH стоят около $357 в FN и около $62 в FT (ЛИСТИНГ, [steamdb.com](https://www.steamdb.com/en/skins/cs2/gloves/hydra-gloves-case-hardened), около середины 2026). |
| Механика | Номер сдвигает и поворачивает общую сине-золотую текстуру (поворот до 0–360°). Ценится доля синего на видимой стороне (playside). Тиры составляют csbluegem, csdb.gg и гайды маркетплейсов. Проценты для одного и того же номера у разных сайтов расходятся: для AK #670 это около 85% у [cs2-inventory](https://cs2-inventory.com/en/blog/ak-47-case-hardened-blue-gem-tier-list) и около 71% у [skin.place](https://skin.place/blog/ak-47-case-hardened-blue-gem-patterns/). |
| Лучшие номера и споры | **AK-47:** #661 («Scar») стоит вне тиров. Tier 1, по версии [csgoskins.gg](https://csgoskins.gg/blog/ak-47-case-hardened-blue-gem-seed-patterns) и [lis-skins](https://lis-skins.com/blog/ak-47-case-hardened-pattern-guide-case-hardened-tier-list/): 151, 955, 321, 387, 670, 179. Другие сайты добавляют, например, 555 ([cs-resource](https://cs-resource.com/en/case-hardened-guide/)). **Karambit:** #387 называют лучшим почти единогласно. **Five-SeveN:** 278, 690, 868. Что из них лучше, 278 или 868, спорят [profilerr](https://profilerr.net/five-seven-case-hardened-blue-gem-guide/) и [hellcase](https://hellcase.com/blog/skinopedia/five-seven-blue-gem-patterns/). **Survival:** 403 ([csgoskins.gg](https://csgoskins.gg/blog/survival-knife-case-hardened-blue-gem-seed-patterns)), но тир-листы разных сайтов по Survival не совпадают. По Bayonet и Butterfly номера не проверены. |
| Как проверить | «Pattern Template» в игре или на Steam. Процент синего спереди и сзади показывает CSFloat. Смотреть, но не копировать, можно базы csbluegem, csdb.gg и pattern.wiki. |
| Шанс крафтом | Ножи получаются через контракт из 5 Covert, пушки — обычным контрактом своей коллекции. Конкретный номер — примерно 1/1001. Наш пример расчёта: если в коллекции 30 вариантов «нож + отделка», то шанс на Karambit CH #387 ≈ 1/30 × 1/1000 ≈ **1 к 30 000** за контракт. По оценке гайдов, качество blue gem имеют около 0,3% Karambit CH ([thespike](https://www.thespike.gg/counter-strike-2/beginner-guides/trade-ups-cs2-guide)). Тогда шанс на любой blue gem Karambit ≈ **1 к 10 000**. |

| Предмет и номер | Цена | Дата | Тип | Источник |
|---|---|---|---|---|
| StatTrak AK-47 CH #661 FN | «более $1 млн»; точная сумма не раскрыта, начальный buyout был $1,5 млн | 5.06.2024 | СДЕЛКА (частная, через посредников zipeL и roflm0nster) | [Dexerto](https://www.dexerto.com/counter-strike-2/counter-strike-2s-most-expensive-skin-sells-for-jaw-dropping-1-million-2762918/), [Insider Gaming](https://insider-gaming.com/counter-strike-skin-sells-1-million/) |
| StatTrak AK-47 CH #661 MW с 4 наклейками Titan Holo Katowice 2014 | около $400 000 в пакете дороже $500 000; большая часть цены приходится на наклейки | 16.04.2023 (CS:GO) | СДЕЛКА (частная, разбивку цены назвал посредник) | [PC Gamer](https://www.pcgamer.com/counter-strike-skin-sells-for-dollar400k-probably-the-most-expensive-gun-in-videogame-history/) |
| Karambit CH FT (float 0,325); номер спорный: #387 или ниже | $169 000 | июль 2023 (CS:GO) | СООБЩАЛОСЬ (на момент статьи сделка не была завершена) | [WIN.GG](https://win.gg/news/the-noob-blue-gem-karambit-has-sold-for-169000/), [esports.net](https://www.esports.net/news/counter-strike/blue-gem-karambit-sold/) |
| Karambit CH #387 WW, копия, восстановленная поддержкой Steam | около $118–120 тыс. | июнь 2023 (CS:GO) | СООБЩАЛОСЬ (возможно, это та же сделка, что пакет апреля 2023) | [Dot Esports](https://dotesports.com/counter-strike/news/karambit-case-hardened-blue-gems-patterns-prices-and-history), [Skin.Club](https://community.skin.club/en/articles/karambit-case-hardened-blue-gem) |
| Karambit CH #387 FN | €1,2 млн в биткоинах | сентябрь 2021 (CS:GO) | ПРЕДЛОЖЕНИЕ, владелец отказался. **Это не продажа** | [skin.place](https://skin.place/blog/karambit-blue-gem/), [GHOSTCAP](https://www.ghostcap.com/most-expensive-cs2-knife) |
| Five-SeveN CH: #278 FN / #868 FN / #690 MW | $2 156 / $1 380,99 / $651,99. По 81 продаже топовых номеров медиана $366,12 | последняя продажа в группе 21.09.2026 | СДЕЛКА-трекер (данные CSFloat, независимо не проверены) | [cs2pattern-prices](https://cs2pattern-prices.com/weapons/five-seven/case-hardened/blue-gems-1) |
| AK-47 CH FT (номер не указан) | около $33 536 | 7.07.2026 | не проверено | [csgobluegem](https://app.csgobluegem.com/case-hardened-cs2-sales-data) |
| AK-47 CH #661, «частная сделка $260 000» | — | июль 2026 | **не использовать**: противоречит остальным данным | [cspredict](https://cspredict.gg/news/ak-47-case-hardened-blue-gem-661-private-negotiation-260k-new-pattern-lottery-record/) |
| Наценка blue gem к обычному паттерну | «в 10–100 раз» | — | ОЦЕНКА без методики | [csdb.gg](https://csdb.gg/guides/case-hardened-guide/) |

### Heat Treated

| Пункт | Что известно |
|---|---|
| Предметы и износы | Только две пушки, на ножах этой отделки нет. **Desert Eagle** — Limited Edition из The Armory (октябрь 2024), сейчас напрямую не получить. **Five-SeveN** — коллекция The Sport & Field, тоже из Armory, 2.10.2024 ([Hotspawn](https://www.hotspawn.com/counter-strike/news/cs2-desert-eagle-heat-treated-blue-gem-patterns-ranks), [csgoskins.gg](https://csgoskins.gg/items/five-seven-heat-treated)). |
| Механика | Как у Case Hardened: ценится синий на видимой стороне. |
| Лучшие номера и споры | У Deagle лучший номер #490. Сколько на нём синего, источники оценивают по-разному: «больше 90%» или 75,09%. Также ценятся 148, 69, 704 ([Hotspawn](https://www.hotspawn.com/counter-strike/news/cs2-desert-eagle-heat-treated-blue-gem-patterns-ranks), [skin.place](https://skin.place/blog/desert-eagle-heat-treated-patterns/)). |
| Цены | Five-SeveN HT Tier 2: лучшая продажа #406 за $159, дата не указана (СДЕЛКА-трекер, [cs2pattern-prices](https://cs2pattern-prices.com/weapons/five-seven/heat-treated/blue-gems-2)). Обычный Five-SeveN HT: около $13–14 в FN и около $2,23 в FT, дата снимка не указана (ЛИСТИНГ/трекер, [steamanalyst](https://www.steamanalyst.com/skin/five-seven-heat-treated)). |
| Как проверить | «Pattern Template». Процент синего для HT есть в MIT-данных chescos blue gem. |
| Шанс крафтом | Five-SeveN HT теоретически можно получить контрактом внутри Sport & Field. Можно ли крафтом получить Deagle HT (Limited Edition), неясно. |

### Fade (процент)

| Пункт | Что известно |
|---|---|
| Предметы и износы **[файл]** | Fade есть на всех 20 ножах, а также на AWP, M4A1-S, UMP-45, Glock-18 и MAC-10. У всех них float 0–0,08, поэтому бывают **только FN и MW**. MP7 Fade имеет float 0–0,25 (до FT), R8 Fade — 0–0,40 (до WW). Specialist Gloves Fade — 0,06–0,80, все износы ([ByMykel skins.json](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json)). |
| Механика **[файл]** | В самой игре процента нет. Это договорённость сообщества: номер через открытый генератор случайных чисел Valve задаёт поворот текстуры (у части пушек ещё и сдвиг). Лучший вариант принят за 100%, худший — за 80% ([README chescos](https://github.com/chescos/csgo-fade-percentage-calculator)). По словам автора, эти же значения показывают CSFloat, Skinport, CSGOSKINS.GG, DMarket, BitSkins и другие. CS.MONEY, BUFF163, BUFF Market, BroSkins и CS.DEALS считают своим способом, и **проценты у них могут отличаться**. |
| Лучшие номера **[файл]** | Наш прогон chescos 2.0.0 даёт такие номера со 100%: **763** — у большинства ножей, Glock, MAC-10, R8 и UMP-45; **412** — у AWP, Karambit и Talon (у них шкала перевёрнута); **374** — у M4A1-S; **80** — у MP7. Названия вроде «90/10», «Full fade» и «Max» сайты понимают по-разному ([profilerr](https://profilerr.net/karambit-fade-patterns/)). |
| Как проверить | Узнать номер по инспект-ссылке или на Steam, затем найти процент в пакете chescos или на CSFloat, Skinport, csgoskins.gg. Нужно учитывать, что BUFF и CS.MONEY покажут другое число. |
| Шанс крафтом **[файл]** | Ножи получаются контрактом из 5 Covert, пушки — обычным контрактом. Распределение процентов по нашему прогону для 1001 номера: |

| Группа | Номер 100% | ≥99% | ≥98% | ≥95% | ≥90% |
|---|---|---|---|---|---|
| Большинство ножей, Glock, MAC-10, R8, UMP-45, все Amber Fade | 763 | 6,2% | 10,9% | 26,1% | 50,0% |
| AWP, Karambit, Talon | 412 | 4,9% | 10,6% | 25,2% | 50,0% |
| M4A1-S | 374 | 3,5% | 10,2% | 22,8% | 47,3% |
| MP7 | 80 | 2,2% | 7,8% | 23,2% | 50,5% |

Шанс на точный номер со 100% около 0,1%. Его тоже нужно умножать на шанс получить сам предмет.

| Предмет | Цена | Дата | Тип | Источник |
|---|---|---|---|---|
| Все ножи Fade FN | 99–100%: медиана +17% (93 продажи); 96–99%: +9% (164); 93–96%: +2% | данные CSFloat за сентябрь 2026 | СДЕЛКИ (сводка трекера) | [SteamAnalyst](https://www.steamanalyst.com/guides/fade) |
| Karambit Fade FN | 99–100%: +37% (всего 4 продажи); 96–99%: +15% (4) | то же | СДЕЛКИ (сводка трекера, выборка мала) | [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-fade) |
| M9 Bayonet Fade FN | 99–100%: +24% (5 продаж); 96–99%: +14% (10) | то же | СДЕЛКИ (сводка трекера) | [SteamAnalyst](https://www.steamanalyst.com/skin/m9-bayonet-fade) |
| M4A1-S Fade #441 (99%) FN | $5 677,14. Цену определили 5 наклеек Dignitas Holo Cologne 2014, а не процент | дата не указана | СДЕЛКА-трекер | [cs2pattern-prices](https://cs2pattern-prices.com/weapons/m4a1-s/fade/99/441) |
| Karambit Fade, самый дешёвый на CSFloat | $1 799 | 26.06.2026 | ЛИСТИНГ | [steamdb.com](https://steamdb.com/en/skins/cs2/knives/karambit-fade) |
| Блоги: «+20–50%» за 100%; Butterfly 100% «до $9 700»; AWP 100% «+40–60% к 80%» | — | без даты | ОЦЕНКА | [white.market](https://white.market/blog/guides/cs2-fade-skins-guide), [hellcase](https://hellcase.com/blog/skinopedia/butterfly-knife-fade-patterns/), [CSBoard](https://csboard.com/en/blog/awp-fade-cs2-trading-guide-float-caps-and-2026-price-ranges) |

### Amber Fade и Acid Fade

| Пункт | Что известно |
|---|---|
| Предметы и износы **[файл]** | **Amber Fade** есть на шести пушках: AUG, Galil AR, MAC-10, Sawed-Off (Mil-Spec), P2000 (Restricted) и R8 (Classified). Float 0–0,40, износы от FN до WW, StatTrak нет. **Acid Fade** — только SSG 08 (Mil-Spec, The Safehouse), float 0–0,03, бывает **только в FN** ([ByMykel](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json)). Откуда берётся P2000, источники расходятся: Dust 2 Collection или сувенирный набор Berlin 2019 ([csgoskins.gg](https://csgoskins.gg/items/p2000-amber-fade), [cs.trade](https://cs.trade/cs2/skins/p2000/amber-fade)). |
| Механика и лучшие номера **[файл]** | Процент считается так же, как у Fade. Пакет chescos поддерживает обе отделки. У всех Amber Fade 100% даёт номер 763. У SSG 08 шкала перевёрнута, но конкретный номер со 100% в заметках не записан. |
| Цены | Данных о наценке за процент не найдено. Скины дешёвые, наценка, видимо, мала, но цифрами это не подтверждено. |
| Шанс крафтом | Обычный контракт своей коллекции. У Amber Fade распределение такое же, как у Glock: ≥99% выпадает с шансом около 6,2% **[файл]**. |

### Doppler и Gamma Doppler (фазы и камни)

| Пункт | Что известно |
|---|---|
| Предметы и износы | Doppler есть на ножах, полный список моделей не подтверждён. Gamma Doppler есть на Bayonet, M9, Karambit, Flip, Gut, Bowie, Falchion, Shadow Daggers, Huntsman и Butterfly, а из пушек — только у Glock-18 (float 0–0,50, включая Emerald). У ножей float 0–0,08, то есть FN и MW ([CSDROP Wiki](https://wiki.csdrop.com/guides/doppler-phases)). |
| Механика | **Фазу задаёт не номер, а отдельный код отделки (paint index)**. У Doppler: Ruby 415, Sapphire 416, Black Pearl 417, фазы P1–P4 — 418–421. У Butterfly и Shadow Daggers свои коды: Black Pearl 617, P2 618, Sapphire 619. У Gamma Doppler на ножах: Emerald 568, P1–P4 — 569–572. У Glock: Emerald 1119, P1–P4 — 1120–1123 ([cspriceapi](https://cspriceapi.com/resources/cs2-doppler-phases-price-guide)). Коды у Talon не выяснены. Номер влияет только на раскладку цветов внутри фазы. Это важно для P2 («Max Pink», «Pink Galaxy») и P4 («Max Blue», «Fake Sapphire»). Один сниппет SteamAnalyst утверждает, что «seed задаёт фазу». Это противоречит остальным источникам. |
| Лучшие номера и споры | Номера отличаются для каждой модели ножа. Пример для M9 P2 Pink Galaxy: 15, 35, 159 ([Steam-гайд](https://steamcommunity.com/sharedfiles/filedetails/?id=3323322399)). Списки, где одни и те же номера даны для разных ножей, считаются ошибочными ([skin.land](https://skin.land/blog/bayonet-doppler-phase-2-patterns-guide/)). Порядок цен по одному гайду: Black Pearl > Ruby > Sapphire > P2 > P4 > P1 > P3 ([SteamAnalyst](https://www.steamanalyst.com/guides/doppler-phases)). |
| Как проверить | Фазу определяют по коду отделки, а не по цвету. Код есть в инспект-ссылке, его можно расшифровать MIT-сериализатором. Возможно, в игре это поле «Finish Catalog», но это наш вывод, он не проверен. |
| Шанс крафтом | Получить можно: к примеру, в списке результатов Butterfly из Spectrum есть все фазы, включая Black Pearl ([white.market](https://white.market/blog/guides/how-to-get-a-butterfly-knife-in-cs2-via-trade-up-complete-2026-guide)). **Как распределяются фазы и камни, Valve не публикует.** Цифра «1–2% на каждый камень» найдена только на сомнительном сайте, её использовать нельзя. |

| Предмет | Цена | Дата | Тип | Источник |
|---|---|---|---|---|
| Butterfly Doppler Ruby FN | последние продажи $9 400–10 200, медиана около $10 190 (40 продаж), лучшая $14 900 | начало–середина октября 2026 | СДЕЛКА-трекер, но ссылка точно не установлена (один из трёх сайтов) | [steamanalyst](https://www.steamanalyst.com/skin/butterfly-knife-doppler-ruby/factory-new) / [csgoskins.gg](https://csgoskins.gg/items/butterfly-knife-doppler-ruby) / [pricempire](https://pricempire.com/cs2-items/skin/butterfly-knife-doppler-ruby) |
| Karambit Doppler FN | P2 около $1 698, Ruby около $7 418, Black Pearl около $8 881, P3 около $1 181 | дата не указана | ЛИСТИНГ/трекер | [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-doppler) |
| Karambit Ruby FN, история цен за 2026 | $6 716,44–9 095,16, максимум 28.02.2026 | 2026 | трекер (не отдельная сделка) | [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-doppler-factory-new-ruby) |
| Karambit Gamma Doppler Emerald FN | максимумы трекеров $8 891,73 (4.04.2026) и $11 150,74 (22.02.2026), сейчас около $6 500–7 500 | 2026 | трекер; какая цифра с какого сайта, точно не установлено | [steamanalyst](https://www.steamanalyst.com/skin/karambit-gamma-doppler-factory-new-emerald), [csmarketcap](https://csmarketcap.com/item/karambit-gamma-doppler-emerald) |
| Emerald против обычных фаз, FN | M9: около $5 740 против $974–1 371; Butterfly: около $7 217 против $1 627–2 069; Shadow Daggers: около $181 против $91–93 | дата не указана | трекер | [M9](https://www.steamanalyst.com/skin/m9-bayonet-gamma-doppler-emerald), [Butterfly](https://www.steamanalyst.com/skin/butterfly-knife-gamma-doppler), [SD](https://www.steamanalyst.com/skin/shadow-daggers-gamma-doppler/factory-new/emerald) |
| Black Pearl дороже Ruby | Paracord: $637 против $501; Skeleton: $2 485 против $2 181 | дата не указана | ЛИСТИНГ | [Paracord](https://www.steamanalyst.com/skin/paracord-knife-doppler), [Skeleton](https://www.steamanalyst.com/skin/skeleton-knife-doppler) |
| Блоги: «Karambit Ruby $12–25 тыс.», «Max Pink P2 +30–60%» | — | без даты | ОЦЕНКА, противоречит трекерам | [skinswap](https://skinswap.com/blog/en/cs2/karambit-doppler-phases-ranked-a-complete-buying-guide-for-2026/), [csgo-guides](https://csgo-guides.com/patterns/doppler) |

Вывод для калькулятора: наценка за камень растёт вместе с ценой ножа. У дешёвых она около 2×, у M9, Butterfly и Karambit — около 4–6×. Один общий множитель на все ножи даст неверные цены.

### Marble Fade (Fire & Ice)

| Пункт | Что известно |
|---|---|
| Предметы и износы **[файл]** | Есть на всех ножах, **кроме Classic и Kukri**, float 0–0,08 (FN и MW). Specialist Gloves Marble Fade — 0,06–0,80, все износы ([ByMykel](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json)). |
| Механика | Процента у этой отделки нет. **Fire & Ice** — когда на видимой стороне только красный и синий, без жёлтого. **Fake F&I** — немного жёлтого, обычно на кончике. **Tricolor** — красный, жёлтый и синий. Тиры обозначают «1st Max», «2nd Max» и так далее ([SteamAnalyst](https://www.steamanalyst.com/guides/fire-ice), [steamdb.com](https://steamdb.com/en/skins/cs2/patterns/marble-fade)). Есть ли настоящий F&I на всех ножах, спорят: SteamAnalyst признаёт его только у Karambit, Flip, Bayonet и Gut. |
| Лучшие номера и споры | Karambit: **#412** — единственный «1st Max». Примеры «2nd Max»: 16, 146, 241 ([csdb.gg](https://csdb.gg/karambit-marble-fade-fire-and-ice-seed-patterns), [profilerr](https://profilerr.net/karambit-fire-and-ice-iconic-cs2-knife-skin/)). Gut: в «1st Max» попадают 412 и 756 ([skin.land](https://skin.land/blog/gut-knife-marble-fade-patterns-guide/)). SteamAnalyst не публикует списки по ножам и предупреждает, что нельзя переносить номера с одного ножа на другой. Ниже второго тира списки разных сайтов расходятся. |
| Как проверить | Сверить номер со списком для конкретной модели ножа и посмотреть предмет глазами в игре. Подписи продавцов «F&I» часто неверны ([eatingwithkirby](https://eatingwithkirby.com/news/marble_fade_guide_cs2.html)). |
| Шанс крафтом | Если нож уже Karambit MF, шанс на #412 около 0,1%. На любой из четырёх верхних тиров (около 31 номера по спискам из сниппетов) — около 3%. |

| Предмет | Цена | Дата | Тип | Источник |
|---|---|---|---|---|
| Talon MF F&I Tier 4 #224 FN | $577,97; медиана $552,25 по 4 продажам (от $514,90 до $577,97) | 2026, точная дата не указана | СДЕЛКА-трекер | [cs2pattern-prices](https://cs2pattern-prices.com/weapons/talon-knife/marble-fade/fire-ice-4) |
| Karambit MF FN | лучшая проданная копия $2 250 (номер неизвестен); самые дешёвые листинги на CSFloat около $887,74 | дата не указана | трекер | [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-marble-fade/factory-new) |
| Karambit MF #412 | оценки $12–19 тыс. Отдельно «около $7 000 MW / $9 999 FN» как рыночные цифры | — | ОЦЕНКА: **ни одной зафиксированной продажи** | [SteamAnalyst](https://www.steamanalyst.com/guides/most-expensive-cs2-skins), [csdb.gg](https://csdb.gg/karambit-marble-fade-fire-and-ice-seed-patterns) |
| Karambit MF #241 | около $4 500, «единичная продажа» | без даты | не проверено | [profilerr](https://profilerr.net/karambit-fire-and-ice-iconic-cs2-knife-skin/) |
| Наценка за F&I | Max/True: +200–400%, Fake: +15–30% (SteamAnalyst); 3–5× (cs2-inventory); «5–10× и больше» (skinswap) | — | ОЦЕНКИ, расходятся | [SteamAnalyst](https://www.steamanalyst.com/guides/fire-ice), [cs2-inventory](https://cs2-inventory.com/en/blog/marble-fade-fire-and-ice-tier-list), [skinswap](https://skinswap.com/blog/en/cs2/the-marble-fade-pattern-system-fire-and-ice-and-beyond/) |

### Crimson Web

| Пункт | Что известно |
|---|---|
| Предметы и износы | Многие ножи: float 0,06–0,80, все износы, есть StatTrak. Также Specialist Gloves и Desert Eagle ([csgoskins.gg](https://csgoskins.gg/items/nomad-knife-crimson-web), [Hotspawn](https://www.hotspawn.com/counter-strike/news/all-pattern-based-cs2-skins)). **Износ здесь важен вдвойне:** чёрная паутина стирается первой, и к середине FT она превращается в серые пятна. Поэтому наценка за номер держится только в FN и в начале MW ([P2Trades](https://www.p2trades.com/guides/crimson-web-patterns)). |
| Механика | Номер определяет, где лежит паутина. На маленьком клинке (Karambit) ценят одну паутину по центру. На больших (M9, Butterfly) — три паутины (triple web). |
| Лучшие номера и споры | **Karambit:** 41 номер в Tier 1, примеры — 390, 515, 964. Трёх паутин на Karambit не бывает ([Pricempire](https://pricempire.com/guides/karambit-crimson-web-guide), [cs2.io](https://cs2.io/en/skins/patterns/crimson-web)). **M9:** около 45 номеров с тремя паутинами. Лучшим Pricempire называет #718, Profilerr — #706 ([Pricempire M9](https://pricempire.com/guides/m9-bayonet-crimson-web-guide), [Profilerr](https://profilerr.net/m9-bayonet-crimson-web-guide/)). **Butterfly:** три паутины, например 686 и 830 ([skin.land](https://skin.land/blog/the-butterfly-knife-crimson-web-pattern-guide/)). |
| Как проверить | «Pattern Template» плюс осмотр в игре. Обязательно смотреть износ. |
| Шанс крафтом | Если нож уже Karambit CW, шанс на Tier 1 около 4,1% (41/1001). Для M9 CW шанс на три паутины около 4,5%. Износ результата предсказуем, поэтому калькулятор может заранее сказать, будет ли паутина видна. |

| Предмет | Цена | Дата | Тип | Источник |
|---|---|---|---|---|
| Butterfly CW FN | медиана $4 250 по 23 продажам на CSFloat; лучшая копия на +18,3% дороже обычной | даты продаж не видны | СДЕЛКИ (сводка трекера) | [SteamAnalyst](https://www.steamanalyst.com/skin/butterfly-knife-crimson-web) |
| M9 CW FN | лучшая $6 850; медиана $5 275,84 по 21 продаже | с марта 2023 по 2026 | СДЕЛКА-трекер, ссылка точно не установлена | [csgoskins.gg](https://csgoskins.gg/items/m9-bayonet-crimson-web) / [steamanalyst](https://www.steamanalyst.com/skin/m9-bayonet-crimson-web/factory-new) |
| Karambit CW FN / StatTrak FN | обычный: $5 495–6 497; StatTrak: от $10 889 до $50 000 (выставленная цена) | около октября 2026 | ЛИСТИНГ | [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-crimson-web) |
| «Центральная паутина на Karambit FN — $10–50 тыс.+» | — | — | ОЦЕНКА; противоречит таблице самого сайта ($7 304 за FN) | [SteamAnalyst](https://www.steamanalyst.com/guides/crimson-web-pattern) |

### Slaughter

| Пункт | Что известно |
|---|---|
| Предметы и износы | Ножи и Hand Wraps. Float 0,00–0,26 (на одной странице 0,01–0,26), поэтому бывают только **FN, MW и FT** ([wiki.cs.money](https://wiki.cs.money/weapons/classic-knife/slaughter)). |
| Механика | Номер определяет, какие фигуры сложатся на видимой стороне: Diamond, Heart, Angel, Phoenix, Zebra, Dogbone и другие. Ценятся фигуры, которые хорошо видны и стоят по центру. |
| Лучшие номера и споры | Все источники ставят на верх Diamond (и Diamond вместе с Heart) ([wiki.cs.money](https://wiki.cs.money/weapons/karambit/slaughter)). Про Angel спорят: CS.MONEY считает его обычным, SteamAnalyst — премиальным ([SteamAnalyst](https://www.steamanalyst.com/guides/slaughter-pattern)). Пример для Karambit: центральный Diamond — 349, 355; Heart — 466, 585 ([skin.land](https://skin.land/blog/full-karambit-slaughter-patterns-guide/)). Номера у каждой модели свои. |
| Как проверить | Номер плюс осмотр глазами: узнать фигуру — дело субъективное ([SteamAnalyst](https://www.steamanalyst.com/tools/pattern-checker)). |
| Шанс крафтом | Около 0,1% на конкретный номер. Сколько всего номеров с Diamond у каждой модели, нигде не посчитано. |

Цены. Обычный Karambit Slaughter на CSFloat выставлен от $968,69 в FN и от $815,87 в MW, около октября 2026 (ЛИСТИНГ, [SteamAnalyst](https://www.steamanalyst.com/skin/karambit-slaughter/factory-new)). Гайд SteamAnalyst оценивает «полностью центральный Diamond» на FN Karambit в +$600–1 200 к цене. Гайду на момент поиска было около 255 дней (ОЦЕНКА, [SteamAnalyst](https://www.steamanalyst.com/guides/slaughter-pattern)). Множители у разных сайтов расходятся: +100–300% у SteamAnalyst и +25–50% у [gratorama](https://gratorama777.com/slaughter-patterns-guide/) (ОЦЕНКИ). **Сделок с конкретным номером не найдено.**

### Tiger Tooth, Lore, Autotronic, Damascus Steel и похожие

| Отделка | Влияет ли номер на вид | Подтверждённая наценка | Источник |
|---|---|---|---|
| Tiger Tooth | Да: у одних номеров широкие частые полосы, у других — оранжевый фон с тонкими линиями (наблюдение времён CS:GO) | Не найдена | [csgoskins.gg](https://csgoskins.gg/items/paracord-knife-tiger-tooth), [cs.money](https://cs.money/blog/cs-go-skins/unique-csgo-shapeshifting-patterns/) |
| Damascus Steel | Да: рисунок ярче, когда линии реже | Не найдена | [csgoskins.gg](https://csgoskins.gg/items/gut-knife-damascus-steel) |
| Autotronic | Нет: на странице Karambit указано «Pattern Variants: No». Цена около $1 413 в FN, дата не указана (ЛИСТИНГ) | Нет | [csgoskins.gg](https://csgoskins.gg/items/karambit-autotronic) |
| Lore | Данных нет | Не найдена | — |
| Freehand | Да: покупатели предпочитают крупный завиток по центру клинка, но это вкус, а не тир-лист | Не найдена | [SteamAnalyst](https://www.steamanalyst.com/guides/freehand) |
| Bright Water, Night, Ultraviolet | По Bright Water есть страницы номеров на pattern.wiki, но по одному гайду такие ножи почти не отличаются друг от друга. По Night и Ultraviolet данных нет | Не найдена | [pattern.wiki](https://pattern.wiki/skin/hy_ocean_knife_90/weapon_knife_butterfly/) |

Для калькулятора честнее всего писать «наценка за номер не задокументирована (октябрь 2026)».

### Перчатки

| Перчатки и отделка | Что ценят | Пример номеров | Источник |
|---|---|---|---|
| Specialist Gloves Crimson Web | центр паутины на обеих перчатках; тир считают по правой | #914 — Tier 1 (Steam-гайд); у CSGUI.DE Tier 1 — #323 | [Steam-гайд](https://steamcommunity.com/sharedfiles/filedetails/?id=2818147579), [CSGUI.DE](https://csgui.de/best-specialist-gloves-crimson-web-patterns-guide/) |
| Specialist Blackbook | символы на обеих руках | #30 («Double Dicky») | [Hotspawn](https://www.hotspawn.com/counter-strike/news/specialist-gloves-blackbook-patterns-guide) |
| Specialist Cloud Chaser | два дракона по центру | #551 | [Hotspawn](https://www.hotspawn.com/counter-strike/news/specialist-gloves-cloud-chaser-patterns-guide) |
| Specialist Big Swell | «максимум жёлтого» | #132 (на трекере есть отдельная страница этого номера, цена не записана) | [cs2pattern-prices](https://cs2pattern-prices.com/weapons/specialist-gloves/big-swell/max-yellow/132) |
| Hand Wraps Overprint | стрелки целиком на костяшках и запястье («Arrow») | — | [csgoskins.gg](https://csgoskins.gg/blog/hand-wraps-overprint-guide-all-rare-seed-patterns) |
| Sport Gloves Ultra Violent / Big Game | максимум фиолетового или голубого / больше оранжевого | — | [Hotspawn](https://www.hotspawn.com/counter-strike/news/sport-gloves-ultra-violent-patterns-guide), [lis-skins](https://lis-skins.com/blog/the-best-sport-gloves-big-game-patterns-guide/) |
| Hydra Gloves Case Hardened | синий | — | [skin.land](https://skin.land/blog/all-best-hydra-gloves-case-hardened-patterns/) |
| Pandora's Box, Vice, Hedge Maze, Specialist Fade, Driver Gloves, Hand Wraps Slaughter | наценка за номер не задокументирована. Про Pandora's Box прямо пишут: «рынка особых паттернов нет», цену определяют модель, отделка и износ | — | [ProSettings](https://prosettings.net/guides/best-cs2-gloves/) |

Цены. **Ни одной продажи перчаток с датой и конкретным номером не найдено.** Для сравнения, как ценой управляет износ: Sport Gloves Pandora's Box FN выставлены примерно за $20–25 тыс. (на HLTV $21 645). При этом CSDB не видит продаж FN за 30 дней, а медиана MW за 30 дней — $5 388 ([CSDB](https://csdb.gg/skin/sport-gloves-pandora-s-box/), [HLTV](https://www.hltv.org/skins/gloves/sport-gloves/pandora's-box), обе цифры — снимки, дата не указана).

Крафт: перчатки можно получить только из обычных, не StatTrak, Covert-предметов. Калькулятор chescos перчатки не поддерживает, потому что их рисунок сдвигается непредсказуемо, как у Case Hardened **[файл]**.

### Прочее: Glock-18 Fade и другие пушки

| Пункт | Что известно |
|---|---|
| Glock-18 Fade | Restricted, The Assault Collection, только FN и MW, StatTrak нет **[файл]**. Лучший номер — **#763**, следом идут 575, 897, 636 ([csgoskins.gg](https://csgoskins.gg/blog/glock-18-fade-percentage-values-seed-patterns)). Из 1001 номера 62 дают 99% и выше. Это совпадает с нашим прогоном chescos **[файл]**. |
| Цены Glock Fade | 99–100%: медиана +26% по 6 продажам; 96–99%: +10% по 3 продажам. Дата не указана (СДЕЛКИ, сводка трекера, [SteamAnalyst](https://www.steamanalyst.com/guides/glock-18-fade)). В блогах встречаются «+100–200%» и «2–3×», но это ОЦЕНКИ без источника ([cs2floatchecker](https://cs2floatchecker.com/blog/cs2-rare-patterns-guide)). |
| Glock-18 Gamma Doppler | Единственная пушка с Gamma Doppler, есть вариант Emerald (коды 1119–1123). Цен на Emerald не найдено. |
| Без подтверждённой наценки за номер | AK-47 Fire Serpent, Desert Eagle Blaze, M4A1-S Printstream, AWP Wildfire, AK Hydroponic. Их цену определяют редкость и износ ([cs2floatchecker](https://cs2floatchecker.com/blog/cs2-rare-patterns-guide)). Для большинства отделок номер «сдвигает текстуру незаметно и ничего не добавляет» ([skinfolio](https://skinfolio.net/guide/patterns)). |

---

## Источники данных: открытый код можно брать, чужие базы — только ссылкой

Коротко. Ключевой открытый код выпущен под MIT. Его можно использовать даже на коммерческом сайте, если сохранить строку копирайта и текст лицензии. У коммерческих баз паттернов открытой лицензии нет. SteamDB прямо запрещает автоматический сбор данных. Условия остальных проверить не удалось, поэтому по умолчанию считаем: «нельзя без письменного разрешения».

| Источник | Что даёт | Условия | Можно / нельзя | Проверено |
|---|---|---|---|---|
| chescos/csgo-fade-percentage-calculator | процент Fade, Amber Fade и Acid Fade по номеру, готовый JSON | MIT, «Copyright (c) 2022 chescos»; последняя версия 2.0.0 вышла 26.10.2025 ([LICENSE](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/LICENSE), [npm](https://registry.npmjs.org/csgo-fade-percentage-calculator)) | **Можно**, с указанием копирайта. Перчатки не поддерживаются | **[файл]** |
| chescos/csgo-blue-gem-calculator | процент синего для Case Hardened и Heat Treated (анализ картинок), готовый JSON | MIT, 2022 ([LICENSE](https://raw.githubusercontent.com/chescos/csgo-blue-gem-calculator/master/LICENSE)) | **Можно**, с указанием копирайта. По сниппету, репозиторий не обновлялся около 448 дней, поэтому новые предметы нужно проверить | **[файл]** лицензия и README |
| ByMykel/CSGO-API и counter-strike-image-tracker | данные игры в JSON (скины, коллекции, диапазоны float, paint_index) и ссылки на картинки на CDN Steam | MIT, 2023 и 2025 ([LICENSE](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/LICENSE)) | **Можно**. Лицензия не распространяется на сами картинки Valve: их показывают ссылкой на CDN Steam, а не перезаливают | **[файл]** |
| csfloat/cs-inspect-serializer | расшифровка инспект-ссылки (номер, износ, код отделки) прямо в браузере, без ботов | MIT ([GitHub](https://github.com/csfloat/cs-inspect-serializer)) | **Можно**. Это самый чистый способ узнать номер предмета пользователя | **[файл]** |
| csfloat/inspect | старый сервис с ботами | MIT, помечен как устаревший: с марта 2026 ссылки содержат данные сами ([README](https://github.com/csfloat/inspect)) | Не нужен | **[файл]** |
| GameTracking-CS2 | зеркало файлов игры (items_game.txt) | файла LICENSE нет, права остаются у Valve ([GitHub](https://github.com/SteamTracking/GameTracking-CS2)) | Факты читать можно, выкладывать файлы целиком не стоит (наш вывод) | **[файл]** |
| Valve Source SDK 2013 | код движка | распространять можно только **бесплатно** и с лицензией Valve ([LICENSE](https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/LICENSE)) | Не копировать в платный продукт | **[файл]** |
| SteamDB (steamdb.info) | цены, история | FAQ запрещает скрейпинг, перепродажу и публикацию данных целиком ([FAQ](https://steamdb.info/faq/)) | **Нельзя** брать данные, можно ставить ссылку. Сайт steamdb.com — **другой**, это сайт про скины, а не SteamDB | сниппет |
| CSFloat | листинги, процент синего и Fade, FloatDB | официальный API с ключом, свои лимиты и ToS; текст о повторном использовании данных не найден ([блог](https://blog.csfloat.com/how-we-serve-over-500-million-float-requests-per-month/)) | Только по их ToS, по умолчанию — ссылкой. По словам стороннего продавца данных, API отдаёт только листинги, без истории продаж ([cs2.sh](https://cs2.sh/csfloat-api)) | сниппет |
| csbluegem | процент синего, история продаж | API есть (неофициальная обёртка csbluegempy), условия не найдены ([docs](https://csbluegempy.readthedocs.io/en/latest/csbluegem.html)) | Без разрешения — только ссылкой | сниппет |
| csdb.gg | процент синего и ранг среди 1000 номеров, инспект-инструмент | ToS не найден ([pattern database](https://csdb.gg/pattern-database/)) | Только ссылкой | сниппет |
| pattern.wiki | для каждого номера сдвиги X и Y и поворот, номера 0–1000 | ToS не проверен ([pattern.wiki](https://pattern.wiki/)) | Только ссылкой | сайт не открылся |
| wiki.cs.money, Buff163 | описания, цены, свой процент Fade | условия не найдены | Только ссылкой. Процент Fade у них отличается от chescos | сайты не открылись |
| Skinport API | цены | часть методов требует ключ, часть публичная; по непроверенным данным Apify, Skinport блокирует IP дата-центров ([PyPI](https://pypi.org/project/skinport)) | Через официальный API по их правилам | сниппет |
| cs2pattern-prices.com | продажи на CSFloat по номеру или тиру, открыто | ToS не проверен | Удобно для ссылок «реальные продажи этого номера». Указывать, что данные вторичные | сниппет |
| SteamAnalyst | медианы продаж по процентам и тирам | ToS не проверен | Только ссылкой | сниппет |
| Steam Web API, Steam Subscriber Agreement | данные Steam | до 100 000 запросов в сутки ([условия](https://steamcommunity.com/dev/apiterms)); контент Steam — для личного некоммерческого использования, если коммерческое не разрешено явно ([SSA](https://store.steampowered.com/subscriber_agreement/)) | При монетизации показать юристу | сниппет |
| Платные продавцы данных: cs2.sh, CSPriceAPI | продажи на CSFloat и Buff с номером (у CSPriceAPI — за последние 72 часа, глубже — по тарифу Enterprise) | платно, по договору ([cspriceapi](https://cspriceapi.com/csfloat-api)) | Можно по договору | сниппет |

**Правовая рамка (это не юридическая консультация).** Сами по себе факты вроде «AK-47 #661 — лучший blue gem» не защищены. Но в ЕС у составителя базы данных есть особое право (sui generis, директива 96/9/EC). Оно запрещает выгружать всю базу или её существенную часть, а также систематически вытягивать её по кусочкам ([Open Rights Group](https://wiki.openrightsgroup.org/wiki/Databases)). Поэтому полные тир-листы csbluegem, csdb.gg и cs2.io копировать рискованно. Числа, которые сайт вычислил сам по MIT-коду, — это его собственные данные. Картинки и текстуры принадлежат Valve. На сайте стоит написать «не связано с Valve».

## Свой расчёт качества номера: Fade — да, синева и паутина — только с текстурами

**Процент Fade можно считать полностью самим.** Номер через открытый генератор случайных чисел задаёт сдвиг и поворот текстуры. Процент — это просто пересчёт поворота в шкалу от 80 до 100%. Игровые файлы для этого не нужны. Можно подключить MIT-пакет chescos, и тогда числа совпадут с CSFloat и Skinport **[файл]** ([BaseCalculator.ts](https://github.com/chescos/csgo-fade-percentage-calculator/blob/master/src/modules/BaseCalculator.ts)).

**Процент синего у Case Hardened и Heat Treated одной математикой не посчитать.** Нужно наложить текстуру Valve на модель и посчитать синие пиксели. Именно так сделан калькулятор chescos blue gem, и csdb.gg тоже меряет по текстуре ([README](https://github.com/chescos/csgo-blue-gem-calculator)). Для сайта проще всего взять готовый MIT-файл с результатами chescos и указать автора. Пересчитать заново может программист, если у него есть игровые файлы. Публиковать при этом можно только итоговые проценты, а не сами текстуры (наш вывод).

**Паутину Crimson Web, Fire & Ice и фигуры Slaughter** тоже можно оценить только через рендер или анализ картинки. Открытого кода для них не найдено.

**Подвох в файлах игры.** В текущем items_game.txt CS2 **нет** полей со сдвигом и поворотом паттерна. Например, у Case Hardened (код aq_oiled) там есть только износ и стиль **[файл]** ([items_game.txt](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/scripts/items/items_game.txt)). Где Valve хранит эти диапазоны в CS2, не установлено. Сейчас их берут из конфигов chescos или pattern.wiki.

**Фаза Doppler** — это не расчёт, а код отделки из инспект-ссылки. Его выдаёт MIT-сериализатор CSFloat.

## Брелоки: номер до 100 000 меняет цвет, цены не подтверждены

Брелоки (charms) появились с The Armory 2 октября 2024 ([SteamAnalyst](https://www.steamanalyst.com/guides/charms-explained)). У каждого есть «Charm Template», и диапазон у него намного шире, чем у номера скина: примерно до 100 000. Начинается ли он с 0 или с 1, официально не сказано. С мая 2026 Steam показывает шаблон брелока в листингах ([анонс Steam](https://steamcommunity.com/games/593110/announcements/detail/673994309884707671)).

У части брелоков шаблон меняет цвет:
- **Baby Karat:** при шаблонах 0–50 000 бывает разных оттенков бронзы, выше — золотой ([SteamAnalyst](https://www.steamanalyst.com/guides/charms-explained));
- **Big Kev:** от розового к фиолетовому около 65 000, голубой от примерно 85 000;
- **Die-Cast AK:** цвет идёт полосами по диапазону, золотой — примерно в 0–10 000. Границы остальных полос у разных источников расходятся ([Hotspawn](https://www.hotspawn.com/counter-strike/news/best-rarest-cs2-charm-patterns-explained), [Steam-гайд](https://steamcommunity.com/sharedfiles/filedetails/?id=3385308903)). Если золото действительно занимает 0–10 000, это около 10% всех шаблонов, а не редкость уровня 0,1%.

Брелоки Souvenir Highlight с мейджора в Остине (2025) несут видеоклип матча, а не цветовой рисунок ([HLTV](https://www.hltv.org/news/41803/valve-introduces-souvenir-highlight-packages-for-austin-major)).

В контрактах обмена брелоки не участвуют. Надёжных данных о ценах на шаблоны нет, а заявления о «сотнях долларов» за крайние шаблоны встречаются только на сомнительных сайтах. Для калькулятора достаточно короткой справки «что значит этот номер».

## Идеи для честного сайта

Ниже — наши выводы, а не чья-то сложившаяся практика.

**Показывать шанс двумя строками.** Первая: «шанс получить этот предмет», вторая: «× N хороших номеров из 1001». Добавить подсказку «шанс хотя бы раз за k контрактов» = 1 − (1 − p)^k. Например, при p = 0,1% за 100 контрактов это около 9,5%. Прямо написать: на номер ничего не влияет, «приёмов прицелиться в номер» не существует.

**Разделять предсказуемое и случайное.** Износ результата посчитать можно, и надо указать, по какой формуле считает сайт: калькуляторы считают по-разному ([CSDelta](https://csdelta.com/blog/cs2-weighted-float-vs-normal-average-trade-ups-2026)). Номер — это чистая случайность. У Crimson Web сразу предупреждать: при прогнозируемом износе FT паутину почти не будет видно.

**Цены — только с меткой и датой.** Метки: «сделка», «продажа по трекеру», «выставлено», «оценка». Отклонённые предложения не называть продажами: Karambit #387 за $1,5 млн так и не был продан. Цены до октября 2025 помечать как «до краха рынка ножей». Для наценки показывать медианы реальных продаж (например, +17% за Fade 99–100%), а не блоговые «+20–50%».

**Тир-листы — со ссылкой на источник и с оговоркой о споре.** Например: «#718 — лучший по Pricempire; Profilerr считает лучшим #706». Не копировать чужие списки целиком: давать несколько номеров и ссылку. Не ставить значок «редкий паттерн!», если за ним нет опубликованного списка.

**Проценты — свои и прозрачные.** Fade и синеву считать по MIT-коду и данным chescos, на странице «Лицензии» указать авторов. Предупреждать, что BUFF и CS.MONEY покажут другой процент Fade. Фазу Doppler определять по коду отделки, а не по цвету.

**Проверка — через Steam и игру.** Давать ссылку на листинг Steam, где с мая 2026 видны Pattern Template и картинка именно этого предмета. Номер брать из инспект-ссылки пользователя, расшифровывая её в браузере. Добавить блок «как не попасться»: не верить скриншотам, потому что их перерабатывают и подделывают, и никогда не открывать осмотр предмета во время висящего предложения обмена ([cs2bonus](https://cs2bonus.com/articles/cs2-fake-low-float-knife-scams), [tradeupacademy](https://tradeupacademy.org/articles/cs2-skin-trading-safety-avoid-scams)).

**Честно показывать пробелы.** Где данных нет — писать «наценка не задокументирована» или «сделок с датой не найдено». Это касается Lore, Autotronic, большинства перчаток и шансов на фазы Doppler. Не стоит заполнять пробелы правдоподобными цифрами.
