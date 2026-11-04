from pathlib import Path
import hashlib
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
GAMES = [
    ('sushi', '초밥 뷔페', 'stadium/games/sushi.html', '1–4인', 'PARTY'),
    ('says', '칠판 기억왕', 'stadium/games/says.html', '1–4인', 'MEMORY'),
    ('harden', '딱딱하게!', 'stadium/games/harden.html', '1–4인', 'TIMING'),
    ('stampede', '친구 세기', 'stadium/games/stampede.html', '1–4인', 'PARTY'),
    ('crossroad', '길 건너 한 판', 'crossroad/', '1인', 'VOXEL'),
    ('stairs', '끝없는 계단', 'stairs/', '1인', 'ARCADE'),
    ('platformer', '구름길 어드벤처', 'platformer/', '1인', 'PLATFORMER'),
    ('ramen', '보글보글 라면가게', 'ramen/', '1인', 'COOKING'),
    ('rangers', '출동! 수호전대', 'rangers/', '1인', 'ACTION'),
    ('ringout', '링아웃', 'ringout/', '1인 · CPU 대전', 'BRAWLER'),
    ('football-rescue', '플라잉 슛 구출작전', 'football-rescue/', '1인', 'ACTION'),
    ('gate-defense', '게이트 러시', 'gate-defense/', '1인', 'RUNNER'),
    ('chess', '클래식 체스', 'chess/', '1인', 'BOARD'),
]

def version(path):
    f = PUBLIC / path
    return hashlib.sha256(f.read_bytes()).hexdigest()[:10] if f.exists() else 'new'

cards = []
for index, (id, title, url, players, genre) in enumerate(GAMES):
    poster = f'art/previews/{id}.png'
    html_path = url + 'index.html' if url.endswith('/') else url
    preview = f'{url}?preview=1&v={version(html_path)}'
    # A missing poster must not accidentally show a different game.
    image = f'<img class="poster" src="{poster}?v={version(poster)}" alt="" loading="{"eager" if index < 2 else "lazy"}">' if (PUBLIC / poster).exists() else '<div class="poster poster-empty" aria-hidden="true"></div>'
    cards.append(f'''<article class="game-card{' is-active' if index == 0 else ''}" data-preview="{escape(preview)}" data-name="{title}" aria-label="{title}">
    <a class="game-link" href="{url}" aria-label="{title} 플레이">
      <div class="screen">{image}<div class="preview-host" aria-hidden="true"></div><span class="launch" aria-hidden="true">↗</span></div>
      <div class="card-caption"><div><span class="genre">{genre}</span><h1>{title}</h1></div><span class="players">{players}</span><span class="play-label">플레이 <b>↗</b></span></div>
    </a></article>''')

(PUBLIC / 'catalog.json').write_text(json.dumps([dict(id=id,title=title,url=url,players=players,genre=genre) for id,title,url,players,genre in GAMES],ensure_ascii=False,indent=2))
(PUBLIC / 'index.html').write_text(f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>게임룸</title><link rel="stylesheet" href="room.css?v={version('room.css')}"><script src="room.js?v={version('room.js')}" defer></script></head>
<body><header class="site-header"><a class="wordmark" href="./" aria-label="게임룸 홈"><span aria-hidden="true">▦</span> 게임룸.</a><div class="header-actions"><span class="game-total">{len(GAMES):02d} GAMES</span><button class="motion-toggle" id="motion-toggle" aria-pressed="true" aria-label="움직이는 미리보기 일시정지"><span aria-hidden="true">Ⅱ</span><span class="motion-label">미리보기</span></button></div></header>
<main><section class="deck" aria-label="게임 선택"><div class="card-track" id="card-track" tabindex="0" aria-label="좌우로 넘겨 게임 선택">{''.join(cards)}</div><div class="deck-controls"><button class="arrow" id="previous" aria-label="이전 게임">←</button><div class="dots" aria-label="게임 바로 선택">{''.join(f'<button data-index="{i}" class="dot{" selected" if i==0 else ""}" aria-label="{title}" aria-pressed="{"true" if i==0 else "false"}"></button>' for i,(_,title,*_) in enumerate(GAMES))}</div><button class="arrow" id="next" aria-label="다음 게임">→</button><span class="page-count" id="page-count">01 / {len(GAMES):02d}</span></div><p class="sr-only" id="selection-status" aria-live="polite">초밥 뷔페 선택됨</p></section></main>
</body></html>''')
print(f'Generated {len(GAMES)} Web Game cards.')
