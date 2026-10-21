"""Поиск гайдов по паттернам на YouTube (открытые страницы, без входа в аккаунт).

Для каждого скина ищем видео на английском и русском, берём подходящие по
названию, открываем страницу видео и достаём из описания дату, просмотры и
номера паттернов. Субтитры недоступны (YouTube требует вход), поэтому номера,
которые автор только произносит вслух, сюда не попадут.

Сырые данные — в parser/cache/youtube/ (в git не идут).
Итог — parser/cache/youtube_videos.json: ссылка, название, канал, дата, найденные номера.
"""
import json, os, re, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'cache', 'youtube')
OUT = os.path.join(HERE, 'cache', 'youtube_videos.json')  # с цитатами из описаний — в git не идёт
PAUSE = 1.5
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)', 'Accept-Language': 'en-US,en;q=0.8,ru;q=0.6'}

# Скины без номеров в гайдах каталога — для них YouTube особенно полезен
EXTRA = ['M4A4 | Etch Lord', 'M4A1-S | Blue Phosphor', 'M4A1-S | Icarus Fell', 'AWP | Printstream',
         'SSG 08 | Blush Pour', 'Galil AR | Caution', 'SCAR-20 | Poultrygeist', 'G3SG1 | Ancient Ritual',
         'USP-S | Alpine Camo', 'USP-S | Tropical Breeze', 'P2000 | Amber Fade', 'Five-SeveN | Neon Kimono',
         'Tec-9 | Ice Cap', 'Tec-9 | Sandstorm', 'Desert Eagle | Emerald Jörmungandr', 'Desert Eagle | Sputnik',
         'P90 | Aeolian Light', 'UMP-45 | Moonrise', 'UMP-45 | Warm Blooded', 'Nova | Windblown',
         'MAG-7 | Sonar', 'Negev | Terrain']
TOPIC = re.compile(r'pattern|seed|паттерн|сид|rare|редк|tier|blue gem|блю|gem|template|max|fade|фейд|best|лучш|top', re.I)
LINE_HINT = re.compile(r'pattern|seed|паттерн|сид|template|tier|\bt[0-4]\b|#\s?\d|gem|max|fade|best|лучш|rank|№', re.I)


def get(url, key, body=None):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, key + '.html')
    if os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            return f.read()
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=dict(UA, **({'Content-Type': 'application/json'} if body else {})))
    with urllib.request.urlopen(req, timeout=30) as r:
        s = r.read().decode('utf-8', 'ignore')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)
    time.sleep(PAUSE)
    return s


def initial_data(s):
    m = re.search(r'var ytInitialData = (\{.*?\});</script>', s, re.S)
    return json.loads(m.group(1)) if m else {}


def walk(o, key):
    if isinstance(o, dict):
        if key in o:
            yield o[key]
        for v in o.values():
            yield from walk(v, key)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v, key)


def norm(t):
    return re.sub(r'[^a-zа-я0-9]+', ' ', t.lower().replace('ö', 'o')).strip()


def search(skin, lang):
    weapon, name = [x.strip() for x in skin.split('|')]
    q = f'{weapon} {name} pattern' if lang == 'en' else f'{weapon} {name} паттерн'
    url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(q)
    key = 'search_' + re.sub(r'\W+', '_', q)
    res = []
    for v in walk(initial_data(get(url, key)), 'videoRenderer'):
        title = ''.join(r['text'] for r in v.get('title', {}).get('runs', []))
        if norm(name) not in norm(title) or not TOPIC.search(title):
            continue
        res.append(v['videoId'])
    return res[:6]


WEAPONS = re.compile(r'AK-?\s?47|SSG\s?08|SG\s?553|M4A[14](?:-S)?|MP\s?[579]|P\s?90|P\s?250|P\s?2000|UMP-?\s?45|MAC-?\s?10|'
                     r'XM\s?1014|G3SG1|SCAR-?\s?20|Tec-?\s?9|CZ\s?75|R8|Glock-?\s?18|MAG-?\s?7|Negev|CS\s?:?\s?GO|CS\s?2|Counter[- ]?Strike\s?2?|'
                     r'\b(?:all|все[хм]?)\s+1\s?000\b|\b1\s?000\s+(?:patterns|паттерн\w*)', re.I)


