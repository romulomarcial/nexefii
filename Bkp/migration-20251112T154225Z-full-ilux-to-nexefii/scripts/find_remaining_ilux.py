from pathlib import Path
import re, json
ROOT = Path(r"r:\Development\Projects\nexefii")
EXCLUDE = ['node_modules','sprints','backup','Bkp','migration-']
TEXT_EXTS = ['.js','.html','.json','.md','.py','.css','.ts']
res = {}
for p in ROOT.rglob('*'):
    if not p.is_file():
        continue
    s = str(p)
    if any(x in s for x in EXCLUDE):
        continue
    if p.suffix.lower() not in TEXT_EXTS:
        continue
    try:
        txt = p.read_text(encoding='utf-8')
    except Exception:
        try:
            txt = p.read_text(encoding='latin-1')
        except Exception:
            continue
    if re.search(r'(?i)ilux', txt):
        # record count
        cnt = len(re.findall(r'(?i)ilux', txt))
        res[str(p)] = cnt
print(json.dumps(res, indent=2))
