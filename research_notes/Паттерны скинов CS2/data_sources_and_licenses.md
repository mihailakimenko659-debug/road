# Источники данных о паттернах (paint seed) CS2, их лицензии/условия и возможность самостоятельного расчёта

Дата доступа ко всем источникам: 19.10.2026.

Важное методическое ограничение. Из среды, где шло исследование, напрямую открывались только GitHub и raw.githubusercontent.com. Сайты steamdb.info, csfloat.com, pattern.wiki, csdb.gg, csbluegem.com, docs.skinport.com, steamcommunity.com, store.steampowered.com и valvesoftware.com не открылись (ошибка DNS или отказ прокси). Поэтому лицензии и код на GitHub проверены по первоисточнику (файлы LICENSE/README). Условия использования сайтов взяты из сводок поисковой выдачи по их страницам, то есть **косвенно**. Каждый такой пункт помечен ниже, и перед юридическими решениями его нужно перечитать на самом сайте.

## 1. Что предлагает каждый источник и на каких условиях

### Takeaway
По коду картина ясная: ключевые open-source инструменты (калькуляторы fade и blue gem от chescos, ByMykel CSGO-API и image-tracker, csfloat/inspect, cs-inspect-serializer) выпущены под MIT. Их можно использовать и в коммерческом проекте, если сохранить уведомление о копирайте. У коммерческих баз паттернов (SteamDB, CSFloat, csbluegem, csdb.gg, pattern.wiki, cs.money wiki, Buff163) открытой лицензии на данные нет. SteamDB прямо запрещает скрейпинг. Условия остальных проверить не удалось, и по умолчанию их стоит считать «нельзя без разрешения».

### Cited Findings

