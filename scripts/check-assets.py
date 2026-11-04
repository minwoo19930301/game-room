from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import re
root=Path('public').resolve();missing=[]
class Scan(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('src','href') and v:check(v,self.file.parent)
def check(url,base):
 u=urlsplit(url)
 if u.scheme or u.netloc or not u.path or any(x in u.path for x in ['{','<','\\']):return
 path=(root/u.path.lstrip('/') if u.path.startswith('/') else base/unquote(u.path)).resolve()
 if not path.exists():missing.append(str(path.relative_to(root)) if path.is_relative_to(root) else str(path))
for p in root.rglob('*.html'):
 h=Scan();h.file=p;h.feed(p.read_text())
for p in root.rglob('*.css'):
 for u in re.findall(r'url\([\'"]?([^\)\'"]+)',p.read_text()):check(u,p.parent)
if missing:raise SystemExit('Missing assets: '+str(sorted(set(missing))))
print('All static HTML/CSS links resolve.')
