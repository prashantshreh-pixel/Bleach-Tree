# -*- coding: utf-8 -*-
"""
BLEACH: Thousand-Year Blood War - Spiritual Intelligence Network Generator
Generates the complete standalone index.html with:
- Force-directed graph of 185+ Bleach characters and 350+ canonical relationships
- Sprite sheet slicing for instant circular avatar rendering on HTML5 Canvas
- Specialized tactical cluster layouts (Gotei 13, Wandenreich, Hueco Mundo, Karakura Town, Original Gotei)
- Character dossier sidebar with relationship filtering, timeline, and custom character themes (e.g. Rukia Frost effect)
- Tactical Radar Minimap, shortest-path BFS relationship tracer, and quick search (Ctrl+K)
"""

import json
import base64
import os

TIER_1_IDS = frozenset(('aizen', 'ichigo', 'yhwach', 'yamamoto', 'soul_king', 'ichibei'))
TIER_2_IDS = frozenset((
    'gin', 'tosen', 'starrk', 'baraggan', 'harribel', 'ulquiorra', 'grimmjow', 'nnoitra',
    'shunsui', 'kenpachi', 'byakuya', 'urahara', 'shinji', 'ginjo', 'jugram', 'uryu',
    'rukia', 'renji', 'hitsugaya', 'unohana', 'chika_shihoin', 'kinroku_izuhara',
    'chigiri_shijima', 'danjiro_obana', 'furofushi_saito', 'nobutsuna_shigyo',
    'batsuunsai_katori', 'entetsu_kumoi', 'furuoki_otogawa', 'uhin_zenjoji', 'saizo_sakahone',
    'soi_fon', 'mayuri', 'komamura', 'ukitake', 'rose', 'kensei', 'lille_barro',
    'gerard_valkyrie', 'pernida_parnkgjas', 'askin_nakk_le_vaar', 'gremmy_thoumeaux',
    'oetsu', 'senjumaru', 'tenjiro', 'kirio'
))
TIER_3_IDS = frozenset((
    'zommari', 'szayelaporro', 'aaroniero', 'yammy', 'luppi', 'nelliel', 'wonderweiss',
    'bazz_b', 'bambietta_basterbine', 'as_nodt', 'cang_du', 'quilge_opie', 'bg9',
    'pepe_waccabrada', 'robert_accutrone', 'driscoll_berci', 'meninas_mcallon',
    'mask_de_masculine', 'candice_catnipp', 'giselle_gewelle', 'nanana_najahkoop',
    'nianzol_weizol', 'royd_lloyd', 'loyd_lloyd', 'liltotto_lamperd', 'love', 'lisa',
    'hachigen', 'yoruichi', 'isshin', 'ryuken', 'orihime', 'chad', 'tsukishima', 'tatsuki',
    'omaeda', 'kira', 'isane', 'momo', 'nanao', 'hisagi', 'rangiku', 'yachiru', 'nemu', 'sasakibe'
))
TIER_5_IDS = frozenset((
    'lilynette', 'loly', 'menoly', 'roka_paramia', 'charlotte', 'abirama', 'findorr', 'poww',
    'ggio', 'nirgge', 'shawlong', 'edrad', 'ylfordt', 'diroy', 'nakim', 'apacci', 'milarose',
    'sunsun', 'ayon', 'tesla', 'lumina', 'medazeppi', 'pesche', 'dondochakka', 'bawabawa',
    'demoura', 'aisslinger', 'kukkapuro', 'aldegor', 'grand_fisher', 'jinta', 'ururu', 'kon',
    'ririn', 'noba', 'kurodo', 'keigo', 'mizuiro', 'chizuru', 'ryo', 'michiru', 'mahana',
    'misato', 'keisuke', 'mizuho', 'ikumi', 'kaoru', 'don_kanonji', 'kagine',
    'asguiaro_ebern', 'luders_friegen', 'berenice_gabrielli', 'jerome_guizbatt', 'guenael_lee',
    'shaz_domino'
))

