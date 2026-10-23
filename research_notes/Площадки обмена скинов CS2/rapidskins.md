# RapidSkins (rapidskins.com): какие данные открыты публично, оборот, автоматизация сбора

Как собирались данные: 23.10.2026, без входа в аккаунт. Открыты /trade, /buy, /races (headless Chromium + Playwright, перехват сетевых запросов), robots.txt, sitemap.xml, ToS, API Terms, FAQ, блог, публичная OpenAPI-спецификация, Trustpilot и агрегаторы отзывов. Сделано около 30 запросов к HTML-страницам и API с паузами. Плюс разово скачаны статические JS-чанки фронтенда (~134 файла с CDN), чтобы найти названия полей фильтров. Код и базы не копировались. Цены в API указаны в центах USD.

## 1. Что показывает /trade без входа

### Takeaway
Без входа /trade показывает **весь сток сайта** (CS2 + Rust): цены, скидку за «старение» лота, бейдж трейд-лока, фильтры и 7 вариантов сортировки. При наведении на карточку видны float, paint seed, ссылка на Steam и Inspect. Своя половина («You Offer») требует входа через Steam. Ленты недавних сделок и истории цен на странице нет.

### Cited Findings
- Страница разделена на «You Offer» и «You Receive». В левой части без входа стоит заглушка «Log in to view your Steam items and trade your skins». Правая часть («You Receive», сток сайта) видна полностью — [rapidskins.com/trade](https://www.rapidskins.com/trade) (наблюдение 23.10.2026).
- Элементы управления правой части: переключатель игры (All / CS2 / Rust), сортировка, поиск «Search for items», кнопка REFRESH. В центральной панели фильтры: Price (диапазон), Category, Paint Family, Item. Сверху навигация по категориям: Rifles, Pistols, Close Quarters, Heavy Weapons, Headwear, Chestwear, Bottoms, Accessories, Tools, Explosives и другие (в основном категории Rust) — [rapidskins.com/trade](https://www.rapidskins.com/trade).
- Варианты сортировки: Price: High, Price: Low, Biggest Discount, Float: Low, Float: High, Unlocks Soon, Newest — [rapidskins.com/trade](https://www.rapidskins.com/trade) (выпадающее меню, 23.10.2026).
- Карточка лота показывает: износ (FN/MW/FT/WW/BS) и пометку ST™, название, фазу Doppler/Gamma Doppler («Doppler - P1», «Ruby»), цену в USD, процент скидки (например −1.5%), количество для стаковых Rust-предметов. На /buy у части лотов есть бейдж срока трейд-лока (например «5 days») — [/trade](https://www.rapidskins.com/trade), [/buy](https://www.rapidskins.com/buy).
- При наведении на карточку CS2 появляется панель: Paint Seed (например 908), полоса float с точным значением (например 0.0067003141…), кнопки STEAM и INSPECT — [/trade](https://www.rapidskins.com/trade) (скриншот 23.10.2026).
- Самые дорогие лоты на 23.10.2026: ★ M9 Bayonet Doppler Ruby (MW) $6 408.91, ★ ST Butterfly Gamma Doppler P2 (FN) $1 950.73, ★ Butterfly Fade (FN) $1 828.84, Sticker s1mple (Gold) London 2018 $1 450.42 — [/trade](https://www.rapidskins.com/trade).
- Клик по лоту без входа кладёт его в локальную корзину («$6,392.64 Saving $113.86»). Сделки при этом не происходит — [/trade](https://www.rapidskins.com/trade).
- Площадка — прямой выкуп и продажа со своего стока, а не P2P-маркет: «the exchange of the Items can be made between the users and RapidSkins, in which case, RapidSkins will obtain ownership» — [Terms](https://www.rapidskins.com/terms) (Last updated: March 25, 2026).

### Inferences
- Историю цен, график продаж и «последние сделки» в интерфейсе /trade, /buy я не нашёл. Видна только текущая цена стока.
- Поддерживаются только две игры, CS2 (appId 730) и Rust (252490). Это видно из перечисления в API.

### Gaps
- Как оценивается сторона «You Offer» (по цене выкупа или по цене продажи, есть ли бонус за трейд) — без входа не видно.

## 2. Оборот и масштаб: опубликованные цифры

### Takeaway
Независимых данных об обороте нет. Сайт сам заявляет «200K+ пользователей», «$15M+ exchanged» и «250K+ транзакций» с 2022 года. Публичных оценок трафика (Similarweb/Semrush) я не нашёл.

### Cited Findings
- «Since launch, the platform has grown to over 200,000 registered users, $15M+ total exchanged, and over 250K total transactions» — [FAQ: Is RapidSkins legit?](https://www.rapidskins.com/faq/is-rapidskins-legit) (страница открыта 23.10.2026; дата на странице не указана).
- Те же цифры (200K+ users, 250K+ transactions, $15M+ под руководством CEO Jack Flux) — [блог «Is RapidSkins Legit?»](https://www.rapidskins.com/blog/is-rapidskins-safe-and-legitimate) (published March 4, 2026); [блог RapidSkins vs Skinport](https://www.rapidskins.com/blog/rapidskins-vs-skinport) (published March 18, 2026).
- «Join 200K+ registered users already being paid» — плашка на всех страницах FAQ, например [faq/api-access](https://www.rapidskins.com/faq/api-access) (23.10.2026).
- Компания: RAPIDSKINS LTD, Англия и Уэльс, company number 12336425, 23 Severn Road, Hallen, Bristol, BS10 7RZ — [Terms](https://www.rapidskins.com/terms). Основана в 2022 году — [FAQ legit](https://www.rapidskins.com/faq/is-rapidskins-legit). Pricempire, по пересказу поисковой выдачи, называет 2020 год. Сам Pricempire отдал 403, проверить не удалось — [pricempire.com](https://pricempire.com/cs2-marketplaces/rapidskins).
- На странице Races: «We've Given Away $61,768.75» (сумма выданных призов в лидербордах). Сейчас лидеры недели: 352 813 / 207 431 / 194 848 очков, призы $28 / $17 / $12 — [rapidskins.com/races](https://www.rapidskins.com/races) (23.10.2026).
- Trustpilot: TrustScore 4.1, 357 отзывов, 44 отзыва за последние 12 месяцев, 5★ — 82%, 4★ — 6%, 3★ — 2%, 2★ — <1%. Профиль «Claimed • Jun 2022», компания отвечает на 70% негативных отзывов. Trustpilot отмечает «No recent history of asking for reviews» — [trustpilot.com/review/rapidskins.com](https://www.trustpilot.com/review/rapidskins.com) (23.10.2026). Сам сайт в футере пишет «4.3/5 · 347+ reviews», то есть старее и выше текущего значения — [/trade](https://www.rapidskins.com/trade).
- Агрегатор steamdb.com (не путать с SteamDB.info) на 1 июля 2026: Trust score 4.3/5 (343) — [steamdb.com/en/markets/rapidskins](https://steamdb.com/en/markets/rapidskins).
- Косвенный признак объёма закупки. В выдаче сортировки «Newest» на 23.10.2026 (14:00 UTC) у лотов, поступивших в сток в тот же день, createdAt стоит в часы 07, 10, 12, 13 UTC. В одной выдаче (50 описаний) более 60 ассетов поступили за последние ~7 часов — [api.rapidskins.com/graphql](https://www.rapidskins.com/trade) (запрос фронтенда, см. раздел 4).

### Inferences
- По заявленным $15M+ за ~4 года выходит в среднем порядка $3–4M в год. Это грубая оценка по маркетинговым цифрам сайта, независимого подтверждения нет.
- 44 отзыва Trustpilot за год говорят о небольшой аудитории по сравнению с CS.MONEY (9K отзывов) и Skinport — [Trustpilot «People also looked at»](https://www.trustpilot.com/review/rapidskins.com).

### Gaps
- Трафик: ни Similarweb, ни Semrush по rapidskins.com в поиске не нашлись (Semrush в выдаче был по другому сайту, rapidsave.com).
- Интервью и прессы с цифрами не нашёл. Есть только упоминания основателя Jack Flux на агрегаторах.
- Страница Companies House вернула 502, дату регистрации компании проверить не удалось.
- Точное число предметов в стоке не измерено (см. раздел 7).

## 3. Видны ли недавно проданные или купленные предметы и история

### Takeaway
Публичной ленты сделок нет. Ближе всего к ней три вещи: (а) сортировка «Newest» в стоке, где у каждого лота есть createdAt (время, когда RapidSkins выкупил предмет); (б) анонимная WebSocket-подписка StockUpdate, которая сообщает assetId ушедших из стока предметов; (в) эндпоинт API `/stock/assets/latest` с «recently purchased assets», для которого нужен API-ключ, то есть вход в аккаунт.

### Cited Findings
- Каждый ассет в ответе фронтенда содержит `createdAt` (когда попал в сток), а сортировка Newest упорядочивает по нему. В выборке от 23.10.2026 даты createdAt шли от 2025-02 до 2026-10-23 — [/trade](https://www.rapidskins.com/trade) (перехват GraphQL).
- Фронтенд /trade и /buy без входа открывает WebSocket `wss://api.rapidskins.com/graphql` (протокол graphql-ws) и подписывается на `StockUpdate`. Его полезная нагрузка — `removed { assetId, amount }`, то есть уведомления об удалении ассетов из стока. Остальные подписки (SteamOfferUpdate, CashoutUpdate, DepositUpdate, CheckoutUpdate) у анонима сразу завершаются ошибкой. CashoutMethodStatusUpdate (доступность методов вывода) остаётся активной — [/trade](https://www.rapidskins.com/trade) (перехват 23.10.2026).
- За два окна наблюдения (~15 с и ~60 с) я не получил ни одного события StockUpdate — собственное наблюдение 23.10.2026.
- Публичное API: `GET /stock/assets/latest` — «Gets a list of recently purchased assets in the Rapidskins stock» (лимит 1 запрос в 5 с, scope LIST_STOCK). Это недавно **выкупленные сайтом** предметы, а не проданные — [OpenAPI](https://api.rapidskins.com/docs/swagger.json) / [API docs](https://api.rapidskins.com/docs).
- Личная история (`/steam-offer/list`, `/cashout/list`) и страница Account → History доступны только самому пользователю (scope HISTORY) — [OpenAPI](https://api.rapidskins.com/docs/swagger.json); [FAQ reversal hold](https://www.rapidskins.com/faq/reversal-hold).

### Inferences
- «Что продано» можно восстановить только косвенно: регулярно снимать сток и сравнивать снимки (исчезнувшие assetId означают продажу, вывод или ручное снятие) или слушать StockUpdate. Причину удаления (продажа или иное) событие не сообщает, а цены сделки в нём нет. Последнюю известную цену берут из снимка.
- «Что поступило» (выкуплено у пользователей) видно напрямую по createdAt и сортировке Newest.

### Gaps
- Не проверено, как часто приходят события StockUpdate и одинаковы ли они для всех анонимных клиентов. Наблюдение было коротким и ничего не поймало.

## 4. Публичное API и эндпоинты фронтенда

### Takeaway
Есть два канала. (1) Внутренний GraphQL фронтенда `https://api.rapidskins.com/graphql` (POST) и WS `wss://api.rapidskins.com/graphql`. Запрос `SiteInventory` работает **без авторизации** (в том числе обычным curl), курсорная пагинация, 50–100 описаний на страницу, rate-limit заголовков в ответе нет. (2) Официальный REST API `https://api.rapidskins.com/api/v1` с документацией ReDoc, где обязателен API-ключ (выдаётся после входа), с ограничениями по scope и жёсткими лимитами.

### Cited Findings
**GraphQL фронтенда (наблюдение 23.10.2026, [/trade](https://www.rapidskins.com/trade)):**
- В публичном конфиге Nuxt на странице: `apiUrl: https://api.rapidskins.com`, `wsUrl: wss://api.rapidskins.com`, auth-cookie `x-jwt-auth-token` — [/trade](https://www.rapidskins.com/trade) (HTML).
- Операция `SiteInventory(input: GetSiteInventoryInput!)`. Вход: `itemsPerPage` (/trade шлёт 50, /buy шлёт 100), `order {orderBy, direction}` с orderBy ∈ price / float / createdAt / discount / unlockDate, курсор `lastDescriptionId` (берётся из предыдущего ответа), необязательный `filter` (appId, категории, поиск, paint family и пр.).
- Ответ состоит из трёх массивов. `descriptions` — тип предмета: id, marketHashName, iconHash, appId, price, inStock, maxStock, pricePromotions. `assets` — конкретные экземпляры: assetId, amount, steamDescriptionId, ownerSteamId (SteamID бота-держателя), unlockDate, createdAt, discountedPrice, discountPercent, `itemExtra` для CS2 с полями inspectLink, float, paintSeed, charm {marketHashName, iconHash}, itemStickers [{marketHashName, iconHash, float (износ стикера), slot}]. `pricePromotions` — id, name, percentage, expiresAt.
- Пагинация проверена: при прокрутке фронтенд сделал 5 последовательных запросов с `lastDescriptionId`. Признак конца — описаний пришло меньше, чем itemsPerPage. Суммарно 6 страниц дали 300 описаний и 1303 ассета.
- Одиночный POST из curl (с заголовками Origin и Content-Type) вернул 200 без cookie и токена. В ответе только Cloudflare-заголовки, никаких X-RateLimit. CORS разрешён только для `https://www.rapidskins.com`.
- В JS фронтенда есть вспомогательные справочные запросы с пометкой inStock: listStickers, listCharms, listCollections, listContainers, listPaintFamilies, listWeaponFamilies, listStickerTeams, listSteamDescriptions. Похоже, они питают фильтры, в том числе «patches» — [JS-бандл /_nuxt/](https://www.rapidskins.com/trade). Набор полей этих запросов я не проверял.

**Официальный REST API ([api.rapidskins.com/docs](https://api.rapidskins.com/docs), спецификация [swagger.json](https://api.rapidskins.com/docs/swagger.json), «Rapidskins Public API» v1.0.0):**
- Авторизация: «Every request needs an API key. Create one from the API page of your account settings». Ключ передаётся в `x-api-key` или `Authorization: Bearer`. Ключи вида `rs_live_…`.
- Эндпоинты со scope LIST_STOCK:
  - `GET /stock/listings?appId=` — карта marketHashName → {price минимальной копии, count}. Фильтры search и marketHashName. Лимит 4 запроса / 30 с.
  - `GET /stock/assets/list?appId=` — все ассеты: marketHashName (у Doppler с фазой в названии), descriptionId, assetId, amount, price с учётом aging discount, unlockDate. Лимит 30 / 5 мин.
  - `GET /stock/assets/latest` — недавно выкупленные. Лимит 1 / 5 с.
  - `GET /stock/assets/count` — descriptionId → количество. Лимит 10 / мин.
  - `GET /descriptions` — до 250 marketHashName за запрос. Лимит 10 / 10 с.
- В REST-ответах `/stock/assets/*` по схеме **нет float, paintSeed, стикеров и inspect-ссылки**. Эти поля есть только в GraphQL фронтенда.
- Пагинация: параметр `page` с 1, до 250 элементов на страницу, в ответе `totalCount`. Без `page` возвращается вся коллекция («historic behaviour»). Лимиты считаются на ключ и на эндпоинт в фиксированных окнах, при превышении — `429 RateLimitExceeded` без Retry-After.
- Остальные scope: BASIC_USER, LIST_INVENTORY (свой инвентарь, лимит 5 / 5 мин), BACKPACK (покупка в «рюкзак», в том числе предметов с трейд-локом), TRADE, HISTORY.
- В FAQ две ступени доступа. «Public — Stock listings, skin prices, user profile, buy skins — Create an API key instantly, no approval needed». «Permissioned — Sell skins, cashouts, trading — Apply for approval». Лимит Public-ступени — «120 requests / minute per key» — [FAQ API Access](https://www.rapidskins.com/faq/api-access).

### Inferences
- Для сбора стока без аккаунта технически хватает GraphQL `SiteInventory`. Это единственный канал, где без входа отдаются float, seed, inspect и трейд-лок. Но это внутренний недокументированный интерфейс, и его использование противоречит духу API Terms (см. раздел 5).
- Легальный путь — официальный REST API с ключом. Ключ требует входа через Steam, а значит выходит за рамки этого исследования.
- Лимиты в FAQ (120/мин) и в OpenAPI (по эндпоинтам, например 4 / 30 с для listings) не совпадают. Вероятно, OpenAPI свежее и точнее.

### Gaps
- Реальные лимиты анонимного GraphQL не измерялись, чтобы не нагружать сайт. Заголовков лимита нет, но защита Cloudflare (challenge-platform) на сайте присутствует.
- Полная схема `GetSiteInventoryInput.filter` (диапазон float, стикеры и пр.) не извлекалась. Интроспекцию я не запускал.

## 5. robots.txt и условия использования (скрейпинг, боты, автоматизация)

### Takeaway
robots.txt разрешает всё, кроме `/account/`, `/auth/`, `/rewards/`, `/api/`, `/a/` на www (у поддомена api.rapidskins.com robots.txt нет, ответ 404). Основные ToS разрешают автоматическую покупку с разумными паузами. API Terms прямо запрещают сбор и распространение цен, data mining и конкурентную разведку.

### Cited Findings
- robots.txt: «User-agent: * Allow: /», «Disallow: /account/ /auth/ /rewards/», «# Disallow API routes Disallow: /api/», «Disallow: /a/» (партнёрские редиректы), Sitemap — [robots.txt](https://www.rapidskins.com/robots.txt) (23.10.2026). `https://api.rapidskins.com/robots.txt` вернул 404.
- ToS 2.1: «While automated scripts may detect and purchase underpriced items, patterns of exclusively targeting manipulated items are not permitted». ToS 2.4: «Users may not use the API to engage in front-running…», «Automated buying must include reasonable delays between requests to prevent server strain». ToS 3.3: «Unusually high trading volumes may trigger automatic review» — [Terms](https://www.rapidskins.com/terms) (Last updated: March 25, 2026).
- ToS: «ANY ATTEMPT BY YOU TO DISRUPT OR INTERFERE WITH THE PLATFORM … IS A VIOLATION» — [Terms](https://www.rapidskins.com/terms).
- API Terms, раздел Price Confidentiality: «Publishing or sharing Rapidskins' selling prices (the prices paid for users' items) is strictly prohibited» и «Scraping or systematically collecting pricing data for distribution is prohibited» — [API Terms](https://www.rapidskins.com/api-terms) (Last updated: April 14, 2025).
- API Terms, запрещённые сценарии: «Data Mining: Using the API primarily to collect data rather than to facilitate legitimate trades»; «Competitive Intelligence: … systematically gather information for competitive analysis without permission»; «Reverse engineering the API beyond what is necessary for legitimate use is prohibited»; «Developing or using tools designed to circumvent API limitations is prohibited». Один ключ на человека, а VPN или прокси для обхода правил ведут к ограничениям — [API Terms](https://www.rapidskins.com/api-terms).
- Разрешено явно: «Mass Buying: Including "arbitrage" buying…», «Mass Selling», «Ghost-Provider Services» (после одобрения) — [API Terms](https://www.rapidskins.com/api-terms). При этом FAQ противоречит этому: «Keys used for automated scraping, arbitrage bots, or any purpose not covered by the Terms of Service will be revoked without notice» — [FAQ API Access](https://www.rapidskins.com/faq/api-access).
- Для неперечисленных сценариев нужно согласование: «users must seek approval from Rapidskins … Contact dev@…» — [API Terms](https://www.rapidskins.com/api-terms); контакт dev@rapidskins.com в [OpenAPI](https://api.rapidskins.com/docs/swagger.json).

### Inferences
- Систематический сбор цен ради статистики или сравнения с конкурентами по API Terms прямо запрещён. Для такого проекта нужно письменное согласование с dev@rapidskins.com либо только ручной, точечный просмотр.
- Запрет в robots.txt на `/api/` относится к www.rapidskins.com/api/ (там Nuxt Content). Хост API — отдельный поддомен без robots.txt. Но это не отменяет условий API Terms.

### Gaps
- Отдельного пункта о скрейпинге HTML-страниц (не API) в основных ToS нет. Распространяются ли API Terms на внутренний GraphQL без ключа, явно не сказано.

## 6. Данные по каждому предмету

### Takeaway
Для CS2 по каждому экземпляру доступны: цена (с учётом aging discount), процент скидки, float, paint seed, inspect-ссылка, стикеры (с float и слотом) и брелок (поля есть, но в выборке пустые), дата разблокировки трейд-лока, дата поступления в сток, фаза Doppler (в названии). Отдельной наценки за float или паттерн и скриншотов нет.

### Cited Findings
- Поля ассета в GraphQL: price/discountedPrice/discountPercent, float, paintSeed, inspectLink (`steam://run/730//+csgo_econ_action_preview …`), itemStickers (marketHashName, iconHash, float, slot), charm (marketHashName, iconHash), unlockDate, createdAt, ownerSteamId — [/trade](https://www.rapidskins.com/trade) (перехват 23.10.2026).
- Фаза Doppler и Gamma Doppler входит в marketHashName («… (Factory New) - Phase 1», «… - Ruby»). В REST так же: «For CS2 Doppler and Gamma Doppler, the Phase is included at the end of the market hash name» — [OpenAPI](https://api.rapidskins.com/docs/swagger.json). В UI показывается «Doppler - P1», «Gamma Doppler - P2» — [/trade](https://www.rapidskins.com/trade).
- Цена копии зависит от «старения»: «Each asset's price includes any aging discount that asset has accrued, so two copies of the same item may differ in price. Promotional pricing, where active, is applied at purchase» — [OpenAPI](https://api.rapidskins.com/docs/swagger.json).
- Своё измерение (1762 ассета, 23.10.2026): у лотов младше 7 дней скидка 0%. При возрасте 7–30 дней в среднем 2.38%, 30–90 дней — 3.22%, старше 90 дней — 3.77%. Скидка растёт шагами по ~0.25%, максимум 5%. Между двумя загрузками с разницей в минуты проценты у части лотов выросли (например −2.25% стало −2.5%). Активных pricePromotions не было.
- Трейд-лок: 85 из 1762 ассетов имели unlockDate (от 23.10.2026 до 30.10.2026, то есть ≤7 дней). Есть сортировка «Unlocks Soon» и бейдж «N days». Через API можно покупать в «рюкзак» предметы с трейд-локом — [OpenAPI /backpack/buy](https://api.rapidskins.com/docs/swagger.json).
- Float был заполнен у 237 из 256 CS2-ассетов топ-300 описаний (стикеры, кейсы и т.п. float не имеют). В моих выборках не было ни одного ассета с непустыми itemStickers или charm (262 CS2-ассета).
- Ценообразование: «based on real-time market data from Steam's Community Market and major third-party marketplaces». Учитываются спрос, ликвидность, износ, «Stickers: high-value applied stickers can significantly increase a skin's price» — [FAQ pricing](https://www.rapidskins.com/faq/how-are-skins-priced). В ToS: «determined by RapidSkins by a certain algorithm … based on several lead trade networks» — [Terms](https://www.rapidskins.com/terms).
- `maxStock` у всех полученных описаний равен 0. Вероятно, это лимит закупки, а не отображаемое поле (вывод по данным, не подтверждён).

### Inferences
- Цена задаётся на уровне описания (marketHashName плюс фаза). В данных не видно отдельной надбавки за низкий float или редкий паттерн: экземпляры одного описания отличаются только aging discount. Значит, редкие float и seed на RapidSkins не дороже обычных, а иногда дешевле, если лот долго лежит. Для охотника за паттернами это потенциально выгодно.
- Скриншотов (рендеров) нет, только иконка и inspect-ссылка.

### Gaps
- Не проверено, показывает ли сайт стикеры и брелки в UI и учитывает ли их в цене продажи на практике: в выборке не было предметов с ними.
- Цены выкупа (sell page) без входа не видны. К тому же API Terms запрещают их публиковать.

## 7. Комиссии и бонусы (по публичным данным)

### Takeaway
Отдельной комиссии на покупку нет. Доход площадки заложен в спред: агрегатор оценивает цену выкупа примерно на 20% ниже Steam Market. На вывод, по словам сайта, нет платформенной комиссии, но комиссия провайдера «may apply». Бонусы: aging discount до 5% на стоке, лидерборды Races с денежными призами, Rewards/кейсы.

### Cited Findings
- «We price skins competitively with no hidden fees. The price you see on the sell page is what you receive» — [FAQ What is RapidSkins](https://www.rapidskins.com/faq/what-is-rapidskins). Маржа встроена в цену: «our prices include an operating margin that covers payment processing fees…» — [FAQ pricing](https://www.rapidskins.com/faq/how-are-skins-priced).
- PayPal: «zero platform fees». Bitcoin: «RapidSkins charges no platform fee on Bitcoin payouts — you pay only the standard Bitcoin network fee» — [sell/cs2/paypal](https://www.rapidskins.com/sell/cs2/paypal), [sell/cs2/bitcoin](https://www.rapidskins.com/sell/cs2/bitcoin). Instant Cash: «For other methods (e.g. PayPal, card, crypto), a fee may apply; the sell page shows the exact amount» — [FAQ Instant Cash](https://www.rapidskins.com/faq/instant-cash-cs2).
- Агрегатор steamdb.com (верифицировано 1 июля 2026): seller fee 20% («the spread below market value on an instant sale»), buyer fee 0%, crypto deposits 2%, для PayPal-выплат — комиссия PayPal $1 + 2% — [steamdb.com/en/markets/rapidskins](https://steamdb.com/en/markets/rapidskins). По пересказу поиска, Pricempire указывает seller fee 5%, а SteamAnalyst — 0% (спред). Эти страницы вернули 403, напрямую не проверены.
- Instant Cash для CS2: выплата во время 7-дневного reversal hold в пределах личного лимита, остаток — после окончания холда. При откате трейда лимит обнуляется навсегда, бонусы сгорают, долг нужно вернуть за 10 дней — [FAQ Instant Cash](https://www.rapidskins.com/faq/instant-cash-cs2), [FAQ reversal hold](https://www.rapidskins.com/faq/reversal-hold), [Terms](https://www.rapidskins.com/terms).
- Возврат: в течение 14 дней, только для невыведенных предметов. Платёжный процессор может удержать 3% — [Terms](https://www.rapidskins.com/terms).
- Races: дневные и недельные лидерборды, очки начисляются за продажу, покупку и трейд, «no entry fee». Призы недели: $28 / $17 / $12 / $7.50 … $2 — [rapidskins.com/races](https://www.rapidskins.com/races) (23.10.2026).
- Способы выплат: PayPal, Visa/Mastercard push-to-card (только США, Канада, Мексика), ACH/bank, Venmo, BTC, ETH, LTC, USDT — [sitemap](https://www.rapidskins.com/sitemap.xml), [FAQ card](https://www.rapidskins.com/faq/card-payments), [FAQ crypto](https://www.rapidskins.com/faq/crypto-payments).
- Отзыв на Trustpilot (Jan 30, 2026): «prices are not the best, but also not ridiculously low… full amount up to 150 dollars instan[tly]» — [Trustpilot](https://www.trustpilot.com/review/rapidskins.com).

### Inferences
- Для трейда (обмен скина на скин) отдельной комиссии или бонуса публично не указано. Невыгодность для пользователя, вероятно, в разнице между ценой выкупа его предметов и ценой продажи предметов сайта, но без входа это не проверить.

### Gaps
- Точный размер спреда (цена выкупа против цены продажи) публично не виден.
- Размеры Instant Cash лимитов и условия Rewards/кейсов (/rewards/ закрыт в robots.txt) не изучались.

## 8. Можно ли собирать агрегированную статистику

### Takeaway
Технически — да, и без входа. Внутренний GraphQL отдаёт весь сток с курсорной пагинацией, а WebSocket сообщает об уходе ассетов из стока. Из этого можно собрать снапшоты стока, поток поступлений (createdAt), оценку продаж (диффы и StockUpdate), распределения float и seed, долю трейд-локов. Юридически систематический сбор и распространение цен запрещены API Terms, так что для проекта нужен либо официальный ключ с согласованием сценария, либо ручной точечный просмотр.

### Cited Findings
- Все нужные для снапшота поля отдаются одним запросом `SiteInventory` с пагинацией по `lastDescriptionId`. Сортировка `createdAt desc` сразу даёт свежие поступления — [/trade](https://www.rapidskins.com/trade) (перехват 23.10.2026).
- Через официальный REST весь сток можно получить одним запросом `/stock/assets/list?appId=730` (без `page`). Сайт сам рекомендует «request it once rather than walking the pages» — [OpenAPI](https://api.rapidskins.com/docs/swagger.json).
- Запреты: «Scraping or systematically collecting pricing data for distribution is prohibited», «Data Mining», «Competitive Intelligence» — [API Terms](https://www.rapidskins.com/api-terms).

### Inferences
- Что реально можно посчитать:
  1. Размер стока по играм, категориям и ценовым бакетам на дату.
  2. Скорость поступления (выкупа) по createdAt.
  3. Оценку оборота продаж из диффов снапшотов, умножив исчезнувшие assetId на последнюю цену. Это верхняя оценка, потому что включает выводы и снятия.
  4. Распределение aging discount как прокси «залёживания» лота.
  5. Для охоты за паттернами — поиск по paintSeed и float в стоке, ведь цена не зависит от паттерна.
- Ручной поиск упрощают сортировки Float: Low/High, Unlocks Soon, Newest, Biggest Discount, фильтр Paint Family и поиск по названию. Наведение на карточку сразу показывает seed, float и Inspect, что удобно для ручной проверки паттернов.
- Ограничение: история цен и сделок не публикуется, поэтому ретроспективную статистику получить нельзя. Сбор возможен только начиная с момента запуска мониторинга.

### Gaps
- Полный объём стока (число описаний и ассетов) не измерялся: для этого нужна полная пагинация, а это десятки запросов и выход за рамки «лёгкой» нагрузки. В первых 6 страницах по убыванию цены оказалось 300 описаний и 1303 ассета, нижняя цена в выборке — $26.02. Значит, сток заметно больше.
- Частота событий StockUpdate и полнота этого канала не проверены.
