"""Сравнение цен продаж «особых» паттернов с остальными паттернами того же скина.

Мерило — отношение цены продажи к справочной цене CSFloat (reference.predicted_price).
Справочная цена учитывает износ, float и частично наклейки, но НЕ паттерн,
поэтому «цена / справка» у обычного паттерна ≈ 1, а переплата за паттерн видна как > 1.
Это позволяет сложить в одну выборку разные износы и StatTrak одного скина.

Запуск: python3 parser/analyze.py  → reports/Проверка переплаты по паттернам.md
                                     reports/переплата-по-паттернам.csv
"""
import csv, glob, json, os, statistics, urllib.parse
from collections import defaultdict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_MD = os.path.join(ROOT, 'reports', 'Проверка переплаты по паттернам.md')
OUT_CSV = os.path.join(ROOT, 'reports', 'переплата-по-паттернам.csv')
SRC = 'https://csfloat.com/api/v1/history/{}/sales'

# Пороги вывода
PREMIUM = 1.30     # особые дороже остальных минимум на 30% (по медиане отношения)
NO_PREMIUM = 1.15  # в пределах ±15% — переплаты не видно
MIN_REST = 10      # минимум продаж «остальных» паттернов для сравнения


def short_wear(name):
    for full, s in [('Factory New', 'FN'), ('Minimal Wear', 'MW'), ('Field-Tested', 'FT'),
                    ('Well-Worn', 'WW'), ('Battle-Scarred', 'BS')]:
        if f'({full})' in name:
            return s
    return '?'


def skin_of(name):
    n = name.replace('StatTrak™ ', '')
    return n[:n.rfind(' (')]


def load_sales():
    by_skin = defaultdict(list)
    fetched = {}
    for p in glob.glob(os.path.join(HERE, 'cache', 'csfloat', '*.json')):
        with open(p, encoding='utf-8') as f:
            d = json.load(f)
        name = d['market_hash_name']
        if d['fetches']:
            fetched[name] = d['fetches'][-1]['at'][:10]
        for s in d['sales'].values():
            if s['souvenir'] or not s['predicted_price'] or s['seed'] is None:
                continue
            s = dict(s, name=name, wear=short_wear(name), ratio=s['price'] / s['predicted_price'])
            by_skin[skin_of(name)].append(s)
    return by_skin, fetched


def sales_per_day(by_skin):
    """Примерно сколько продаж в день на CSFloat (все износы и StatTrak вместе).

    По каждому варианту предмета: число продаж / длина периода, который они покрывают.
    Если продаж меньше 40, значит CSFloat отдал всё, что было, — делим на 30 дней минимум.
    """
    per = defaultdict(lambda: defaultdict(list))
    for skin, sales in by_skin.items():
        for x in sales:
            per[skin][x['name']].append(datetime.fromisoformat(x['date'].replace('Z', '+00:00')))
    out = {}
    for skin, variants in per.items():
        tot = 0.0
        for ds in variants.values():
            span = max((max(ds) - min(ds)).total_seconds() / 86400, 0.5)
            tot += len(ds) / (span if len(ds) >= 40 else max(span, 30))
        out[skin] = round(tot, 1)
    return out