def generate_obsidian_graph():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    asset_dir = os.path.join(base_dir, "Asset")

    # 1. Load canonical intelligence datasets
    with open(os.path.join(base_dir, "data", "characters.json"), "r", encoding="utf-8") as f:
        chars = json.load(f)
    with open(os.path.join(base_dir, "data", "relationships.json"), "r", encoding="utf-8") as f:
        rels = json.load(f)

    # 2. Ensure character sprite sheet and coordinate map are built and up-to-date
    from build_sprites import build_sprites
    sprite_meta = build_sprites()

    # 3. Read sprite sheet as base64 data URI fallback for local file:// execution
    sprite_webp_path = os.path.join(asset_dir, "sprites", "characters.webp")
    sprite_version = int(os.path.getmtime(sprite_webp_path)) if os.path.exists(sprite_webp_path) else 1
    with open(sprite_webp_path, "rb") as f:
        sprite_webp_b64 = base64.b64encode(f.read()).decode("ascii")

    def get_initials(name):
        parts = [p for p in name.strip().split() if p]
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        elif len(parts) == 1 and len(parts[0]) > 0:
            return parts[0][:2].upper()
        return "??"

    RACE_COLORS = {
        "Deity":       "#FFD700",
        "Soul Reaper": "#4A9EFF",
        "Quincy":      "#DC2626",
        "Human":       "#9CA3AF",
        "Hybrid":      "#A855F7",
        "Noble":       "#D4AF37",
        "Royal Guard": "#F5E6C8",
        "Hollow":      "#6B21A8",
        "Visored":     "#F59E0B",
        "Fullbringer": "#10B981",
        "Mod Soul":    "#F472B6",
        "Arrancar":    "#E5E7EB",
    }

    graph_data = {"nodes": [], "links": []}

    for char_id, data in chars.items():
        race = data.get("race", "Human")
        color = RACE_COLORS.get(race, "#9CA3AF")
        fac = data.get("faction", "")

        # Hierarchical node tier sizing based on narrative power & authority
        if char_id in TIER_1_IDS:
            tier, node_val = 1, 16.0
        elif char_id in TIER_2_IDS:
            tier, node_val = 2, 11.5
        elif char_id in TIER_3_IDS:
            tier, node_val = 3, 8.5
        elif 'Fracci' in fac or char_id in TIER_5_IDS:
            tier, node_val = 5, 3.5
        else:
            tier, node_val = 4, 5.8

        name = data.get("name", char_id)
        graph_data["nodes"].append({
            "id": char_id,
            "name": name,
            "race": race,
            "faction": fac or "Unknown",
            "family": data.get("family", "Unknown"),
            "desc": data.get("description", ""),
            "color": color,
            "val": node_val,
            "tier": tier,
            "is_top": tier <= 2,
            "initials": get_initials(name),
        })

    for rel in rels:
        graph_data["links"].append({
            "source": rel["source"],
            "target": rel["target"],
            "type": rel["type"],
            "label": rel["label"]
        })

    # Render faction filter pills
    legend_items = "".join(
        f'<div class="faction-filter" data-faction="{race}" style="display:flex;align-items:center;cursor:pointer;padding:2px 0;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">'
        f'<span style="width:8px;height:8px;border-radius:50%;background:{color};'
        f'display:inline-block;margin-right:8px;box-shadow:0 0 5px {color};"></span>{race}</div>'
        for race, color in RACE_COLORS.items()
    )

    graph_json = json.dumps(graph_data)
    sprite_map_json = json.dumps(sprite_meta.get("sprites", {}))
    sprite_meta_json = json.dumps({
        "sheetWidth": sprite_meta.get("sheetWidth", 2304),
        "sheetHeight": sprite_meta.get("sheetHeight", 3072),
        "tileSize": sprite_meta.get("tileSize", 192)
    })

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>BLEACH - TYBW Intelligence Network</title>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://unpkg.com">
    <link rel="preconnect" href="https://unpkg.com" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://unpkg.com/force-graph"></script>
    <link rel="stylesheet" href="frost-panel.css">
    <script src="frost-panel.js"></script>
    <link rel="stylesheet" href="flame-panel.css">
    <script src="flame-panel.js"></script>
    <link rel="stylesheet" href="glass-panel.css">
    <script src="glass-panel.js"></script>
    <link rel="stylesheet" href="ichigo-panel.css">
    <script src="ichigo-panel.js"></script>
    <link rel="stylesheet" href="yhwach-panel.css">
    <script src="yhwach-panel.js"></script>
    <link rel="stylesheet" href="ichibei-panel.css">
    <script src="ichibei-panel.js"></script>
    <link rel="stylesheet" href="kisuke-panel.css">
    <script src="kisuke-panel.js"></script>
    <link rel="stylesheet" href="kenpachi-panel.css">
    <script src="kenpachi-panel.js"></script>
    <link rel="stylesheet" href="soulking-panel.css">
    <script src="soulking-panel.js"></script>
    <link rel="stylesheet" href="nimaiya-panel.css">
    <script src="nimaiya-panel.js"></script>
    <link rel="stylesheet" href="senjumaru-panel.css">
    <script src="senjumaru-panel.js"></script>
    <link rel="stylesheet" href="tenjiro-panel.css">
    <script src="tenjiro-panel.js"></script>
    <link rel="stylesheet" href="kirio-panel.css">
    <script src="kirio-panel.js"></script>
    <link rel="stylesheet" href="sasakibe-panel.css">
    <script src="sasakibe-panel.js"></script>
    <link rel="stylesheet" href="kira-panel.css">
    <script src="kira-panel.js"></script>
    <link rel="stylesheet" href="hitsugaya-panel.css">
    <script src="hitsugaya-panel.js"></script>
    <link rel="stylesheet" href="soifon-panel.css">
    <script src="soifon-panel.js"></script>
    <link rel="stylesheet" href="omaeda-panel.css">
    <script src="omaeda-panel.js"></script>
    <link rel="stylesheet" href="gin-panel.css">
    <script src="gin-panel.js"></script>
    <link rel="stylesheet" href="unohana-panel.css">
    <script src="unohana-panel.js"></script>
    <link rel="stylesheet" href="isane-panel.css">
    <script src="isane-panel.js"></script>
    <link rel="stylesheet" href="momo-panel.css">
    <script src="momo-panel.js"></script>
    <link rel="stylesheet" href="byakuya-panel.css">
    <script src="byakuya-panel.js"></script>
    <link rel="stylesheet" href="renji-panel.css">
    <script src="renji-panel.js"></script>
    <link rel="stylesheet" href="komamura-panel.css">
    <script src="komamura-panel.js"></script>
    <link rel="stylesheet" href="shunsui-panel.css">
    <script src="shunsui-panel.js"></script>
    <link rel="stylesheet" href="nanao-panel.css">
    <script src="nanao-panel.js"></script>
    <link rel="stylesheet" href="tosen-panel.css">
    <script src="tosen-panel.js"></script>
    <link rel="stylesheet" href="hisagi-panel.css">
    <script src="hisagi-panel.js"></script>
    <link rel="stylesheet" href="rangiku-panel.css">
    <script src="rangiku-panel.js"></script>
    <link rel="stylesheet" href="yachiru-panel.css">
    <script src="yachiru-panel.js"></script>
    <link rel="stylesheet" href="mayuri-panel.css">
    <script src="mayuri-panel.js"></script>
    <link rel="stylesheet" href="nemu-panel.css">
    <script src="nemu-panel.js"></script>
    <link rel="stylesheet" href="ukitake-panel.css">
    <script src="ukitake-panel.js"></script>
    <style>
        /* Base Reset & Pointer Cursor Defaults */
        * {{ box-sizing: border-box; }}
        body {{ margin: 0; padding: 0; background-color: #0A0A0F; color: white; font-family: 'Inter', sans-serif; overflow: hidden; touch-action: none; }}
        #graph-container {{ width: 100vw; height: 100vh; position: absolute; z-index: 1; }}
        #graph-container canvas {{ cursor: pointer; }}

        /* Fast Responsive Loader */
        #loader {{
            position: fixed; inset: 0; background: #000; z-index: 9999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            transition: opacity 0.6s ease-out, visibility 0.6s; cursor: pointer;
        }}
        #loader.fade-out {{ opacity: 0; pointer-events: none; }}
        .css-spinner {{
            width: 70px; height: 70px; border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #D4AF37; border-radius: 50%;
            animation: spin 0.9s linear infinite; margin-bottom: 20px;
        }}
        @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        .loader-text {{
            font-family: 'Cinzel', serif; font-size: 22px; letter-spacing: 4px;
            color: #fff; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }}
        .loader-hint {{ margin-top: 14px; font-size: 12px; color: #888; letter-spacing: 1px; text-transform: uppercase; }}

        /* Character Intelligence Sidebar */
        #sidebar {{
            position: fixed;
            top: 20px;
            bottom: 20px;
            right: -420px;
            width: 360px;
            background: rgba(10, 10, 16, 0.92);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.9);
            z-index: 30;
            display: flex;
            flex-direction: column;
            gap: 0;
            transition: right 0.38s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.35s ease;
            overflow: hidden;
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
        }}
        #sidebar.open {{ right: 20px; }}

        #sidebar-bg {{
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background-size: cover; background-position: center 25%;
            background-repeat: no-repeat; z-index: 0;
            transition: background-image 0.4s ease, opacity 0.4s ease;
            opacity: 0.35; filter: blur(12px) saturate(1.3) brightness(0.8);
            transform: scale(1.1); pointer-events: none;
        }}
        #sidebar-overlay {{
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(10,10,18,0.4) 0%, rgba(10,10,18,0.85) 40%, rgba(10,10,18,0.98) 100%);
            z-index: 0; pointer-events: none;
        }}
        
        #sidebar-content {{
            padding: 20px 22px 35px 22px;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 2;
            scrollbar-width: thin;
            scrollbar-color: rgba(212, 175, 55, 0.5) rgba(15, 15, 25, 0.4);
        }}
        #sidebar-content::-webkit-scrollbar {{ width: 5px; }}
        #sidebar-content::-webkit-scrollbar-track {{ background: rgba(10, 10, 20, 0.4); border-radius: 4px; }}
        #sidebar-content::-webkit-scrollbar-thumb {{ background: rgba(212, 175, 55, 0.5); border-radius: 4px; }}

        .scroll-fade {{
            position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
            background: linear-gradient(to top, rgba(10,10,18,0.95), transparent);
            pointer-events: none; z-index: 5;
            border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
        }}

        #s-banner{{display:none;height:150px;margin:-4px -22px 14px;background-size:cover;background-position:center 20%;
          -webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent);flex-shrink:0;}}

        /* Close (X) Cross Mark Button */
        #sidebar-close {{
            position: absolute;
            top: 15px;
            right: 16px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            font-size: 17px;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            z-index: 50;
        }}
        #sidebar-close:hover {{
            background: rgba(220, 38, 38, 0.45);
            border-color: #DC2626;
            color: #fff;
            transform: scale(1.05);
        }}

        /* Shared Character Theme Variables & Overrides */
        #sidebar[class*="-theme"] {{ border: 1px solid var(--tb) !important; box-shadow: var(--ts) !important; }}
        #sidebar[class*="-theme"] #s-avatar {{ border-color: var(--ab) !important; box-shadow: var(--as) !important; }}
        #sidebar[class*="-theme"]::before {{ content: ''; position: absolute; inset: 0; background: var(--tg); pointer-events: none; z-index: 1; }}
        @keyframes frostPulse {{ 0%, 100% {{ box-shadow: 0 0 30px rgba(186,230,253,.4), inset 0 0 20px rgba(255,255,255,.1); }} 50% {{ box-shadow: 0 0 45px rgba(186,230,253,.65), inset 0 0 30px rgba(255,255,255,.25); }} }}
        @keyframes flamePulse {{ 0%, 100% {{ box-shadow: 0 0 30px rgba(255,120,40,.4), inset 0 0 20px rgba(255,190,120,.1); }} 50% {{ box-shadow: 0 0 45px rgba(255,130,50,.65), inset 0 0 30px rgba(255,190,120,.25); }} }}
        @keyframes glassPulse {{ 0%, 100% {{ box-shadow: 0 0 30px rgba(167,139,250,.4), inset 0 0 20px rgba(255,255,255,.1); }} 50% {{ box-shadow: 0 0 45px rgba(167,139,250,.65), inset 0 0 30px rgba(255,255,255,.25); }} }}

        #sidebar.frost-theme {{ --tb: rgba(186,230,253,.85); --ts: 0 0 35px rgba(186,230,253,.45), inset 0 0 25px rgba(255,255,255,.12); --ab: #BAE6FD; --as: 0 0 25px rgba(186,230,253,.85); --tg: linear-gradient(135deg, rgba(186,230,253,.12) 0%, rgba(147,197,253,.05) 50%, rgba(10,15,30,.2) 100%); animation: frostPulse 3s infinite ease-in-out; }}
        #sidebar.flame-theme {{ --tb: rgba(255,150,60,.85); --ts: 0 0 35px rgba(255,120,40,.45), inset 0 0 25px rgba(255,200,100,.12); --ab: #ffb066; --as: 0 0 25px rgba(255,130,50,.85); --tg: linear-gradient(135deg, rgba(255,130,40,.12) 0%, rgba(255,80,20,.05) 50%, rgba(30,10,5,.2) 100%); animation: flamePulse 3s infinite ease-in-out; }}
        #sidebar.glass-theme {{ --tb: rgba(205,195,255,.85); --ts: 0 0 35px rgba(167,139,250,.45), inset 0 0 25px rgba(255,255,255,.12); --ab: #d8ccff; --as: 0 0 25px rgba(167,139,250,.85); --tg: linear-gradient(135deg, rgba(167,139,250,.12) 0%, rgba(190,170,255,.05) 50%, rgba(20,10,35,.2) 100%); animation: glassPulse 3s infinite ease-in-out; }}
        #sidebar.ichigo-theme {{ --tb: #ff3b30; --ts: 0 0 35px rgba(255,20,10,.45), 0 0 70px rgba(0,0,0,.9), inset 0 0 25px rgba(255,20,10,.16); --ab: #ff5a4d; --as: 0 0 22px rgba(255,40,30,.9), 0 0 0 3px rgba(0,0,0,.75); --tg: linear-gradient(135deg, rgba(255,30,20,.12) 0%, rgba(200,10,10,.05) 50%, rgba(10,0,5,.3) 100%); }}
        #sidebar.yhwach-theme {{ --tb: rgba(215,230,255,.85); --ts: 0 0 35px rgba(170,205,255,.35), 0 0 90px rgba(0,0,0,.95), inset 0 0 30px rgba(0,0,0,.6); --ab: #dbe9ff; --as: 0 0 24px rgba(170,205,255,.85), 0 0 0 3px rgba(0,0,0,.8); --tg: linear-gradient(135deg, rgba(190,215,255,.10) 0%, rgba(120,160,255,.04) 50%, rgba(5,5,12,.4) 100%); }}
        #sidebar.ichibei-theme {{ --tb: rgba(236,230,214,.85); --ts: 0 0 35px rgba(200,194,180,.35), 0 0 80px rgba(0,0,0,.95), inset 0 0 30px rgba(0,0,0,.7); --ab: #ece6d6; --as: 0 0 24px rgba(236,230,214,.85), 0 0 0 3px rgba(0,0,0,.8); --tg: linear-gradient(135deg, rgba(236,230,214,.08) 0%, rgba(10,10,12,.5) 100%); }}
        #sidebar.kisuke-theme {{ --tb: rgba(255,74,95,.85); --ts: 0 0 35px rgba(255,74,95,.45), 0 0 70px rgba(0,0,0,.9), inset 0 0 25px rgba(255,74,95,.16); --ab: #ff6b7d; --as: 0 0 22px rgba(255,74,95,.9), 0 0 0 3px rgba(0,0,0,.75); --tg: linear-gradient(135deg, rgba(255,74,95,.10) 0%, rgba(243,232,207,.04) 50%, rgba(20,4,8,.4) 100%); }}
        #sidebar.kenpachi-theme {{ --tb: rgba(225,29,72,.85); --ts: 0 0 35px rgba(190,18,60,.45), 0 0 75px rgba(0,0,0,.95), inset 0 0 25px rgba(250,204,21,.16); --ab: #facc15; --as: 0 0 22px rgba(225,29,72,.85), 0 0 10px rgba(250,204,21,.55), 0 0 0 3px rgba(0,0,0,.8); --tg: linear-gradient(135deg, rgba(190,18,60,.12) 0%, rgba(250,204,21,.05) 50%, rgba(15,2,4,.4) 100%); }}
        #sidebar.soulking-theme {{ --tb: rgba(255,226,150,.85); --ts: 0 0 35px rgba(255,224,138,.35), 0 0 85px rgba(10,10,20,.95), inset 0 0 25px rgba(157,132,255,.15); --ab: #fff1c4; --as: 0 0 22px rgba(255,232,170,.85), 0 0 44px rgba(157,132,255,.45), 0 0 0 3px rgba(0,0,0,.8); --tg: linear-gradient(135deg, rgba(255,226,150,.10) 0%, rgba(157,132,255,.06) 50%, rgba(10,8,20,.5) 100%); }}
        #sidebar.nimaiya-theme {{ --tb: rgba(226,232,240,.85); --ts: 0 0 38px rgba(56,189,248,.35), 0 0 80px rgba(0,0,0,.95), inset 0 0 25px rgba(245,158,11,.18); --ab: #f8fafc; --as: 0 0 22px rgba(56,189,248,.85), 0 0 14px rgba(245,158,11,.55), 0 0 0 3px rgba(0,0,0,.82); --tg: linear-gradient(135deg, rgba(56,189,248,.10) 0%, rgba(245,158,11,.08) 50%, rgba(10,15,25,.5) 100%); }}
        #sidebar.senjumaru-theme {{ --tb: rgba(217,165,74,.85); --ts: 0 0 35px rgba(217,165,74,.38), 0 0 75px rgba(0,0,0,.95), inset 0 0 20px rgba(240,198,116,.15); --ab: #e8bd70; --as: 0 0 22px rgba(217,165,74,.8), 0 0 12px rgba(240,198,116,.5), 0 0 0 3px rgba(0,0,0,.8); --tg: linear-gradient(135deg, rgba(217,165,74,.12) 0%, rgba(240,198,116,.05) 50%, rgba(15,8,4,.45) 100%); }}
        #sidebar.tenjiro-theme {{ --tb: rgba(45,212,191,.85); --ts: 0 0 38px rgba(45,212,191,.35), 0 0 75px rgba(0,0,0,.95), inset 0 0 24px rgba(254,240,138,.15); --ab: #a7f3d0; --as: 0 0 22px rgba(45,212,191,.7), 0 0 12px rgba(254,240,138,.45), 0 0 0 3px rgba(0,0,0,.82); --tg: linear-gradient(135deg, rgba(45,212,191,.10) 0%, rgba(254,240,138,.06) 50%, rgba(8,20,24,.5) 100%); }}
        #sidebar.kirio-theme {{ --tb: rgba(52,211,153,.85); --ts: 0 0 38px rgba(52,211,153,.35), 0 0 75px rgba(0,0,0,.95), inset 0 0 24px rgba(252,211,77,.16); --ab: #fde68a; --as: 0 0 22px rgba(52,211,153,.65), 0 0 14px rgba(252,211,77,.5), 0 0 0 3px rgba(0,0,0,.82); --tg: linear-gradient(135deg, rgba(252,211,77,.10) 0%, rgba(52,211,153,.06) 50%, rgba(8,20,14,.5) 100%); }}
        #sidebar.sasakibe-theme {{ --tb: rgba(250,204,21,.9); --ts: 0 0 38px rgba(250,204,21,.45), 0 0 80px rgba(0,0,0,.95), inset 0 0 25px rgba(234,179,8,.22); --ab: #fef08a; --as: 0 0 22px rgba(250,204,21,.9), 0 0 14px rgba(245,158,11,.65), 0 0 0 3px rgba(0,0,0,.85); --tg: linear-gradient(180deg, rgba(250,204,21,.15) 0%, rgba(245,158,11,.06) 45%, rgba(10,8,2,.55) 100%); }}
        #sidebar.kira-theme {{ --tb: rgba(148,163,184,.75); --ts: 0 0 38px rgba(71,85,105,.5), 0 0 80px rgba(0,0,0,.95), inset 0 0 25px rgba(30,41,59,.35); --ab: #cbd5e1; --as: 0 0 22px rgba(148,163,184,.75), 0 0 14px rgba(71,85,105,.65), 0 0 0 3px rgba(0,0,0,.85); --tg: linear-gradient(180deg, rgba(71,85,105,.18) 0%, rgba(30,41,59,.12) 45%, rgba(10,10,15,.65) 100%); }}
        #sidebar.hitsugaya-theme {{ --tb: rgba(56,189,248,.85); --ts: 0 0 38px rgba(56,189,248,.45), 0 0 80px rgba(0,0,0,.95), inset 0 0 25px rgba(14,165,233,.25); --ab: #e0f2fe; --as: 0 0 22px rgba(56,189,248,.95), 0 0 14px rgba(2,132,199,.75), 0 0 0 3px rgba(0,0,0,.85); --tg: linear-gradient(180deg, rgba(56,189,248,.12) 0%, rgba(14,116,144,.05) 45%, rgba(2,6,23,.45) 100%); }}
        #sidebar.hitsugaya-theme #sidebar-overlay {{ background: linear-gradient(to bottom, rgba(8,47,73,.15) 0%, rgba(2,6,23,.55) 45%, rgba(2,6,23,.85) 100%) !important; }}
        #sidebar.hitsugaya-theme #sidebar-bg {{ filter: blur(1.5px) brightness(0.92) saturate(1.2) !important; opacity: 0.65 !important; background-size: cover !important; background-position: center 30% !important; }}

        /* Header & Navigation */
        .sidebar-header-line {{
            font-family: 'Cinzel', serif; color: #D4AF37; font-size: 10px; letter-spacing: 4px;
            margin-bottom: 14px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 9px;
            padding-right: 40px; display: flex; justify-content: space-between; align-items: center;
        }}

        .back-nav {{ display: flex; align-items: center; margin-bottom: 12px; }}
        .back-btn {{
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            color: #ddd; font-size: 11px; padding: 5px 10px; border-radius: 4px; cursor: pointer;
            display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }}
        .back-btn:hover {{ background: rgba(212, 175, 55, 0.25); border-color: #D4AF37; color: #fff; }}
        .back-btn strong {{ color: #fff; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}

        /* Profile Header */
        .char-header {{ display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }}
        #s-avatar {{
            width: 64px; height: 64px; border-radius: 50%;
            background-color: #0F1318; display: flex; align-items: center; justify-content: center;
            font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #fff;
            border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            background-repeat: no-repeat; flex-shrink: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        .char-title-block {{ display: flex; flex-direction: column; justify-content: center; min-width: 0; }}
        .char-name {{ font-family: 'Cinzel', serif; font-size: 18px; color: #fff; margin: 0 0 3px 0; display: flex; align-items: center; flex-wrap: wrap; }}
        .char-name-gif {{
            display: inline-block;
            vertical-align: middle;
            height: 34px;
            width: auto;
            margin-left: 8px;
            border-radius: 4px;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }}
        .ulquiorra-name-gif {{
            height: 32px;
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.85));
            animation: ulq-gif-hover 2.2s ease-in-out infinite alternate;
        }}
        @keyframes ulq-gif-hover {{
            0% {{ transform: translateY(0); filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6)); }}
            100% {{ transform: translateY(-3px); filter: drop-shadow(0 0 14px rgba(52, 211, 153, 0.95)); }}
        }}
        .ichigo-name-gif {{
            height: 36px;
            filter: drop-shadow(0 0 10px rgba(255, 30, 20, 0.85));
            animation: ichigo-mask-hover 2.4s ease-in-out infinite alternate;
        }}
        @keyframes ichigo-mask-hover {{
            0% {{ transform: translateY(0); filter: drop-shadow(0 0 8px rgba(255, 30, 20, 0.75)); }}
            100% {{ transform: translateY(-2px); filter: drop-shadow(0 0 14px rgba(255, 60, 40, 0.95)); }}
        }}
        .char-meta {{ font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }}
        .char-desc {{ font-size: 12.5px; color: #bbb; line-height: 1.6; margin-bottom: 16px; font-style: italic; }}

        /* Action Buttons */
        .action-bar {{ display: flex; gap: 8px; margin-top: 15px; margin-bottom: 12px; }}
        .action-btn {{
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            color: #ccc; font-size: 11px; padding: 8px 14px; border-radius: 4px;
            cursor: pointer; display: flex; align-items: center; gap: 6px;
            transition: all 0.2s; font-family: 'Inter', sans-serif;
        }}
        .action-btn:hover {{ background: rgba(212, 175, 55, 0.3); border-color: #D4AF37; color: #fff; }}
        .action-btn.active {{ background: #D4AF37; border-color: #D4AF37; color: #000; font-weight: 600; }}

        /* Tabs */
        .dossier-tabs {{ display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px; gap: 4px; }}
        .tab-btn {{
            background: transparent; border: none; border-bottom: 2px solid transparent;
            color: #888; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1.5px;
            padding: 8px 12px; cursor: pointer; transition: all 0.2s;
        }}
        .tab-btn:hover {{ color: #ddd; }}
        .tab-btn.active {{ color: #D4AF37; border-bottom-color: #D4AF37; font-weight: 700; }}
        .tab-pane {{ display: none; }}
        .tab-pane.active {{ display: block; }}

        /* Path Tracing Floating Banner */
        #path-banner {{
            position: fixed; top: 68px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 15, 25, 0.95); border: 1px solid #D4AF37;
            box-shadow: 0 6px 25px rgba(212, 175, 55, 0.35); border-radius: 8px;
            padding: 10px 18px; z-index: 45; display: none; align-items: center; gap: 12px;
            backdrop-filter: blur(12px); font-size: 12px; color: #eee;
            max-width: calc(100vw - 32px);
            transition: left 0.38s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        #path-banner.active {{ display: flex; }}
        #path-banner strong {{ color: #F59E0B; }}
        #path-banner button {{
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: #fff; padding: 4px 10px; border-radius: 4px; cursor: pointer;
            font-size: 11px; transition: all 0.2s;
        }}
        #path-banner button:hover {{ background: rgba(220,38,38,0.4); border-color: #DC2626; }}

        /* Connection Filter Chips & Cards */
        .conn-filter-bar {{ display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }}
        .conn-chip {{
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
            color: #888; font-size: 9.5px; padding: 3px 8px; border-radius: 8px;
            cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;
            transition: all 0.2s; user-select: none;
        }}
        .conn-chip:hover, .conn-chip.active {{ background: rgba(212, 175, 55, 0.25); border-color: #D4AF37; color: #fff; }}

        .conn-list {{ list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }}
        .conn-card {{
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 12px; background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06); border-left-width: 3px; border-left-style: solid;
            border-radius: 4px; cursor: pointer; transition: all 0.2s; text-decoration: none;
        }}
        .conn-card:hover {{ background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.25); transform: translateX(3px); }}
        .conn-card-name {{ font-size: 11.5px; font-weight: 600; color: #eee; }}
        .conn-card-label {{ font-size: 10px; color: #999; }}
        .conn-card-badge {{ font-size: 8.5px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; }}

        /* Cluster Navigation Bar */
        #cluster-bar {{
            position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
            z-index: 20; display: flex; align-items: center; gap: 6px;
            padding: 6px 10px; background: rgba(10, 10, 16, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 30px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.75); backdrop-filter: blur(14px);
            user-select: none; max-width: calc(100vw - 32px);
            overflow-x: auto; scrollbar-width: none;
            transition: left 0.38s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.38s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease, gap 0.25s ease;
        }}
        #cluster-bar::-webkit-scrollbar {{ display: none; }}
        body.sidebar-open #cluster-bar,
        body.sidebar-open #path-banner {{
            left: calc((100vw - 380px) / 2);
            max-width: calc(100vw - 410px);
        }}
        .cluster-btn {{
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.7); padding: 5px 12px; border-radius: 20px;
            font-size: 11px; font-family: 'Cinzel', serif; letter-spacing: 0.8px;
            cursor: pointer; transition: all 0.2s ease; white-space: nowrap; flex-shrink: 0;
        }}
        .cluster-btn:hover {{ background: rgba(255, 255, 255, 0.15); color: #fff; border-color: rgba(255, 255, 255, 0.25); }}
        .cluster-btn.active {{ background: rgba(212, 175, 55, 0.25); border-color: #D4AF37; color: #F5E6C8; box-shadow: 0 0 14px rgba(212, 175, 55, 0.4); }}
        @media (max-width: 1520px) {{
            body.sidebar-open #cluster-bar {{
                gap: 4px;
                padding: 5px 8px;
            }}
            body.sidebar-open .cluster-btn {{
                padding: 5px 9px;
                font-size: 10px;
                letter-spacing: 0.5px;
            }}
        }}
        @media (max-width: 768px) {{
            #sidebar {{
                top: auto; bottom: -120%; left: 0; right: 0; width: 100%; height: 52vh;
                border-radius: 20px 20px 0 0;
                transition: bottom 0.32s cubic-bezier(0.16, 1, 0.3, 1);
            }}
            #sidebar.open {{ bottom: 0; right: 0; }}
            #cluster-bar, body.sidebar-open #cluster-bar {{
                top: 12px; left: 50%; max-width: calc(100vw - 20px);
                gap: 4px; padding: 5px 8px;
            }}
            #path-banner, body.sidebar-open #path-banner {{
                top: 58px; left: 50%; max-width: calc(100vw - 24px);
            }}
            #mini-legend, #node-hover-card {{ display: none !important; }}
        }}

        /* Mini Legend */
        #mini-legend {{
            position: absolute; bottom: 20px; left: 20px; z-index: 10;
            background: rgba(10,10,15,0.7); padding: 10px 14px; border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(8px);
            font-size: 10px; color: rgba(255,255,255,0.75); display: flex; flex-direction: column; gap: 5px;
            pointer-events: none; transition: opacity 0.3s ease, transform 0.3s ease;
        }}
        #mini-legend.hidden {{ opacity: 0; transform: translateY(20px); pointer-events: none; }}
        #mini-legend .title {{ font-family: 'Cinzel', serif; letter-spacing: 2px; font-weight: 700; color: rgba(255,255,255,0.85); font-size: 9px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3px; margin-bottom: 3px; }}

        /* Search Overlay (Ctrl+K) */
        #search-overlay {{
            position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
            z-index: 60; display: none; align-items: flex-start; justify-content: center; padding-top: 18vh;
        }}
        #search-overlay.open {{ display: flex; }}
        #search-box {{
            width: 440px; background: rgba(15,15,22,0.96);
            border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
            overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.9);
        }}
        #search-input {{
            width: 100%; padding: 16px 20px; background: transparent;
            border: none; border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #fff; font-family: 'Inter', sans-serif; font-size: 15px; outline: none;
        }}
        #search-input::placeholder {{ color: #666; }}
        #search-results {{ max-height: 320px; overflow-y: auto; }}
        .search-result {{
            padding: 10px 20px; cursor: pointer; display: flex; align-items: center; gap: 10px;
            transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.02);
        }}
        .search-result:hover, .search-result.active {{ background: rgba(212, 175, 55, 0.2); }}
        .search-result .dot {{ width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }}
        .search-result .sr-name {{ font-size: 13px; color: #eee; }}
        .search-result .sr-faction {{ font-size: 10px; color: #888; margin-left: auto; text-transform: uppercase; letter-spacing: 1px; }}
        #search-hint {{ padding: 10px 20px; font-size: 10px; color: #555; text-align: center; letter-spacing: 1px; }}

        /* Floating Hover Tooltip */
        #node-hover-card {{
            position: fixed; pointer-events: none; z-index: 50;
            display: flex; align-items: center; gap: 12px; padding: 10px 16px;
            background: rgba(10, 10, 18, 0.92); border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9);
            opacity: 0; transform: translate(-50%, -125%) scale(0.92);
            transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        #node-hover-card.visible {{ opacity: 1; transform: translate(-50%, -125%) scale(1); }}
        #hover-avatar {{
            width: 44px; height: 44px; border-radius: 50%;
            background-color: #0F1318; border: 2px solid #D4AF37;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; color: #fff;
            flex-shrink: 0; background-repeat: no-repeat;
        }}
        .hover-text {{ display: flex; flex-direction: column; }}
        #hover-name {{ font-family: 'Cinzel', serif; font-size: 13px; color: #fff; }}
        #hover-meta {{ font-size: 10px; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px; }}
        #hover-conns {{ font-size: 9px; color: #888; margin-top: 2px; }}

        /* Timeline Items */
        .vertical-timeline {{ position: relative; padding-left: 20px; margin-top: 10px; }}
        .vertical-timeline::before {{ content: ''; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2px; background: rgba(255,255,255,0.1); }}
        .tl-item {{ position: relative; padding-bottom: 18px; font-size: 11px; color: #666; }}
        .tl-item::before {{ content: ''; position: absolute; left: -24px; top: 2px; width: 8px; height: 8px; background: #0F1318; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; }}
        .tl-item.active {{ color: #D4AF37; font-weight: 600; }}
        .tl-item.active::before {{ border-color: #D4AF37; background: #D4AF37; box-shadow: 0 0 10px rgba(212,175,55,0.5); }}
    </style>
</head>
<body>
    <div id="dynamic-bg" style="position:fixed; inset:0; z-index:0; background-size:cover; background-position:center; background-repeat:no-repeat; opacity:0; transition:opacity 1s ease; pointer-events:none; background-color:#0A0A0F;"></div>
    
    <!-- Floating Hover Tooltip -->
    <div id="node-hover-card">
        <div id="hover-avatar"></div>
        <div class="hover-text">
            <div id="hover-name"></div>
            <div id="hover-meta"></div>
            <div id="hover-conns"></div>
        </div>
    </div>

    <!-- Fast Loader Screen -->
    <div id="loader" title="Click to skip">
        <div class="css-spinner"></div>
        <div class="loader-text">Loading Intelligence</div>
        <div class="loader-hint">Click anywhere to skip intro</div>
    </div>

    <!-- Main Graph Container -->
    <div id="graph-container"></div>

    <!-- Cluster Navigation Bar -->
    <div id="cluster-bar">
        <button class="cluster-btn active" data-cluster="all">All Galaxy</button>
        <button class="cluster-btn" data-cluster="gotei">Gotei 13</button>
        <button class="cluster-btn" data-cluster="wandenreich">Wandenreich</button>
        <button class="cluster-btn" data-cluster="arrancar">Hueco Mundo</button>
        <button class="cluster-btn" data-cluster="royal">Royal Realm</button>
        <button class="cluster-btn" data-cluster="karakura">Karakura Town</button>
        <button class="cluster-btn" data-cluster="original">Original Gotei</button>
    </div>

    <!-- Path Tracing Banner -->
    <div id="path-banner">
        <span id="path-banner-text">Select a target character to trace connection</span>
        <button id="path-cancel-btn">Cancel</button>
    </div>

    <!-- Character Profile Sidebar -->
    <div id="sidebar">
        <div id="sidebar-bg"></div>
        <div id="sidebar-overlay"></div>
        <div class="scroll-fade"></div>
        <div id="sidebar-content">
            <button id="sidebar-close" title="Close dossier">&times;</button>
            <div class="sidebar-header-line">
                <span>CLASSIFIED // INTEL</span>
                <span id="s-id-code">S-000</span>
            </div>

            <!-- Back Navigation -->
            <div class="back-nav" id="s-back-container" style="display:none;">
                <button class="back-btn" id="s-back-btn">
                    <span>&larr; Back to</span> <strong id="s-back-name"></strong>
                </button>
            </div>

            <!-- Profile Header -->
            <div id="s-banner"></div>
            <div class="char-header">
                <div class="char-avatar" id="s-avatar"></div>
                <div class="char-title-block">
                    <div class="char-name" id="s-name">Select Node</div>
                    <div class="char-meta" id="s-meta">System Status</div>
                </div>
            </div>

            <div id="dossier-dynamic" style="display:none;">
                <!-- Tabs -->
                <div class="dossier-tabs">
                    <button class="tab-btn active" data-target="pane-overview">OVERVIEW</button>
                    <button class="tab-btn" data-target="pane-relations">RELATIONS</button>
                    <button class="tab-btn" data-target="pane-timeline">TIMELINE</button>
                </div>

                <!-- OVERVIEW PANE -->
                <div id="pane-overview" class="tab-pane active">
                    <div style="font-size: 12px; margin-bottom: 18px; color: rgba(255,255,255,0.7); line-height: 1.7;">
                        <div><strong style="color:#888; display:inline-block; width:95px;">RACE</strong> <span id="s-field-race" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">AFFILIATION</strong> <span id="s-field-affil" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">FAMILY/CLAN</strong> <span id="s-field-family" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">REIATSU CLASS</strong> <span id="s-field-tier" style="color:#D4AF37; font-family:'Cinzel';"></span></div>
                    </div>
                    
                    <div class="char-desc" id="s-desc"></div>
                    
                    <div class="action-bar">
                        <button class="action-btn" id="trace-path-btn" style="width:100%; justify-content:center;">
                            <span>&#x1F4CD;</span> TRACE CONNECTION PATH
                        </button>
                    </div>
                </div>

                <!-- RELATIONS PANE -->
                <div id="pane-relations" class="tab-pane">
                    <div class="connections-section" id="conn-section" style="margin-top:0;">
                        <div style="font-family:'Cinzel',serif; font-size:11px; letter-spacing:1.5px; color:#888; margin-bottom:8px; display:flex; justify-content:space-between;">
                            <span>KNOWN RELATIONSHIPS</span>
                            <span id="conn-count" style="color:#D4AF37;">0</span>
                        </div>
                        <div class="conn-filter-bar" id="conn-filter-bar"></div>
                        <div class="connections-list" id="s-connections"></div>
                    </div>
                </div>

                <!-- TIMELINE PANE -->
                <div id="pane-timeline" class="tab-pane">
                    <div class="vertical-timeline">
                        <div class="tl-item">SUBSTITUTE SHINIGAMI</div>
                        <div class="tl-item">SOUL SOCIETY</div>
                        <div class="tl-item">ARRANCAR</div>
                        <div class="tl-item">LOST AGENT</div>
                        <div class="tl-item">THOUSAND-YEAR BLOOD WAR</div>
                    </div>
                </div>
            </div>

            <div id="s-placeholder" style="font-size: 13px; font-style:italic; color:#888; margin-top:20px;">
                Click any character node in the spiritual network to inspect classified intelligence, examine family bloodlines, and trace tactical connections.
            </div>
        </div>
    </div>

    <!-- Mini legend -->
    <div id="mini-legend">
        <div class="title">FACTIONS</div>
        {legend_items}
    </div>

    <!-- Search overlay (Ctrl+K) -->
    <div id="search-overlay">
        <div id="search-box">
            <input type="text" id="search-input" placeholder="🔍 Search characters, factions, relationships (Ctrl+K)" autocomplete="off" />
            <div id="search-results"></div>
            <div id="search-hint">ESC to close &middot; &uarr;&darr; to navigate &middot; ENTER to select</div>
        </div>
    </div>

    <script>
        // Intro Loader Dismissal
        const loader = document.getElementById('loader');
        function dismissLoader() {{
            if (loader && loader.style.display !== 'none') {{
                loader.classList.add('fade-out');
                setTimeout(() => {{ loader.style.display = 'none'; }}, 400);
            }}
        }}
        if (loader) loader.addEventListener('click', dismissLoader);
        setTimeout(dismissLoader, 1200);

        const RAW_GRAPH = {graph_json};
        const SPRITE_MAP = {sprite_map_json};
        const SPRITE_META = {sprite_meta_json};
        const SPRITE_DATA_URI = "data:image/webp;base64,{sprite_webp_b64}";

        let Graph = null;

        // Load Sprite Sheet with instant local and remote compatibility
        const spriteSheet = new Image();
        if (location.protocol !== 'file:') {{
            spriteSheet.crossOrigin = "anonymous";
        }}
        spriteSheet.onload = () => {{
            try {{ if (Graph && Graph.refresh) Graph.refresh(); }} catch (e) {{}}
            dismissLoader();
        }};
        spriteSheet.onerror = () => {{
            if (spriteSheet.src !== SPRITE_DATA_URI) spriteSheet.src = SPRITE_DATA_URI;
        }};
        spriteSheet.src = (location.protocol === 'file:') ? SPRITE_DATA_URI : 'Asset/sprites/characters.webp?v={sprite_version}';

        // Graph State & O(1) Lookup Helpers
        let gData = {{
            nodes: RAW_GRAPH.nodes.map(n => Object.assign({{}}, n)),
            links: RAW_GRAPH.links.map(l => Object.assign({{}}, l))
        }};
        let nodeById = new Map();
        function rebuildNodeMap() {{
            nodeById = new Map(gData.nodes.map(n => [n.id, n]));
        }}
        rebuildNodeMap();

        function linkIds(l) {{
            return [
                typeof l.source === 'object' ? l.source.id : l.source,
                typeof l.target === 'object' ? l.target.id : l.target
            ];
        }}

        // Pin Ichigo in the center on initial load
        const initIchigo = nodeById.get('ichigo');
        if (initIchigo) {{
            initIchigo.x = 0; initIchigo.y = 0; initIchigo.fx = 0; initIchigo.fy = 0;
        }}

        let hoverNode = null;
        let currentNode = null;
        let activeFactionFilter = null;
        let navHistory = [];

        // Precompute Node Maps & Adjacency
        const neighbors = {{}};
        const nodeConnections = {{}};
        const nodeNameMap = {{}};

        RAW_GRAPH.nodes.forEach(n => {{
            neighbors[n.id] = new Set();
            nodeConnections[n.id] = [];
            nodeNameMap[n.id] = n.name;
        }});

        RAW_GRAPH.links.forEach(l => {{
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            if (neighbors[sid]) neighbors[sid].add(tid);
            if (neighbors[tid]) neighbors[tid].add(sid);
            if (nodeConnections[sid]) nodeConnections[sid].push({{ targetId: tid, type: l.type, label: l.label }});
            if (nodeConnections[tid]) nodeConnections[tid].push({{ targetId: sid, type: l.type, label: l.label }});
        }});

        // Relationship Categories
        function getRelCategory(relType) {{
            const typeLower = (relType || '').toLowerCase();
            if (typeLower.includes('parent') || typeLower.includes('child') || typeLower.includes('sibling') || typeLower.includes('spouse') || typeLower.includes('cousin') || typeLower.includes('ancestor') || typeLower.includes('blood') || typeLower.includes('family') || typeLower.includes('clan')) {{
                return {{ name: 'Family', color: '#D4AF37' }};
            }}
            if (typeLower.includes('rival') || typeLower.includes('enemy') || typeLower.includes('killed') || typeLower.includes('nemesis') || typeLower.includes('opposed') || typeLower.includes('betrayal')) {{
                return {{ name: 'Rival', color: '#DC2626' }};
            }}
            if (typeLower.includes('captain') || typeLower.includes('lieutenant') || typeLower.includes('officer') || typeLower.includes('subordinate') || typeLower.includes('master') || typeLower.includes('creator') || typeLower.includes('leader') || typeLower.includes('command')) {{
                return {{ name: 'Military', color: '#4A9EFF' }};
            }}
            if (typeLower.includes('friend') || typeLower.includes('ally') || typeLower.includes('comrade') || typeLower.includes('saved') || typeLower.includes('bond') || typeLower.includes('social')) {{
                return {{ name: 'Allies', color: '#10B981' }};
            }}
            return {{ name: 'Organization', color: '#9CA3AF' }};
        }}

        function escapeHtml(str) {{
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }}

        // HTML Elements & Panel Registry
        const sidebar = document.getElementById('sidebar');
        const PANEL_CONFIG = {{
            rukia:      {{ api: 'FrostPanel',     opts: {{ particles: 30, snow: true }}, theme: 'frost-theme',     banner: 'Asset/Images/Rukia.jpg',           bg: 'Asset/Images/Rukia.jpg',            op: '0.6' }},
            yamamoto:   {{ api: 'FlamePanel',     opts: {{ embers: 45 }},                theme: 'flame-theme',     banner: 'Asset/Images/Yamamoto.jpg',        bg: 'Asset/Images/Yamamoto.jpg',         op: '0.6' }},
            aizen:      {{ api: 'GlassPanel',     opts: {{ impact: [0.7, 0.3] }},        theme: 'glass-theme',     banner: 'Asset/Images/Aizen.jpg',           bg: 'Asset/Images/Aizen.jpg',            op: '0.6' }},
            ichigo:     {{ api: 'IchigoPanel',    theme: 'ichigo-theme',    banner: 'Asset/Images/Ichigo.jpg',           bg: 'Asset/Images/Ichigo.jpg',           op: '0.6' }},
            yhwach:     {{ api: 'YhwachPanel',    theme: 'yhwach-theme',    banner: 'Asset/Images/Yhwach.jpg',           bg: 'Asset/Images/Yhwach.jpg',           op: '0.6' }},
            ichibei:    {{ api: 'IchibeiPanel',   theme: 'ichibei-theme',   banner: 'Asset/Images/Ichibei.jpg',          bg: 'Asset/Images/Ichibei.jpg',          op: '0.6' }},
            urahara:    {{ api: 'KisukePanel',    theme: 'kisuke-theme',    banner: 'Asset/Images/Kisuke.jpg',           bg: 'Asset/Images/Kisuke.jpg',           op: '0.6' }},
            kenpachi:   {{ api: 'KenpachiPanel',  theme: 'kenpachi-theme',  banner: 'Asset/Images/Kenpachi.jpg',         bg: 'Asset/Images/Kenpachi.jpg',         op: '0.6' }},
            soul_king:  {{ api: 'SoulKingPanel',  theme: 'soulking-theme',  banner: 'Asset/Images/Soul King.jpg',        bg: 'Asset/Images/Soul King.jpg',        op: '0.6' }},
            oetsu:      {{ api: 'NimaiyaPanel',   theme: 'nimaiya-theme',   banner: 'Asset/Images/Nimaiya Bg.jpg',       bg: 'Asset/Images/Nimaiya Bg.jpg',       op: '0.6' }},
            senjumaru:  {{ api: 'SenjumaruPanel', theme: 'senjumaru-theme', banner: 'Asset/Images/Senjumaru Bg.jpg',     bg: 'Asset/Images/Senjumaru Bg.jpg',     op: '0.6' }},
            tenjiro:    {{ api: 'TenjiroPanel',   theme: 'tenjiro-theme',   banner: 'Asset/Images/Tenjiro.jpg',          bg: 'Asset/Images/Tenjiro.jpg',          op: '0.6' }},
            kirio:      {{ api: 'KirioPanel',     theme: 'kirio-theme',     banner: 'Asset/Images/Kirio.jpg',            bg: 'Asset/Images/Kirio.jpg',            op: '0.6' }},
            sasakibe:   {{ api: 'SasakibePanel',  theme: 'sasakibe-theme',  banner: 'Asset/Images/Sasakibe Bg.jpg',      bg: 'Asset/Images/Sasakibe Bankai.jpg',  op: '0.65' }},
            kira:       {{ api: 'KiraPanel',      theme: 'kira-theme',      banner: 'Asset/Images/Kira.jpg',             bg: 'Asset/Images/Kira Bankai.jpg',      op: '0.65' }},
            hitsugaya:  {{ api: 'HitsugayaPanel', theme: 'hitsugaya-theme', banner: 'Asset/Images/Hitsugaya Dragon.jpg', bg: 'Asset/Images/Hitsugaya Bankai.jpg', op: '0.68' }},
            soi_fon:    {{ api: 'SoifonPanel' }},
            omaeda:     {{ api: 'OmaedaPanel' }},
            gin:        {{ api: 'GinPanel' }},
            unohana:    {{ api: 'UnohanaPanel' }},
            isane:      {{ api: 'IsanePanel' }},
            momo:       {{ api: 'MomoPanel' }},
            byakuya:    {{ api: 'ByakuyaPanel' }},
            renji:      {{ api: 'RenjiPanel' }},
            komamura:   {{ api: 'KomamuraPanel' }},
            shunsui:    {{ api: 'ShunsuiPanel' }},
            nanao:      {{ api: 'NanaoPanel' }},
            tosen:      {{ api: 'TosenPanel' }},
            hisagi:     {{ api: 'HisagiPanel' }},
            rangiku:    {{ api: 'RangikuPanel' }},
            yachiru:    {{ api: 'YachiruPanel' }},
            mayuri:     {{ api: 'MayuriPanel' }},
            nemu:       {{ api: 'NemuPanel' }},
            ukitake:    {{ api: 'UkitakePanel' }}
        }};
        PANEL_CONFIG.kisuke = PANEL_CONFIG.urahara;
        PANEL_CONFIG.zaraki = PANEL_CONFIG.kenpachi;
        PANEL_CONFIG.soulking = PANEL_CONFIG.soul_king;
        PANEL_CONFIG.nimaiya = PANEL_CONFIG.oetsu;
        PANEL_CONFIG.shutara = PANEL_CONFIG.senjumaru;
        PANEL_CONFIG.kirinji = PANEL_CONFIG.tenjiro;
        PANEL_CONFIG.hikifune = PANEL_CONFIG.kirio;

        const panelCache = {{}};
        let activePanel = null;
        let activeTheme = null;

        function getPanelInstance(cfg) {{
            if (!cfg || !cfg.api) return null;
            if (!panelCache[cfg.api]) {{
                const mod = window[cfg.api];
                if (mod && mod.attach) panelCache[cfg.api] = mod.attach(sidebar, cfg.opts);
            }}
            return panelCache[cfg.api] || null;
        }}

        const sidebarClose = document.getElementById('sidebar-close');
        const sName = document.getElementById('s-name');
        const sMeta = document.getElementById('s-meta');
        const sDesc = document.getElementById('s-desc');
        const connSection = document.getElementById('conn-section');
        const sConnections = document.getElementById('s-connections');
        const connCount = document.getElementById('conn-count');
        const tracePathBtn = document.getElementById('trace-path-btn');
        const pathBanner = document.getElementById('path-banner');
        const pathBannerText = document.getElementById('path-banner-text');
        const pathCancelBtn = document.getElementById('path-cancel-btn');
        const sBackContainer = document.getElementById('s-back-container');
        const sBackBtn = document.getElementById('s-back-btn');
        const sBackName = document.getElementById('s-back-name');
        const miniLegend = document.getElementById('mini-legend');

        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetPane = document.getElementById(btn.dataset.target);
                if (targetPane) targetPane.classList.add('active');
            }});
        }});

        function closeAllPanels() {{
            if (activePanel) {{ activePanel.close(); activePanel = null; }}
            if (activeTheme) {{ sidebar.classList.remove(activeTheme); activeTheme = null; }}
        }}

        function deselectNode() {{
            currentNode = null;
            navHistory = [];
            updateBackNav();
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
            closeAllPanels();
            const b = document.getElementById('s-banner');
            if (b) b.style.display = 'none';
            miniLegend.classList.remove('hidden');
            clearPathFinding();
            document.body.style.cursor = 'default';
            history.replaceState(null, '', window.location.pathname);
            fitGraphToScreen(700);
        }}

        sidebarClose.addEventListener('click', deselectNode);

        function updateBackNav() {{
            if (navHistory.length > 0) {{
                const prevNode = navHistory[navHistory.length - 1];
                sBackName.innerText = prevNode.name;
                sBackContainer.style.display = 'flex';
            }} else {{
                sBackContainer.style.display = 'none';
            }}
        }}

        sBackBtn.addEventListener('click', () => {{
            if (navHistory.length > 0) {{
                const prevNode = navHistory.pop();
                selectNode(prevNode, false);
            }}
        }});

        function renderConnections(node, activeFilter = 'ALL') {{
            const rawConns = nodeConnections[node.id] || [];
            connCount.innerText = rawConns.length;
            const filterBar = document.getElementById('conn-filter-bar');
            
            const cats = new Set();
            rawConns.forEach(c => cats.add(getRelCategory(c.type).name));

            let filterHtml = '<div class="conn-chip' + (activeFilter === 'ALL' ? ' active' : '') + '" data-cat="ALL">ALL (' + rawConns.length + ')</div>';
            cats.forEach(cat => {{
                const count = rawConns.filter(c => getRelCategory(c.type).name === cat).length;
                filterHtml += '<div class="conn-chip' + (activeFilter === cat ? ' active' : '') + '" data-cat="' + cat + '">' + cat.toUpperCase() + ' (' + count + ')</div>';
            }});
            filterBar.innerHTML = filterHtml;

            filterBar.querySelectorAll('.conn-chip').forEach(chip => {{
                chip.addEventListener('click', () => renderConnections(node, chip.dataset.cat));
            }});

            const filteredConns = activeFilter === 'ALL' ? rawConns : rawConns.filter(c => getRelCategory(c.type).name === activeFilter);

            let html = '<div class="conn-list">';
            filteredConns.forEach(c => {{
                const targetNode = nodeById.get(c.targetId) || {{ name: c.targetId, race: 'Unknown', color: '#888' }};
                const catObj = getRelCategory(c.type);
                html += '<div class="conn-card" style="border-left-color:' + catObj.color + '" data-target-id="' + c.targetId + '">' +
                    '<div class="conn-card-info">' +
                    '<div class="conn-card-name">' + escapeHtml(targetNode.name) + '</div>' +
                    '<div class="conn-card-label">' + escapeHtml(c.label || c.type) + '</div>' +
                    '</div>' +
                    '<div class="conn-card-badge" style="background:' + catObj.color + '22;color:' + catObj.color + ';border:1px solid ' + catObj.color + '44">' + catObj.name + '</div>' +
                    '</div>';
            }});
            html += '</div>';
            sConnections.innerHTML = html;

            sConnections.querySelectorAll('.conn-card').forEach(card => {{
                card.addEventListener('click', () => {{
                    const targetNode = nodeById.get(card.dataset.targetId);
                    if (targetNode) selectNode(targetNode, true);
                }});
            }});
        }}

        // Offscreen avatar generator for crisp sidebar and hover background
        const charAvatarCache = {{}};
        function getCharacterAvatarUrl(nodeId, size = 256) {{
            if (charAvatarCache[nodeId]) return charAvatarCache[nodeId];
            const s = SPRITE_MAP[nodeId];
            if (!s || !spriteSheet.complete || spriteSheet.naturalWidth === 0) return null;
            try {{
                const offCanvas = document.createElement('canvas');
                offCanvas.width = size; offCanvas.height = size;
                const offCtx = offCanvas.getContext('2d');
                offCtx.imageSmoothingEnabled = true;
                offCtx.imageSmoothingQuality = 'high';
                offCtx.drawImage(spriteSheet, s.x, s.y, s.w, s.h, 0, 0, size, size);
                const dataUrl = offCanvas.toDataURL('image/webp', 0.92);
                charAvatarCache[nodeId] = dataUrl;
                return dataUrl;
            }} catch (e) {{
                return null;
            }}
        }}

        function applyAvatarStyle(el, node, size, spriteShadow, fallbackShadow) {{
            const s = SPRITE_MAP[node.id];
            el.style.borderColor = node.color;
            if (s && spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                el.innerText = '';
                el.style.backgroundImage = 'url(' + spriteSheet.src + ')';
                const scale = size / s.w;
                el.style.backgroundSize = (SPRITE_META.sheetWidth * scale) + 'px ' + (SPRITE_META.sheetHeight * scale) + 'px';
                el.style.backgroundPosition = '-' + (s.x * scale) + 'px -' + (s.y * scale) + 'px';
                el.style.boxShadow = spriteShadow;
            }} else {{
                el.style.backgroundImage = 'none';
                el.style.backgroundColor = '#0F1318';
                el.style.boxShadow = fallbackShadow;
                el.innerText = node.initials || '??';
                el.style.color = node.color;
            }}
        }}

        function openSidebar(node) {{
            const sidebarBg = document.getElementById('sidebar-bg');
            const sAvatar = document.getElementById('s-avatar');
            const sSprite = SPRITE_MAP[node.id];

            closeAllPanels();
            const b = document.getElementById('s-banner');
            const cfg = PANEL_CONFIG[node.id];

            if (cfg && cfg.banner) {{
                if (b) {{ b.style.backgroundImage = "url('" + cfg.banner + "')"; b.style.display = 'block'; }}
                if (cfg.theme) {{ sidebar.classList.add(cfg.theme); activeTheme = cfg.theme; }}
                sidebarBg.style.backgroundImage = "url('" + (cfg.bg || cfg.banner) + "')";
                sidebarBg.style.opacity = cfg.op || '0.6';
            }} else {{
                if (b) b.style.display = 'none';
                const avatarDataUrl = (sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0) ? getCharacterAvatarUrl(node.id, 384) : null;
                if (avatarDataUrl) {{
                    sidebarBg.style.backgroundImage = 'url(' + avatarDataUrl + ')';
                    sidebarBg.style.opacity = '0.38';
                }} else {{
                    sidebarBg.style.backgroundImage = 'radial-gradient(circle at 85% 15%, ' + node.color + (sSprite ? '33' : '22') + ', transparent 65%)';
                    sidebarBg.style.opacity = '1';
                }}
            }}

            applyAvatarStyle(sAvatar, node, 64, '0 0 20px ' + node.color + '55', '0 0 16px ' + node.color + '44');

            if (node.id === 'ulquiorra') {{
                sName.innerHTML = escapeHtml(node.name) + ' <img class="char-name-gif ulquiorra-name-gif" src="Asset/GIF/Ulquiorra.gif" alt="Ulquiorra" />';
            }} else if (node.id === 'ichigo') {{
                sName.innerHTML = escapeHtml(node.name) + ' <img class="char-name-gif ichigo-name-gif" src="Asset/GIF/ichigo mask.gif?t=' + Date.now() + '" alt="Hollow Mask" />';
            }} else {{
                sName.innerText = node.name;
            }}
            sMeta.innerText = 'STATUS: ACTIVE';
            document.getElementById('s-id-code').innerText = 'S-' + Math.floor(Math.random()*900 + 100);
            document.getElementById('s-placeholder').style.display = 'none';
            document.getElementById('dossier-dynamic').style.display = 'block';
            
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelector('.tab-btn[data-target="pane-overview"]').classList.add('active');
            document.getElementById('pane-overview').classList.add('active');

            document.getElementById('s-field-race').innerText = node.race || 'CLASSIFIED';
            document.getElementById('s-field-affil').innerText = node.faction || 'UNKNOWN';
            document.getElementById('s-field-family').innerText = node.family || 'NONE';
            
            const tiers = {{ 1: 'SPECIAL WAR POTENTIAL', 2: 'CAPTAIN CLASS', 3: 'LIEUTENANT CLASS', 4: 'STANDARD' }};
            document.getElementById('s-field-tier').innerText = tiers[node.tier || 4] || 'UNMEASURED';
            sDesc.innerText = node.desc || 'No intelligence data available on this subject.';

            const tlItems = document.querySelectorAll('.tl-item');
            const descLower = (node.desc || '').toLowerCase();
            tlItems[0].classList.toggle('active', descLower.includes('substitute'));
            tlItems[1].classList.toggle('active', descLower.includes('soul society') || descLower.includes('rukia'));
            tlItems[2].classList.toggle('active', descLower.includes('arrancar') || descLower.includes('hueco') || descLower.includes('aizen') || descLower.includes('espada'));
            tlItems[3].classList.toggle('active', descLower.includes('lost agent') || descLower.includes('fullbring'));
            tlItems[4].classList.toggle('active', descLower.includes('thousand-year') || descLower.includes('yhwach') || descLower.includes('sternritter') || descLower.includes('tybw') || descLower.includes('blood war'));
            if (!Array.from(tlItems).some(item => item.classList.contains('active'))) {{
                tlItems.forEach(item => item.classList.add('active'));
            }}

            const conns = nodeConnections[node.id] || [];
            if (conns.length > 0) {{
                connSection.style.display = 'block';
                renderConnections(node, 'ALL');
            }} else {{
                connSection.style.display = 'none';
            }}

            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
            miniLegend.classList.add('hidden');
            const panel = getPanelInstance(cfg);
            if (panel) {{ activePanel = panel; panel.open(); }}
        }}

        function getBounds(nodes) {{
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            nodes.forEach(n => {{
                if (n.x === undefined || n.y === undefined) return;
                if (n.x < minX) minX = n.x;
                if (n.x > maxX) maxX = n.x;
                if (n.y < minY) minY = n.y;
                if (n.y > maxY) maxY = n.y;
            }});
            return isFinite(minX) ? {{ minX, maxX, minY, maxY }} : null;
        }}

        function selectNode(node, pushHistory = true) {{
            if (!node) return;
            if (pushHistory && currentNode && currentNode.id !== node.id) {{
                navHistory.push(currentNode);
            }}
            currentNode = node;
            updateBackNav();
            openSidebar(node);
            const nbrNodes = Array.from(neighbors[node.id] || []).map(id => nodeById.get(id)).filter(Boolean);
            fitGraphToScreen(850, {{ nodes: [node, ...nbrNodes], centerNode: node }});
            history.replaceState(null, '', '#' + encodeURIComponent(node.id));
        }}

        // Shortest Path Finder (BFS)
        let pathFindingFrom = null;
        let highlightedPathNodes = new Set();
        let highlightedPathLinks = new Set();

        function findShortestPath(startId, endId) {{
            if (startId === endId) return [startId];
            const queue = [[startId]];
            const visited = new Set([startId]);
            while (queue.length > 0) {{
                const path = queue.shift();
                const curr = path[path.length - 1];
                const nbrs = neighbors[curr] || new Set();
                for (const nbr of nbrs) {{
                    if (!visited.has(nbr)) {{
                        visited.add(nbr);
                        const newPath = [...path, nbr];
                        if (nbr === endId) return newPath;
                        queue.push(newPath);
                    }}
                }}
            }}
            return null;
        }}

        function executePathFinding(targetNode) {{
            if (!pathFindingFrom) return;
            const path = findShortestPath(pathFindingFrom.id, targetNode.id);
            if (path && path.length > 1) {{
                highlightedPathNodes = new Set(path);
                highlightedPathLinks = new Set();
                for (let i = 0; i < path.length - 1; i++) {{
                    const a = path[i], b = path[i + 1];
                    highlightedPathLinks.add(a + '--' + b);
                    highlightedPathLinks.add(b + '--' + a);
                }}

                const degrees = path.length - 1;
                const pathNames = path.map(id => nodeNameMap[id] || id).join(' &rarr; ');
                pathBannerText.innerHTML = 'Connection Path (' + degrees + ' degree' + (degrees > 1 ? 's' : '') + '): <strong>' + pathNames + '</strong>';
                pathCancelBtn.innerText = 'Clear Path';

                fitGraphToScreen(850, {{ nodes: path.map(id => nodeById.get(id)).filter(Boolean), isPath: true }});
            }} else {{
                pathBannerText.innerHTML = 'No connection path found between <strong>' + escapeHtml(pathFindingFrom.name) + '</strong> and <strong>' + escapeHtml(targetNode.name) + '</strong>';
                pathCancelBtn.innerText = 'Dismiss';
            }}
            pathFindingFrom = null;
            tracePathBtn.classList.remove('active');
        }}

        function clearPathFinding() {{
            pathFindingFrom = null;
            highlightedPathNodes.clear();
            highlightedPathLinks.clear();
            pathBanner.classList.remove('active');
            tracePathBtn.classList.remove('active');
        }}

        tracePathBtn.addEventListener('click', () => {{
            if (!currentNode) return;
            if (pathFindingFrom || highlightedPathNodes.size > 0) {{
                clearPathFinding();
            }} else {{
                pathFindingFrom = currentNode;
                highlightedPathNodes.clear();
                highlightedPathLinks.clear();
                pathBannerText.innerHTML = 'Tracing path from <strong>' + escapeHtml(currentNode.name) + '</strong> &rarr; Click any character';
                pathCancelBtn.innerText = 'Cancel';
                pathBanner.classList.add('active');
                tracePathBtn.classList.add('active');
            }}
        }});

        pathCancelBtn.addEventListener('click', clearPathFinding);

        function isFactionLink(sid, tid) {{
            const s = nodeById.get(sid), t = nodeById.get(tid);
            const ok = n => n && (n.race === activeFactionFilter || n.faction === activeFactionFilter);
            return ok(s) && ok(t);
        }}

        // ForceGraph Engine Initialization
        Graph = ForceGraph()(document.getElementById('graph-container'))
            .graphData(gData)
            .nodeId('id')
            .nodeRelSize(4)
            .backgroundColor('rgba(10, 10, 15, 0.45)')
            .linkCurvature(0.2)
            .linkWidth(link => {{
                const [sid, tid] = linkIds(link);
                if (highlightedPathLinks.size > 0) return highlightedPathLinks.has(sid + '--' + tid) ? 3.2 : 0.35;
                if (hoverNode) return (sid === hoverNode.id || tid === hoverNode.id) ? 2.5 : 0.35;
                if (currentNode) return (sid === currentNode.id || tid === currentNode.id) ? 2.5 : 0.35;
                if (activeFactionFilter) return isFactionLink(sid, tid) ? 1.5 : 0.2;
                return 0.8;
            }})
            .linkColor(link => {{
                const [sid, tid] = linkIds(link);
                if (highlightedPathLinks.size > 0) return highlightedPathLinks.has(sid + '--' + tid) ? '#F59E0B' : 'rgba(255,255,255,0.025)';
                if (hoverNode) return (sid === hoverNode.id || tid === hoverNode.id) ? 'rgba(255,255,255,1.0)' : 'rgba(255,255,255,0.025)';
                if (currentNode) return (sid === currentNode.id || tid === currentNode.id) ? 'rgba(245,158,11,1.0)' : 'rgba(255,255,255,0.025)';
                if (activeFactionFilter) return isFactionLink(sid, tid) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.025)';
                return 'rgba(255,255,255,0.15)';
            }})
            .linkLineDash(link => {{
                const cat = getRelCategory(link.type || 'Other').name;
                if (cat === 'Rival') return [2, 4];
                if (cat === 'Military' || cat === 'Organization') return [5, 5];
                if (cat === 'Allies') return [1, 2];
                return null;
            }})
            .linkDirectionalParticles(link => {{
                if (!highlightedPathLinks.size) return 0;
                const [sid, tid] = linkIds(link);
                return highlightedPathLinks.has(sid + '--' + tid) ? 4 : 0;
            }})
            .linkDirectionalParticleSpeed(0.008)
            .linkDirectionalParticleWidth(2.5)
            .linkDirectionalParticleColor(() => '#F59E0B')

            // Custom Canvas Node Rendering with Sprite Slicing
            .nodeCanvasObject((node, ctx, globalScale) => {{
                if (node === gData.nodes[0] || !window.__cachedTransform) {{
                    window.__cachedTransform = ctx.getTransform();
                }}
                const transform = window.__cachedTransform;
                const dpr = window.devicePixelRatio || 1;
                const screenX = (node.x * transform.a + transform.e) / dpr;
                const screenY = (node.y * transform.d + transform.f) / dpr;
                const margin = 120;
                if (screenX < -margin || screenX > window.innerWidth + margin || screenY < -margin || screenY > window.innerHeight + margin) {{
                    return;
                }}

                const isHovered = node === hoverNode;
                const isSelected = (currentNode && currentNode.id === node.id);
                const isPathNode = highlightedPathNodes.has(node.id);
                const isConnectedToHover = hoverNode && neighbors[hoverNode.id] && neighbors[hoverNode.id].has(node.id);
                const isConnectedToSelected = currentNode && neighbors[currentNode.id] && neighbors[currentNode.id].has(node.id);

                let isDimmed = false;
                if (activeFactionFilter) {{
                    isDimmed = (node.race !== activeFactionFilter && node.faction !== activeFactionFilter);
                }} else if (highlightedPathNodes.size > 0) {{
                    isDimmed = !isPathNode;
                }} else if (hoverNode) {{
                    isDimmed = !isHovered && !isConnectedToHover;
                }} else if (currentNode) {{
                    isDimmed = !isSelected && !isConnectedToSelected;
                }}

                const isTopPillar = node.is_top || ['ichigo', 'yhwach', 'yamamoto', 'aizen', 'soul_king', 'ichibei', 'shunsui', 'kenpachi', 'urahara', 'byakuya', 'rukia', 'gin', 'ulquiorra', 'grimmjow', 'hitsugaya', 'oetsu', 'nimaiya', 'senjumaru', 'shutara', 'tenjiro', 'kirio', 'sasakibe', 'kira'].includes(node.id);

                // Responsive Level-of-Detail (LOD): Avatars render crisply at standard zoom
                let canRenderAvatar = false;
                if (globalScale >= 0.45) {{
                    canRenderAvatar = true;
                }} else if (globalScale >= 0.22) {{
                    canRenderAvatar = isTopPillar || isHovered || isSelected || isPathNode || isConnectedToHover || isConnectedToSelected || (node.tier <= 3);
                }} else {{
                    canRenderAvatar = isHovered || isSelected || isTopPillar;
                }}

                const tier = node.tier || 4;
                let baseRadius;
                if (tier === 1) baseRadius = 26.0;
                else if (tier === 2) baseRadius = 18.0;
                else if (tier === 3) baseRadius = 13.5;
                else if (tier === 4) baseRadius = 9.5;
                else baseRadius = 5.8;

                const stateMultiplier = isHovered ? 1.35 : (isSelected ? 1.2 : 1.0);
                const effectiveRadius = baseRadius * stateMultiplier;

                const sSprite = SPRITE_MAP[node.id];
                const hasAvatar = sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0;
                const imgSize = (hasAvatar && canRenderAvatar) ? effectiveRadius : (effectiveRadius * 0.85);

                if (isHovered) {{
                    const hoverCard = document.getElementById('node-hover-card');
                    if (hoverCard && hoverCard.classList.contains('visible')) {{
                        hoverCard.style.left = screenX + 'px';
                        hoverCard.style.top = (screenY - 12) + 'px';
                    }}
                }}

                // Reiatsu Glow
                if (!isDimmed) {{
                    ctx.beginPath();
                    let pulse = isSelected ? (1.0 + Math.sin(Date.now() / 250) * 0.12) : 1.0;
                    const baseGlow = (hasAvatar && canRenderAvatar ? imgSize : effectiveRadius) * 1.8;
                    const finalGlow = isSelected ? (baseGlow * pulse * 1.3) : baseGlow;
                    
                    ctx.arc(node.x, node.y, finalGlow, 0, 2 * Math.PI);
                    
                    if (isSelected) {{
                        const grad = ctx.createRadialGradient(node.x, node.y, effectiveRadius, node.x, node.y, finalGlow);
                        grad.addColorStop(0, 'rgba(212,175,55,0.7)');
                        grad.addColorStop(1, 'rgba(212,175,55,0)');
                        ctx.fillStyle = grad;
                    }} else if (isPathNode) {{
                        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
                    }} else {{
                        ctx.fillStyle = node.color + '22';
                    }}
                    ctx.fill();
                }}

                if (canRenderAvatar && hasAvatar && !isDimmed) {{
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.clip();

                    ctx.drawImage(
                        spriteSheet,
                        sSprite.x, sSprite.y, sSprite.w, sSprite.h,
                        node.x - imgSize, node.y - imgSize, imgSize * 2, imgSize * 2
                    );

                    if (!isHovered && !isSelected && !isPathNode && !isConnectedToHover && !isConnectedToSelected) {{
                        ctx.fillStyle = 'rgba(10, 10, 15, 0.16)';
                        ctx.fill();
                    }}
                    ctx.restore();

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.lineWidth = (isHovered || isSelected || isPathNode ? 2.5 : 1.5) / globalScale;
                    ctx.strokeStyle = isPathNode ? '#F59E0B' : (isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : node.color));
                    ctx.stroke();
                }} else if (canRenderAvatar && !isDimmed && globalScale >= 0.9) {{
                    const fallbackSize = Math.max(effectiveRadius, 7);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, fallbackSize, 0, 2 * Math.PI);
                    ctx.fillStyle = '#0F1318';
                    ctx.fill();

                    ctx.lineWidth = (isHovered || isSelected || isPathNode ? 2.0 : 1.0) / globalScale;
                    ctx.strokeStyle = isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : node.color);
                    ctx.stroke();

                    const initials = node.initials || '??';
                    const initFontSize = Math.max(fallbackSize * 0.9, 7.5);
                    ctx.font = '600 ' + initFontSize + 'px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = (isHovered || isSelected) ? '#FFFFFF' : node.color;
                    ctx.fillText(initials, node.x, node.y + 0.5);
                }} else {{
                    const dotRadius = Math.max(effectiveRadius * 0.65, 2.8);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, dotRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = isDimmed ? (node.color + '18') : (isPathNode ? '#F59E0B' : node.color);
                    ctx.fill();

                    if (!isDimmed) {{
                        ctx.lineWidth = (isHovered || isPathNode ? 2.5 : 0.6) / globalScale;
                        ctx.strokeStyle = isPathNode ? '#F59E0B' : (isHovered ? '#fff' : '#000');
                        ctx.stroke();
                    }}
                }}

                if (!node.__label) {{
                    node.__label = node.name.split(' ')[0].toUpperCase();
                }}
                const label = node.__label;
                const fontSize = Math.max(10 / globalScale, 2);
                const currentRadius = (canRenderAvatar && hasAvatar && !isDimmed) ? imgSize : ((canRenderAvatar && !isDimmed && globalScale >= 0.9) ? Math.max(effectiveRadius, 7) : Math.max(effectiveRadius * 0.65, 2.8));
                const labelY = node.y + currentRadius + 3;

                let shouldShowLabel = false;
                if (isHovered || isPathNode) {{
                    shouldShowLabel = true;
                }} else if (globalScale >= 1.1) {{
                    shouldShowLabel = true;
                }} else if (globalScale >= 0.6 && (isTopPillar || isConnectedToHover || isConnectedToSelected)) {{
                    shouldShowLabel = true;
                }} else if (globalScale < 0.6 && isTopPillar && globalScale >= 0.35) {{
                    shouldShowLabel = true;
                }}

                if (!isDimmed && shouldShowLabel) {{
                    ctx.font = fontSize + 'px Cinzel';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = isPathNode ? '#F59E0B' : (isHovered ? '#fff' : 'rgba(255,255,255,0.75)');
                    ctx.fillText(label, node.x, labelY);
                }}
            }})
            .onNodeHover(node => {{
                hoverNode = node || null;
                document.body.style.cursor = node ? 'pointer' : 'default';

                const hoverCard = document.getElementById('node-hover-card');
                if (node) {{
                    applyAvatarStyle(document.getElementById('hover-avatar'), node, 44, '0 0 16px ' + node.color + '77', '0 0 12px ' + node.color + '44');
                    document.getElementById('hover-name').innerText = node.name;
                    document.getElementById('hover-meta').innerText = node.race + ' • ' + node.faction;
                    const cCount = (nodeConnections[node.id] || []).length;
                    document.getElementById('hover-conns').innerText = cCount + (cCount === 1 ? ' CONNECTION' : ' CONNECTIONS');

                    const coords = Graph.graph2ScreenCoords(node.x, node.y);
                    hoverCard.style.left = coords.x + 'px';
                    hoverCard.style.top = (coords.y - 12) + 'px';
                    hoverCard.classList.add('visible');
                }} else {{
                    hoverCard.classList.remove('visible');
                }}
            }})
            .onNodeDragEnd(node => {{
                node.fx = node.x;
                node.fy = node.y;
            }})
            .onNodeClick(node => {{
                if (node) {{
                    document.body.style.cursor = 'pointer';
                    if (pathFindingFrom) {{
                        executePathFinding(node);
                    }} else {{
                        selectNode(node, true);
                    }}
                }}
            }})
            .onBackgroundClick(() => {{
                deselectNode();
            }});

        // Physics Engine Force Configuration
        Graph.warmupTicks(35);
        Graph.cooldownTicks(95);
        Graph.d3Force('charge').strength(-160).distanceMax(480);
        Graph.d3Force('link').distance(link => {{
            const [sid, tid] = linkIds(link);
            if ((sid === 'aizen' && (tid === 'gin' || tid === 'tosen')) || (tid === 'aizen' && (sid === 'gin' || sid === 'tosen'))) return 52;
            const ESPADA_IDS = new Set(['starrk', 'baraggan', 'harribel', 'ulquiorra', 'nnoitra', 'grimmjow', 'zommari', 'szayelaporro', 'aaroniero', 'yammy']);
            if ((sid === 'aizen' && ESPADA_IDS.has(tid)) || (tid === 'aizen' && ESPADA_IDS.has(sid))) return 145;
            if (sid === 'aizen' || tid === 'aizen') return 245;
            if ((sid === 'baraggan' && tid === 'ikomikidomoe') || (tid === 'baraggan' && sid === 'ikomikidomoe')) return 130;
            if (sid === 'baraggan' || tid === 'baraggan') return 120;
            if (link.type === 'Fracción') return 115;
            if (link.type === 'Soul Bond' || link.type === 'Parent') return 60;
            return 80;
        }});
        if (window.d3 && typeof d3.forceCollide === 'function') {{
            Graph.d3Force('collide', d3.forceCollide().radius(node => {{
                const tier = node.tier || 4;
                if (tier === 1) return 38;
                if (tier === 2) return 26;
                if (tier === 3) return 20;
                if (tier === 4) return 15;
                return 10;
            }}).iterations(2));
        }}
        Graph.d3VelocityDecay(0.35);
        Graph.d3AlphaDecay(0.032);

        window.addEventListener('resize', () => {{
            Graph.width(window.innerWidth);
            Graph.height(window.innerHeight);
            if (!currentNode) {{
                fitGraphToScreen(200);
            }}
        }});

        function getFactionFilter(clusterType) {{
            if (clusterType === 'all') return () => true;
            if (clusterType === 'gotei') {{
                const roster = ['yamamoto', 'sasakibe', 'soi_fon', 'omaeda', 'gin', 'kira', 'unohana', 'isane', 'aizen', 'momo', 'byakuya', 'renji', 'komamura', 'shunsui', 'nanao', 'tosen', 'hisagi', 'hitsugaya', 'rangiku', 'kenpachi', 'yachiru', 'mayuri', 'nemu', 'ukitake', 'rukia'];
                return n => roster.includes(n.id);
            }}
            if (clusterType === 'wandenreich') {{
                const karakuraQuincies = ['masaki', 'ryuken', 'soken', 'kanae', 'izumi'];
                return n => (n.faction === 'Wandenreich' || n.faction === 'Quincy' || n.race === 'Quincy') && !karakuraQuincies.includes(n.id);
            }}
            if (clusterType === 'arrancar') {{
                return n => {{
                    if (n.faction === 'Wandenreich') return false;
                    const fac = n.faction || '';
                    return n.race === 'Arrancar' || n.race === 'Hollow' ||
                        fac.includes('Espada') || fac.includes('Fracci') || fac.includes('Hueco') || fac.includes('Las Noches') ||
                        ['aizen', 'gin', 'tosen'].includes(n.id);
                }};
            }}
            if (clusterType === 'royal') {{
                return n => n.race === 'Royal Guard' || n.race === 'Deity' || n.faction === 'Soul King Palace' ||
                    ['soul_king', 'ichibei', 'nimaiya', 'oetsu', 'tenjiro', 'senjumaru', 'shutara', 'kirio'].includes(n.id);
            }}
            if (clusterType === 'karakura') {{
                return n => {{
                    const fac = n.faction || '';
                    const isHumanWorldFac = fac.includes('Karakura') || fac.toUpperCase().includes('XCUTION') ||
                        fac === 'Urahara Shop' || fac === 'Human World' || fac === 'Substitute Soul Reaper';
                    const isHybrid = n.race === 'Hybrid' && (isHumanWorldFac || n.id === 'ichigo');
                    return ['Human', 'Fullbringer', 'Mod Soul', 'Visored'].includes(n.race) ||
                        n.faction === 'Visored' || isHumanWorldFac || isHybrid ||
                        ['ichigo', 'urahara', 'yoruichi', 'tessai'].includes(n.id);
                }};
            }}
            if (clusterType === 'original') {{
                return n => n.faction === 'Original Gotei 13' || ['yamamoto', 'unohana'].includes(n.id);
            }}
            return () => true;
        }}

        function fitGraphToScreen(duration = 600, opts = null) {{
            const nodes = (opts && opts.nodes) || ((gData.nodes && gData.nodes.length) ? gData.nodes : RAW_GRAPH.nodes);
            const b = getBounds(nodes);
            if (!b) return;
            const sw = window.innerWidth, sh = window.innerHeight, mob = sw <= 768;
            if (opts && opts.centerNode) {{
                const pad = 130, boxW = Math.max(b.maxX - b.minX + pad * 2, 280), boxH = Math.max(b.maxY - b.minY + pad * 2, 280);
                const cardW = mob ? 0 : 390;
                const zoom = Math.max(0.65, Math.min(Math.max(sw - cardW - 60, sw * 0.5) / boxW, (mob ? Math.max(sh * 0.5 - 60, 200) : Math.max(sh - 120, 320)) / boxH, 1.8));
                Graph.centerAt(opts.centerNode.x + (mob ? 0 : (cardW / 2) / zoom), opts.centerNode.y + (mob ? -40 / zoom : 0), duration);
                Graph.zoom(zoom, duration);
            }} else if (opts && opts.isPath) {{
                const zoom = Math.max(0.65, Math.min((sw - (mob ? 20 : 450)) / Math.max(b.maxX - b.minX + 220, 250), (sh - 150) / Math.max(b.maxY - b.minY + 220, 250), 1.6));
                Graph.centerAt((b.minX + b.maxX) / 2 + (mob ? 0 : 150) / zoom, (b.minY + b.maxY) / 2, duration);
                Graph.zoom(zoom, duration);
            }} else {{
                const pt = mob ? 65 : 75, pb = mob ? 85 : 65, pl = mob ? 25 : 45, pr = mob ? 25 : (sidebar.classList.contains('open') ? 380 : 55);
                const m = mob ? 40 : 50;
                const zoom = Math.max(0.15, Math.min(Math.max(sw - pl - pr, 200) / Math.max(b.maxX - b.minX + m * 2, 100), Math.max(sh - pt - pb, 200) / Math.max(b.maxY - b.minY + m * 2, 100), mob ? 0.95 : 1.6));
                Graph.centerAt((b.minX + b.maxX) / 2 - ((pl - pr) / 2) / zoom, (b.minY + b.maxY) / 2 - ((pt - pb) / 2) / zoom, duration);
                Graph.zoom(zoom, duration);
            }}
        }}

        function pinAt(node, x, y, pin = true) {{
            if (!node) return;
            node.x = x; node.y = y; node.vx = 0; node.vy = 0;
            if (pin) {{ node.fx = x; node.fy = y; }}
        }}

        function placeRing(nodes, radius, startAngle = -Math.PI / 2, pin = true, stepAngle = null, cx = 0, cy = 0) {{
            const step = stepAngle !== null ? stepAngle : (2 * Math.PI / Math.max(nodes.length, 1));
            nodes.forEach((node, i) => {{
                const a = startAngle + i * step;
                pinAt(node, cx + Math.round(Math.cos(a) * radius), cy + Math.round(Math.sin(a) * radius), pin);
            }});
        }}

        function jumpToCluster(clusterType) {{
            document.querySelectorAll('.cluster-btn').forEach(btn => {{
                btn.classList.toggle('active', btn.dataset.cluster === clusterType);
            }});

            const CLUSTER_BGS = {{
                arrancar:    ["url('Asset/Background/weikomundo.jpg')", '0.55'],
                original:    ["url('Asset/Background/Original 13.png')", '0.60'],
                royal:       ["url('Asset/Background/Soul Palace.jpg')", '0.55'],
                wandenreich: ["url('Asset/Background/Quency base.jpg')", '0.55']
            }};
            const dynamicBg = document.getElementById('dynamic-bg');
            if (dynamicBg) {{
                const bg = CLUSTER_BGS[clusterType];
                if (bg) {{ dynamicBg.style.backgroundImage = bg[0]; dynamicBg.style.opacity = bg[1]; }}
                else {{ dynamicBg.style.opacity = '0'; }}
            }}

            const filteredNodes = RAW_GRAPH.nodes.filter(getFactionFilter(clusterType)).map(n => {{
                const existing = nodeById.get(n.id);
                const clone = Object.assign({{}}, n);
                if (existing) {{
                    clone.x = existing.x; clone.y = existing.y;
                    clone.vx = existing.vx; clone.vy = existing.vy;
                }}
                delete clone.fx; delete clone.fy;
                return clone;
            }});
            const byId = new Map(filteredNodes.map(n => [n.id, n]));

            const filteredLinks = RAW_GRAPH.links.map(l => {{
                const [sid, tid] = linkIds(l);
                return (byId.has(sid) && byId.has(tid)) ? {{ source: sid, target: tid, type: l.type, label: l.label }} : null;
            }}).filter(Boolean);

            if (clusterType === 'arrancar') {{
                pinAt(byId.get('aizen'), 0, 0);
                pinAt(byId.get('gin'), -36, -52);
                pinAt(byId.get('tosen'), 36, -52);

                const ESPADA_ORDER = ['starrk', 'baraggan', 'harribel', 'ulquiorra', 'nnoitra', 'grimmjow', 'zommari', 'szayelaporro', 'aaroniero', 'yammy'];
                const espCoords = {{}};
                ESPADA_ORDER.forEach((id, idx) => {{
                    const angle = -Math.PI / 2 - idx * (2 * Math.PI / ESPADA_ORDER.length);
                    const ex = Math.round(Math.cos(angle) * 145), ey = Math.round(Math.sin(angle) * 145);
                    espCoords[id] = {{ angle }};
                    pinAt(byId.get(id), ex, ey);
                }});

                const fracMasterMap = {{
                    lilynette: 'starrk', charlotte: 'baraggan', findorr: 'baraggan', ggio: 'baraggan',
                    poww: 'baraggan', abirama: 'baraggan', nirgge: 'baraggan', ikomikidomoe: 'baraggan',
                    sunsun: 'harribel', milarose: 'harribel', apacci: 'harribel', ayon: 'harribel',
                    tesla: 'nnoitra', nelliel: 'nnoitra', pesche: 'nnoitra', dondochakka: 'nnoitra', bawabawa: 'nnoitra',
                    shawlong: 'grimmjow', edrad: 'grimmjow', ylfordt: 'grimmjow', diroy: 'grimmjow', nakim: 'grimmjow', luppi: 'grimmjow',
                    lumina: 'szayelaporro', medazeppi: 'szayelaporro', roka_paramia: 'szayelaporro',
                    kukkapuro: 'yammy', aldegor: 'ulquiorra'
                }};
                const masterChildCounts = {{}};
                const espSet = new Set(['aizen', 'gin', 'tosen', ...ESPADA_ORDER]);
                const privaron = ['dordoni', 'cirucci', 'gantenbainne'];
                const exequias = ['rudbornn', 'aisslinger', 'demoura'];
                const lolymen = ['loly', 'menoly'];
                filteredNodes.forEach(node => {{
                    if (espSet.has(node.id)) return;
                    const masterId = fracMasterMap[node.id];
                    let ang, dist;
                    if (masterId && espCoords[masterId]) {{
                        const cnt = (masterChildCounts[masterId] = (masterChildCounts[masterId] || 0) + 1);
                        ang = espCoords[masterId].angle + (cnt % 2 ? 1 : -1) * Math.ceil(cnt / 2) * 0.18;
                        dist = node.id === 'ikomikidomoe' ? 275 : 250;
                    }} else if (privaron.includes(node.id)) {{
                        ang = 0.08 + privaron.indexOf(node.id) * 0.22; dist = 265;
                    }} else if (exequias.includes(node.id)) {{
                        ang = Math.PI * 0.45 + (exequias.indexOf(node.id) - 1) * 0.2; dist = 265;
                    }} else if (lolymen.includes(node.id)) {{
                        ang = -Math.PI * 0.75 + (lolymen.indexOf(node.id) === 0 ? -0.15 : 0.15); dist = 235;
                    }} else {{
                        ang = Math.random() * Math.PI * 2; dist = 255;
                    }}
                    pinAt(node, Math.round(Math.cos(ang) * dist), Math.round(Math.sin(ang) * dist), false);
                }});
            }} else if (clusterType === 'gotei') {{
                pinAt(byId.get('yamamoto'), 0, 0);
                pinAt(byId.get('sasakibe'), 0, -85);
                const SQUADS = [
                    {{ cap: 'soi_fon', subs: ['omaeda'] }}, {{ cap: 'gin', subs: ['kira'] }},
                    {{ cap: 'unohana', subs: ['isane'] }}, {{ cap: 'aizen', subs: ['momo'] }},
                    {{ cap: 'byakuya', subs: ['renji', 'rukia'] }}, {{ cap: 'komamura', subs: [] }},
                    {{ cap: 'shunsui', subs: ['nanao'] }}, {{ cap: 'tosen', subs: ['hisagi'] }},
                    {{ cap: 'hitsugaya', subs: ['rangiku'] }}, {{ cap: 'kenpachi', subs: ['yachiru'] }},
                    {{ cap: 'mayuri', subs: ['nemu'] }}, {{ cap: 'ukitake', subs: [] }}
                ];
                const placedIds = new Set(['yamamoto', 'sasakibe']);
                SQUADS.forEach((squad, i) => {{
                    const cap = byId.get(squad.cap);
                    if (!cap) return;
                    const angle = -Math.PI / 2 - i * (2 * Math.PI / SQUADS.length);
                    pinAt(cap, Math.round(Math.cos(angle) * 220), Math.round(Math.sin(angle) * 220));
                    placedIds.add(cap.id);
                    const subs = squad.subs.map(id => byId.get(id)).filter(Boolean);
                    subs.forEach((sub, j) => {{
                        const subAngle = angle + (j - (subs.length - 1) / 2) * 0.4;
                        pinAt(sub, cap.x + Math.round(Math.cos(subAngle) * 100), cap.y + Math.round(Math.sin(subAngle) * 100));
                        placedIds.add(sub.id);
                    }});
                }});
                placeRing(filteredNodes.filter(n => !placedIds.has(n.id)), 380, -Math.PI / 2, false);
            }} else if (clusterType === 'wandenreich') {{
                pinAt(byId.get('yhwach'), 0, 0);
                const rightHands = ['jugram', 'uryu'];
                pinAt(byId.get('jugram'), -120, 0);
                pinAt(byId.get('uryu'), 120, 0);
                placeRing(filteredNodes.filter(n => n.val === 11.5 && n.id !== 'yhwach' && !rightHands.includes(n.id)), 260);
                placeRing(filteredNodes.filter(n => n.val === 8.5), 440);
                placeRing(filteredNodes.filter(n => n.val < 8.5), 620);
            }} else if (clusterType === 'original') {{
                pinAt(byId.get('yamamoto'), 0, 0);
                placeRing(filteredNodes.filter(n => n.id !== 'yamamoto'), 180);
            }} else if (clusterType === 'karakura') {{
                const VISORED_IDS = ['shinji', 'hiyori', 'love', 'rose', 'kensei', 'mashiro', 'lisa', 'hachigen'];
                const SHOP_IDS = ['urahara', 'yoruichi', 'tessai', 'jinta', 'ururu'];
                const FB_IDS = ['ginjo', 'tsukishima', 'riruka', 'yukio', 'jackie', 'moe', 'giriko', 'chad', 'aura_michibane'];
                pinAt(byId.get('ichigo'), 0, 0);
                pinAt(byId.get('urahara'), -130, -60);
                pinAt(byId.get('shinji'), 130, -60);
                pinAt(byId.get('ginjo'), 0, 150);
                const shopNodes = filteredNodes.filter(n => SHOP_IDS.includes(n.id) && n.id !== 'urahara');
                placeRing(shopNodes, 75, Math.PI * 0.75, false, Math.PI / Math.max(shopNodes.length, 1), -130, -60);
                const visNodes = filteredNodes.filter(n => VISORED_IDS.includes(n.id) && n.id !== 'shinji');
                placeRing(visNodes, 85, -Math.PI * 0.25, false, Math.PI / Math.max(visNodes.length, 1), 130, -60);
                const fbNodes = filteredNodes.filter(n => FB_IDS.includes(n.id) && n.id !== 'ginjo');
                placeRing(fbNodes, 90, Math.PI * 0.1, false, Math.PI * 0.8 / Math.max(fbNodes.length, 1), 0, 150);
                const placed = new Set(['ichigo', ...VISORED_IDS, ...SHOP_IDS, ...FB_IDS]);
                filteredNodes.filter(n => !placed.has(n.id)).forEach((node, i, arr) => {{
                    const angle = -Math.PI / 2 + i * (2 * Math.PI / Math.max(arr.length, 1));
                    const r = 250 + (i % 2 === 0 ? 25 : -25);
                    pinAt(node, Math.round(Math.cos(angle) * r), Math.round(Math.sin(angle) * r), false);
                }});
            }} else if (clusterType === 'royal') {{
                pinAt(byId.get('soul_king'), 0, 0);
                const zeroOrder = ['ichibei', 'tenjiro', 'kirio', 'oetsu', 'senjumaru'];
                const guards = zeroOrder.map(id => byId.get(id)).filter(Boolean);
                const extra = filteredNodes.filter(n => n.id !== 'soul_king' && !zeroOrder.includes(n.id));
                placeRing([...guards, ...extra], 155);
            }} else {{
                const leader = byId.get('ichigo');
                if (leader) {{ leader.x = 0; leader.y = 0; leader.fx = 0; leader.fy = 0; }}
            }}

            gData.nodes = filteredNodes;
            gData.links = filteredLinks;
            rebuildNodeMap();
            Graph.graphData({{ nodes: filteredNodes, links: filteredLinks }});
            Graph.d3ReheatSimulation();
            setTimeout(() => fitGraphToScreen(700), 400);

            if (currentNode && !byId.has(currentNode.id)) {{
                sidebar.classList.remove('open');
                document.body.classList.remove('sidebar-open');
                closeAllPanels();
                const b = document.getElementById('s-banner');
                if (b) b.style.display = 'none';
                miniLegend.classList.remove('hidden');
                currentNode = null;
            }}
            if (pathFindingFrom && !byId.has(pathFindingFrom.id)) clearPathFinding();
        }}

        document.querySelectorAll('.cluster-btn').forEach(btn => {{
            btn.addEventListener('click', () => jumpToCluster(btn.dataset.cluster));
        }});

        document.querySelectorAll('.faction-filter').forEach(el => {{
            el.addEventListener('click', () => {{
                const fac = el.dataset.faction;
                const toggleOff = activeFactionFilter === fac;
                activeFactionFilter = toggleOff ? null : fac;
                document.querySelectorAll('.faction-filter').forEach(f => {{ f.style.border = 'none'; f.style.background = 'transparent'; }});
                if (!toggleOff) {{
                    el.style.border = '1px solid rgba(255,255,255,0.4)';
                    el.style.background = 'rgba(255,255,255,0.1)';
                    el.style.borderRadius = '4px';
                }}
            }});
        }});

        // Quick Search (Ctrl+K)
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        let activeIdx = -1;
        let searchMatches = [];

        function toggleSearch(open) {{
            searchOverlay.classList.toggle('open', open);
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchMatches = [];
            activeIdx = -1;
            if (open) setTimeout(() => searchInput.focus(), 50);
        }}

        document.addEventListener('keydown', e => {{
            if (e.target && e.target.id === 'search-input') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {{
                e.preventDefault();
                toggleSearch(!searchOverlay.classList.contains('open'));
            }} else if (e.key === 'Escape') {{
                if (searchOverlay.classList.contains('open')) toggleSearch(false);
                else if (currentNode || highlightedPathNodes.size > 0) deselectNode();
            }}
        }});

        function selectOrFocusNode(id) {{
            let node = nodeById.get(id);
            if (!node) {{
                jumpToCluster('all');
                node = nodeById.get(id);
            }}
            if (!node) return null;
            if (pathFindingFrom) executePathFinding(node);
            else selectNode(node, true);
            return node;
        }}

        function renderResults(query) {{
            if (!query) {{ searchResults.innerHTML = ''; searchMatches = []; activeIdx = -1; return; }}
            const q = query.toLowerCase().trim();
            searchMatches = RAW_GRAPH.nodes.filter(n => n.name.toLowerCase().includes(q) || n.faction.toLowerCase().includes(q) || n.race.toLowerCase().includes(q)).slice(0, 12);

            if (!searchMatches.length) {{
                activeIdx = -1;
                searchResults.innerHTML = '<div style="padding:16px 20px;font-size:12px;color:#888;text-align:center;line-height:1.6;">No character matching query.<br><span style="font-size:10px;color:#555;">Try searching another name or faction.</span></div>';
                return;
            }}

            activeIdx = 0;
            searchResults.innerHTML = searchMatches.map((n, i) =>
                '<div class="search-result' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
                '<span class="dot" style="background:' + n.color + ';box-shadow:0 0 4px ' + n.color + '"></span>' +
                '<span class="sr-name">' + escapeHtml(n.name) + '</span>' +
                '<span class="sr-faction">' + escapeHtml(n.faction) + '</span>' +
                '</div>'
            ).join('');

            searchResults.querySelectorAll('.search-result').forEach((el, i) => {{
                el.addEventListener('click', () => {{ toggleSearch(false); selectOrFocusNode(searchMatches[i].id); }});
            }});
        }}

        searchInput.addEventListener('input', e => renderResults(e.target.value));

        searchInput.addEventListener('keydown', e => {{
            const items = searchResults.querySelectorAll('.search-result');
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {{
                e.preventDefault();
                activeIdx = e.key === 'ArrowDown' ? Math.min(activeIdx + 1, items.length - 1) : Math.max(activeIdx - 1, 0);
                items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
                if (items[activeIdx]) items[activeIdx].scrollIntoView({{ block: 'nearest' }});
            }} else if (e.key === 'Enter') {{
                e.preventDefault();
                const hit = searchMatches[activeIdx];
                if (hit) {{ toggleSearch(false); selectOrFocusNode(hit.id); }}
            }} else if (e.key === 'Escape') {{
                toggleSearch(false);
            }}
        }});

        searchOverlay.addEventListener('click', e => {{ if (e.target === searchOverlay) toggleSearch(false); }});

        // URL Hash Deep Linking
        window.addEventListener('load', () => {{
            setTimeout(() => {{
                if (window.location.hash) {{
                    const targetId = decodeURIComponent(window.location.hash.substring(1));
                    let targetNode = nodeById.get(targetId);
                    if (!targetNode) {{
                        jumpToCluster('all');
                        targetNode = nodeById.get(targetId);
                    }}
                    if (targetNode) selectNode(targetNode, false);
                }}
            }}, 250);
        }});
    </script>
</body>
</html>"""

    with open(os.path.join(base_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Obsidian Canvas Database saved to: index.html")

if __name__ == "__main__":
    generate_obsidian_graph()
