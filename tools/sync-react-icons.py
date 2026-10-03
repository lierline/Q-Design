"""Sync only interface icons. Other frozen Q-Design parts are not included.

Owner authorized all three products on 2026-10-03. Run with --write to apply;
without it, report drift and exit nonzero if a sync is required.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
mapping = json.loads((root / 'patterns/react-icons.json').read_text())
write = '--write' in sys.argv
dirty = 0
imports = re.compile(r'import\s+(type\s+)?\{([^}]+)\}\s+from\s+[\'"]lucide-react[\'"];?')

for project in ['Q-Atelier', 'Q-Works', 'DHR']:
    repo = root.parent / project
    used = set()
    changed = 0
    for folder in ['app', 'components', 'lib']:
        for path in (repo / folder).rglob('*'):
            if path.suffix not in ['.tsx', '.ts']:
                continue
            before = path.read_text(encoding='utf-8-sig')
            def replace(match):
                lines = []
                for item in match[2].split(','):
                    item = item.strip()
                    if not item:
                        continue
                    type_only = bool(match[1]) or item.startswith('type ')
                    item = re.sub(r'^type\s+', '', item)
                    name = item.split(' as ')[0].strip()
                    if name == 'LucideIcon':
                        lines.append(f"import type {{ {item} }} from '@/components/q-design-icons/_icon';")
                    else:
                        if name not in mapping:
                            raise ValueError(f'Unmapped icon {name} in {path}')
                        lines.append(f"import {'type ' if type_only else ''}{{ {item} }} from '@/components/q-design-icons/{name}';")
                return '\n'.join(lines)
            after = imports.sub(replace, before)
            used.update(re.findall(r'@/components/q-design-icons/([A-Z][A-Za-z0-9]*)', after))
            if after != before:
                dirty += 1
                changed += 1
                if write:
                    path.write_text(after, encoding='utf-8', newline='')
    target = repo / 'components/q-design-icons'
    for name in sorted(used):
        if name not in mapping:
            raise ValueError(f'Unmapped product icon {name}')
    files = [f'{name}.tsx' for name in sorted(used)] + ['_icon.tsx', 'LICENSE']
    for name in files:
        source = (root / 'dist/react-icons' / name).read_bytes()
        dest = target / name
        if not dest.exists() or dest.read_bytes() != source:
            dirty += 1
            if write:
                target.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(source)
    print(f'{project}: {len(used)} icons, {changed} import migrations')
if dirty and not write:
    raise SystemExit(f'{dirty} files need synchronization; rerun with --write')
