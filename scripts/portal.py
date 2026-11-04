from pathlib import Path
import json
import hashlib
import re
r=Path(__file__).resolve().parents[1]
games=[('칠판 기억왕','MEMORY','칠판 위 화살표를 기억하는 네 사람의 한 판.','stadium/games/says.html','says','1–4인 · 기억력'),('초밥 뷔페','PARTY','눈앞을 지나가는 한 접시. 누구보다 빠르게!','stadium/games/sushi.html','sushi','1–4인 · 파티'),('딱딱하게!','TIMING','마지막 순간까지 기다렸다가, 단단하게 막아라.','stadium/games/harden.html','harden','1–4인 · 타이밍'),('친구 세기','OBSERVATION','옷과 움직임을 살펴보고 정확히 세어보세요.','stadium/games/stampede.html','stampede','1–4인 · 관찰력'),('게이트 러시','RUNNER','더하고, 곱하고, 돌파하는 군단 러너.','gate-defense/','gate-defense','1인 · 러너'),('보글보글 라면가게','COOKING','네 개의 냄비, 끊이지 않는 주문. 오늘도 영업 중.','ramen/','ramen','1인 · 타이쿤'),('플라잉 슛 구출작전','ACTION','슛과 태클로 경기장을 돌파하고 동료를 구출하세요.','football-rescue/','football-rescue','1인 · 액션'),('출동! 수호전대','ACTION','세 명의 대원. 세 개의 구역. 도시를 되찾을 시간.','rangers/','rangers','1인 · 액션'),('클래식 체스','BOARD','서두르지 않아도 좋아요. 다음 한 수를 찾아보세요.','chess/','chess','1인 · 보드')]
(r/'public/catalog.json').write_text(json.dumps([dict(title=a,tag=b,description=c,url=d) for a,b,c,d,_,_ in games],ensure_ascii=False,indent=2))
cards=''.join(f'''<a class="game-card" href="{d}"><div class="cover"><img src="art/previews/{e}.png" alt="{a} 플레이 화면" loading="lazy"><span class="genre">{b}</span><span class="play-symbol" aria-hidden="true">↗</span></div><div class="card-text"><span class="players">{f}</span><h3>{a}</h3><p>{c}</p></div></a>''' for a,b,c,d,e,f in games)
(r/'public/index.html').write_text('''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>게임룸 — 오늘의 한 판</title><link rel="stylesheet" href="room.css?v=2"></head><body>
<header><a class="wordmark" href="./" aria-label="게임룸 홈"><span class="wordmark-mark" aria-hidden="true">▦</span>게임룸<span class="wordmark-dot">.</span></a><nav aria-label="게임 분류"><button id="web-tab" aria-controls="web" aria-pressed="true">Web Games</button><button id="phone-tab" aria-controls="phone" aria-pressed="false">Phone Controller Games<span class="soon">예정</span></button></nav><span class="header-note">설치 없이, 가볍게 한 판.</span></header>
<main><section id="web" aria-labelledby="web-tab"><div class="intro"><div><span class="eyebrow">PICK A GAME. PRESS PLAY.</span><h1>오늘은, 어떤 한 판?</h1></div><p>혼자 몰입해도, 함께 웃어도.<br>마음에 드는 게임을 골라보세요.</p></div>
<section class="featured" aria-label="추천 게임"><a class="feature-main" href="ramen/"><img src="ramen/art/noodle-kitchen.png" alt="따뜻한 라면가게 주방"><div class="feature-shade"></div><div class="feature-copy"><span class="feature-kicker">오늘의 추천 · COOKING</span><h2>보글보글<br>라면가게</h2><p>정성 한 냄비, 손님 한 명.<br>작은 가게의 바쁜 하루를 시작하세요.</p><span class="feature-cta">가게 문 열기 <b>↗</b></span></div></a><div class="feature-side"><a href="rangers/"><img src="art/previews/rangers.png" alt="수호전대 도시 전투"><div><small>ACTION / 1 PLAYER</small><h2>출동! 수호전대</h2><span>도시를 되찾을 시간 <b>↗</b></span></div></a><a href="stadium/games/sushi.html"><img src="art/previews/sushi.png" alt="회전초밥 파티 경기장"><div><small>PARTY / 1–4 PLAYERS</small><h2>초밥 뷔페</h2><span>다 같이 한 접시 더 <b>↗</b></span></div></a></div></section>
<section class="library"><div class="section-heading"><h2>모든 게임 <span>09</span></h2><p>키보드 · 마우스 · 게임별 터치 지원</p></div><div class="game-grid">'''+cards+'''</div></section></section>
<section id="phone" aria-labelledby="phone-tab" hidden><div class="phone-coming"><span class="eyebrow">PHONE CONTROLLER GAMES</span><h1>손안의 움직임이<br>게임이 되는 곳.</h1><p>휴대폰을 연결해 큰 화면으로 즐길 게임들을 준비하고 있어요.<br>이 모드는 아직 플레이할 수 없습니다.</p><div class="sport-list"><span>야구</span><span>테니스</span><span>골프</span><span>낚시</span><span>광선검</span><span>에어하키</span></div><button id="back-web">지금 즐길 수 있는 게임 보기 ↗</button></div></section>
</main><footer><span class="wordmark">게임룸.</span><p>잠깐의 휴식, 즐거운 한 판.</p><a href="#">맨 위로 ↑</a></footer><script>const tabs=[document.querySelector('#web-tab'),document.querySelector('#phone-tab')];function select(b){for(const t of tabs){let on=t===b;t.setAttribute('aria-pressed',on);document.getElementById(t.getAttribute('aria-controls')).hidden=!on}}tabs.forEach(b=>b.onclick=()=>select(b));document.querySelector('#back-web').onclick=()=>select(tabs[0]);</script></body></html>''')

# Content hashes keep previews fresh when the local static server is reused.
p=r/"public/index.html"
def version_image(match):
    path=match.group(1)
    digest=hashlib.sha256((r/"public"/path).read_bytes()).hexdigest()[:10]
    return f'src="{path}?v={digest}"'
p.write_text(re.sub(r'src="([^"?]+\.png)"',version_image,p.read_text()))
