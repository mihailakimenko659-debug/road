# PirateSwap (pirateswap.com): что сайт показывает публично, его масштаб и можно ли автоматизировать сбор данных

Дата исследования: 2026-10-23. Я открывал только публичные страницы, без логина и Steam-авторизации, ничего не покупал и не обменивал. Всего около 40 лёгких запросов к pirateswap.com и web.pirateswap.com с паузами. Использовал headless Chromium (Playwright) и curl. Важная оговорка: прокси моей среды не пропускает `challenges.cloudflare.com`, поэтому проверка Cloudflare Turnstile в браузере не проходила. Именно на Turnstile завязана полная выдача инвентаря (подробности ниже). Числа из JSON-ответов я получил своими запросами; это мои наблюдения, а не опубликованная статистика сайта.

## 1. Что показывает страница обмена /ru/exchanger без входа

### Takeaway
Без входа страница открывается, но поверх неё висит окно «Зарегистрироваться через Steam» (его можно закрыть кнопкой «Продолжайте осматриваться»). Полный инвентарь ботов с фильтрами грузится только после невидимой проверки Cloudflare Turnstile. Если проверка не пройдена, фронтенд подставляет публичное «превью»: топ-100 самых дорогих предметов, без фильтров и без пагинации. Ленты последних сделок или выводов на странице я не нашёл. В каталоге магазина у каждого скина есть отдельная страница с остатками и ценами по степеням износа.

