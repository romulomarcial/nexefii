#!/usr/bin/env python3
"""
Conservative rebrand script: ilux -> nexefii (Phase 2)
- Operates only under nexefii/ folder
- Skips: node_modules, sprints, backup, Bkp, migration-*, *.bak
- Makes timestamped backups under Bkp/migration-<ts>/ (full copies of files changed)
- Applies conservative replacements and keeps compatibility shim for language keys
- Produces a manifest report: migration-manifest.json and summary printed to stdout

Run from repository root (it will resolve paths relative to this file)
"""
import re
import sys
from pathlib import Path
from datetime import datetime
import json

ROOT = Path(r"r:\Development\Projects\nexefii")
if not ROOT.exists():
    print("ERROR: expected folder r:\\Development\\Projects\\nexefii to exist")
    sys.exit(1)

TS = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
BACKUP_ROOT = ROOT / 'Bkp' / f'migration-{TS}-full-ilux-to-nexefii'
REPORT = {'timestamp': TS, 'backups': [], 'changes': {}, 'files_changed': []}
EXCLUDE_PARTS = ['node_modules', 'sprints', 'backup', 'Bkp', 'migration-', '.bak']

# Ordered replacements (longer first)
REPLACEMENTS = [
    (r'IluxProps', 'NexefiiProps'),
    (r'IluxAuth', 'NexefiiAuth'),
    (r'iluxsys_users', 'nexefii_users'),
    (r'iluxsys_session', 'nexefii_session'),
    (r'iluxsys_properties', 'nexefii_properties'),
    (r'iluxsys_email_log', 'nexefii_email_log'),
    (r'ilux_lang', 'nexefii_lang'),
    (r'ilux_user', 'nexefii_user'),
    (r'ilux_token', 'nexefii_token'),
    (r'iluxSaoPaulo', 'nexefiiSaoPaulo'),
    (r'iluxMiami', 'nexefiiMiami'),
    (r'iluxRioDeJaneiro', 'nexefiiRioDeJaneiro'),
    (r'iLux Hotel', 'Nexefii Hotel'),
    # generic lower-case token AFTER specific tokens
    (r'\\bilux\\b', 'nexefii'),
]

# Helper: skip path
def skip_path(p: Path):
    s = str(p)
    for ex in EXCLUDE_PARTS:
        if ex.endswith('-'):
            if ex[:-1] in s:
                return True
        elif ex in s:
            return True
    if p.suffix.lower() in ['.bak', '.zip']:
        return True
    return False

# File types to edit
TEXT_EXTS = ['.js', '.html', '.json', '.md', '.py', '.css', '.ts']

# Make list of candidate files
candidates = []
for p in ROOT.rglob('*'):
    try:
        if p.is_file():
            if skip_path(p):
                continue
            if p.suffix.lower() in TEXT_EXTS:
                # quick read to see if 'ilux' occurs
                try:
                    txt = p.read_text(encoding='utf-8')
                except Exception:
                    try:
                        txt = p.read_text(encoding='latin-1')
                    except Exception:
                        continue
                if re.search(r'(?i)ilux', txt):
                    candidates.append((p, txt))
    except Exception:
        continue

print(f"Found {len(candidates)} candidate files containing 'ilux' under {ROOT}")

# Ensure backup dir
BACKUP_ROOT.mkdir(parents=True, exist_ok=True)

for p, original_text in candidates:
    rel = p.relative_to(ROOT)
    backup_path = BACKUP_ROOT / rel
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    # write backup
    try:
        backup_path.write_text(original_text, encoding='utf-8')
        REPORT['backups'].append(str(backup_path))
    except Exception as e:
        print(f"WARN: could not write backup for {p}: {e}")
        continue

    new_text = original_text
    file_changes = {}

    # Special handling: localStorage language get/set patterns
    # Replace getItem('ilux_lang') -> (localStorage.getItem('nexefii_lang') || localStorage.getItem('ilux_lang'))
    new_text = re.sub(r"localStorage\.getItem\(\s*['\"]ilux_lang['\"]\s*\)",
                      "(localStorage.getItem('nexefii_lang') || localStorage.getItem('ilux_lang'))",
                      new_text)
    # Replace setItem('ilux_lang', X) -> try set both (nexefii_lang then ilux_lang)
    def rep_set_lang(m):
        args = m.group(1)
        # build string without f-string to avoid brace collisions
        return "try{ localStorage.setItem('nexefii_lang'," + args + "); }catch(e){} try{ localStorage.setItem('ilux_lang'," + args + "); }catch(e){}"
    new_text = re.sub(r"localStorage\.setItem\(\s*['\"]ilux_lang['\"]\s*,\s*(.*?)\)", rep_set_lang, new_text)

    # Now apply replacements list
    for pat, repl in REPLACEMENTS:
        count = 0
        # use word-boundary aware replacements for simple tokens, case-sensitive
        if pat.startswith('\\\\b'):
            # generic ilux word
            new_text, count = re.subn(r'(?i)\\\bilux\\b', repl, new_text)
        else:
            new_text, count = re.subn(pat, repl, new_text)
        if count:
            file_changes[pat] = file_changes.get(pat, 0) + count

    if new_text != original_text:
        # write back
        try:
            p.write_text(new_text, encoding='utf-8')
            REPORT['files_changed'].append(str(p))
            REPORT['changes'][str(p)] = file_changes
            print(f"Updated {p} — {sum(file_changes.values())} replacements")
        except Exception as e:
            print(f"ERROR writing {p}: {e}")

# Write manifest
man = BACKUP_ROOT / 'migration-manifest.json'
man.write_text(json.dumps(REPORT, indent=2), encoding='utf-8')
print('\nMigration complete. Manifest at:', man)
print(json.dumps(REPORT, indent=2))
