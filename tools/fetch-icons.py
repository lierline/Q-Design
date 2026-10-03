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

files = [('LICENSE', 'LICENSE')] + [(f"assets/regular/{i['source']}.svg", f"regular/{i['source']}.svg") for i in catalog['icons']]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for name in pool.map(download, files):
        print(name)