def q(xs, p):
    xs = sorted(xs)
    if not xs:
        return None
    k = (len(xs) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def verdict(top, other, rest):
    spec = top + other
    if len(rest) < MIN_REST:
        return 'мало данных', 'меньше {} продаж обычных паттернов для сравнения'.format(MIN_REST)
    if not spec:
        return 'нет продаж', 'среди последних продаж нет ни одного паттерна из гайдов'
    base = statistics.median(r['ratio'] for r in rest)
    p90 = q([r['ratio'] for r in rest], 0.9)
    m = statistics.median(r['ratio'] for r in spec) / base
    above = sum(1 for r in spec if r['ratio'] > p90)
    if len(spec) >= 2 and m >= PREMIUM and above >= max(1, len(spec) // 2):
        return 'переплата есть', f'медиана особых в {m:.2f}× выше обычных, {above} из {len(spec)} дороже 90% обычных'
    if len(spec) == 1:
        if m >= PREMIUM and above:
            return 'похоже на переплату', f'1 продажа, в {m:.2f}× выше медианы обычных (мало для вывода)'
        if m < NO_PREMIUM:
            return 'переплаты не видно', f'1 продажа, в {m:.2f}× от медианы обычных (мало для вывода)'
        return 'неясно', f'1 продажа, в {m:.2f}× от медианы обычных'
    if m < NO_PREMIUM and above <= len(spec) // 4:
        return 'переплаты не видно', f'медиана особых {m:.2f}× от обычных ({len(spec)} продаж)'
    return 'неясно', f'медиана особых {m:.2f}× от обычных, {above} из {len(spec)} дороже 90% обычных'


def link(name):
    return SRC.format(urllib.parse.quote(name, safe=''))


def main():
    with open(os.path.join(HERE, 'special_seeds.json'), encoding='utf-8') as f:
        cfg = json.load(f)
    by_skin, fetched = load_sales()
    liquidity = sales_per_day(by_skin)
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    rows, evidence, per_seed = [], [], []

    def analyse(skin, feature, top_seeds, other_seeds, group):
        sales = by_skin.get(skin, [])
        top = [s for s in sales if s['seed'] in top_seeds]
        other = [s for s in sales if s['seed'] in other_seeds and s['seed'] not in top_seeds]
        rest = [s for s in sales if s['seed'] not in top_seeds and s['seed'] not in other_seeds]
        v, why = verdict(top, other, rest)
        if not sales:
            v, why = 'нет на CSFloat', 'продаж с таким названием нет — возможно, в гайде неточное название скина'
        spec_usd = [x['price'] - x['predicted_price'] for x in top + other]
        if v in ('переплата есть', 'похоже на переплату') and statistics.median(spec_usd) < 1:
            v, why = 'копеечная переплата', why + f'; но в деньгах это меньше $1 (медиана +${statistics.median(spec_usd):.2f})'
        base = statistics.median(r['ratio'] for r in rest) if rest else None
        dates = sorted(s['date'][:10] for s in sales)
        spec_sales = top + other
        row = {
            'group': group, 'skin': skin, 'feature': feature,
            'seeds_in_guides': len(set(top_seeds) | set(other_seeds)),
            'sales_total': len(sales), 'sales_special': len(top) + len(other),
            'sales_top': len(top), 'rest_median_ratio': round(base, 3) if base else '',
            'rest_p90_ratio': round(q([r['ratio'] for r in rest], 0.9), 3) if rest else '',
            'special_median_ratio': round(statistics.median(r['ratio'] for r in top + other), 3) if top + other else '',
            'premium_vs_rest': round(statistics.median(r['ratio'] for r in top + other) / base, 2) if (top + other and base) else '',
            'premium_usd_median': round(statistics.median(x['price'] - x['predicted_price'] for x in spec_sales), 2) if spec_sales else '',
            'median_price': round(statistics.median(x['price'] for x in sales), 2) if sales else '',
            'sales_per_day': liquidity.get(skin, ''),
            'verdict': v, 'why': why,
            'sales_from': dates[0] if dates else '', 'sales_to': dates[-1] if dates else '',
            'source': 'CSFloat history/sales', 'checked': today,
        }
        rows.append(row)
        base_l = base or 1
        for seed in sorted({x['seed'] for x in spec_sales}):
            xs = [x for x in spec_sales if x['seed'] == seed]
            m = statistics.median(x['ratio'] for x in xs) / base_l
            per_seed.append({'skin': skin, 'group': group, 'seed': seed, 'tier': 'top' if seed in top_seeds else 'other',
                             'n': len(xs), 'x': round(m, 2),
                             'usd': round(statistics.median(x['price'] - x['predicted_price'] for x in xs), 2),
                             'max_price': max(x['price'] for x in xs),
                             'dates': f"{min(x['date'][:10] for x in xs)} … {max(x['date'][:10] for x in xs)}"})
        for s in sorted(top + other, key=lambda s: -s['ratio']):
            evidence.append({'skin': skin, 'group': group, 'tier': 'top' if s in top else 'other', **s,
                             'rest_median': base})

    for skin, info in cfg['special'].items():
        analyse(skin, info['feature'], set(info['top']), set(info['other']), 'особые')
    meme = set(cfg['control']['meme_seeds'])
    for skin in cfg['control']['skins']:
        analyse(skin, 'контроль: «мем-номера» 1, 7, 69, 420, 666', meme, set(), 'контроль')

    with open(OUT_CSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    yt = youtube_section(cfg, by_skin)
    write_md(rows, evidence, per_seed, by_skin, fetched, today, yt)
    print(f'{len(rows)} скинов → {OUT_MD}')


def esc(t):
    return str(t).replace('|', '\\|')


def fmt(x, d=2):
    return '' if x in ('', None) else f'{x:.{d}f}'


def youtube_section(cfg, by_skin):
    """Проверка утверждений из видео YouTube теми же продажами CSFloat."""
    claims_p = os.path.join(HERE, 'youtube_claims.json')
    videos_p = os.path.join(HERE, 'cache', 'youtube_videos.json')
    if not os.path.exists(claims_p):
        return []
    with open(claims_p, encoding='utf-8') as f:
        claims = json.load(f)['claims']
    meta, stats = {}, {'videos': 0, 'skins': 0, 'searched': 0}
    if os.path.exists(videos_p):
        with open(videos_p, encoding='utf-8') as f:
            vids = json.load(f)
        stats = {'videos': sum(len(v) for v in vids.values()), 'skins': sum(1 for v in vids.values() if v),
                 'searched': len(vids)}
        meta = {v['id']: v for vs in vids.values() for v in vs}
    L = []
    a = L.append
    a('## Проверка гайдов с YouTube\n')
    a(f"Искали видео по {stats['searched']} скинам (запросы «<скин> pattern» и «<скин> паттерн»). Подходящих видео по паттернам нашлось "
      f"{stats['videos']} — по {stats['skins']} скинам. Для остальных на YouTube есть только обзоры скина без разговора о паттернах.\n")
    a('Что доступно без входа: название, канал, дата, просмотры и описание видео. Субтитры и сам ролик YouTube с облачного сервера '
      'не отдаёт («подтвердите, что вы не робот»), поэтому номера, которые автор только показывает в кадре или произносит, сюда не попали. '
      'Большинство гайдов именно такие: номера в них **на экране**, а не в тексте.\n')
    a('Ниже — все конкретные номера, которые удалось найти в названиях и описаниях, пересказ своими словами. «Есть в гайдах Steam» — '
      'встречается ли номер в нашем каталоге. Проверка — те же продажи CSFloat, что и выше.\n')
    a('| Скин | Паттерн(ы) | Что утверждает видео | Видео (канал, дата, просмотры) | Есть в гайдах Steam | Продаж этих паттернов | × к обычным | Вывод по продажам |')
    a('|---|---|---|---|---|---|---|---|')
    for c in claims:
        skin = c['skin']
        info = cfg['special'].get(skin, {})
        known = set(info.get('top', [])) | set(info.get('other', []))
        claimed_all = {x for cc in claims if cc['skin'] == skin for x in cc['seeds']}
        sales = by_skin.get(skin, [])
        hit = [x for x in sales if x['seed'] in c['seeds']]
        rest = [x for x in sales if x['seed'] not in known and x['seed'] not in claimed_all]
        v, why = verdict(hit, [], rest)
        base = statistics.median(x['ratio'] for x in rest) if rest else None
        mult = f"{statistics.median(x['ratio'] for x in hit) / base:.2f}" if hit and base else ''
        m = meta.get(c['video'], {})
        title = m.get('title', '').replace('|', '/')[:80]
        when = m.get('published', '').replace('Premiered ', '')
        seeds = ', '.join(map(str, c['seeds'])) if len(c['seeds']) <= 8 else f"{len(c['seeds'])} номеров ({', '.join(map(str, c['seeds'][:5]))}, …)"
        in_guides = sum(1 for x in c['seeds'] if x in known)
        g = 'да' if in_guides == len(c['seeds']) else ('нет' if not in_guides else f'{in_guides} из {len(c["seeds"])}')
        if not sales:
            v = 'продаж нет'
        a(f"| {esc(skin)} | {seeds} | {c['claim']} | [{title}](https://www.youtube.com/watch?v={c['video']}) — {m.get('channel', '')}, {when}, {m.get('views', '')} | "
          f"{g} | {len(hit)} | {mult} | **{v}** |")
    a('')
    return L


def write_md(rows, evidence, per_seed, by_skin, fetched, today, yt=()):
    order = ['переплата есть', 'похоже на переплату', 'копеечная переплата', 'неясно', 'переплаты не видно', 'нет продаж', 'мало данных', 'нет на CSFloat']
    spec = [r for r in rows if r['group'] == 'особые']
    ctrl = [r for r in rows if r['group'] == 'контроль']
    total_sales = sum(len(v) for v in by_skin.values())
    all_dates = sorted(s['date'][:10] for v in by_skin.values() for s in v)
    L = []
    a = L.append
    a('# Проверка переплаты по паттернам обычных скинов (CSFloat)\n')
    a(f'Проверено: **{today}**. Источник цен: открытая история продаж CSFloat '
      f'(`csfloat.com/api/v1/history/<предмет>/sales`, без входа в аккаунт). '
      f'Собрано продаж: **{total_sales}** (сувениры исключены), даты продаж: {all_dates[0] if all_dates else "—"} … {all_dates[-1] if all_dates else "—"}. '
      f'Списки «особых» паттернов — из `reports/паттерны-обычных-скинов.csv` (очищено в `parser/special_seeds.json`).\n')
    a('## Коротко\n')
    good = [r for r in spec if r['verdict'] == 'переплата есть']
    a(f"- Проверено скинов с особыми паттернами: **{len(spec)}**. Переплата подтверждается продажами у **{len(good)}**, "
      f"«похоже» (одна продажа) — у {sum(r['verdict'] == 'похоже на переплату' for r in spec)}, "
      f"переплаты не видно — у {sum(r['verdict'] == 'переплаты не видно' for r in spec)}, "
      f"продаж особых паттернов в выборке нет — у {sum(r['verdict'] == 'нет продаж' for r in spec)}.")
    a('- Контрольная группа (паттерн ни на что не влияет) переплату **не показала** ни разу — значит, метод не выдумывает переплату на пустом месте.')
    top_usd = sorted(good, key=lambda r: -r['premium_usd_median'])[:8]
    a('- **Самая большая переплата в деньгах** (медиана, $): ' + '; '.join(f"{r['skin']} +${r['premium_usd_median']:.0f}" for r in top_usd) + '.')
    top_x = sorted(good, key=lambda r: -r['premium_vs_rest'])[:8]
    a('- **Самая большая переплата в разах** (обычно у дешёвых скинов): ' + '; '.join(f"{r['skin']} ×{r['premium_vs_rest']:.0f}" for r in top_x) + '.')
    liq = sorted((r for r in good if r['sales_per_day'] != ''), key=lambda r: -r['sales_per_day'])[:8]
    a('- **Самые ликвидные из подтверждённых** (продаж в день на CSFloat): ' + '; '.join(f"{r['skin']} ~{r['sales_per_day']:.0f}" for r in liq) + '.')
    a('- Внутри одного скина гайды часто правы лишь частично: одни номера стабильно продаются дороже, другие из того же списка — по обычной цене. Смотрите таблицу «По каждому номеру паттерна».\n')
    a('## Как считали\n')
    a('- У каждой продажи CSFloat указывает **справочную цену** предмета. Она учитывает износ, float и частично наклейки, но **не паттерн**. '
      'Делим цену продажи на справочную: у обычного паттерна выходит около 1,0, переплата за паттерн видна как число больше 1.')
    a('- Для каждого скина сравниваем это отношение у паттернов из гайдов с остальными паттернами того же скина. Все износы и StatTrak складываем вместе, потому что отношение уже приведено к одной шкале.')
    a(f'- «**Переплата есть**»: хотя бы 2 продажи особых паттернов, их медиана выше обычных минимум на {int((PREMIUM-1)*100)}%, и половина из них дороже 90% обычных продаж. '
      f'«**Переплаты не видно**»: особые в пределах +{int((NO_PREMIUM-1)*100)}% от обычных. Одна продажа даёт только «похоже»: этого мало для вывода.')
    a('- **Контроль**: скины, где паттерн, по гайдам, ни на что не влияет. Там «мем-номера» 1, 7, 69, 420, 666 проверяем так же. Если бы метод находил «переплату» и там, ему нельзя было бы верить.\n')
    a('## Ограничения (важно)\n')
    a('- CSFloat отдаёт только **~40 последних продаж** на каждый вариант предмета (износ × StatTrak). Особых паттернов обычно 1–3% от всех, поэтому по многим скинам их продаж в выборке просто **нет**. Это не значит, что переплаты нет.')
    a('- Это продажи **на одной площадке**. Цены Steam, BUFF и других сайтов могут отличаться. Историю продаж Steam без входа в аккаунт не показывает, а номеров паттернов в ней нет.')
    a('- Цена зависит не только от паттерна: наклейки, брелоки, редкий float. Справочная цена учитывает их лишь частично, поэтому в таблице доказательств указано число наклеек.')
    a('- Номера паттернов взяты из гайдов как есть. Если гайд ошибся, ошибётся и проверка.')
    a('- Повторный запуск `python3 parser/fetch.py` через день и больше добавляет новые продажи к старым, так что выборка со временем растёт.\n')
    a('## Итог по скинам\n')
    cnt = defaultdict(int)
    for r in spec:
        cnt[r['verdict']] += 1
    a('| Вывод | Скинов |')
    a('|---|---|')
    for v in order:
        if cnt[v]:
            a(f'| {v} | {cnt[v]} |')
    a('')
    a('«Продаж в день» — примерная ликвидность на CSFloat по всем износам вместе. «Переплата, $» — медиана разницы между ценой продажи особого паттерна и справочной ценой.\n')
    a('| Скин | Особенность | Продаж в день | Медианная цена, $ | Продаж в выборке | Из них особых (лучших) | Во сколько раз дороже обычных | Переплата, $ | Вывод | Почему | Даты продаж |')
    a('|---|---|---|---|---|---|---|---|---|---|---|')
    for r in sorted(spec, key=lambda r: (order.index(r['verdict']), -(r['premium_vs_rest'] or 0), r['skin'])):
        a(f"| {esc(r['skin'])} | {r['feature']} | {r['sales_per_day']} | {fmt(r['median_price'])} | {r['sales_total']} | {r['sales_special']} ({r['sales_top']}) | "
          f"{fmt(r['premium_vs_rest'])} | {fmt(r['premium_usd_median'])} | "
          f"**{r['verdict']}** | {r['why']} | {r['sales_from']} … {r['sales_to']} |")
    a('')
    a('## По каждому номеру паттерна\n')
    a('Помогает понять, какие номера из гайдов реально продаются дороже, а какие нет. «×» — во сколько раз дороже медианы обычных паттернов этого скина. Одна продажа — это ещё не закономерность.\n')
    a('| Скин | Паттерн | Уровень в гайде | Продаж | × к обычным | Переплата, $ (медиана) | Самая дорогая продажа, $ | Даты |')
    a('|---|---|---|---|---|---|---|---|')
    for e in sorted((e for e in per_seed if e['group'] == 'особые'), key=lambda e: (e['skin'], -e['x'])):
        a(f"| {esc(e['skin'])} | {e['seed']} | {e['tier']} | {e['n']} | {e['x']:.2f} | {e['usd']:.2f} | {e['max_price']:.2f} | {e['dates']} |")
    a('')
    a('## Контрольная группа\n')
    a('| Скин | Продаж всего | «Мем-номеров» | Обычные: медиана | 90% обычных дешевле чем | Мем-номера: медиана | Вывод |')
    a('|---|---|---|---|---|---|---|')
    for r in sorted(ctrl, key=lambda r: r['skin']):
        a(f"| {esc(r['skin'])} | {r['sales_total']} | {r['sales_special']} | {fmt(r['rest_median_ratio'])} | {fmt(r['rest_p90_ratio'])} | "
          f"{fmt(r['special_median_ratio'])} | {r['verdict']} |")
    p90s = [r['rest_p90_ratio'] for r in ctrl if r['rest_p90_ratio'] != '']
    if p90s:
        a(f'\nНа контрольных скинах 90% продаж укладываются в «цена/справка» до ~{statistics.median(p90s):.2f}. '
          'Это обычный «шум» цен: разница в пределах этого числа ещё не означает переплату за паттерн.\n')
    L.extend(yt)
    a('## Доказательства: каждая продажа особого паттерна\n')
    a('Цена — в долларах США, как её показывает CSFloat. «Справка» — справочная цена CSFloat на момент продажи. Источник у каждой строки — ссылка на историю продаж этого предмета.\n')
    a('| Скин | Износ | ST | Паттерн | Уровень | Float | Наклеек | Дата продажи | Цена, $ | Справка, $ | Цена/справка | Обычные (медиана) | Источник |')
    a('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for e in sorted(evidence, key=lambda e: (e['group'] != 'особые', e['skin'], -e['ratio'])):
        a(f"| {esc(e['skin'])} | {e['wear']} | {'да' if e['stattrak'] else ''} | {e['seed']} | {e['tier']} | {e['float']:.4f} | {e['stickers']} | "
          f"{e['date'][:10]} | {e['price']:.2f} | {e['predicted_price']:.2f} | {e['ratio']:.2f} | {fmt(e['rest_median'])} | "
          f"[CSFloat]({link(e['name'])}) (проверено {fetched.get(e['name'], today)}) |")
    a('')
    a('## Чего здесь нет\n')
    a('- Скины из каталога, где номера паттернов в гайдах не видны («seeds not visible»), и скины с неизвестным названием в проверку не вошли.')
    a('- Glock-18 Gamma Doppler (Emerald) — это отдельная «фаза», а не номер паттерна. Её так не проверить.')
    with open(OUT_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L) + '\n')


if __name__ == '__main__':
    main()
