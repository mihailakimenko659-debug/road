# SkinSwap (skinswap.com): публичные данные, масштаб, автоматизация сбора

Дата исследования: 2026-10-23. Все обращения к skinswap.com: несколько штук (robots.txt, llms.txt, /ru/trade, /terms, /tos, /sitemap.xml), плюс одна загрузка /ru/trade в headless Chromium (Playwright). Без логина, без Steam, без форм.

Как прошёл прямой доступ (важно для всех разделов ниже):
- `robots.txt` и `llms.txt` отдались нормально (HTTP 200). Страницы `/ru/trade`, `/terms`, `/tos`, `/sitemap.xml` через curl отдали HTTP 403 с заглушкой Cloudflare «Just a moment...». Headless Chromium получил ту же заглушку: «Выполнение проверки безопасности… Этот веб-сайт использует сервис безопасности для защиты от вредоносных ботов», заголовок «Один момент…». Ни одного XHR/JSON/WebSocket-запроса приложения не было видно. Проверено 2026-10-23.
- `llms.txt` прямо требует «Respect authentication, access restrictions, and security challenges. Do not attempt to bypass them». Поэтому stealth-плагины, подмену отпечатков, решение капчи и прочий обход я не пробовал. Сами страницы торговли, их сетевые запросы и ToS я напрямую **не видел**. Всё, что ниже сказано про интерфейс, взято из официального Help Center (intercom.help/skinswap, он открывается) и сторонних обзоров.

---

## 1. Что показывает страница Trade без логина (инвентарь сайта, цены, фильтры, сортировка, лента сделок, история цен)

### Takeaway
Без логина страницу /ru/trade не удалось открыть ни curl, ни headless-браузером: её закрывает JS-челлендж Cloudflare. По официальной справке, Trade состоит из двух панелей: слева инвентарь пользователя (нужен вход), справа склад SkinSwap (CS2/Rust, мгновенные и P2P-предметы, предметы под трейд-локом). У Market есть фильтры по цене, цвету, износу, категории/оружию, а на странице предмета ещё по float и pattern. Публичной ленты недавних сделок и истории цен ни один источник не описывает.

