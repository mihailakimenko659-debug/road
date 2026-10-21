"""Сбор истории продаж с CSFloat (открытый адрес, без входа в аккаунт).

CSFloat отдаёт по каждому предмету только ~40 последних продаж, поэтому
сохраняем всё в parser/cache/ и при повторном запуске дописываем новые
продажи к старым (по id продажи) — так выборка растёт со временем.

Запуск:  python3 parser/fetch.py            (обычные)
         python3 parser/fetch.py --stattrak (ещё и StatTrak)
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'cache', 'csfloat')
WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']
API = 'https://csfloat.com/api/v1/history/{}/sales'
PAUSE = 1.5          # секунд между запросами — не нагружаем сайт
MIN_REMAINING = 40   # оставляем запас лимита запросов


def cache_path(name):
    safe = ''.join(c if c.isalnum() else '_' for c in name)
    return os.path.join(CACHE, safe + '.json')


def load(name):
    p = cache_path(name)
    if os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    return {'market_hash_name': name, 'fetches': [], 'sales': {}}


def save(name, data):
    with open(cache_path(name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)


def slim(s):
    it = s.get('item', {})
    ref = s.get('reference') or {}
    return {
        'id': s['id'], 'date': s.get('sold_at') or s.get('created_at'),
        'price': s['price'] / 100, 'seed': it.get('paint_seed'),
        'float': it.get('float_value'), 'paint_index': it.get('paint_index'),
        'stattrak': bool(it.get('is_stattrak')), 'souvenir': bool(it.get('is_souvenir')),
        'stickers': len(it.get('stickers') or []), 'keychains': len(it.get('keychains') or []),
        'base_price': (ref.get('base_price') or 0) / 100,
        'predicted_price': (ref.get('predicted_price') or 0) / 100,
        'float_factor': ref.get('float_factor'), 'blue_gem': it.get('blue_gem'),
    }


def fetch(name):
    url = API.format(urllib.parse.quote(name, safe=''))
    req = urllib.request.Request(url, headers={'User-Agent': 'pattern-research (study project)'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            remaining = int(r.headers.get('x-ratelimit-remaining', '999'))
            return json.load(r), remaining
    except urllib.error.HTTPError as e:
        return {'error': e.code}, int(e.headers.get('x-ratelimit-remaining', '0') or 0)


def names(stattrak):
    with open(os.path.join(HERE, 'special_seeds.json'), encoding='utf-8') as f:
        cfg = json.load(f)
    skins = list(cfg['special']) + cfg['control']['skins']
    for skin in skins:
        for w in WEARS:
            yield f'{skin} ({w})'
            if stattrak:
                yield f'StatTrak™ {skin} ({w})'


def main():
    os.makedirs(CACHE, exist_ok=True)
    stattrak = '--stattrak' in sys.argv
    refresh_hours = 20  # не запрашиваем один и тот же предмет чаще
    for name in names(stattrak):
        data = load(name)
        if data['fetches']:
            last = datetime.fromisoformat(data['fetches'][-1]['at'])
            if (datetime.now(timezone.utc) - last).total_seconds() < refresh_hours * 3600:
                continue
            if data['fetches'][-1].get('empty_streak', 0) >= 2:
                continue  # такого износа у скина, похоже, нет
        res, remaining = fetch(name)
        now = datetime.now(timezone.utc).isoformat(timespec='seconds')
        if isinstance(res, dict) and 'error' in res:
            print(f'{name}: HTTP {res["error"]}, лимит {remaining}', flush=True)
            if res['error'] == 429:
                break
            continue
        new = 0
        for s in res:
            if s['id'] not in data['sales']:
                data['sales'][s['id']] = slim(s)
                new += 1
        prev = data['fetches'][-1].get('empty_streak', 0) if data['fetches'] else 0
        data['fetches'].append({'at': now, 'got': len(res), 'new': new,
                                'empty_streak': prev + 1 if not res else 0})
        save(name, data)
        print(f'{name}: {len(res)} продаж (+{new}), лимит {remaining}', flush=True)
        if remaining < MIN_REMAINING:
            print('Лимит запросов почти исчерпан — остановка, продолжу позже.')
            break
        time.sleep(PAUSE)


if __name__ == '__main__':
    main()
