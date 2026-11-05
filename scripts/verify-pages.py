"""Check the published commit, every game route and its entry-point assets."""
import concurrent.futures
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import time
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

base = sys.argv[1].rstrip('/') + '/'
expected = sys.argv[2]
local = json.loads(Path('public/catalog.json').read_text())

def fetch(url):
    request = Request(url, headers={'User-Agent': 'game-room-deploy-check', 'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f'{url}: HTTP {response.status}')
        return response.read()

for attempt in range(25):
    try:
        release = json.loads(fetch(base + 'release.json?revision=' + expected))
        if release.get('commit') != expected:
            raise RuntimeError('The CDN still serves a different revision')
        break
    except Exception as error:
        if attempt == 24:
            raise
        print(f'Waiting for deployed revision ({attempt + 1}/25): {error}', flush=True)
        time.sleep(5)

catalog = json.loads(fetch(base + 'catalog.json'))
assert catalog == local, 'Live catalog does not match this commit'
assert len(catalog) == 13, 'Expected thirteen games'
entry_urls = [base] + [urljoin(base, game['url']) for game in catalog]
asset_urls = {urljoin(base, f"art/previews/{game['id']}.png") for game in catalog}

class Assets(HTMLParser):
    def __init__(self, page):
        super().__init__()
        self.page = page
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value or key not in ('src', 'href'):
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            if any(token in parsed.path for token in ('{', '<', '\\')):
                continue
            url = urljoin(self.page, value)
            assert url.startswith(base), f'Asset leaves the Pages project path: {url}'
            asset_urls.add(url)

for url in entry_urls:
    html = fetch(url).decode('utf-8')
    assert '<html' in html.lower(), f'Expected game HTML at {url}'
    Assets(url).feed(html)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    list(pool.map(fetch, sorted(asset_urls)))
print(f'Live commit {expected}: 13 game routes and {len(asset_urls)} assets/links passed.')