def numbers(line, title=False):
    line = WEAPONS.sub(' ', line)
    line = re.sub(r'^\s*\d{1,2}\s*[.)-]\s', ' ', line)              # нумерация списка «1. …»
    line = re.sub(r'https?://\S+', ' ', line)
    line = re.sub(r'\b\d{1,2}:\d{2}(:\d{2})?\b', ' ', line)        # таймкоды
    line = re.sub(r'\$\s?\d[\d.,]*|\d[\d.,]*\s?(\$|%|usd|руб|k\b)', ' ', line, flags=re.I)  # цены и проценты
    line = re.sub(r'\b(19|20)\d{2}\b', ' ', line)                   # годы
    line = re.sub(r'\b(t|tier|тир|ст|x|top|топ)[\s-]?\d+\b', ' ', line, flags=re.I)  # «T1», «x4»
    line = re.sub(r'\b\d+\.\d+\b', ' ', line)                       # float
    ns = [int(n) for n in re.findall(r'(?<![\w.])\d{1,4}(?![\w.])', line) if int(n) <= 1000]
    marked = re.findall(r'(?:#|№|seed|pattern|паттерн|сид|template)\s*[:#№]?\s*(\d{1,4})\b', line, re.I)
    marked += re.findall(r'\b(\d{1,4})\s*(?:pattern|seed|паттерн|сид)', line, re.I)
    if len(ns) >= 3 and ns == list(range(ns[0], ns[0] + len(ns))):
        return []  # 1, 2, 3, 4 … — это нумерация, а не паттерны
    if len(ns) >= 2 or marked or (title and ns and ns[0] >= 10):
        return ns  # в названии видео одиночное число рядом с именем скина — почти всегда паттерн
    return []  # одиночное число без пометки («один из 3») — не паттерн


def video(vid):
    # Обычная страница видео с облачного адреса требует «докажите, что не робот»,
    # поэтому берём те же данные через открытый запрос, которым пользуется сам сайт.
    s = get('https://www.youtube.com/youtubei/v1/next?prettyPrint=false', 'next_' + vid,
            {'context': {'client': {'clientName': 'WEB', 'clientVersion': '2.20251001.00.00', 'hl': 'en'}}, 'videoId': vid})
    d = json.loads(s)
    desc = next((x['content'] for k in ('attributedDescriptionBodyText', 'attributedDescription')
                 for x in walk(d, k) if isinstance(x, dict) and 'content' in x), '')
    links = sorted({u for u in re.findall(r'(?:steamcommunity\.com/sharedfiles/filedetails/\?id=|id%3D)(\d{6,})', s)})
    title = next((''.join(r.get('text', '') for r in x.get('runs', [])) for x in walk(d, 'videoPrimaryInfoRenderer')
                  for x in [x.get('title', {})]), '')
    m = re.search(r'"dateText":\{"simpleText":"([^"]+)"', s)
    ch = next((x.get('title', {}).get('runs', [{}])[0].get('text', '') for x in walk(d, 'videoOwnerRenderer')), '')
    views = re.search(r'"viewCount":\{"videoViewCountRenderer":\{"viewCount":\{"simpleText":"([^"]+)"', s)
    seeds, lines = [], []
    for i, line in enumerate([title] + desc.splitlines()):
        if i == 0 or LINE_HINT.search(line) or re.match(r'^\s*\d{1,2}:\d{2}', line):
            ns = numbers(line, title=(i == 0))
            if ns:
                seeds += ns
                lines.append(line.strip()[:200])
    return {'id': vid, 'url': 'https://www.youtube.com/watch?v=' + vid, 'title': title,
            'channel': ch, 'published': m.group(1) if m else '',
            'views': views.group(1) if views else '', 'steam_guides': links, 'seeds': sorted(set(seeds)), 'lines': lines}


def main():
    with open(os.path.join(HERE, 'special_seeds.json'), encoding='utf-8') as f:
        skins = list(json.load(f)['special']) + EXTRA
    out = {}
    if os.path.exists(OUT):
        with open(OUT, encoding='utf-8') as f:
            out = json.load(f)
    for skin in skins:
        if skin in out:
            continue
        ids = []
        for lang in ('en', 'ru'):
            try:
                ids += [i for i in search(skin, lang) if i not in ids]
            except Exception as e:
                print(skin, lang, 'поиск не удался:', e, flush=True)
        vids = []
        for vid in ids:
            try:
                vids.append(video(vid))
            except Exception as e:
                print(skin, vid, 'видео не открылось:', e, flush=True)
        out[skin] = vids
        with open(OUT, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        print(f'{skin}: {len(vids)} видео, с номерами {sum(1 for v in vids if v["seeds"])}', flush=True)


if __name__ == '__main__':
    main()