**Открытый код (проверено по LICENSE/README на GitHub)**
- chescos/csgo-fade-percentage-calculator. Лицензия MIT, «Copyright (c) 2022 chescos». Библиотека переводит paint seed в процент Fade для ножей и оружия с Fade, а также Amber Fade и Acid Fade; перчатки не поддерживаются. — [LICENSE](https://raw.githubusercontent.com/chescos/csgo-fade-percentage-calculator/master/LICENSE), [README](https://github.com/chescos/csgo-fade-percentage-calculator)
- По README, те же значения fade показывают Skinport, CSGOSKINS.GG, SkinsMonkey, SkinBid, BitSkins, CSFloat, GamerPay и DMarket, то есть это де-факто отраслевой стандарт. Утверждение принадлежит автору, независимо не проверено. — [README](https://github.com/chescos/csgo-fade-percentage-calculator)
- chescos/csgo-blue-gem-calculator. Лицензия MIT (Copyright 2022 chescos). Считает «процент синего» для Case Hardened и Heat Treated по seed. Метод: анализ пикселей изображения, где считаются синие пиксели каждого паттерна. В репозитории лежит готовый JSON со значениями для всех поддерживаемых предметов (gen/result.json). По README, те же значения используют CSGOSKINS.GG и Skinport. В поисковой сводке указано, что репозиторий не обновлялся около 448 дней, поэтому актуальность для новых предметов нужно проверить. — [LICENSE](https://raw.githubusercontent.com/chescos/csgo-blue-gem-calculator/master/LICENSE), [README](https://github.com/chescos/csgo-blue-gem-calculator)
- ByMykel/CSGO-API. Лицензия MIT («Copyright (c) 2023 ByMykel»). Это «неофициальный JSON API для Counter-Strike 2»: данные игры (скины, наклейки, кейсы, коллекции) в виде JSON по URL raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/{language}. Хостятся языки en и zh-CN, остальные (включая ru) можно сгенерировать самостоятельно. У скинов есть поля pattern и paint_index. Ссылки на картинки ведут на CDN Steam (cdn.steamstatic.com, community.akamai.steamstatic.com) и на репозиторий counter-strike-image-tracker. — [LICENSE](https://raw.githubusercontent.com/ByMykel/CSGO-API/main/LICENSE), [README](https://github.com/ByMykel/CSGO-API)
- ByMykel/counter-strike-image-tracker. Лицензия MIT (2025). Содержит JSON с соответствием «image_inventory → официальный URL картинки на CDN Steam». MIT распространяется на код и разметку автора, но не на сами изображения Valve (см. раздел 2). — [LICENSE](https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/LICENSE), [README](https://github.com/ByMykel/counter-strike-image-tracker)
- csfloat/inspect (бывший Step7750/CSGOFloat). Лицензия MIT («Copyright (c) 2016 Stepan Fedorko-Bartos»). В README помечен как **Deprecated**: «с марта 2026 все inspect-ссылки CS2 сами кодируют данные предмета», и вместо него рекомендован @csfloat/cs-inspect-serializer. Старой схеме нужны были Steam-аккаунты-боты с CS, около 1 запроса в секунду на аккаунт. В ответе было поле paintseed: «seed для RNG, определяющий, как размещается текстура скина». — [LICENSE](https://raw.githubusercontent.com/csfloat/inspect/master/LICENSE), [README](https://github.com/csfloat/inspect)
- csfloat/cs-inspect-serializer. Лицензия MIT («Copyright (c) 2023 FitChiON»). Форк пакета cs2-inspect-create. Кодирует и декодирует inspect-ссылки CS2 (defindex, paintindex, paintseed, paintwear, стикеры, брелоки) без обращения к серверам Valve. — [README и LICENSE](https://github.com/csfloat/cs-inspect-serializer)
- SteamTracking/GameTracking-CS2 (ссылки SteamDatabase/GameTracking-CS2 ведут сюда). В корне нет файла LICENSE (raw-запросы LICENSE/LICENSE.md вернули 404). README сообщает только «Tracking things, so you don't have to» и отсылает к общему README GameTracking. Там описано, что файлы игры автоматически скачиваются из депо Steam через GitHub Actions. Лицензии нет и у общего репозитория GameTracking. Репозиторий содержит, в частности, items_game.txt (около 8,1 МБ на 19.10.2026). — [GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2), [GameTracking README](https://github.com/SteamTracking/GameTracking)
- Valve Source SDK 2013 (ValveSoftware/source-sdk-2013) распространяется по «SOURCE 1 SDK LICENSE». Разрешено использовать и модифицировать SDK, чтобы делать моды Valve-игр на движке Source 1. Распространять SDK и производные можно только **бесплатно**, с файлом LICENSE, thirdpartylegalnotices.txt и уведомлением о копирайте. — [LICENSE](https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/LICENSE)

**Сайты и базы (условия взяты из поисковых сводок; сами страницы открыть не удалось)**
- SteamDB. FAQ запрещает скрейпинг и краулинг, за авто-обновление и автоматический сбор возможен автоматический бан. Для академического использования нужно разрешение. Продавать или публиковать данные целиком и обучать на них ИИ «строго запрещено». Публичного API и дампов нет, SteamDB советует брать данные напрямую у Steam (Web API, SteamKit). — [SteamDB FAQ](https://steamdb.info/faq/) (через сводку поиска); то, что разработчики в принципе не планируют API, утверждается лишь в комментарии на [Hacker News](https://news.ycombinator.com/item?id=43160456), неофициально.
- CSFloat. Официальный API описан на csfloat.com/api: листинги, детали предметов, пользователи. Нужна аутентификация, действуют собственные лимиты и ToS. Текст ToS о скрейпинге и повторном использовании данных найти не удалось. Неофициальные клиенты прямо предупреждают, что их нужно использовать с соблюдением ToS CSFloat. — [сводка поиска](https://github.com/lheintzmann1/csfloat-rs), [блог CSFloat](https://blog.csfloat.com/how-we-serve-over-500-million-float-requests-per-month/)
- csbluegem.com. Есть API: неофициальная Python-обёртка csbluegempy описывает данные PatternData (процент синего и золотого по сторонам, число продаж, история продаж с ценой и датой). Условия использования API и сайта не найдены. — [csbluegempy docs](https://csbluegempy.readthedocs.io/en/latest/csbluegem.html)
- csdb.gg. Ведёт базу паттернов: процент синего и ранг среди 1000 seed для 22 видов оружия, «измерено по собственной текстуре паттерна paint kit». Есть бесплатный inspect-инструмент, который декодирует новые ссылки в браузере сериализатором CSFloat, а старые разрешает на сервере через Game Coordinator. ToS и лицензия не найдены. — [csdb.gg pattern database](https://csdb.gg/pattern-database/), [csdb.gg inspect](https://csdb.gg/inspect/), [csdb.gg blue gem](https://csdb.gg/blue-gem/)
- pattern.wiki. Позиционирует себя как «CS2 Skin Pattern Checker & Database» и держит справочную статью «Pattern Offsets & Rotation». Сайт открыть не удалось, ToS не проверен. — [pattern.wiki](https://pattern.wiki/), [pattern offsets](https://pattern.wiki/wiki/pattern_offsets/)
- wiki.cs.money и Buff163. Условия использования поиском не найдены, сайты не открылись. Это пробел, см. Gaps.
- Skinport API. Официальная документация (docs.skinport.com) не открылась и в выдачу не попала. Сторонние обёртки указывают, что для части методов нужен API-ключ из аккаунта Skinport, а часть методов публичная. Неподтверждённое утверждение третьей стороны (Apify): Skinport блокирует IP дата-центров против скрейпинга. — [PyPI skinport](https://pypi.org/project/skinport), [npm skinport.js](https://npmjs.com/package/skinport.js), [Apify](https://apify.com/the.beast/cs2-skin-price-tracker)
- Steam Web API. Условия ограничивают ключ 100 000 вызовов в сутки. Valve вправе изменить или прекратить API или доступ конкретного пользователя. Страница условий датирована «Last updated July 2010». — [Steam Web API Terms of Use](https://steamcommunity.com/dev/apiterms) (через сводку поиска)
- Steam Subscriber Agreement. Лицензия на «Content and Services», включая виртуальные предметы из Subscription Marketplace, выдаётся для личного некоммерческого использования. Коммерческая эксплуатация разрешена, только если она явно предусмотрена соглашением или условиями подписки. Steam Community Market назван примером Subscription Marketplace. — [SSA](https://store.steampowered.com/subscriber_agreement/) (через сводку поиска; формулировки разных версий отличаются)

### Inferences
- Для калькулятора трейдов самый безопасный путь — опираться на MIT-код и MIT-данные (chescos, ByMykel, cs-inspect-serializer). Нужно лишь включить текст MIT-лицензии и строку копирайта, например на странице «Лицензии/Благодарности».
- SteamDB как источник данных для сайта исключён, его FAQ прямо запрещает автоматический сбор и републикацию.
- Данные CSFloat, csbluegem, csdb.gg, pattern.wiki, cs.money и Buff163 без письменного разрешения или явной открытой лицензии лучше не копировать массово. Безопаснее ставить на них ссылки («проверить паттерн на ...»).
- GameTracking-CS2 без LICENSE — это просто зеркало файлов Valve. Права на сами файлы остаются у Valve, а не у SteamDB. Читать их для извлечения фактов (диапазоны offset/rotation, индексы paint kit) по смыслу допустимо, но выкладывать сами игровые файлы целиком не стоит. Это вывод, а не прямо найденное правило Valve.

### Gaps
- Не удалось прочитать первоисточники ToS: CSFloat, csbluegem, csdb.gg, pattern.wiki, wiki.cs.money, Buff163 (включая пользовательское соглашение NetEase), Skinport API (лимиты, кэш, требования к атрибуции), а также robots.txt этих сайтов. Всё заблокировано в среде исследования, проверять нужно вручную в браузере.
- Не найдены страницы Valve с правилами для фан-сайтов и сайтов-инструментов (video policy и аналоги), их тоже не удалось открыть.

## 2. Что можно переиспользовать: факты, базы данных, изображения, атрибуция

### Takeaway
Голые факты (у предмета X seed N, его fade 93%) сами по себе не защищены авторским правом. Но в ЕС у составителя базы может возникнуть право sui generis, если он существенно вложился в сбор, проверку или подачу данных. Тогда извлекать «существенную часть» базы или систематически вытягивать её по кусочкам нельзя. Картинки скинов и текстуры принадлежат Valve, MIT-лицензии репозиториев на них не распространяются.

### Cited Findings
- Право sui generis по Директиве ЕС о базах данных 96/9/EC защищает от извлечения или повторного использования всей базы или её существенной части. Оно также запрещает многократное систематическое извлечение несущественных частей, если это мешает нормальной эксплуатации базы. Срок защиты 15 лет, он продлевается при новой существенной инвестиции. — [vLex](https://eu.vlex.com/vid/838508613), [Open Rights Group](https://wiki.openrightsgroup.org/wiki/Databases)
- По решению CJEU по делу British Horseracing Board учитываются только инвестиции в получение, проверку или подачу содержимого. Инвестиции в само *создание* данных не учитываются, поэтому, например, списки забегов защиты не получили. Простой просмотр базы не считается извлечением. — [Mondaq](https://mondaq.com/uk/ip/30575/the-ecj-interprets-the-database-sui-generis-right)
- Скрейпинг обычно запрещают договорными условиями сайта. Browsewrap-условия, которые просто висят где-то на сайте, исполнимы хуже, чем принятые явно (обзор права США). — [Keker](https://www.keker.com/Templates/media/files/Articles/Paven%20Legal%20Tech%20Article%20Great%20Scrape.pdf), [Skadden](https://www.skadden.com/-/media/files/publications/2014/01/070071319-skadden.pdf)
- SSA: лицензия на контент Steam и виртуальные предметы выдаётся для личного некоммерческого использования, если коммерческое не разрешено явно. — [SSA](https://store.steampowered.com/subscriber_agreement/) (через сводку поиска)
- Source 1 SDK License разрешает распространять код SDK только бесплатно и с сохранением лицензии Valve. — [LICENSE](https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/LICENSE)
- ByMykel CSGO-API и image-tracker отдают не сами картинки, а ссылки на официальный CDN Steam. — [README image-tracker](https://github.com/ByMykel/counter-strike-image-tracker)

### Inferences
- Если сайт сам вычисляет fade% или blue% по seed с помощью MIT-кода или собственного расчёта, это собственные данные и чужое право на базу не задевается. Копировать чужую таблицу «tier 1 / tier 2 seed» целиком (csbluegem, csdb.gg, cs2.io) в ЕС рискованно с точки зрения sui generis. Отдельные широко известные факты («AK-47 seed 661 — топовый blue gem») — нет.
- Картинки скинов безопаснее показывать по ссылкам на CDN Steam, как делает ByMykel, а не перезаливать их. Кроме того, добавить дисклеймер «не связано с Valve; Counter-Strike — товарный знак Valve». Насколько это допустимо при коммерческой монетизации, прямой нормой Valve подтвердить не удалось, это вывод.
- Атрибуция обязательна для MIT-кода (копирайт и текст лицензии). Для данных Valve формальных требований к атрибуции не найдено.
- Это не юридическая консультация. При монетизации стоит показать конкретную схему юристу, особенно по части ЕС и условий маркетплейсов.

### Gaps
- Официальной позиции Valve о том, могут ли сторонние коммерческие сайты использовать картинки предметов и данные items_game, не найдено: страницы Valve были недоступны.
- Нет данных о судебной практике именно по базам паттернов CS2.

## 3. Можно ли самостоятельно вычислить качество паттерна (blue %, fade %, расположение паутины)

### Takeaway
Да, частично. Seed детерминированно задаёт до трёх чисел: смещение X, смещение Y и поворот текстуры. Генератор случайных чисел воспроизведён в открытом MIT-коде (chescos). Fade% считается чистой математикой без игровых ассетов. Для blue% и расположения паутины одной математики мало: нужно наложить текстуру Valve на UV-развёртку модели и посчитать пиксели. Текстуры принадлежат Valve, их нельзя распространять, но можно использовать локально и публиковать только вычисленные числа (вывод).

### Cited Findings
- Seed (pattern index) находится в диапазоне 0–1000 и задаёт смещения X и Y и поворот паттерна. По словам автора, эти три значения считаются алгоритмом, «который Valve открыла». Для большинства Fade смещения фиксированы, меняется только поворот. Лучший поворот считается 100% Fade, худший — 80%. — [README chescos fade](https://github.com/chescos/csgo-fade-percentage-calculator)
- В коде chescos (BaseCalculator.ts, RandomNumberGenerator.ts) для каждого seed по очереди генерируются три float: X в диапазоне pattern_offset_x_start..end, затем Y, затем rotation в pattern_rotate_start..end. Для оружия из trade-up коллекций seed перебирается до 1000, для остальных до 999. Некоторые скины (например, MP7) используют и поворот, и X-смещение, а M4A1-S — только X-смещение. Генератор устроен как классический RNG Park–Miller/«ran1» из Numerical Recipes, на это указывают константы IA, IQ, IR, AM; источник у Valve в коде не процитирован. — [BaseCalculator.ts](https://github.com/chescos/csgo-fade-percentage-calculator/blob/master/src/modules/BaseCalculator.ts), [RandomNumberGenerator.ts](https://github.com/chescos/csgo-fade-percentage-calculator/blob/master/src/modules/RandomNumberGenerator.ts)
- Диапазоны отличаются по скинам. Case Hardened допускает поворот 0–360°, у Karambit Marble Fade поворот от −70° до −50°. Технический разбор isitabluegem утверждает, что seed порождает до 11 псевдослучайных float для разных слоёв текстуры, а масштаб задаётся в items_game.txt. Это сторонние источники. — [pattern.wiki: Pattern Offsets & Rotation](https://pattern.wiki/wiki/pattern_offsets/) (через сводку поиска), [isitabluegem insights](https://www.isitabluegem.com/insights)
- В текущем items_game.txt CS2 (зеркало GameTracking-CS2, 19.10.2026) **нет** полей pattern_offset_* или pattern_rotate_*. Например, у paint kit «aq_oiled» (Case Hardened) записаны только wear_default, seed, style и wear_remap_min/max. Диапазоны смещений, которые chescos держит в своих конфигах, в этом файле отсутствуют. Проверено поиском по файлу. — [items_game.txt](https://raw.githubusercontent.com/SteamTracking/GameTracking-CS2/master/game/csgo/pak01_dir/scripts/items/items_game.txt)
- Blue% у chescos считается анализом пикселей изображения, а не одной математикой. csdb.gg тоже измеряет процент синего «по собственной текстуре паттерна paint kit». — [README blue gem calc](https://github.com/chescos/csgo-blue-gem-calculator), [csdb.gg](https://csdb.gg/pattern-database/)
- Код расчёта Valve уровня Source 1 SDK распространяется только бесплатно, по лицензии Valve. — [Source 1 SDK License](https://raw.githubusercontent.com/ValveSoftware/source-sdk-2013/master/LICENSE)

### Inferences
- Fade%: сайт может считать сам или просто подключить MIT-пакет chescos, при этом значения совпадут с крупными площадками.
- Blue%: проще всего взять готовый MIT JSON chescos (gen/result.json) и указать атрибуцию. Посчитать заново можно так: извлечь текстуру и модель из файлов игры, наложить их с offset и rotation из RNG и посчитать синие пиксели. Для этого нужен программист и игровые ассеты. Публиковать сами текстуры нельзя, вычисленные проценты — по смыслу можно.
- Расположение паутины (Crimson Web) и других паттернов требует того же рендера или анализа пикселей. Готового открытого кода именно для паутины не найдено.
- В CS2 диапазоны offset и rotation, видимо, хранятся не в items_game.txt, а в файлах материалов paint kit (предположительно composite material). Это предположение, подтверждения не найдено.

### Gaps
- Не найден конкретный файл Valve с исходником RNG (путь в source-sdk-2013 не подтверждён: random.cpp по проверенным путям вернул 404). Где в CS2 хранятся pattern_offset и rotate, тоже не подтверждено.
- Не найден открытый код для анализа паутины, Fire & Ice и Marble Fade, кроме коммерческих сайтов.
- Лицензионные условия Valve на извлечение и локальное использование текстур не найдены, вывод о запрете распространения основан на SSA и общих принципах.

## 4. Свойство «Pattern Template» на Steam Community Market и inspect-ссылки

### Takeaway
Бета обновлённого Steam Community Market стартовала 12 мая 2026 года. Листинги CS2 теперь показывают pattern template (по сути seed), точный износ (float) и шаблоны брелоков, а также сгенерированные изображения конкретного предмета. С марта 2026 года inspect-ссылки CS2 сами кодируют данные предмета (float, paint seed, paint index), и для их декодирования не нужны боты.

### Cited Findings
- Обновление Steam Community Market вышло в бету 12 мая 2026 года, CS2 стал главным полигоном. На листингах стали видны «pattern template, wear/float и charm template». Valve сгенерировала «более 27 млн уникальных изображений», чтобы заполнить уже существующие листинги CS2. Появились фильтры по float, а стикеры и брелоки привязаны к собственным листингам. — [PCGamesN](https://www.pcgamesn.com/steam/community-market-update), [GamesRadar](https://www.gamesradar.com/games/valve-cant-stop-winning-new-steam-update-revamps-community-market-with-bigger-better-listings-and-more-much-to-counter-strike-2-fans-delight/), [Skinbase](https://skinbase.io/blog/steam-community-market-update-cs2-may-2026), [Hotspawn](https://www.hotspawn.com/counter-strike/news/new-steam-community-market-update-overhauls-cs2-skins-pages); официальный анонс — [Steam News](https://steamcommunity.com/games/593110/announcements/detail/673994309884707671) (открыть не удалось)
- По оценке одних изданий, после обновления inspect-серверы больше не нужны, чтобы посмотреть предмет перед покупкой. Другие пишут лишь, что предмет можно осмотреть без запуска игры. Формулировки расходятся. — [TalkEsport](https://www.talkesport.com/news/cs2/cs2-steam-market-update-inspect-skin-wear-float/), [Upcomer](https://upcomer.com/steam-launches-massive-update-to-the-cs2-market/)
- С марта 2026 года все inspect-ссылки CS2 сами кодируют данные предмета, рекомендуется @csfloat/cs-inspect-serializer. — [README csfloat/inspect](https://github.com/csfloat/inspect)
- На форуме разработчиков DoctorMcKay описано, что новый «сертификат» предмета декодируется в protobuf с defindex, paint index, paint seed и float. Там же замечено, что история рынка и трейдов больше не отдаёт валидные inspect-ссылки для не-обычных предметов, а только ссылки-ссылки (references). Это наблюдение сообщества, а не заявление Valve. — [dev.doctormckay.com](https://dev.doctormckay.com/topic/5926-new-cs2-inspect-links/)

### Inferences
- Для калькулятора это значит, что seed и float можно получать из inspect-ссылки пользователя локально, MIT-сериализатором, без ботов и без чужих API. Это и юридически, и технически самый чистый путь.
- Значение «Pattern Template» на рынке Steam, по всей видимости, совпадает с paint seed, но точного определения Valve найти не удалось.

### Gaps
- Официальный текст анонса Valve о Pattern Template и точное определение поля прочитать не удалось.
- Не проверено, отдаёт ли публичный JSON или Web API Steam Market поле pattern template и разрешено ли машинное получение этих данных.