### Cited Findings
- Страница обмена построена на Next.js с предрендером (gsp). Сам HTML содержит только тексты интерфейса (i18n) на 12 языках, данных о предметах в нём нет. Meta-description: «Pireateswap Exchanger — мгновенный обмен скинами CS2». — [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger)
- Окно для гостя обещает «Выбери скины, чтобы обменять их на скины из инвентаря наших ботов — их более 1 000 000!» и показывает виджет Trustpilot «Excellent, 4643 reviews» (снято 2026-10-23). — [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger)
- Без входа видна раскладка: слева «Твои предметы» с пометкой «войдите, чтобы увидеть», справа инвентарь ботов. Над ними категории: ножи, перчатки, снайперские винтовки, винтовки, SMG, пистолеты, тяжёлое оружие, брелоки, наклейки, булавки, агенты. Ниже поиск, кнопка «Избранное», сортировка по цене и панель фильтров: «Предмет с наклейкой», «Элемент с брелоком», блок «Блокировка торговли» («Без торговой блокировки» / «Обмен заблокирован» плюс выбор дней 0–4…). — наблюдение в headless-браузере на [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger)
- Полный инвентарь отдаёт запрос `web.pirateswap.com/inventory/v2/ExchangerInventory?orderBy=price&sortOrder=DESC&page=1&results=40`. Без сессии он возвращает HTTP 403 `{"error":"session_missing"}`. В JS-клиенте видно, что сессия передаётся в заголовке `X-Ext-Session`, а флаг `InventoryTurnstile: true` в `/Features` включает для инвентаря проверку Turnstile. — [web.pirateswap.com/Features](https://web.pirateswap.com/Features), собственный запрос 2026-10-23
- Если сессии нет, фронтенд вызывает публичный `inventory/v2/ExchangerPreview`. Он вернул HTTP 200 без cookie (подробности в разделе 4). — собственный запрос к [web.pirateswap.com/inventory/v2/ExchangerPreview](https://web.pirateswap.com/inventory/v2/ExchangerPreview?results=40)
- По строковым константам фронтенда, сортировки такие: цена ↑/↓, флоат ↑/↓, дата снятия трейд-лока ↑/↓ (`tradableAfter`). Ещё есть `createdAt`, `isTradable`, `lowestPrice`. Параметры фильтров: `searchPhrase`, `priceFrom/priceTo`, `floatFrom/floatTo`, `phases`, `exterior`, `collection`, `stickers`, `isStatTrak`, `isSouvenir`, а также трейд-лок, «с наклейкой», «с брелоком». Сохранённые наборы фильтров живут в эндпоинте `/UserExchangerFilterPresets`, избранное в `/UserFavouriteSkins` (оба для пользователя). — JS-бандлы страницы [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger), 2026-10-23
- В интерфейсе есть строки «Осмотр в игре», «Открыть 3D-просмотр в новой вкладке» (3d.pirateswap.com) и «Скины в 3D — флоат, паттерн и наклейки точно как в игре». Есть также строки «История цен» / «История цен пока отсутствует». — i18n в HTML [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger)
- Отдельный эндпоинт `/inventory/NewSkins` без входа вернул пустой массив `[]`. — [web.pirateswap.com/inventory/NewSkins](https://web.pirateswap.com/inventory/NewSkins), 2026-10-23
- В каталоге `/store/<slug>` по sitemap-ам набралось 4 865 уникальных страниц скинов: 2 734 из них StatTrak/Souvenir, каждая на 12 языках. Данные страницы (`pageProps.skin`) включают название, редкость, коллекцию, описание, похожие предметы и массив `stocks`: для каждой степени износа указан остаток (`stock`) и цена (`price`). Пример для AK-47 | Redline: MW — 0 шт / $133.80, FT — 21 шт / $28.29, WW — 16 шт / $22.41, BS — 7 шт / $22.40. — [pirateswap.com/store/ak-47-redline](https://pirateswap.com/store/ak-47-redline), [sitemap.xml](https://pirateswap.com/sitemap.xml), 2026-10-23
- На странице `/store/<slug>` фронтенд тоже запрашивает ExchangerInventory с `searchPhrase=<название>`, и без сессии тоже получает 403. Подсказки автодополнения `inventory/search/v2/autocomplete?searchPhrase=…` публичны (HTTP 200) и возвращают marketHashName, иконку и хэш-коды названий. — собственный запрос, [web.pirateswap.com](https://web.pirateswap.com/inventory/search/v2/autocomplete?searchPhrase=Five-SeveN%20%7C%20Fall%20Hazard)

### Inferences
- Ручной поиск по сайту полностью работает в обычном браузере человека: Turnstile проходит незаметно. В headless-браузере и из curl полный инвентарь закрыт.
- `stocks` на страницах `/store/*` — это агрегат «сколько штук и почём по каждой степени износа». Но страница предрендерена: в заголовках `s-maxage=31536000`, `x-nextjs-cache: HIT`. Насколько эти данные свежие, неизвестно, их можно считать снимком на момент последней регенерации.

### Gaps
- Как выглядит полный список после прохождения Turnstile (сколько всего позиций, отдаёт ли сервер `totalResults`), я проверить не смог: прокси блокирует challenges.cloudflare.com.
- Откуда берётся «История цен», не установлено: в загруженных JS-чанках подходящего эндпоинта нет, видимо, он подгружается лениво.
- Периодичность обновления `stocks` на страницах `/store/*` неизвестна.

## 2. Масштаб и оборот: опубликованные цифры

### Takeaway
Объём сделок в долларах сайт не публикует. Есть только маркетинговые счётчики: «987.2K активных пользователей», «999K+ разных скинов и вариаций», «обмен за 30 с», «более 1 000 000 предметов у ботов». Сторонние оценки трафика сильно расходятся. Отзывы на Trustpilot: около 4.6 при 3.5–4.7 тыс. отзывов, в зависимости от даты замера.

### Cited Findings
- Публичный эндпоинт `/Statistics` (он же `landingPageStatistics` в данных главной) отдаёт `commission: 2.1`, `activeUsersNumber: 987.2`, `skinNumber: 999`, `exchangeTime: 30`. На главной это счётчики «Exchange completion time 30S», «Active users …K», «Different skins and variations …K+» и «Lowest commission on market». — [web.pirateswap.com/Statistics](https://web.pirateswap.com/Statistics), [pirateswap.com](https://pirateswap.com/), 2026-10-23
- В окне для гостя на странице обмена сказано, что у ботов «более 1 000 000» скинов. — [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger), 2026-10-23
- В SEO-тексте главной перечислены спонсорские соглашения с The MongolZ, Imperial Esports, paiN Gaming, Chinggis Warriors и MIBR. Аудитории партнёров-блогеров указаны «от 163 000 до 2.17 млн» (Tiagovski, Izak, Boltz), отзывов «4329». — [pirateswap.com](https://pirateswap.com/) (дата текста не указана, снято 2026-10-23)
- Виджет Trustpilot на сайте: «Excellent, 4643 reviews». — [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger), 2026-10-23
- SteamDB: «4.6 out of 5 across 3,559 reviews», последняя проверка 1 июля 2026. — [steamdb.com/en/markets/pirateswap](https://www.steamdb.com/en/markets/pirateswap)
- CSDB.gg: 4.6★ при 4,490 отзывах (проверено 2 августа 2026), «replies to 99% of negative reviews», оператор IT MARKET BG, Варна. — [csdb.gg/trading-site/pirateswap](https://csdb.gg/trading-site/pirateswap/)
- SIH: 4.6 при «4706+ reviews», «~249,000 monthly visits», запуск в 2024 году, оператор «GVANTAGEWeb Limited», Болгария. Страница обновлена в «October 2026», источник трафика не назван, а «Active Listings ~0» явно ошибочно. — [sih.app/reviews/pirateswap](https://sih.app/reviews/pirateswap)
- Сниппет Semrush в выдаче поисковика: «En abril pirateswap.com se recibieron 1,05 M visitas», топ-страна Польша, около 72% трафика прямой. Сниппет помечен «последнее обновление 12 мая 2025». Сама страница сейчас отдаёт 404, проверить не удалось. — [es.semrush.com/website/pirateswap.com/overview](https://es.semrush.com/website/pirateswap.com/overview) (только сниппет); расходится с оценкой SIH примерно вчетверо
- CreatorDB: 147 спонсируемых блогеров, 71.5M просмотров, 6.9K спонсорских публикаций, данные обновлены 27 августа 2026; среди партнёров The MongolZ, Eternal Fire. — [creatordb.app/brands/pirateswap.com](https://creatordb.app/brands/pirateswap.com)
- Юрлицо и возраст: в ToS указаны «IT MARKET BG, 24 Morska Sirena St., Varna, Bulgaria» и «Effective Date: 14.04.2023» (запись в CMS обновлена 2025-08-21), в футере «Copyright © 2023». Это противоречит SIH («founded 2024», GVANTAGEWeb Limited). — [pirateswap.com/terms-of-service](https://pirateswap.com/terms-of-service); [sih.app](https://sih.app/reviews/pirateswap)

### Inferences
- Единицы в `/Statistics` выводятся из вёрстки счётчиков (K, K+): получается примерно 987 тыс. «активных пользователей» и 999 тыс.+ «скинов и вариаций». Как сайт считает «активных», не раскрыто. Значение `commission: 2.1` в интерфейсе подписано как «самая низкая комиссия на рынке», но единица (%?) и база расчёта не указаны.
- Число 1 000 000 у ботов и 999K «вариаций» — маркетинговые цифры, независимо подтвердить их нельзя.

### Gaps
- Объём торгов ($/мес), число сделок, выручку сайт не публикует, и в прессе я этих данных не нашёл.
- Свежих данных Similarweb найти не удалось; Trustpilot и Pricempire из моей среды недоступны (DNS/403).

## 3. Видны ли недавние сделки, продажи или история

### Takeaway
Публичной ленты сделок, выводов или продаж я не обнаружил. История обменов (`/Exchange/history/{userId}`) и история баланса существуют только в личном кабинете. Единственный публичный способ косвенно увидеть «проданное» — следить за исчезновением предметов из инвентаря ботов (`id`/`assetId`) или за изменением `stock` на страницах `/store/*`.

### Cited Findings
- Эндпоинты истории в клиенте вызываются через авторизованный клиент с userId: `/Exchange/history/{id}` (параметры SortOrder, OrderBy=CreatedAt, Page, Results, TradeId), `/Exchange/history/{id}/details`, `/Balance/history/{id}/payments`, `login.pirateswap.com/UserActivity/{id}`. — JS-бандлы [pirateswap.com/store/ak-47-redline](https://pirateswap.com/store/ak-47-redline), 2026-10-23
- Help Center: историю транзакций смотрят в разделе «Activity Details» своего аккаунта. — [pirateswap.com/help-center](https://pirateswap.com/help-center)
- SignalR-хаб `web.pirateswap.com/notification-hub` есть в коде, но гостевая сессия к нему не подключалась: в headless-сессии WebSocket-соединений не было. — собственное наблюдение, 2026-10-23
- Для раздачи Freebies есть эндпоинт `/freebies/{id}/participants`. Он относится к розыгрышам, а не к сделкам. — JS-бандлы, 2026-10-23

### Inferences
- Оборот можно оценить только по разнице снимков инвентаря ботов: что исчезло, то выведено или обменяно, что появилось, то пришло от пользователей. Публичное превью для этого не годится, нужен полный инвентарь, а он закрыт Turnstile-сессией.

### Gaps
- Наличие публичной ленты или виджета «последние обмены» на других страницах (Freebies, Giveaways) я не проверял подробно; на /exchanger и главной ничего подобного не нашёл.

## 4. Публичный API и эндпоинты фронтенда

### Takeaway
Официального документированного API нет. Фронтенд ходит на `web.pirateswap.com`. Без входа и без Turnstile работают: `ExchangerPreview` (до 100 самых дорогих предметов с полными атрибутами, фильтры и страницы игнорируются), `Statistics`, `Features`, `AppConfiguration/exchange-rates`, `inventory/Collections`, `inventory/search/v2/autocomplete`, плюс JSON-данные Next.js для страниц `/store/*`. Полный каталог (`inventory/v2/ExchangerInventory` и связанные `/groups`, `/variants`, `/category`, `grouped-by-market-hash-names`) требует Turnstile-сессию.

### Cited Findings
- `GET web.pirateswap.com/inventory/v2/ExchangerPreview?results=N` → 200 без cookie. Ответ: `items[]` плюс `empty`, `currentPage`, `resultsPerPage`, `totalPages: 0`, `totalResults: 0`. При results=200 пришло ровно 100 предметов (потолок). `page=2` вернул те же предметы, что и page=1. `searchPhrase`/`orderBy`/`sortOrder` игнорируются: всегда отдаётся топ по цене (в моём срезе от $1 301.20 до $17 701.88). — собственные запросы к [ExchangerPreview](https://web.pirateswap.com/inventory/v2/ExchangerPreview?results=40), 2026-10-23
- `GET web.pirateswap.com/inventory/v2/ExchangerInventory` (постраничная выдача с page/results, сортировкой и фильтрами из раздела 1) → 403 `session_missing` без заголовка `X-Ext-Session`; `/groups` тоже 403. — собственный запрос, 2026-10-23
- `GET /Statistics` — четыре счётчика главной. `GET /Features` — флаги функций, `currentDepositPercentageBonus: 35`, время сервера. `GET /AppConfiguration/exchange-rates` — курсы валют к USD (например, RUB 81.5122, EUR 0.8916). `GET /inventory/Collections` — названия коллекций с иконками. `GET /inventory/Stickers` без параметров вернул 500. — [web.pirateswap.com](https://web.pirateswap.com/Statistics), 2026-10-23
- JSON-данные Next.js: `pirateswap.com/_next/data/<buildId>/store/<slug>.json?id=<slug>` содержит те же `skin.stocks`, что и HTML. buildId меняется при деплое, в моём замере `3vIrEaq-zB9Ft6xLMrpBx`. — собственный запрос, 2026-10-23
- Лимиты: в ответах нет заголовков rate-limit или Retry-After. CORS разрешён только для `https://pirateswap.com`. Всё стоит за Cloudflare (`cf-cache-status: DYNAMIC`). Телеметрия уходит на `statisticsapi.pirateswap.com/api/Analytics/events` и PostHog (`api9.pirateswap.com`). — заголовки ответов, 2026-10-23
- В robots.txt `Disallow: /api/` и `/_next/` для всех агентов (см. раздел 5). Эндпоинты на поддомене web.pirateswap.com под этот robots.txt формально не подпадают, а свой robots.txt там я не проверял. — [pirateswap.com/robots.txt](https://pirateswap.com/robots.txt)

### Inferences
- Автоматизировать можно три вещи:
  - снимать раз в N минут топ-100 дорогих предметов через ExchangerPreview;
  - обходить 4 865 страниц `/store/*` (или их `_next/data`) и собирать остатки и цены по степеням износа;
  - пользоваться autocomplete.
- Полная выгрузка инвентаря требует пройти Turnstile в настоящем браузере. Обход этой защиты противоречит её цели и, вероятно, условиям сайта (раздел 5). Практичнее облегчить ручной поиск: сохранённые фильтры, сортировка по флоату и по дате снятия лока, фильтр по фазам, поиск по названию.

### Gaps
- Лимиты запросов эмпирически не проверял, это было бы нагрузочным тестом.
- Работает ли `X-Ext-Session`, полученный в обычном браузере, вне браузера и сколько он живёт, неизвестно.

## 5. robots.txt и условия использования (скрапинг, боты)

### Takeaway
robots.txt закрывает сайт для архивов (Wayback, archive.today, HTTrack и др.) и ИИ-краулеров (GPTBot, ChatGPT-User, Google-Extended, Bytespider, FacebookBot). Остальным агентам разрешено всё, кроме `/api/`, `/_next/`, `/profile/` и ряда служебных путей. Прямого запрета на «скрапинг» в ToS нет, но лицензия ограничена личным некоммерческим использованием, а копировать или использовать контент без письменного согласия запрещено.

### Cited Findings
- robots.txt: для ia_archiver, archive.org_bot, archive.today, HTTrack, GPTBot, ChatGPT-User, Google-Extended, Bytespider, FacebookBot и др. стоит `Disallow: /`. Для `User-agent: *` действует `Allow: /`, но закрыты `/api/`, `/_next/`, `/profile/`, `/store/checkout`, `/archive/`, `/backup/` и др. Указан Sitemap со ссылкой на 13 под-карт. — [pirateswap.com/robots.txt](https://pirateswap.com/robots.txt), 2026-10-23
- ToS, п. 12: «limited, non-exclusive, non-transferable, and revocable license to access and use the platform for personal, non-commercial purposes. You may not reproduce, distribute, modify, create derivative works from… or otherwise use any content from our platform without prior written consent». — [pirateswap.com/terms-of-service](https://pirateswap.com/terms-of-service) (Effective 14.04.2023, обновлено в CMS 2025-08-21)
- ToS, п. 3.4: запрещены «any attempt to exploit, manipulate, or take advantage of vulnerabilities, glitches, or technical deficiencies… any form of unfair advantage». — [pirateswap.com/terms-of-service](https://pirateswap.com/terms-of-service)
- Ключевых слов «scrap», «crawl», «robot», «automated» в тексте ToS нет (проверял поиском по всему тексту). — [pirateswap.com/terms-of-service](https://pirateswap.com/terms-of-service)

### Inferences
- Обход Turnstile можно трактовать как «unfair advantage» или эксплуатацию защиты. Коммерческое переиспользование собранных данных требует письменного согласия по п. 12.

### Gaps
- Отдельной API-политики или страницы для разработчиков не нашёл.

## 6. Какие данные есть по каждому предмету

### Takeaway
По каждому предмету у ботов сайт отдаёт много данных: цену обмена и цену магазина, флоат, paint seed (`pattern`), paintIndex, фазу Doppler/Gamma Doppler, процент фейда, наклейки (название, слот, иногда износ и цена), брелоки (с паттерном и ценой), дату снятия трейд-лока, inspect-ссылку, assetId. Переплаты за флоат или паттерн нет: в срезе топ-100 одинаковые marketHashName (с учётом фазы) имеют одинаковую цену при разном флоате и сиде.

### Cited Findings
- Поля предмета в `ExchangerPreview`: `id` (UUID), `assetId`, `inspectInGameLink` (steam://…csgo_econ_action_preview…), `icon`, `marketHashName`, `marketNameHashCode`, `weapon`, `skinShortName`, `category`, `subcategory`, `exterior`, `rarity`, `itemType`, `collection` (+ `collectionImage`), `nameColor`, `pattern` (paint seed), `paintIndex`, `float` (полная точность, например 0.014397908933460712), `phase` (числовой код; в выборке встретились 2–7, Ruby=6, Sapphire=7, Phase 3=4), `fadePercentage` (например, 93.77 у Marble Fade), `isStatTrak`, `isSouvenir`, `tradableAfter` (дата и время снятия лока), `price`, `storePrice`, `priceWithoutDiscount`, `storePriceWithoutDiscount`, `stickers[]`, `keyChains[]`, `creatorData`. — [ExchangerPreview](https://web.pirateswap.com/inventory/v2/ExchangerPreview?results=40), 2026-10-23
- Наклейки: `name`, `imageUrl`, `slot`, `anchorSlot`, `offsetX/Y`, `rotation`, `wear`, `price`. В выборке из 100 предметов было 68 наклеек, у 66 указана цена, у 16 износ. Брелоки: `name`, `imageUrl`, `slot`, смещения X/Y/Z, `pattern` (например 29228), `price` (0.05, 2.17, 24.87 или null). В интерфейсе есть строка «Стоимость наклеек и брелоков». — там же
- Трейд-лок: у 51 из 100 предметов задан `tradableAfter` с датами от 2026-10-23 до 2026-10-30. Help Center: на плитке замок и число дней («8D = 8 days»); такие предметы после обмена ждут во вкладке Equipment, пока лок не истечёт. — [pirateswap.com/help-center](https://pirateswap.com/help-center), ExchangerPreview
- Цена зависит от названия и фазы, а не от флоата или паттерна: 9 экземпляров MP9 | Wild Lily (FT) с флоатом 0.18–0.31 и разными сидами стоят по $3 025.12; 2 Karambit | Crimson Web (FN) с сидами 166 и 700 — по $8 288; 7 StatTrak Karambit Gamma Doppler Phase 3 — по $3 306.23. — собственный анализ ответа [ExchangerPreview](https://web.pirateswap.com/inventory/v2/ExchangerPreview?results=200), 2026-10-23
- `storePrice / price` = 0.741 у всех проверенных предметов: цена магазина примерно на 26% ниже «обменной» цены. — там же
- Скриншотов как картинок я не нашёл: есть иконка Steam, 3D-просмотрщик (3d.pirateswap.com) и inspect-ссылка. — [pirateswap.com/ru/exchanger](https://pirateswap.com/ru/exchanger)

### Inferences
- Обменная цена (`price`) выглядит как внутренняя «торговая» оценка, завышенная относительно денежной цены магазина (`storePrice`); постоянное отношение 0.741 указывает на фиксированный коэффициент. Значит, редкий флоат или паттерн (например, Crimson Web с хорошим сидом) можно получить без доплаты. Это и есть смысл облегчённого ручного поиска по флоату и сиду.

### Gaps
- Учитывается ли в цене стоимость наклеек, не ясно: в выборке это не проверить.
- Соответствие кодов `phase` названиям фаз я вывел только из сопоставления с marketHashName.

## 7. Комиссии и бонусы за обмен (как опубликовано)

### Takeaway
Ставку комиссии за обмен сайт явно не публикует: только «низкие комиссии, без скрытых платежей» и счётчик 2.1 без единицы. Сторонние сайты расходятся: 10%, 5% или «не опубликовано». Бонусы: +35% к пополнению по промокоду (временно +40%), торговый бонус до $30 за первые три обмена (минимумы $5/$7/$10), «GET FREE $10».

### Cited Findings
- FAQ: «PirateSwap charges low fees for both cs2 trade and instant sell options. No hidden fees apply to any withdrawal or payout method». — [pirateswap.com](https://pirateswap.com/) (FAQ на главной)
- Промокод даёт +35% к пополнению («deposit $10 → $13.50»), статья от 2025-02-23. `/Features` сейчас отдаёт `currentDepositPercentageBonus: 35`, баннеры обещают «+40% к каждому пополнению в течение ограниченного времени». — [pirateswap.com/blog](https://pirateswap.com/blog), [web.pirateswap.com/Features](https://web.pirateswap.com/Features)
- Trade Bonus: процент от стоимости каждой из первых трёх сделок, только для обмена, до $30. Минимум $5, $7 и $10 для первой, второй и третьей сделки. — [pirateswap.com/help-center](https://pirateswap.com/help-center)
- Депозит вывести нельзя, выводится только выручка от продажи своих скинов (Instant Sell). — [pirateswap.com/help-center](https://pirateswap.com/help-center); [csdb.gg](https://csdb.gg/trading-site/pirateswap/)
- Строки Instant Sell для залоченных предметов: «50% в течение 12 часов после принятия обмена, остальное после 8-дневной блокировки». — i18n на [pirateswap.com](https://pirateswap.com/)
- Для торговли нужен Steam Guard Mobile Authenticator, включённый не менее 7 дней. — [pirateswap.com/help-center](https://pirateswap.com/help-center)
- Сторонние данные по комиссиям: SteamDB — продавец 10%, покупатель 0%, вывод криптой 0.3–3% (проверено 2026-07-01); SIH — 10%/0%, при этом в тексте «Low fees (5%)»; CSDB — «No published fee of any kind», в Refunds policy упомянут продукт «PirateSwap Commission» без ставки (проверено 2026-08-02). — [steamdb.com](https://www.steamdb.com/en/markets/pirateswap); [sih.app](https://sih.app/reviews/pirateswap); [csdb.gg](https://csdb.gg/trading-site/pirateswap/)

### Inferences
- Реальная «комиссия» обмена, видимо, заложена в разницу цен: обменная цена против цены магазина (0.741) и, вероятно, против цены приёма скинов пользователя. Без входа это не проверить.

### Gaps
- Цену, по которой принимаются скины пользователя, без логина не увидеть.

## 8. Реально ли посчитать агрегированную статистику

### Takeaway
Частично. Без входа доступны снимки топ-100 дорогих предметов и снимки остатков и цен по ~4 865 скинам × степеням износа со страниц `/store/*` (свежесть не гарантирована). По ним можно строить распределения цен, флоатов и сидов в верхнем сегменте и счётчики остатков по моделям. Полное распределение по инвентарю (>1 млн по словам сайта) и оценка оборота по изменениям инвентаря требуют полного каталога, а он закрыт Turnstile.

### Cited Findings
- В ExchangerPreview нет `totalResults` (0) и пагинации, потолок 100 предметов. — собственный запрос, 2026-10-23
- В `/store/<slug>` поле `stocks` даёт остаток и цену по степени износа, например 21/16/7 шт. AK-47 | Redline FT/WW/BS. — [pirateswap.com/store/ak-47-redline](https://pirateswap.com/store/ak-47-redline)
- Sitemap: 13 карт, 4 865 уникальных slug в `/store/`. — [pirateswap.com/sitemap.xml](https://pirateswap.com/sitemap.xml)

### Inferences
- Сумма `stock` по всем `/store/*` даёт оценку размера инвентаря (с поправкой на свежесть кэша), а разница между последовательными снимками — грубую оценку оборота по моделям. Для этого нужно около 4,9 тыс. запросов на снимок, что противоречит требованию «лёгкой нагрузки» и п. 12 ToS при коммерческом использовании. Для разовой выборки по нескольким моделям это реально.
- По `id`/`assetId` в ExchangerPreview можно отслеживать уход конкретных дорогих предметов (продан или обменян) между снимками.

### Gaps
- Совпадают ли `stocks` в `/store/*` с живым инвентарём ботов, проверить без Turnstile-сессии не удалось.
