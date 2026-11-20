# -*- coding: utf-8 -*-
import os
import json
import math
from PIL import Image

def build_sprites():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    asset_dir = os.path.join(base_dir, 'assets')
    sprites_dir = os.path.join(asset_dir, 'sprites')
    os.makedirs(sprites_dir, exist_ok=True)

    chars_file = os.path.join(base_dir, 'data', 'characters.json')
    with open(chars_file, 'r', encoding='utf-8') as f:
        chars = json.load(f)

    search_dirs = [
        os.path.join(asset_dir, 'portraits')
    ]

    import unicodedata

    def strip_accents(text):
        nfkd = unicodedata.normalize('NFKD', text)
        return ''.join(c for c in nfkd if not unicodedata.combining(c)).lower()

    by_key = {}
    for sdir in search_dirs:
        if not os.path.exists(sdir):
            continue
        for fname in os.listdir(sdir):
            base, ext = os.path.splitext(fname)
            if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
                continue
            fpath = os.path.join(sdir, fname)
            mtime = os.path.getmtime(fpath)
            for key in (base.lower(), strip_accents(base)):
                if key not in by_key or mtime > by_key[key][1]:
                    by_key[key] = (fpath, mtime)

    found_images = {}
    for char_id, data in chars.items():
        name = data.get('name', '')
        name_lower = name.lower()
        name_norm = strip_accents(name)
        cid_lower = char_id.lower()
        cands = {
            cid_lower,
            cid_lower.replace('_', ' '),
            cid_lower.replace('_', '-'),
            strip_accents(char_id),
            name_lower,
            name_lower.replace(' ', '_'),
            name_lower.replace(' ', '-'),
            name_norm,
            name_norm.replace(' ', '_'),
            name_norm.replace(' ', '-'),
        }
        for p in name.split():
            if len(p) > 2:
                cands.add(p.lower())
                cands.add(strip_accents(p))

        best = max((by_key[c] for c in cands if c in by_key), key=lambda x: x[1], default=None)
        if best:
            found_images[char_id] = best[0]

    print(f"[SPRITE BUILDER] Discovered {len(found_images)} character portrait(s): {list(found_images.keys())}")

    out_webp = os.path.join(sprites_dir, 'characters.webp')
    out_json = os.path.join(sprites_dir, 'characters-map.json')
    cache_file = os.path.join(sprites_dir, '.sprite_cache.json')

    # Quick signature calculation for cache invalidation
    current_sig = {}
    for cid, fpath in found_images.items():
        try:
            current_sig[cid] = [fpath, os.path.getmtime(fpath), os.path.getsize(fpath)]
        except OSError:
            pass

    if os.path.exists(out_webp) and os.path.exists(out_json) and os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as cf:
                cached_sig = json.load(cf)
            if cached_sig == current_sig:
                with open(out_json, 'r', encoding='utf-8') as jf:
                    sprite_map = json.load(jf)
                print(f"[SPRITE BUILDER] Cache hit! Images unchanged. Using existing sprite sheet.")
                return sprite_map
        except Exception:
            pass

    TILE_SIZE = 192
    char_list = sorted(found_images.keys())
    total_tiles = max(1, len(char_list))
    cols = min(12, max(1, math.ceil(math.sqrt(total_tiles))))
    rows = math.ceil(total_tiles / cols)

    sheet_w = cols * TILE_SIZE
    sheet_h = rows * TILE_SIZE
    sprite_sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))

    sprite_map = {
        'sheetWidth': sheet_w,
        'sheetHeight': sheet_h,
        'tileSize': TILE_SIZE,
        'sprites': {}
    }

    for idx, char_id in enumerate(char_list):
        col = idx % cols
        row = idx // cols
        x = col * TILE_SIZE
        y = row * TILE_SIZE

        img_path = found_images[char_id]
        with Image.open(img_path) as im:
            im = im.convert('RGBA')
            w, h = im.size
            if h > w:
                crop_dim = w
                top = int(h * 0.05)
                if top + crop_dim > h:
                    top = h - crop_dim
                box = (0, top, crop_dim, top + crop_dim)
            else:
                crop_dim = h
                left = (w - crop_dim) // 2
                box = (left, 0, left + crop_dim, crop_dim)

            cropped = im.crop(box).resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
            sprite_sheet.paste(cropped, (x, y))

        sprite_map['sprites'][char_id] = {
            'x': x,
            'y': y,
            'w': TILE_SIZE,
            'h': TILE_SIZE
        }

    out_webp = os.path.join(sprites_dir, 'characters.webp')
    sprite_sheet.save(out_webp, 'WEBP', quality=85, method=6)

    out_json = os.path.join(sprites_dir, 'characters-map.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(sprite_map, f, indent=2)

    with open(cache_file, 'w', encoding='utf-8') as cf:
        json.dump(current_sig, cf)

    print(f"[SPRITE BUILDER] Sprite sheet exported: {out_webp} ({os.path.getsize(out_webp)} bytes)")
    print(f"[SPRITE BUILDER] Sprite map exported: {out_json}")
    return sprite_map

if __name__ == '__main__':
    build_sprites()