### Cited Findings
- `/ru/trade` отдаёт 403 и заглушку Cloudflare «Just a moment...» для curl и для headless Chromium; title «Один момент…» (проверено 2026-10-23) — [skinswap.com/ru/trade](https://skinswap.com/ru/trade)
- Устройство Trade (официально): «Your inventory on the left / Skins you can trade for on the right». Платить можно скинами, балансом или тем и другим; «SkinSwap will automatically calculate the trade value» — [Help: How to Trade for Skins?](https://intercom.help/skinswap/en/articles/12970916-how-to-trade-for-skins) (статья «Updated over a month ago» на 2026-10-23)
- В правой панели два вида предметов: «Instant items: Delivered immediately through Steam» и «P2P Market items… may take up to 12 hours». У P2P есть отдельный тег («Check the P2P tag») — [там же](https://intercom.help/skinswap/en/articles/12970916-how-to-trade-for-skins)
- В правой панели можно переключаться между инвентарями CS2 и Rust. Вход нужен на первом шаге: «Log in to your SkinSwap account and go to the trade page» — [Help: How to Trade](https://intercom.help/skinswap/en/articles/9641510-how-to-trade) (14.09.2025)
- На странице Trade показаны и предметы со склада под трейд-холдом. Их можно «зарезервировать», тогда после сделки они уходят в Backpack до конца холда: «Ensure that the selected skin is still locked before proceeding… The items below are currently on trade hold» — [Help: How does the backpack work?](https://intercom.help/skinswap/en/articles/9692086-how-does-the-backpack-work) (30.11.2025)
- Фильтры Market (официально): «Price range, Color, Exterior (Factory New, Minimal Wear, etc.), Category & Weapon». «On the item page you can also filter by Float and Pattern». У каждого скина несколько офферов (Instant или P2P) — [Help: How to Buy Skins on the Market](https://intercom.help/skinswap/en/articles/9707179-how-to-buy-skins-on-the-market) (26.03.2026)
- На странице Buy есть фильтр «Filter by game, rarity, or price» — [Help: How to Sell, Trade & Buy Skins](https://intercom.help/skinswap/en/articles/11638842-how-to-sell-trade-buy-skins) (30.11.2025)
- По словам стороннего обзора, в Trade есть «Advanced filters for type, rarity, float range, collection, and stattrak», «Preview tools to inspect wear levels and float value before confirming», а также «Live price tracking synced with third-party API». Там же процитирован отзыв пользователя: «needs more sorting features for float range». Текст рекламный и общий, надёжность низкая — [Back2Gaming](https://www.back2gaming.com/esports/skinswap-review-all-in-one-cs2-rust-skins-trading-platform-analyzed/) (обновлено 04.06.2025)
- По словам обзорщика, после простой регистрации можно смотреть цены, получать котировки ботов и предпросмотр insta-sell. Подключение Steam нужно, чтобы сайт прочитал инвентарь пользователя — [CS2SkinsMarket.gg](https://cs2skinsmarket.gg/reviews/skinswap) (обновлено 03.09.2026)

### Inferences
- Склад сайта (правая панель), скорее всего, рендерится клиентским JS из внутреннего API. Это вероятно, потому что robots.txt закрывает `/api/` (см. раздел 4), но сам API я не видел.
- Публичной истории цен на стороне SkinSwap не нашлось ни в справке, ни в обзорах. Скорее всего, её нет: цена задаётся внутренним алгоритмом (раздел 6).

### Gaps
- Видна ли правая панель (склад и цены) анонимному посетителю в обычном браузере, проверить не удалось: Cloudflare. Обзоры это прямо не описывают.
- Набор сортировок (цена ↑/↓, float и т.п.) официально не задокументирован.
- Отображается ли на сайте лента «последних сделок» (live feed), не нашёл ни в одном источнике.

---

## 2. Оборот и масштаб: объёмы, пользователи, сделки, склад, трафик

### Takeaway
SkinSwap сам не публикует проверяемых цифр оборота. Лучший доступный ориентир для масштаба — оценки трафика и данные агрегаторов о складе. Трафик: около 0,9–1,35 млн визитов в месяц летом–осенью 2026 по Semrush и обзорам, но есть оценки и в разы ниже. Склад: около 31–37 тыс. уникальных предметов и сотни тысяч офферов по csmarketcap (октябрь 2026). Цифры про 680 тыс. пользователей и 480 тыс. сделок из одного обзора не проверены.

### Cited Findings
**Компания**
- Оператор DES Labs, LLC, Glen Allen, Virginia, US. Ключевое лицо: Andrew Donald Pomeroy. Дата основания на csmarketcap: 01-08-2021 — [csmarketcap.com](https://csmarketcap.com/markets/skinswap) (на 2026-10-23); то же оператор и лицо у [RiskySkins](https://riskyskins.com/markets/skinswap/) (24.04.2026)
- Год основания расходится: 2018 у [CSDB.gg](https://csdb.gg/trading-site/skinswap/) (проверено 13.07.2026); «founded in 2019, the platform launching May 15, 2021» у [Fairness.gg](https://fairness.gg/reviews/skinswap/) (обновлено 08.2026); 2022 у [CS2SkinsMarket.gg](https://cs2skinsmarket.gg/reviews/skinswap); 2021 у [SIH](https://sih.app/best-cs2-marketplace) (15.08.2026) и [SkinLords](https://skinlords.com/review/skinswap/) (09.07.2026). По BetterGamer, возраст домена с 2016 года — [BetterGamer](https://bettergamer.com/compare/sites/skinswap)
- В подвале справки указаны контакты: support@skinswap.com, +1 (804) 420-9632 — [Help Center](https://intercom.help/skinswap/en/)

**Трафик (оценки, не данные сайта)**
- Semrush, сентябрь 2026: 1,34 млн визитов (+11,81% к августу); август 1,2 млн, июль 1,35 млн. 3,75 страницы за визит, средняя сессия 06:40, отказы 41,78%. Глобальный ранг 40 283. Страны: США 16,58% (~221,5 тыс.), Литва 6,25%, Германия 5,7%, Алжир 5,5%, Польша 4,78%. На десктопе 82,5% прямых заходов, 7,47% с google.com — [Semrush](https://it.semrush.com/website/skinswap.com/overview) (обновлено 13.10.2026)
- По сниппету поиска, более ранний срез Semrush (обновлён 13.12.2025) давал около 1,06 млн визитов за ноябрь 2025, около 857,5 тыс. за октябрь и около 371,6 тыс. за сентябрь 2025. Страницу этого среза я не открывал — [Semrush](https://it.semrush.com/website/skinswap.com/overview)
- Fairness.gg приводит ряд месячных визитов: 07.2025 334 400; 08.2025 356 200; 09.2025 371 600; 02.2026 865 100; 05.2026 1 840 000; 06.2026 980 000; 07.2026 946 000; 08.2026 1 005 000 — [Fairness.gg](https://fairness.gg/reviews/skinswap/) (обновлено 08.2026)
- Другие оценки: 923 тыс./мес. у [BetterGamer](https://bettergamer.com/compare/sites/skinswap) (2026, без точной даты); 859 900 у [RiskySkins](https://riskyskins.com/markets/skinswap/) (24.04.2026); 480 000 у [SIH](https://sih.app/best-cs2-marketplace) (15.08.2026); 366 400 у [CS2SkinsMarket.gg](https://cs2skinsmarket.gg/reviews/skinswap) (обновлено 03.09.2026, цифра, похоже, старая); 61 762 у [csmarketcap](https://csmarketcap.com/markets/skinswap) (2026-10-23, методика явно другая)

**Склад, офферы и стоимость**
- csmarketcap на 2026-10-23: Items 36 761 «(80%)», Offers 897 430, «Average discount −30% compared to Steam», «Market fee 0%». Во встроенных данных страницы есть дневной ряд за 23.09–22.10.2026. Уникальных предметов там 36 743–36 760. Офферов от ~331 тыс. (14.10) до ~959 тыс. (07.10), на 22.10.2026 их 907 007. Поле суммы стоимости (`price_sum`) указано без единиц и сильно колеблется — [csmarketcap.com](https://csmarketcap.com/markets/skinswap)
- RiskySkins пишет: «$185 million in total listed value, with 6.3 million individual offers spread across roughly 31,000 items», средняя скидка 33,3% к Steam Market, «второй по размеру склад» среди CS2-площадок — [RiskySkins](https://riskyskins.com/markets/skinswap/) (24.04.2026)
- SIH: «around 31,400 active listings» — [SIH](https://sih.app/best-cs2-marketplace) (15.08.2026)
- В сниппетах поиска встречались ещё «$150.5 million across 3.8 million listed offers» и «$55.9M». Источники этих цифр я не открыл и не проверил.

**Пользователи и сделки**
- Fairness.gg: «over 680,000 total users, processing 480,000+ trades and 500,000+ items sold to date». Там же своя разбивка трафика: США 45%, Великобритания 15%, Канада 12%, Австралия 10%, Германия 8%. Откуда эти цифры, обзор не говорит. Разбивка по странам противоречит Semrush (США 16,58%) — [Fairness.gg](https://fairness.gg/reviews/skinswap/) (обновлено 08.2026)
- По словам SkinLords, сайт «serves millions of customers annually». Цифра голословная — [SkinLords](https://skinlords.com/review/skinswap/) (09.07.2026)

**Отзывы (Trustpilot, по пересказу третьих сайтов, сам Trustpilot отдал 403)**
- 4.1/5 по 1 795 отзывам (проверено 01.07.2026) — [CS2.io](https://cs2.io/en/markets/skinswap); 4.1–4.3 (13.07.2026) — [CSDB.gg](https://csdb.gg/trading-site/skinswap/); 4.3 по 2 151+ — [SIH](https://sih.app/best-cs2-marketplace) (08.2026); 3.8 по 1 700 — [RiskySkins](https://riskyskins.com/markets/skinswap/) (04.2026); 4.3 по 1 649 — [Fairness.gg](https://fairness.gg/reviews/skinswap/); 4.0 по 1 693 (сниппет, без даты) — [ca.trustpilot.com](https://ca.trustpilot.com/review/skinswap.com)
- BetterGamer: 2.3K отзывов; «Answered 100% of 144 negative reviews, avg 2.8 days»; ~4,9% отзывов сообщают о серьёзной проблеме. За последние 90 дней: 4 жалобы на мошенничество (последняя 25.09.2026) и 1 на «Paid but not delivered» (29.08.2026) — [BetterGamer](https://bettergamer.com/compare/sites/skinswap)

### Inferences
- По Semrush, рост трафика примерно с 0,35 млн (осень 2025) до 1,2–1,35 млн (лето–осень 2026) идёт одновременно с запуском Market/P2P (статьи справки датированы 2025–2026). Это корреляция, причинность не доказана.
- У csmarketcap «Items 36 761 (80%)», вероятно, означает долю покрытия каталога CS2 (уникальные market_hash_name). Размах офферов (330–960 тыс. за месяц) указывает, что считаются и P2P-офферы внешних продавцов, а их число сильно колеблется. Это моя интерпретация, методика на странице не описана.
- Разница между 6,3 млн офферов (RiskySkins, апрель) и ~0,9 млн (csmarketcap, октябрь) скорее объясняется разной методикой агрегаторов, чем реальным сокращением склада.

### Gaps
- Официальных данных об объёме сделок (GMV), числе пользователей и сделок в день не нашёл: ни пресс-релизов, ни интервью. Интервью основателя не найдено.
- Similarweb для skinswap.com не получен.
- Оригинал Trustpilot не открылся (403). Рейтинги взяты из пересказов.

---

## 3. Видно ли недавно проданные/обменянные предметы и историю

### Takeaway
Ни один источник не подтверждает публичную ленту сделок или историю продаж SkinSwap. Свою историю транзакций пользователь видит в аккаунте (нужен вход). Косвенно «что ушло со склада» можно оценивать только по изменению наличия, у самого сайта или у агрегаторов.

### Cited Findings
- В справке есть отдельная статья «Creating Your Account, Connecting Discord & Viewing Transactions»: просмотр транзакций привязан к аккаунту — [Help Center, коллекция Account](https://intercom.help/skinswap/en/) (оглавление на 2026-10-23)
- После сделки пользователя направляют на «completion page», где можно оставить отзыв. О публичности сделок ничего не сказано — [Help: How to Trade](https://intercom.help/skinswap/en/articles/9641510-how-to-trade)
- Обзор Back2Gaming упоминает «Live trade offers filtered by value, condition, and popularity» и публикацию победителей розыгрышей («winners are published publicly»). Это не лента сделок, источник ненадёжный — [Back2Gaming](https://www.back2gaming.com/esports/skinswap-review-all-in-one-cs2-rust-skins-trading-platform-analyzed/) (06.2025)
- csmarketcap публикует дневную историю числа офферов и уникальных предметов SkinSwap (ряд за 30 дней виден на публичной странице, есть переключатели 7D/1M/3M/All). Это наличие, а не продажи — [csmarketcap.com](https://csmarketcap.com/markets/skinswap)

### Inferences
- Продажи можно грубо оценивать по исчезновению конкретных офферов между снимками склада. Но офферы исчезают и по другим причинам: P2P-продавец снял предмет, бот перенёс его, сменилась цена. Метод даёт верхнюю оценку и шумит.

### Gaps
- Есть ли на сайте виджет «последние сделки» и сколько записей он показывает, проверить не удалось (Cloudflare). В обзорах этого нет.

---

## 4. Публичный API, JSON/WebSocket фронтенда, robots.txt, ToS и llms.txt

### Takeaway
Публичного документированного API у SkinSwap нет. `robots.txt` запрещает `/api/`, а весь фронт закрыт JS-челленджем Cloudflare. Эндпоинты фронтенда обнаружить не удалось. `llms.txt` требует от агентов идентификации и запрещает обходить защиту. Условия использования лежат на `/tos`, но тоже закрыты Cloudflare, поэтому формулировки о скрейпинге не проверены.

### Cited Findings
- `robots.txt` (2026-10-23): для всех агентов `Allow: /`, но `Disallow: /api/`, `/?search=`, `/cdn-cgi/`, реферальные пути `/r/*` и `/*/r/*`. Sitemap указан на `/sitemap.xml`, но сам он отдал 403. Первая строка отсылает к `llms.txt` («Automated agent guidance») — [robots.txt](https://skinswap.com/robots.txt)
- `llms.txt` (2026-10-23) требует от автоматических клиентов:
  - описательный User-Agent с URL оператора;
  - заголовок `X-Device-Signature`: base64-JSON с публичным IP оператора, моделью устройства и «salted hash of their primary email address»;
  - при работе через прокси заголовок `X-RealIp` с реальным IP хоста.

  Там же: «Respect authentication, access restrictions, and security challenges. Do not attempt to bypass them», «Keep request concurrency low», «Honor Retry-After… Back off on HTTP 429», «Identification does not grant additional access privileges or exemptions» — [llms.txt](https://skinswap.com/llms.txt)
- Условия использования находятся на `https://skinswap.com/tos` (ссылку даёт BetterGamer). Прямой запрос вернул 403 (Cloudflare). BetterGamer цитирует из них: «SkinSwap is a brand name of DES Labs, LLC.» и «With the reversal option being introduced, SkinSwap might hold on to your payment until the 7-day period expires.» — [BetterGamer](https://bettergamer.com/compare/sites/skinswap); [skinswap.com/tos](https://skinswap.com/tos)
- Headless Chromium остановился на заглушке Cloudflare. Ни одного XHR/fetch/WebSocket-запроса приложения не появилось (2026-10-23) — [skinswap.com/ru/trade](https://skinswap.com/ru/trade)
- Поиск «skinswap api github prices endpoint» не дал ни официальной документации, ни сторонних обёрток. Нашлись только статья справки о ценообразовании и чужие ценовые API (CSPriceAPI, Skinbase) — веб-поиск 2026-10-23
- Сторонние агрегаторы показывают цены и количество офферов SkinSwap по предметам. Pricempire (по сниппету) на одном souvenir-предмете показывает «SkinSwap CN» с 42 листингами по $69.14. Steam Dashboard (steamdb.com, это **не** SteamDB.info) пишет на Bayonet Doppler Phase 1: «Melhor preço SkinSwap 19 ofertas 356,96 €» (26.06.2026) — [Pricempire](https://pricempire.com/item/Souvenir%20FAMAS%20%7C%20Waters%20of%20Nephthys%20%28Minimal%20Wear%29); [steamdb.com](https://steamdb.com/pt-PT/skins/cs2/knives/bayonet-doppler-phase-1)
- csmarketcap рекламирует у себя «Listings search: Every live listing by float, pattern and stickers». Входит ли туда SkinSwap, не указано — [csmarketcap.com](https://csmarketcap.com/markets/skinswap)

### Inferences
- Раз агрегаторы показывают цены и количество офферов SkinSwap по предметам, у них есть машинный доступ к складу. Это может быть партнёрский фид или собственный сбор. Открытого публичного фида я не нашёл, так что для практической работы проще брать данные о SkinSwap у агрегаторов (Pricempire, csmarketcap, SIH), а не с самого сайта.
- Требования `llms.txt` (передавать IP оператора и хеш его email) избыточны по приватности и не стандартны. Я эти заголовки не отправлял: это раскрыло бы данные пользователя.
- Прямой автоматический сбор с skinswap.com идёт против явных сигналов сайта: `Disallow: /api/`, челлендж Cloudflare и запрет обхода в `llms.txt`. Остаётся ручная работа в обычном браузере.

### Gaps
- Пути, поля, пагинация и лимиты внутреннего API неизвестны: фронтенд не загрузился.
- Текст ToS о ботах, скрейпинге и автоматизации не прочитан: `/tos` и `/terms` отдали 403, в поиске формулировок не нашлось.
- Rate limits (429/Retry-After) не измерялись.

---

## 5. Данные по предмету: цена, float, paint seed/pattern, Doppler phase, стикеры, брелоки, трейд-лок, переплата, скриншоты/inspect

### Takeaway
Официально подтверждены цена по каждому офферу (Instant или P2P), фильтры по float и pattern на странице предмета в Market и показ трейд-холда (locked-предметы, Backpack). Про фазы Doppler, стикеры, брелоки, inspect-ссылки и скриншоты в официальных источниках ничего нет. Переплату за float/паттерн сайт не раскрывает: алгоритм цены закрыт.

### Cited Findings
- Цена и офферы: «Each skin listing shows multiple offers», виды доставки ⚡ Instant и P2P — [Help: How to Buy Skins on the Market](https://intercom.help/skinswap/en/articles/9707179-how-to-buy-skins-on-the-market) (26.03.2026)
- Float и pattern: «On the item page you can also filter by Float and Pattern» — [там же](https://intercom.help/skinswap/en/articles/9707179-how-to-buy-skins-on-the-market)
- Трейд-лок: предметы склада под холдом отображаются как locked, их можно забрать в Backpack и вывести «once the trade hold is lifted» — [Help: Backpack](https://intercom.help/skinswap/en/articles/9692086-how-does-the-backpack-work)
- В инвентаре пользователя неприемлемые предметы помечены «Not Accepted» (серым). Причины: переизбыток на складе, волатильность цены, борьба со злоупотреблениями, низкая стоимость — [Help: Item not accepted](https://intercom.help/skinswap/en/articles/9707755-item-not-accepted) (02.04.2025)
- Цена задаётся внутренним алгоритмом (тренды, спрос и предложение, стабильность цены). «We do not disclose the exact algorithms or factors used in our pricing model» — [Help: Pricing on items](https://intercom.help/skinswap/en/articles/9707794-pricing-on-items) (20.08.2024)
- Float в превью и фильтр по StatTrak упоминаются только в рекламном обзоре — [Back2Gaming](https://www.back2gaming.com/esports/skinswap-review-all-in-one-cs2-rust-skins-trading-platform-analyzed/) (06.2025)
- Фазы Doppler как отдельные позиции SkinSwap видны у агрегатора: на странице Bayonet Doppler Phase 1 есть 19 офферов SkinSwap. Отсюда следует, что фаза различается хотя бы на уровне цены — [steamdb.com (Steam Dashboard)](https://steamdb.com/pt-PT/skins/cs2/knives/bayonet-doppler-phase-1) (26.06.2026)

### Inferences
- Раз есть фильтры float и pattern, у каждого оффера на странице предмета должны храниться float и paint seed.
- Цена, судя по описанию алгоритма, устанавливается для market_hash_name (плюс, по агрегаторам, фаза). Отдельную надбавку за конкретный float или паттерн официальные источники не упоминают. Есть ли она, неизвестно.

### Gaps
- Отображение стикеров (и их износа), брелоков, inspect-ссылок, скриншотов или 3D официально не подтверждено ни одним источником.
- Есть ли надбавка за низкий float, редкий паттерн или стикеры и как она считается, неизвестно.

---

## 6. Комиссии и бонусы (как опубликовано)

### Takeaway
Официально заявлены 0% за продажу, «минимальная» комиссия на обмен и покупку, которая зависит от предмета и не раскрыта, 1% за P2P-покупку на Market и около $0.25 за вывод через PayPal/Venmo. Бонусы: +40% к депозиту (только на балансе Trade), Vault после 4 сделок, бесплатный предмет за реф-код. Независимые тесты оценивают спред на покупку в 10–14%, а insta-sell примерно в 55–62% от стоимости. Цифры обзоров заметно расходятся.

### Cited Findings
**Официально**
- «0% fee on selling skins». Комиссия на обмен и покупку «may vary depending on the specific skin… automatically calculates the fee». Вывод через PayPal и Venmo: «estimated fee of $0.25 per transaction». Вывод в крипте (LTC, BTC, ETH): сетевой газ — [Help: Understanding Fees](https://intercom.help/skinswap/en/articles/9703659-understanding-fees-deposits-and-withdrawals) (14.09.2025)
- Market: Instant «No fees»; P2P «1% fee applies. Seller has up to 12 hours». Если продавец не передал предмет, деньги автоматически возвращаются на баланс в течение 12 часов — [Help: Market](https://intercom.help/skinswap/en/articles/9707179-how-to-buy-skins-on-the-market) (26.03.2026)
- Способы выплаты при продаже: PayPal, LTC, BTC, ETH, USDC, USDT, SEPA, PIX, банковский перевод, Venmo. Пример комиссии PayPal: $0.30. Деньги приходят после 7-дневного периода — [Help: How To Sell](https://intercom.help/skinswap/en/articles/9707247-how-to-sell)
- Депозит: пакеты с бонусом («deposit $25 and receive $35 total balance»); карты/фиат, крипта через NowPayments, подарочные карты — [Help: How To Deposit](https://intercom.help/skinswap/en/articles/9707040-how-to-deposit) (26.02.2026)
- Бонус 40%: «Trade balance = Market balance x 1.4, always». Бонус существует только как множитель на странице Trade — [Help: Market and Trade Balances](https://intercom.help/skinswap/en/articles/17158124-understanding-your-market-and-trade-balances)
- Vault: часть стоимости каждой сделки выше $10 (по site value) идёт в Vault. После 4 таких сделок можно забрать бесплатный скин на сумму накопленного, остаток зачисляется на баланс — [Help: Vault](https://intercom.help/skinswap/en/articles/12541876-how-the-vault-reward-system-works) (26.02.2026)
- Бесплатный предмет за реф-код (по умолчанию `SWAP`). Сделка в течение 24 часов на $10 / $50 / $100 / $250 даёт предмет до $1 / $7.50 / $20 / $50. Покупки (BUY) не засчитываются — [Help: Free Item](https://intercom.help/skinswap/en/articles/10910956-how-to-claim-a-free-item-using-an-affiliate-code-on-skinswap) (01.12.2025)
- Steam Trade Protection: CS-баланс включает escrow-баланс. Если отменить CS-трейд в 7-дневное окно, кредит снимается, а аккаунт банится на 30 дней. Кросс-обмен CS↔Rust отключён — [Help: Steam Trade Protection](https://intercom.help/skinswap/en/articles/11841490-steam-trade-protection-what-it-means-for-your-balance) (01.12.2025)

**Сторонние оценки (расходятся)**
- Тесты 4–6.10.2025: спред покупателя 10–14% ($5 → 10%, $55 → 12%, $200 → 14%, $700 → 14%). Insta-sell около 55–62% стоимости, в среднем ~60%. Вывод: PayPal 2% + $0.25, Venmo 2% + $0.25, Prepaid 3.4% + $3, BTC $0.93, ETH/USDT/USDC (ERC-20) $0.05, LTC $0. В шапке той же страницы стоят противоречащие тексту «Trading fee 40%» и «Instant-sell rate 70%» — [CS2SkinsMarket.gg](https://cs2skinsmarket.gg/reviews/skinswap)
- Эффективная маржа покупателя ~10–14% при рекламе «0% fee» — [CSDB.gg](https://csdb.gg/trading-site/skinswap/) (13.07.2026)
- Seller (insta-sell) 35%, buyer 12%; PayPal/Venmo 2% + $0.25; депозит картой/CashApp ~$0.30; крипта и подарочные карты 0% (проверено 01.07.2026) — [CS2.io](https://cs2.io/en/markets/skinswap)
- Instant Sell Fee 45%, Marketplace Fee 11%, Deposit ~2%, Trade Fee 16%. «40% Deposit Bonus» — [Fairness.gg](https://fairness.gg/reviews/skinswap/) (08.2026)
- «45% seller fee» — [RiskySkins](https://riskyskins.com/markets/skinswap/) (04.2026); «5% seller fee» — [SkinLords](https://skinlords.com/review/skinswap/) (07.2026). Цифра SkinLords противоречит остальным.
- Официальная оценка вывода через PayPal/Venmo ($0.25) расходится с обзорами (2% + $0.25).

### Inferences
- Основной доход SkinSwap, похоже, спред между ценой покупки у пользователя и ценой продажи из склада, а не явная комиссия. Бонус +40% на балансе Trade фактически действует как скидка на обмен, частично перекрывающая этот спред.

### Gaps
- Официальной таблицы комиссий на обмен и покупку по ценовым диапазонам нет. Правила начисления Vault (какой процент) не раскрыты.

---

## 7. Можно ли автоматизировать сбор или облегчить ручной поиск; реалистичность агрегированной статистики

### Takeaway
Прямой автоматический сбор с skinswap.com практически закрыт (Cloudflare, `Disallow: /api/`) и явно нежелателен для сайта (запрет обхода в `llms.txt`). Реалистичные пути — ручной поиск в браузере (фильтры float/pattern на странице предмета в Market) и данные агрегаторов о складе SkinSwap. Статистику продаж честно построить нельзя: публичной истории сделок нет. Наличие и цены по снимкам — можно.

### Cited Findings
- Технические и формальные барьеры: 403 и челлендж Cloudflare на страницах торговли, `Disallow: /api/`, требования `llms.txt` об идентификации и запрет обхода — [robots.txt](https://skinswap.com/robots.txt); [llms.txt](https://skinswap.com/llms.txt) (2026-10-23)
- Ручной поиск: фильтры Market по цене, цвету, износу, категории/оружию, на странице предмета по float и pattern — [Help: Market](https://intercom.help/skinswap/en/articles/9707179-how-to-buy-skins-on-the-market)
- Готовые агрегаты: дневной ряд уникальных предметов и офферов SkinSwap на csmarketcap (7D/1M/3M/All) — [csmarketcap.com](https://csmarketcap.com/markets/skinswap). Количество и цены офферов SkinSwap по предметам на Pricempire и Steam Dashboard — [Pricempire](https://pricempire.com/item/Souvenir%20FAMAS%20%7C%20Waters%20of%20Nephthys%20%28Minimal%20Wear%29); [steamdb.com](https://steamdb.com/pt-PT/skins/cs2/knives/bayonet-doppler-phase-1)
- Склад SkinSwap хранится на Steam-ботах (мгновенная доставка через Steam), а продавцы при продаже проверяют уровень, имя и дату регистрации бота — [Help: How To Sell](https://intercom.help/skinswap/en/articles/9707247-how-to-sell); [Help: What Is SkinSwap](https://intercom.help/skinswap/en/articles/11638839-what-is-skinswap-how-it-works)

### Inferences
- Что реально можно посчитать, не нарушая сигналы сайта:
  - число офферов и уникальных предметов во времени (готовый ряд csmarketcap);
  - цены SkinSwap по предметам в сравнении с другими площадками (Pricempire/SIH);
  - отдельные срезы по float и паттерну, но только вручную на странице предмета.
- Нельзя корректно получить: объём продаж, число сделок, историю цен самого SkinSwap и поштучный float/seed по всему складу. Для последнего нужен внутренний API, а он закрыт.
- Теоретически склад виден через публичные Steam-инвентари ботов SkinSwap. Но их Steam ID нигде публично не перечислены, а P2P-офферы на ботах не лежат, так что картина была бы неполной. Этот путь я не проверял.

### Gaps
- Есть ли у SkinSwap партнёрский или аффилиатский фид цен, которым пользуются агрегаторы, публично не описано. В справке есть только коллекции «Affiliate and Referral System» и «Partnerships and Sponsorships» без технических деталей.
