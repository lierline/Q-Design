"""Download the curated official SVGs at the commit pinned in patterns/icons.json."""
import concurrent.futures
import json
from pathlib import Path
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent.parent
catalog = json.loads((root / 'patterns/icons.json').read_text(encoding='utf-8'))
target = root / 'vendor/phosphor'
(target / 'regular').mkdir(parents=True, exist_ok=True)
base = f"https://raw.githubusercontent.com/phosphor-icons/core/{catalog['commit']}/"

def download(pair):
    source, destination = pair
    req = Request(base + source, headers={'User-Agent': 'Q-Design icon import'})
    with urlopen(req, timeout=30) as response:
        data = response.read()
    (target / destination).write_bytes(data)
    return destination

sources = {i['source'] for i in catalog['icons']}
react_catalog = root / 'patterns/react-icons.json'
if react_catalog.exists():
    sources.update(json.loads(react_catalog.read_text(encoding='utf-8')).values())
files = [('LICENSE', 'LICENSE')] + [(f"assets/regular/{name}.svg", f"regular/{name}.svg") for name in sorted(sources)]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for name in pool.map(download, files):
        print(name)
