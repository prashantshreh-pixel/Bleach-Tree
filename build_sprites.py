# -*- coding: utf-8 -*-
import os
import json
import math
import shutil
from PIL import Image

def build_sprites():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    asset_dir = os.path.join(base_dir, 'Asset')
    sprites_dir = os.path.join(asset_dir, 'sprites')
    os.makedirs(sprites_dir, exist_ok=True)

    chars_file = os.path.join(base_dir, 'data', 'characters.json')
    with open(chars_file, 'r', encoding='utf-8') as f:
        chars = json.load(f)

    search_dirs = [
        os.path.join(asset_dir, 'characters'),
        os.path.join(asset_dir, 'Image'),
        asset_dir
    ]

    found_images = {}
    for char_id, data in chars.items():
        name = data.get('name', '')
        candidates = [
            char_id.lower(),
            char_id.lower().replace('_', ' '),
            char_id.lower().replace('_', '-'),
            name.lower(),
            name.lower().replace(' ', '_'),
            name.lower().replace(' ', '-'),
            name.lower().replace('ō', 'o').replace('ū', 'u')
        ]
        found_file = None
        for sdir in search_dirs:
            if not os.path.exists(sdir):
                continue
            for fname in os.listdir(sdir):
                base, ext = os.path.splitext(fname)
                if ext.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    if base.lower() in candidates:
                        found_file = os.path.join(sdir, fname)
                        break
            if found_file:
                break
        if found_file:
            found_images[char_id] = found_file

    print(f"[SPRITE BUILDER] Discovered {len(found_images)} character portrait(s): {list(found_images.keys())}")

    TILE_SIZE = 128
    char_list = sorted(found_images.keys())
    total_tiles = max(1, len(char_list))
    cols = min(8, max(1, math.ceil(math.sqrt(total_tiles))))
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

    mirror_dir = os.path.join(base_dir, 'assets', 'sprites')
    os.makedirs(mirror_dir, exist_ok=True)
    shutil.copy2(out_webp, os.path.join(mirror_dir, 'characters.webp'))
    shutil.copy2(out_json, os.path.join(mirror_dir, 'characters-map.json'))

    print(f"[SPRITE BUILDER] Sprite sheet exported: {out_webp} ({os.path.getsize(out_webp)} bytes)")
    print(f"[SPRITE BUILDER] Sprite map exported: {out_json}")
    return sprite_map

if __name__ == '__main__':
    build_sprites()
