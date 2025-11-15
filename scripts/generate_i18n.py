#!/usr/bin/env python3
"""
Generate a monolithic i18n/i18n.json by merging per-language segment files.
Writes to: i18n/i18n.json (relative to repository root)

Usage: python scripts/generate_i18n.py
"""
import json
import os
from glob import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N_DIR = os.path.join(ROOT, 'i18n')
OUT_PATH = os.path.join(I18N_DIR, 'i18n.json')
LANGS = ['pt', 'en', 'es']


def deep_merge(a, b):
    """Recursively merge b into a and return a."""
    if not isinstance(b, dict):
        return a
    for k, v in b.items():
        if k in a and isinstance(a[k], dict) and isinstance(v, dict):
            deep_merge(a[k], v)
        else:
            a[k] = v
    return a


def load_segments_for_lang(lang):
    lang_dir = os.path.join(I18N_DIR, lang)
    merged = {}
    if not os.path.isdir(lang_dir):
        return merged
    for filepath in sorted(glob(os.path.join(lang_dir, '*.json'))):
        try:
            with open(filepath, 'r', encoding='utf-8') as fh:
                data = json.load(fh)
            deep_merge(merged, data)
            print(f"Loaded {os.path.relpath(filepath, ROOT)}")
        except Exception as e:
            print(f"WARN: failed to load {filepath}: {e}")
    return merged


def main():
    if not os.path.isdir(I18N_DIR):
        print(f"i18n directory not found at {I18N_DIR}")
        return 1

    out = {}
    for lang in LANGS:
        out[lang] = load_segments_for_lang(lang)

    # Ensure output dir exists
    os.makedirs(I18N_DIR, exist_ok=True)
    try:
        with open(OUT_PATH, 'w', encoding='utf-8') as fh:
            json.dump(out, fh, ensure_ascii=False, indent=2)
        print(f"Wrote {os.path.relpath(OUT_PATH, ROOT)}")
        return 0
    except Exception as e:
        print(f"ERROR: could not write {OUT_PATH}: {e}")
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
