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
import networkx as nx

def generate_obsidian_graph():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    asset_dir = os.path.join(base_dir, "Asset")

    # 1. Load canonical intelligence datasets
    with open(os.path.join(base_dir, "data", "characters.json"), "r", encoding="utf-8") as f:
        chars = json.load(f)
    with open(os.path.join(base_dir, "data", "relationships.json"), "r", encoding="utf-8") as f:
        rels = json.load(f)

    # 2. Build network graph & compute degree centralities
    G = nx.Graph()
    for char_id, data in chars.items():
        G.add_node(char_id, **data)
    for rel in rels:
        G.add_edge(rel["source"], rel["target"], type=rel["type"], label=rel["label"])

    # 3. Ensure character sprite sheet and coordinate map are built and up-to-date
    from build_sprites import build_sprites
    sprite_meta = build_sprites()

    # 4. Read sprite sheet as base64 data URI fallback for local file:// execution
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
        if char_id in ('aizen', 'ichigo', 'yhwach', 'yamamoto', 'soul_king'):
            tier = 1
            node_val = 16.0
        elif char_id in ('gin', 'tosen', 'starrk', 'baraggan', 'harribel', 'ulquiorra', 'grimmjow', 'nnoitra', 'shunsui', 'kenpachi', 'byakuya', 'urahara', 'shinji', 'ginjo', 'jugram', 'uryu', 'rukia', 'renji', 'hitsugaya', 'unohana', 'chika_shihoin', 'kinroku_izuhara', 'chigiri_shijima', 'danjiro_obana', 'furofushi_saito', 'nobutsuna_shigyo', 'batsuunsai_katori', 'entetsu_kumoi', 'furuoki_otogawa', 'uhin_zenjoji', 'saizo_sakahone', 'soi_fon', 'mayuri', 'komamura', 'ukitake', 'rose', 'kensei', 'lille_barro', 'gerard_valkyrie', 'pernida_parnkgjas', 'askin_nakk_le_vaar', 'gremmy_thoumeaux'):
            tier = 2
            node_val = 11.5
        elif char_id in ('zommari', 'szayelaporro', 'aaroniero', 'yammy', 'luppi', 'nelliel', 'wonderweiss', 'bazz_b', 'bambietta_basterbine', 'as_nodt', 'cang_du', 'quilge_opie', 'bg9', 'pepe_waccabrada', 'robert_accutrone', 'driscoll_berci', 'meninas_mcallon', 'mask_de_masculine', 'candice_catnipp', 'giselle_gewelle', 'nanana_najahkoop', 'nianzol_weizol', 'royd_lloyd', 'loyd_lloyd', 'liltotto_lamperd', 'love', 'lisa', 'hachigen', 'yoruichi', 'isshin', 'ryuken', 'orihime', 'chad', 'tsukishima', 'tatsuki', 'omaeda', 'kira', 'isane', 'momo', 'nanao', 'hisagi', 'rangiku', 'yachiru', 'nemu', 'sasakibe'):
            tier = 3
            node_val = 8.5
        elif 'Fracci' in fac or char_id in ('lilynette', 'loly', 'menoly', 'roka_paramia', 'charlotte', 'abirama', 'findorr', 'poww', 'ggio', 'nirgge', 'shawlong', 'edrad', 'ylfordt', 'diroy', 'nakim', 'apacci', 'milarose', 'sunsun', 'ayon', 'tesla', 'lumina', 'medazeppi', 'pesche', 'dondochakka', 'bawabawa', 'demoura', 'aisslinger', 'kukkapuro', 'aldegor', 'grand_fisher', 'jinta', 'ururu', 'kon', 'ririn', 'noba', 'kurodo', 'keigo', 'mizuiro', 'tatsuki', 'chizuru', 'ryo', 'michiru', 'mahana', 'misato', 'keisuke', 'mizuho', 'ikumi', 'kaoru', 'don_kanonji', 'kagine', 'asguiaro_ebern', 'luders_friegen', 'berenice_gabrielli', 'jerome_guizbatt', 'guenael_lee', 'shaz_domino'):
            tier = 5
            node_val = 3.5
        else:
            tier = 4
            node_val = 5.8

        graph_data["nodes"].append({
            "id": char_id,
            "name": data.get("name", char_id),
            "race": race,
            "faction": fac or "Unknown",
            "family": data.get("family", "Unknown"),
            "desc": data.get("description", ""),
            "color": color,
            "val": node_val,
            "tier": tier,
            "is_top": tier <= 2,
            "initials": get_initials(data.get("name", char_id)),
            "has_sprite": char_id in sprite_meta.get("sprites", {})
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
            padding: 24px 22px 35px 22px;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            z-index: 1;
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

        #s-banner{{display:none;height:150px;margin:-6px -22px 14px;background-size:cover;background-position:center 20%;
          -webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent)}}

        /* Close (X) Cross Mark Button */
        #sidebar-close {{
            position: absolute;
            top: 12px;
            right: 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            font-size: 18px;
            width: 32px;
            height: 32px;
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

        /* Rukia Kuchiki Special Theme (Sode no Shirayuki Frost Aura) */
        #sidebar.frost-theme {{
            border: 1px solid rgba(186, 230, 253, 0.85) !important;
            box-shadow: 0 0 35px rgba(186, 230, 253, 0.45), inset 0 0 25px rgba(255, 255, 255, 0.12) !important;
            animation: frostPulse 3s infinite ease-in-out;
        }}
        @keyframes frostPulse {{
            0%, 100% {{ box-shadow: 0 0 30px rgba(186, 230, 253, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1); }}
            50% {{ box-shadow: 0 0 45px rgba(186, 230, 253, 0.65), inset 0 0 30px rgba(255, 255, 255, 0.25); }}
        }}
        #sidebar.frost-theme #s-avatar {{
            border-color: #BAE6FD !important;
            box-shadow: 0 0 25px rgba(186, 230, 253, 0.85) !important;
        }}
        #sidebar.frost-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(186, 230, 253, 0.12) 0%, rgba(147, 197, 253, 0.05) 50%, rgba(10, 15, 30, 0.2) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Yamamoto Genryusai Special Theme (Ryujin Jakka Flame Aura) */
        #sidebar.flame-theme {{
            border: 1px solid rgba(255, 150, 60, 0.85) !important;
            box-shadow: 0 0 35px rgba(255, 120, 40, 0.45), inset 0 0 25px rgba(255, 200, 100, 0.12) !important;
            animation: flamePulse 3s infinite ease-in-out;
        }}
        @keyframes flamePulse {{
            0%, 100% {{ box-shadow: 0 0 30px rgba(255, 120, 40, 0.4), inset 0 0 20px rgba(255, 190, 120, 0.1); }}
            50% {{ box-shadow: 0 0 45px rgba(255, 130, 50, 0.65), inset 0 0 30px rgba(255, 190, 120, 0.25); }}
        }}
        #sidebar.flame-theme #s-avatar {{
            border-color: #ffb066 !important;
            box-shadow: 0 0 25px rgba(255, 130, 50, 0.85) !important;
        }}
        #sidebar.flame-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255, 130, 40, 0.12) 0%, rgba(255, 80, 20, 0.05) 50%, rgba(30, 10, 5, 0.2) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Sosuke Aizen Special Theme (Kyoka Suigetsu Shatter Illusion Aura) */
        #sidebar.glass-theme {{
            border: 1px solid rgba(205, 195, 255, 0.85) !important;
            box-shadow: 0 0 35px rgba(167, 139, 250, 0.45), inset 0 0 25px rgba(255, 255, 255, 0.12) !important;
            animation: glassPulse 3s infinite ease-in-out;
        }}
        @keyframes glassPulse {{
            0%, 100% {{ box-shadow: 0 0 30px rgba(167, 139, 250, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1); }}
            50% {{ box-shadow: 0 0 45px rgba(167, 139, 250, 0.65), inset 0 0 30px rgba(255, 255, 255, 0.25); }}
        }}
        #sidebar.glass-theme #s-avatar {{
            border-color: #d8ccff !important;
            box-shadow: 0 0 25px rgba(167, 139, 250, 0.85) !important;
        }}
        #sidebar.glass-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, rgba(190, 170, 255, 0.05) 50%, rgba(20, 10, 35, 0.2) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Ichigo Kurosaki Special Theme (Getsuga Tensho Aura) */
        #sidebar.ichigo-theme {{
            border: 1px solid #ff3b30 !important;
            box-shadow: 0 0 35px rgba(255, 20, 10, 0.45), 0 0 70px rgba(0, 0, 0, 0.9), inset 0 0 25px rgba(255, 20, 10, 0.16) !important;
        }}
        #sidebar.ichigo-theme #s-avatar {{
            border-color: #ff5a4d !important;
            box-shadow: 0 0 22px rgba(255, 40, 30, 0.9), 0 0 0 3px rgba(0, 0, 0, 0.75) !important;
        }}
        #sidebar.ichigo-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255, 30, 20, 0.12) 0%, rgba(200, 10, 10, 0.05) 50%, rgba(10, 0, 5, 0.3) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Yhwach Special Theme (The Almighty / Reishi Void Aura) */
        #sidebar.yhwach-theme {{
            border: 1px solid rgba(215, 230, 255, 0.85) !important;
            box-shadow: 0 0 35px rgba(170, 205, 255, 0.35), 0 0 90px rgba(0, 0, 0, 0.95), inset 0 0 30px rgba(0, 0, 0, 0.6) !important;
        }}
        #sidebar.yhwach-theme #s-avatar {{
            border-color: #dbe9ff !important;
            box-shadow: 0 0 24px rgba(170, 205, 255, 0.85), 0 0 0 3px rgba(0, 0, 0, 0.8) !important;
        }}
        #sidebar.yhwach-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(190, 215, 255, 0.10) 0%, rgba(120, 160, 255, 0.04) 50%, rgba(5, 5, 12, 0.4) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Ichibei Hyosube Special Theme (Ichimonji Sumi-e Black Ink Aura) */
        #sidebar.ichibei-theme {{
            border: 1px solid rgba(236, 230, 214, 0.85) !important;
            box-shadow: 0 0 35px rgba(200, 194, 180, 0.35), 0 0 80px rgba(0, 0, 0, 0.95), inset 0 0 30px rgba(0, 0, 0, 0.7) !important;
        }}
        #sidebar.ichibei-theme #s-avatar {{
            border-color: #ece6d6 !important;
            box-shadow: 0 0 24px rgba(236, 230, 214, 0.85), 0 0 0 3px rgba(0, 0, 0, 0.8) !important;
        }}
        #sidebar.ichibei-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(236, 230, 214, 0.08) 0%, rgba(10, 10, 12, 0.5) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Kisuke Urahara Special Theme (Benihime / Kannonbiraki Seam Aura) */
        #sidebar.kisuke-theme {{
            border: 1px solid rgba(255, 74, 95, 0.85) !important;
            box-shadow: 0 0 35px rgba(255, 74, 95, 0.45), 0 0 70px rgba(0, 0, 0, 0.9), inset 0 0 25px rgba(255, 74, 95, 0.16) !important;
        }}
        #sidebar.kisuke-theme #s-avatar {{
            border-color: #ff6b7d !important;
            box-shadow: 0 0 22px rgba(255, 74, 95, 0.9), 0 0 0 3px rgba(0, 0, 0, 0.75) !important;
        }}
        #sidebar.kisuke-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255, 74, 95, 0.10) 0%, rgba(243, 232, 207, 0.04) 50%, rgba(20, 4, 8, 0.4) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Kenpachi Zaraki Special Theme (Nozarashi Spiritual Pressure Aura) */
        #sidebar.kenpachi-theme {{
            border: 1px solid rgba(225, 29, 72, 0.85) !important;
            box-shadow: 0 0 35px rgba(190, 18, 60, 0.45), 0 0 75px rgba(0, 0, 0, 0.95), inset 0 0 25px rgba(250, 204, 21, 0.16) !important;
        }}
        #sidebar.kenpachi-theme #s-avatar {{
            border-color: #facc15 !important;
            box-shadow: 0 0 22px rgba(225, 29, 72, 0.85), 0 0 10px rgba(250, 204, 21, 0.55), 0 0 0 3px rgba(0, 0, 0, 0.8) !important;
        }}
        #sidebar.kenpachi-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(190, 18, 60, 0.12) 0%, rgba(250, 204, 21, 0.05) 50%, rgba(15, 2, 4, 0.4) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Soul King Special Theme (Primordial Linchpin Divine Aura) */
        #sidebar.soulking-theme {{
            border: 1px solid rgba(255, 226, 150, 0.85) !important;
            box-shadow: 0 0 35px rgba(255, 224, 138, 0.35), 0 0 85px rgba(10, 10, 20, 0.95), inset 0 0 25px rgba(157, 132, 255, 0.15) !important;
        }}
        #sidebar.soulking-theme #s-avatar {{
            border-color: #fff1c4 !important;
            box-shadow: 0 0 22px rgba(255, 232, 170, 0.85), 0 0 44px rgba(157, 132, 255, 0.45), 0 0 0 3px rgba(0, 0, 0, 0.8) !important;
        }}
        #sidebar.soulking-theme::before {{
            content: '';
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255, 226, 150, 0.10) 0%, rgba(157, 132, 255, 0.06) 50%, rgba(10, 8, 20, 0.5) 100%);
            pointer-events: none; z-index: 1;
        }}

        /* Header & Navigation */
        .sidebar-header-line {{
            font-family: 'Cinzel', serif; color: #D4AF37; font-size: 10px; letter-spacing: 4px;
            margin-bottom: 14px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px;
            padding-right: 48px; display: flex; justify-content: space-between; align-items: center;
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
        .byakuya-overview-card {{
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(244, 114, 182, 0.45);
            box-shadow: 0 0 22px rgba(244, 114, 182, 0.3), 0 6px 20px rgba(0, 0, 0, 0.75);
            background: radial-gradient(ellipse at 50% 60%, rgba(244, 114, 182, 0.16) 0%, rgba(20, 10, 24, 0.85) 75%);
            margin-top: 14px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px 0;
        }}
        .byakuya-overview-card img {{
            max-width: 92%;
            height: auto;
            display: block;
            border-radius: 7px;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            filter: drop-shadow(0 0 12px rgba(244, 114, 182, 0.45));
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
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 15, 25, 0.95); border: 1px solid #D4AF37;
            box-shadow: 0 6px 25px rgba(212, 175, 55, 0.35); border-radius: 8px;
            padding: 10px 18px; z-index: 45; display: none; align-items: center; gap: 12px;
            backdrop-filter: blur(12px); font-size: 12px; color: #eee;
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
            user-select: none;
        }}
        .cluster-btn {{
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.7); padding: 5px 12px; border-radius: 20px;
            font-size: 11px; font-family: 'Cinzel', serif; letter-spacing: 0.8px;
            cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
        }}
        .cluster-btn:hover {{ background: rgba(255, 255, 255, 0.15); color: #fff; border-color: rgba(255, 255, 255, 0.25); }}
        .cluster-btn.active {{ background: rgba(212, 175, 55, 0.25); border-color: #D4AF37; color: #F5E6C8; box-shadow: 0 0 14px rgba(212, 175, 55, 0.4); }}

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
                    <div id="s-intel-fields" style="font-size: 12px; margin-bottom: 18px; color: rgba(255,255,255,0.7); line-height: 1.7;">
                        <div><strong style="color:#888; display:inline-block; width:95px;">RACE</strong> <span id="s-field-race" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">AFFILIATION</strong> <span id="s-field-affil" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">FAMILY/CLAN</strong> <span id="s-field-family" style="color:#fff;"></span></div>
                        <div><strong style="color:#888; display:inline-block; width:95px;">REIATSU CLASS</strong> <span id="s-field-tier" style="color:#D4AF37; font-family:'Cinzel';"></span></div>
                    </div>
                    
                    <div class="char-desc" id="s-desc"></div>
                    
                    <div class="action-bar" id="s-action-bar">
                        <button class="action-btn" id="trace-path-btn" style="width:100%; justify-content:center;">
                            <span>&#x1F4CD;</span> TRACE CONNECTION PATH
                        </button>
                    </div>
                    <div id="s-overview-bottom" style="display:none;"></div>
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
        const SPRITE_SRC = 'Asset/sprites/characters.webp?v={sprite_version}';

        // Load Sprite Sheet with instant local and remote compatibility
        const spriteSheet = new Image();
        if (location.protocol !== 'file:') {{
            spriteSheet.crossOrigin = "anonymous";
        }}
        spriteSheet.onload = () => {{
            if (typeof Graph !== 'undefined' && Graph && Graph.refresh) {{
                Graph.refresh();
            }}
            dismissLoader();
        }};
        spriteSheet.onerror = () => {{
            if (spriteSheet.src !== SPRITE_DATA_URI) {{
                spriteSheet.src = SPRITE_DATA_URI;
            }}
        }};
        // Use data URI directly on local file protocol for zero-latency local testing
        if (location.protocol === 'file:') {{
            spriteSheet.src = SPRITE_DATA_URI;
        }} else {{
            spriteSheet.src = SPRITE_SRC;
        }}

        // Graph State
        let gData = {{
            nodes: RAW_GRAPH.nodes.map(n => Object.assign({{}}, n)),
            links: RAW_GRAPH.links.map(l => Object.assign({{}}, l))
        }};

        // Pin Ichigo in the center on initial load
        const initIchigo = gData.nodes.find(n => n.id === 'ichigo');
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

        // HTML Elements
        const sidebar = document.getElementById('sidebar');
        const fp = (typeof FrostPanel !== 'undefined' && FrostPanel.attach) ? FrostPanel.attach(sidebar, {{ particles: 30, snow: true }}) : null;
        const fl = (typeof FlamePanel !== 'undefined' && FlamePanel.attach) ? FlamePanel.attach(sidebar, {{ embers: 45 }}) : null;
        const gl = (typeof GlassPanel !== 'undefined' && GlassPanel.attach) ? GlassPanel.attach(sidebar, {{ impact: [0.7, 0.3] }}) : null;
        const ic = (typeof IchigoPanel !== 'undefined' && IchigoPanel.attach) ? IchigoPanel.attach(sidebar) : null;
        const yh = (typeof YhwachPanel !== 'undefined' && YhwachPanel.attach) ? YhwachPanel.attach(sidebar) : null;
        const ib = (typeof IchibeiPanel !== 'undefined' && IchibeiPanel.attach) ? IchibeiPanel.attach(sidebar) : null;
        const ks = (typeof KisukePanel !== 'undefined' && KisukePanel.attach) ? KisukePanel.attach(sidebar) : null;
        const kp = (typeof KenpachiPanel !== 'undefined' && KenpachiPanel.attach) ? KenpachiPanel.attach(sidebar) : null;
        const sk = (typeof SoulKingPanel !== 'undefined' && SoulKingPanel.attach) ? SoulKingPanel.attach(sidebar) : null;
        const sidebarClose = document.getElementById('sidebar-close');
        const sName = document.getElementById('s-name');
        const sMeta = document.getElementById('s-meta');
        const sDesc = document.getElementById('s-desc');
        const connSection = document.getElementById('conn-section');
        const sConnections = document.getElementById('s-connections');
        const connCount = document.getElementById('conn-count');
        const sActionBar = document.getElementById('s-action-bar');
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
            if (fp) fp.close();
            if (fl) fl.close();
            if (gl) gl.close();
            if (ic) ic.close();
            if (yh) yh.close();
            if (ib) ib.close();
            if (ks) ks.close();
            if (kp) kp.close();
            if (sk) sk.close();
            sidebar.classList.remove('frost-theme', 'flame-theme', 'glass-theme', 'ichigo-theme', 'yhwach-theme', 'ichibei-theme', 'kisuke-theme', 'kenpachi-theme', 'soulking-theme');
        }}

        function deselectNode() {{
            currentNode = null;
            navHistory = [];
            updateBackNav();
            sidebar.classList.remove('open');
            closeAllPanels();
            const b = document.getElementById('s-banner');
            if (b) b.style.display = 'none';
            const ovBottom = document.getElementById('s-overview-bottom');
            if (ovBottom) {{ ovBottom.innerHTML = ''; ovBottom.style.display = 'none'; }}
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
                const targetNode = gData.nodes.find(n => n.id === c.targetId) || {{ name: c.targetId, race: 'Unknown', color: '#888' }};
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
                    const targetId = card.dataset.targetId;
                    const targetNode = gData.nodes.find(n => n.id === targetId);
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

        function openSidebar(node) {{
            const sidebarBg = document.getElementById('sidebar-bg');
            const sAvatar = document.getElementById('s-avatar');
            const sSprite = SPRITE_MAP[node.id];

            // Custom Backgrounds & Ability Themes
            closeAllPanels();
            const b = document.getElementById('s-banner');

            if (node.id === 'rukia') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Rukia.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('frost-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Rukia.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (fp) fp.open();
            }} else if (node.id === 'yamamoto') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Yamamoto.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('flame-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Yamamoto.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (fl) fl.open();
            }} else if (node.id === 'aizen') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Aizen.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('glass-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Aizen.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (gl) gl.open();
            }} else if (node.id === 'ichigo') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Ichigo.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('ichigo-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Ichigo.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (ic) ic.open();
            }} else if (node.id === 'yhwach') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Yhwach.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('yhwach-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Yhwach.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (yh) yh.open();
            }} else if (node.id === 'ichibei') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Ichibei.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('ichibei-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Ichibei.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (ib) ib.open();
            }} else if (node.id === 'urahara' || node.id === 'kisuke') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Kisuke.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('kisuke-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Kisuke.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (ks) ks.open();
            }} else if (node.id === 'kenpachi' || node.id === 'zaraki') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Kenpachi.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('kenpachi-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Kenpachi.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (kp) kp.open();
            }} else if (node.id === 'soul_king' || node.id === 'soulking') {{
                if (b) {{ b.style.backgroundImage = "url('Asset/Images/Soul King.jpg')"; b.style.display = 'block'; }}
                sidebar.classList.add('soulking-theme');
                sidebarBg.style.backgroundImage = "url('Asset/Images/Soul King.jpg')";
                sidebarBg.style.opacity = '0.6';
                if (sk) sk.open();
            }} else {{
                if (b) b.style.display = 'none';
                if (sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                    const avatarDataUrl = getCharacterAvatarUrl(node.id, 384);
                    if (avatarDataUrl) {{
                        sidebarBg.style.backgroundImage = 'url(' + avatarDataUrl + ')';
                        sidebarBg.style.opacity = '0.38';
                    }} else {{
                        sidebarBg.style.backgroundImage = 'radial-gradient(circle at 85% 15%, ' + node.color + '33, transparent 65%)';
                        sidebarBg.style.opacity = '1';
                    }}
                }} else {{
                    sidebarBg.style.backgroundImage = 'radial-gradient(circle at 85% 15%, ' + node.color + '22, transparent 65%)';
                    sidebarBg.style.opacity = '1';
                }}
            }}

            if (sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                sAvatar.innerText = '';
                sAvatar.style.backgroundImage = 'url(' + spriteSheet.src + ')';
                const avatarSize = 64;
                const scale = avatarSize / sSprite.w;
                sAvatar.style.backgroundSize = (SPRITE_META.sheetWidth * scale) + 'px ' + (SPRITE_META.sheetHeight * scale) + 'px';
                sAvatar.style.backgroundPosition = '-' + (sSprite.x * scale) + 'px -' + (sSprite.y * scale) + 'px';
                sAvatar.style.borderColor = node.color;
                sAvatar.style.boxShadow = '0 0 20px ' + node.color + '55';
            }} else {{
                sAvatar.style.backgroundImage = 'none';
                sAvatar.style.backgroundColor = '#0F1318';
                sAvatar.style.borderColor = node.color;
                sAvatar.style.boxShadow = '0 0 16px ' + node.color + '44';
                sAvatar.innerText = node.initials || '??';
                sAvatar.style.color = node.color;
            }}

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
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelector('.tab-btn[data-target="pane-overview"]').classList.add('active');
            document.getElementById('pane-overview').classList.add('active');

            const intelFields = document.getElementById('s-intel-fields');
            intelFields.style.display = 'block';
            document.getElementById('s-field-race').innerText = node.race || 'CLASSIFIED';
            document.getElementById('s-field-affil').innerText = node.faction || 'UNKNOWN';
            document.getElementById('s-field-family').innerText = node.family || 'NONE';
            
            const tiers = {{ 1: 'SPECIAL WAR POTENTIAL', 2: 'CAPTAIN CLASS', 3: 'LIEUTENANT CLASS', 4: 'STANDARD' }};
            document.getElementById('s-field-tier').innerText = tiers[node.tier || 4] || 'UNMEASURED';
            sDesc.innerText = node.desc || 'No intelligence data available on this subject.';

            const ovBottom = document.getElementById('s-overview-bottom');
            if (ovBottom) {{
                if (node.id === 'byakuya') {{
                    ovBottom.innerHTML = '<div class="byakuya-overview-card"><img src="Asset/GIF/Byakuya.gif" alt="Byakuya Kuchiki" /></div>';
                    ovBottom.style.display = 'block';
                }} else {{
                    ovBottom.innerHTML = '';
                    ovBottom.style.display = 'none';
                }}
            }}

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

            sActionBar.style.display = 'flex';
            sidebar.classList.add('open');
            miniLegend.classList.add('hidden');
        }}

        // Dynamic Camera Framing
        function focusOnNodeAndNeighbors(node) {{
            const nbrIds = Array.from(neighbors[node.id] || []);
            const nbrNodes = nbrIds.map(id => gData.nodes.find(n => n.id === id)).filter(Boolean);
            const all = [node, ...nbrNodes];

            let minX = node.x, maxX = node.x, minY = node.y, maxY = node.y;
            all.forEach(n => {{
                if (n.x < minX) minX = n.x;
                if (n.x > maxX) maxX = n.x;
                if (n.y < minY) minY = n.y;
                if (n.y > maxY) maxY = n.y;
            }});

            const padding = 130;
            const boxW = Math.max(maxX - minX + padding * 2, 280);
            const boxH = Math.max(maxY - minY + padding * 2, 280);

            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const isMobile = screenW <= 768;
            
            const cardWidth = isMobile ? 0 : 390;
            const availW = Math.max(screenW - cardWidth - 60, screenW * 0.5);
            const availH = isMobile ? Math.max(screenH * 0.5 - 60, 200) : Math.max(screenH - 120, 320);

            let fitZoom = Math.min(availW / boxW, availH / boxH);
            fitZoom = Math.max(0.65, Math.min(fitZoom, 1.8));

            Graph.centerAt(node.x, node.y, 850);
            Graph.zoom(fitZoom, 850);
        }}

        function selectNode(node, pushHistory = true) {{
            if (!node) return;
            if (pushHistory && currentNode && currentNode.id !== node.id) {{
                navHistory.push(currentNode);
            }}
            currentNode = node;
            updateBackNav();
            openSidebar(node);
            focusOnNodeAndNeighbors(node);
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

        function startPathFinding(fromNode) {{
            pathFindingFrom = fromNode;
            highlightedPathNodes.clear();
            highlightedPathLinks.clear();
            pathBannerText.innerHTML = 'Tracing path from <strong>' + escapeHtml(fromNode.name) + '</strong> &rarr; Click any character';
            pathCancelBtn.innerText = 'Cancel';
            pathBanner.classList.add('active');
            tracePathBtn.classList.add('active');
        }}

        function executePathFinding(targetNode) {{
            if (!pathFindingFrom) return;
            const path = findShortestPath(pathFindingFrom.id, targetNode.id);
            if (path && path.length > 1) {{
                highlightedPathNodes = new Set(path);
                highlightedPathLinks = new Set();
                for (let i = 0; i < path.length - 1; i++) {{
                    const a = path[i];
                    const b = path[i + 1];
                    highlightedPathLinks.add(a + '--' + b);
                    highlightedPathLinks.add(b + '--' + a);
                }}

                const degrees = path.length - 1;
                const pathNames = path.map(id => nodeNameMap[id] || id).join(' &rarr; ');
                pathBannerText.innerHTML = 'Connection Path (' + degrees + ' degree' + (degrees > 1 ? 's' : '') + '): <strong>' + pathNames + '</strong>';
                pathCancelBtn.innerText = 'Clear Path';

                const pathNodesList = path.map(id => gData.nodes.find(n => n.id === id)).filter(Boolean);
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                pathNodesList.forEach(n => {{
                    if (n.x < minX) minX = n.x;
                    if (n.x > maxX) maxX = n.x;
                    if (n.y < minY) minY = n.y;
                    if (n.y > maxY) maxY = n.y;
                }});
                const pMobile = window.innerWidth <= 768;
                const pSidebarOffset = pMobile ? 20 : 450;
                const pCenterShift = pMobile ? 0 : 150;
                const pZoom = Math.min((window.innerWidth - pSidebarOffset) / Math.max(maxX - minX + 220, 250), (window.innerHeight - 150) / Math.max(maxY - minY + 220, 250));
                Graph.centerAt((minX + maxX) / 2 + pCenterShift / pZoom, (minY + maxY) / 2, 850);
                Graph.zoom(Math.max(0.65, Math.min(pZoom, 1.6)), 850);
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
            if (currentNode) {{
                if (pathFindingFrom || highlightedPathNodes.size > 0) {{
                    clearPathFinding();
                }} else {{
                    startPathFinding(currentNode);
                }}
            }}
        }});

        pathCancelBtn.addEventListener('click', () => {{
            clearPathFinding();
        }});

        // ForceGraph Engine Initialization
        const Graph = ForceGraph()(document.getElementById('graph-container'))
            .graphData(gData)
            .nodeId('id')
            .nodeRelSize(4)
            .backgroundColor('rgba(10, 10, 15, 0.45)')
            .linkCurvature(0.2)
            .linkWidth(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                if (highlightedPathLinks.size > 0) return highlightedPathLinks.has(sid + '--' + tid) ? 3.2 : 0.35;
                if (hoverNode) return (sid === hoverNode.id || tid === hoverNode.id) ? 2.5 : 0.35;
                if (currentNode) return (sid === currentNode.id || tid === currentNode.id) ? 2.5 : 0.35;
                
                if (activeFactionFilter) {{
                    const sNode = typeof link.source === 'object' ? link.source : gData.nodes.find(n => n.id === sid);
                    const tNode = typeof link.target === 'object' ? link.target : gData.nodes.find(n => n.id === tid);
                    const sMatch = sNode && (sNode.race === activeFactionFilter || sNode.faction === activeFactionFilter);
                    const tMatch = tNode && (tNode.race === activeFactionFilter || tNode.faction === activeFactionFilter);
                    if (sMatch && tMatch) return 1.5;
                    return 0.2;
                }}
                
                return 0.8;
            }})
            .linkColor(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                if (highlightedPathLinks.size > 0) {{
                    return highlightedPathLinks.has(sid + '--' + tid) ? '#F59E0B' : 'rgba(255,255,255,0.025)';
                }}
                if (hoverNode) {{
                    return (sid === hoverNode.id || tid === hoverNode.id) ? 'rgba(255,255,255,1.0)' : 'rgba(255,255,255,0.025)';
                }}
                if (currentNode) {{
                    return (sid === currentNode.id || tid === currentNode.id) ? 'rgba(245,158,11,1.0)' : 'rgba(255,255,255,0.025)';
                }}

                if (activeFactionFilter) {{
                    const sNode = typeof link.source === 'object' ? link.source : gData.nodes.find(n => n.id === sid);
                    const tNode = typeof link.target === 'object' ? link.target : gData.nodes.find(n => n.id === tid);
                    const sMatch = sNode && (sNode.race === activeFactionFilter || sNode.faction === activeFactionFilter);
                    const tMatch = tNode && (tNode.race === activeFactionFilter || tNode.faction === activeFactionFilter);
                    if (sMatch && tMatch) return 'rgba(255,255,255,0.6)';
                    return 'rgba(255,255,255,0.025)';
                }}

                return 'rgba(255,255,255,0.15)';
            }})
            .linkLineDash(link => {{
                const cat = getRelCategory(link.type || 'Other').name;
                if (cat === 'Family') return null;
                if (cat === 'Rival') return [2, 4];
                if (cat === 'Military' || cat === 'Organization') return [5, 5];
                if (cat === 'Allies') return [1, 2];
                return null;
            }})
            .linkDirectionalParticles(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                if (highlightedPathLinks.size > 0 && highlightedPathLinks.has(sid + '--' + tid)) {{
                    return 4;
                }}
                return 0;
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

                const isTopPillar = node.is_top || ['ichigo', 'yhwach', 'yamamoto', 'aizen', 'soul_king', 'shunsui', 'kenpachi', 'urahara', 'byakuya', 'rukia', 'gin', 'ulquiorra', 'grimmjow', 'hitsugaya'].includes(node.id);

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
                    const hoverAvatar = document.getElementById('hover-avatar');
                    const hoverName = document.getElementById('hover-name');
                    const hoverMeta = document.getElementById('hover-meta');
                    const hoverConns = document.getElementById('hover-conns');
                    const sSprite = SPRITE_MAP[node.id];

                    if (sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                        hoverAvatar.innerText = '';
                        hoverAvatar.style.backgroundImage = 'url(' + spriteSheet.src + ')';
                        const avatarSize = 44;
                        const scale = avatarSize / sSprite.w;
                        hoverAvatar.style.backgroundSize = (SPRITE_META.sheetWidth * scale) + 'px ' + (SPRITE_META.sheetHeight * scale) + 'px';
                        hoverAvatar.style.backgroundPosition = '-' + (sSprite.x * scale) + 'px -' + (sSprite.y * scale) + 'px';
                        hoverAvatar.style.borderColor = node.color;
                        hoverAvatar.style.boxShadow = '0 0 16px ' + node.color + '77';
                    }} else {{
                        hoverAvatar.style.backgroundImage = 'none';
                        hoverAvatar.style.backgroundColor = '#0F1318';
                        hoverAvatar.style.borderColor = node.color;
                        hoverAvatar.style.boxShadow = '0 0 12px ' + node.color + '44';
                        hoverAvatar.innerText = node.initials || '??';
                        hoverAvatar.style.color = node.color;
                    }}

                    hoverName.innerText = node.name;
                    hoverMeta.innerText = node.race + ' • ' + node.faction;
                    const cCount = (nodeConnections[node.id] || []).length;
                    hoverConns.innerText = cCount + (cCount === 1 ? ' CONNECTION' : ' CONNECTIONS');

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
            const sid = typeof link.source === 'object' ? link.source.id : link.source;
            const tid = typeof link.target === 'object' ? link.target.id : link.target;
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

        // Faction Leaders Map
        const FACTION_LEADERS = {{
            'all':         'ichigo',
            'gotei':       'yamamoto',
            'wandenreich': 'yhwach',
            'arrancar':    'aizen',
            'royal':       'soul_king',
            'karakura':    'ichigo',
            'original':    'yamamoto'
        }};

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
                    ['soul_king', 'ichibei', 'nimaiya', 'tenjiro', 'senjumaru', 'kirio'].includes(n.id);
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

        let currentCluster = 'all';

        function fitGraphToScreen(duration = 600) {{
            const nodes = (gData && gData.nodes && gData.nodes.length > 0) ? gData.nodes : RAW_GRAPH.nodes;
            if (!nodes || nodes.length === 0) return;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            nodes.forEach(n => {{
                if (n.x === undefined || n.y === undefined) return;
                if (n.x < minX) minX = n.x;
                if (n.x > maxX) maxX = n.x;
                if (n.y < minY) minY = n.y;
                if (n.y > maxY) maxY = n.y;
            }});

            if (!isFinite(minX)) return;

            const isMobile = window.innerWidth <= 768;
            const padTop = isMobile ? 65 : 75;
            const padBottom = isMobile ? 85 : 65;
            const padLeft = isMobile ? 25 : 45;
            const padRight = isMobile ? 25 : (sidebar && sidebar.classList.contains('open') ? 380 : 55);

            const availW = Math.max(window.innerWidth - padLeft - padRight, 200);
            const availH = Math.max(window.innerHeight - padTop - padBottom, 200);

            const margin = isMobile ? 40 : 50;
            const boxW = Math.max(maxX - minX + margin * 2, 100);
            const boxH = Math.max(maxY - minY + margin * 2, 100);

            const targetZoom = Math.min(availW / boxW, availH / boxH);
            const clampedZoom = Math.max(0.15, Math.min(targetZoom, isMobile ? 0.95 : 1.6));

            const boxCenterX = (minX + maxX) / 2;
            const boxCenterY = (minY + maxY) / 2;

            const centerShiftX = ((padLeft - padRight) / 2) / clampedZoom;
            const centerShiftY = ((padTop - padBottom) / 2) / clampedZoom;

            Graph.centerAt(boxCenterX - centerShiftX, boxCenterY - centerShiftY, duration);
            Graph.zoom(clampedZoom, duration);
        }}

        function jumpToCluster(clusterType) {{
            currentCluster = clusterType;
            document.querySelectorAll('.cluster-btn').forEach(btn => {{
                btn.classList.toggle('active', btn.dataset.cluster === clusterType);
            }});

            const dynamicBg = document.getElementById('dynamic-bg');
            if (dynamicBg) {{
                if (clusterType === 'arrancar') {{
                    dynamicBg.style.backgroundImage = "url('Asset/Background/weikomundo.jpg')";
                    dynamicBg.style.opacity = '0.55';
                }} else if (clusterType === 'original') {{
                    dynamicBg.style.backgroundImage = "url('Asset/Background/Original 13.png')";
                    dynamicBg.style.opacity = '0.60';
                }} else if (clusterType === 'royal') {{
                    dynamicBg.style.backgroundImage = "url('Asset/Background/Soul Palace.jpg')";
                    dynamicBg.style.opacity = '0.55';
                }} else if (clusterType === 'wandenreich') {{
                    dynamicBg.style.backgroundImage = "url('Asset/Background/Quency base.jpg')";
                    dynamicBg.style.opacity = '0.55';
                }} else {{
                    dynamicBg.style.opacity = '0';
                }}
            }}

            const filterFn = getFactionFilter(clusterType);
            const leaderId = FACTION_LEADERS[clusterType] || 'ichigo';

            const filteredNodes = RAW_GRAPH.nodes.filter(filterFn).map(n => {{
                const existing = gData.nodes.find(en => en.id === n.id);
                const clone = Object.assign({{}}, n);
                if (existing) {{
                    clone.x = existing.x; clone.y = existing.y;
                    clone.vx = existing.vx; clone.vy = existing.vy;
                }}
                delete clone.fx; delete clone.fy;
                return clone;
            }});

            const validNodeIds = new Set(filteredNodes.map(n => n.id));

            const filteredLinks = RAW_GRAPH.links.filter(l => {{
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return validNodeIds.has(sid) && validNodeIds.has(tid);
            }}).map(l => ({{
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target,
                type: l.type, label: l.label
            }}));

            // Specialized cluster geometric layouts
            if (clusterType === 'arrancar') {{
                // Pin Aizen at center
                const aizen = filteredNodes.find(n => n.id === 'aizen');
                if (aizen) {{ aizen.x = 0; aizen.y = 0; aizen.fx = 0; aizen.fy = 0; }}

                // Gin & Tosen flanking Aizen
                const gin = filteredNodes.find(n => n.id === 'gin');
                if (gin) {{ gin.x = -36; gin.y = -52; gin.fx = -36; gin.fy = -52; }}
                const tosen = filteredNodes.find(n => n.id === 'tosen');
                if (tosen) {{ tosen.x = 36; tosen.y = -52; tosen.fx = 36; tosen.fy = -52; }}

                // 10 Espada in anticlockwise rank ring
                const ESPADA_ORDER = ['starrk', 'baraggan', 'harribel', 'ulquiorra', 'nnoitra', 'grimmjow', 'zommari', 'szayelaporro', 'aaroniero', 'yammy'];
                const R_ESPADA = 145;
                const espCoords = {{}};
                ESPADA_ORDER.forEach((id, idx) => {{
                    const angle = -Math.PI / 2 - (idx * (2 * Math.PI / ESPADA_ORDER.length));
                    const ex = Math.round(Math.cos(angle) * R_ESPADA);
                    const ey = Math.round(Math.sin(angle) * R_ESPADA);
                    espCoords[id] = {{ x: ex, y: ey, angle: angle }};
                    const node = filteredNodes.find(n => n.id === id);
                    if (node) {{
                        node.x = ex; node.y = ey; node.fx = ex; node.fy = ey; node.vx = 0; node.vy = 0;
                    }}
                }});

                // Fracción radial offsets
                const fracMasterMap = {{
                    'lilynette': 'starrk',
                    'charlotte': 'baraggan', 'findorr': 'baraggan', 'ggio': 'baraggan',
                    'poww': 'baraggan', 'abirama': 'baraggan', 'nirgge': 'baraggan', 'ikomikidomoe': 'baraggan',
                    'sunsun': 'harribel', 'milarose': 'harribel', 'apacci': 'harribel', 'ayon': 'harribel',
                    'tesla': 'nnoitra', 'nelliel': 'nnoitra', 'pesche': 'nnoitra', 'dondochakka': 'nnoitra', 'bawabawa': 'nnoitra',
                    'shawlong': 'grimmjow', 'edrad': 'grimmjow', 'ylfordt': 'grimmjow', 'diroy': 'grimmjow', 'nakim': 'grimmjow', 'luppi': 'grimmjow',
                    'lumina': 'szayelaporro', 'medazeppi': 'szayelaporro', 'roka_paramia': 'szayelaporro',
                    'kukkapuro': 'yammy', 'aldegor': 'ulquiorra'
                }};

                const masterChildCounts = {{}};
                filteredNodes.forEach(node => {{
                    if (node.id === 'aizen' || node.id === 'gin' || node.id === 'tosen' || ESPADA_ORDER.includes(node.id)) return;
                    const masterId = fracMasterMap[node.id];
                    if (masterId && espCoords[masterId]) {{
                        const m = espCoords[masterId];
                        masterChildCounts[masterId] = (masterChildCounts[masterId] || 0) + 1;
                        const count = masterChildCounts[masterId];
                        const spreadAngle = m.angle + (count % 2 === 1 ? 1 : -1) * Math.ceil(count / 2) * 0.18;
                        const dist = (node.id === 'ikomikidomoe' ? 275 : 250);
                        node.x = Math.round(Math.cos(spreadAngle) * dist);
                        node.y = Math.round(Math.sin(spreadAngle) * dist);
                        node.vx = 0; node.vy = 0;
                    }} else if (['dordoni', 'cirucci', 'gantenbainne'].includes(node.id)) {{
                        const pIdx = ['dordoni', 'cirucci', 'gantenbainne'].indexOf(node.id);
                        const pAngle = 0.08 + pIdx * 0.22;
                        node.x = Math.round(Math.cos(pAngle) * 265);
                        node.y = Math.round(Math.sin(pAngle) * 265);
                        node.vx = 0; node.vy = 0;
                    }} else if (['rudbornn', 'aisslinger', 'demoura'].includes(node.id)) {{
                        const eIdx = ['rudbornn', 'aisslinger', 'demoura'].indexOf(node.id);
                        const eAngle = Math.PI * 0.45 + (eIdx - 1) * 0.2;
                        node.x = Math.round(Math.cos(eAngle) * 265);
                        node.y = Math.round(Math.sin(eAngle) * 265);
                        node.vx = 0; node.vy = 0;
                    }} else if (['loly', 'menoly'].includes(node.id)) {{
                        const lIdx = ['loly', 'menoly'].indexOf(node.id);
                        const lAngle = -Math.PI * 0.75 + (lIdx === 0 ? -0.15 : 0.15);
                        node.x = Math.round(Math.cos(lAngle) * 235);
                        node.y = Math.round(Math.sin(lAngle) * 235);
                        node.vx = 0; node.vy = 0;
                    }} else {{
                        const randAngle = Math.random() * Math.PI * 2;
                        node.x = Math.round(Math.cos(randAngle) * 255);
                        node.y = Math.round(Math.sin(randAngle) * 255);
                        node.vx = 0; node.vy = 0;
                    }}
                }});
            }} else if (clusterType === 'gotei') {{
                // Yamamoto pinned at Center
                const yama = filteredNodes.find(n => n.id === 'yamamoto');
                if (yama) {{ yama.x = 0; yama.y = 0; yama.fx = 0; yama.fy = 0; yama.vx = 0; yama.vy = 0; }}
                
                const SQUADS = [
                    {{ cap: 'soi_fon',   subs: ['omaeda'] }},
                    {{ cap: 'gin',       subs: ['kira'] }},
                    {{ cap: 'unohana',   subs: ['isane'] }},
                    {{ cap: 'aizen',     subs: ['momo'] }},
                    {{ cap: 'byakuya',   subs: ['renji', 'rukia'] }},
                    {{ cap: 'komamura',  subs: [] }},
                    {{ cap: 'shunsui',   subs: ['nanao'] }},
                    {{ cap: 'tosen',     subs: ['hisagi'] }},
                    {{ cap: 'hitsugaya', subs: ['rangiku'] }},
                    {{ cap: 'kenpachi',  subs: ['yachiru'] }},
                    {{ cap: 'mayuri',    subs: ['nemu'] }},
                    {{ cap: 'ukitake',   subs: [] }}
                ];
                
                const R_CAPTAINS = 220;
                const R_SUBS = 100;
                let placedIds = new Set(['yamamoto', 'sasakibe']);
                
                const sasakibe = filteredNodes.find(n => n.id === 'sasakibe');
                if (sasakibe) {{
                    sasakibe.x = 0; sasakibe.y = -85;
                    sasakibe.fx = 0; sasakibe.fy = -85;
                    sasakibe.vx = 0; sasakibe.vy = 0;
                }}
                
                SQUADS.forEach((squad, i) => {{
                    const capNode = filteredNodes.find(n => n.id === squad.cap);
                    const angle = -Math.PI / 2 - (i * (2 * Math.PI / SQUADS.length));
                    if (capNode) {{
                        capNode.x = Math.round(Math.cos(angle) * R_CAPTAINS);
                        capNode.y = Math.round(Math.sin(angle) * R_CAPTAINS);
                        capNode.fx = capNode.x; capNode.fy = capNode.y;
                        capNode.vx = 0; capNode.vy = 0;
                        placedIds.add(capNode.id);
                        
                        const subNodes = filteredNodes.filter(n => squad.subs.includes(n.id));
                        subNodes.forEach((subNode, j) => {{
                            const subAngle = angle + (j - (subNodes.length - 1)/2) * 0.4;
                            subNode.x = capNode.x + Math.round(Math.cos(subAngle) * R_SUBS);
                            subNode.y = capNode.y + Math.round(Math.sin(subAngle) * R_SUBS);
                            subNode.fx = subNode.x; subNode.fy = subNode.y;
                            subNode.vx = 0; subNode.vy = 0;
                            placedIds.add(subNode.id);
                        }});
                    }}
                }});
                
                const otherNodes = filteredNodes.filter(n => !placedIds.has(n.id));
                const R_OUTER = 380;
                otherNodes.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(otherNodes.length, 1)));
                    node.x = Math.round(Math.cos(angle) * R_OUTER);
                    node.y = Math.round(Math.sin(angle) * R_OUTER);
                    node.vx = 0; node.vy = 0;
                }});
            }} else if (clusterType === 'wandenreich') {{
                const yhwach = filteredNodes.find(n => n.id === 'yhwach');
                if (yhwach) {{ yhwach.x = 0; yhwach.y = 0; yhwach.fx = 0; yhwach.fy = 0; yhwach.vx = 0; yhwach.vy = 0; }}
                
                const rightHands = ['jugram', 'uryu'];
                rightHands.forEach((id, i) => {{
                    const node = filteredNodes.find(n => n.id === id);
                    if (node) {{
                        const angle = i === 0 ? Math.PI : 0;
                        node.x = Math.round(Math.cos(angle) * 120);
                        node.y = Math.round(Math.sin(angle) * 120);
                        node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                    }}
                }});

                const elites = filteredNodes.filter(n => n.val === 11.5 && n.id !== 'yhwach' && !rightHands.includes(n.id));
                elites.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / elites.length));
                    node.x = Math.round(Math.cos(angle) * 260);
                    node.y = Math.round(Math.sin(angle) * 260);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});

                const standard = filteredNodes.filter(n => n.val === 8.5);
                standard.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / standard.length));
                    node.x = Math.round(Math.cos(angle) * 440);
                    node.y = Math.round(Math.sin(angle) * 440);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});

                const minor = filteredNodes.filter(n => n.val < 8.5);
                minor.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(minor.length, 1)));
                    node.x = Math.round(Math.cos(angle) * 620);
                    node.y = Math.round(Math.sin(angle) * 620);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});
            }} else if (clusterType === 'original') {{
                const yama = filteredNodes.find(n => n.id === 'yamamoto');
                if (yama) {{ yama.x = 0; yama.y = 0; yama.fx = 0; yama.fy = 0; yama.vx = 0; yama.vy = 0; }}
                
                const captains = filteredNodes.filter(n => n.id !== 'yamamoto');
                const R = 180;
                captains.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(captains.length, 1)));
                    node.x = Math.round(Math.cos(angle) * R);
                    node.y = Math.round(Math.sin(angle) * R);
                    node.fx = node.x; node.fy = node.y;
                    node.vx = 0; node.vy = 0;
                }});
            }} else if (clusterType === 'karakura') {{
                const VISORED_IDS      = ['shinji', 'hiyori', 'love', 'rose', 'kensei', 'mashiro', 'lisa', 'hachigen'];
                const URAHARA_SHOP_IDS = ['urahara', 'yoruichi', 'tessai', 'jinta', 'ururu'];
                const FULLBRINGER_IDS  = ['ginjo', 'tsukishima', 'riruka', 'yukio', 'jackie', 'moe', 'giriko', 'chad', 'aura_michibane'];

                const ichigo = filteredNodes.find(n => n.id === 'ichigo');
                if (ichigo) {{ ichigo.x = 0; ichigo.y = 0; ichigo.fx = 0; ichigo.fy = 0; ichigo.vx = 0; ichigo.vy = 0; }}

                const urahara = filteredNodes.find(n => n.id === 'urahara');
                if (urahara) {{ urahara.x = -130; urahara.y = -60; urahara.fx = -130; urahara.fy = -60; }}
                const shopNodes = filteredNodes.filter(n => URAHARA_SHOP_IDS.includes(n.id) && n.id !== 'urahara');
                shopNodes.forEach((node, i) => {{
                    const angle = Math.PI * 0.75 + (i * (Math.PI / Math.max(shopNodes.length, 1)));
                    node.x = -130 + Math.cos(angle) * 75; node.y = -60 + Math.sin(angle) * 75;
                    node.vx = 0; node.vy = 0;
                }});

                const shinji = filteredNodes.find(n => n.id === 'shinji');
                if (shinji) {{ shinji.x = 130; shinji.y = -60; shinji.fx = 130; shinji.fy = -60; }}
                const visNodes = filteredNodes.filter(n => VISORED_IDS.includes(n.id) && n.id !== 'shinji');
                visNodes.forEach((node, i) => {{
                    const angle = -Math.PI * 0.25 + (i * (Math.PI / Math.max(visNodes.length, 1)));
                    node.x = 130 + Math.cos(angle) * 85; node.y = -60 + Math.sin(angle) * 85;
                    node.vx = 0; node.vy = 0;
                }});

                const ginjo = filteredNodes.find(n => n.id === 'ginjo');
                if (ginjo) {{ ginjo.x = 0; ginjo.y = 150; ginjo.fx = 0; ginjo.fy = 150; }}
                const fbNodes = filteredNodes.filter(n => FULLBRINGER_IDS.includes(n.id) && n.id !== 'ginjo');
                fbNodes.forEach((node, i) => {{
                    const angle = Math.PI * 0.1 + (i * (Math.PI * 0.8 / Math.max(fbNodes.length, 1)));
                    node.x = 0 + Math.cos(angle) * 90; node.y = 150 + Math.sin(angle) * 90;
                    node.vx = 0; node.vy = 0;
                }});

                const PLACED_IDS = new Set(['ichigo', ...VISORED_IDS, ...URAHARA_SHOP_IDS, ...FULLBRINGER_IDS]);
                const humanNodes = filteredNodes.filter(n => !PLACED_IDS.has(n.id));
                const R_OUTER = 250;
                humanNodes.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(humanNodes.length, 1)));
                    const jitter = (i % 2 === 0) ? 25 : -25;
                    node.x = Math.round(Math.cos(angle) * (R_OUTER + jitter));
                    node.y = Math.round(Math.sin(angle) * (R_OUTER + jitter));
                    node.vx = 0; node.vy = 0;
                }});
            }} else {{
                const leader = filteredNodes.find(n => n.id === leaderId);
                if (leader) {{ leader.x = 0; leader.y = 0; leader.fx = 0; leader.fy = 0; }}
            }}

            gData.nodes = filteredNodes;
            gData.links = filteredLinks;
            Graph.graphData({{ nodes: filteredNodes, links: filteredLinks }});
            Graph.d3ReheatSimulation();
            setTimeout(() => {{ fitGraphToScreen(700); }}, 400);

            if (currentNode && !validNodeIds.has(currentNode.id)) {{
                sidebar.classList.remove('open');
                closeAllPanels();
                const b = document.getElementById('s-banner');
                if (b) b.style.display = 'none';
                miniLegend.classList.remove('hidden');
                currentNode = null;
            }}
            if (pathFindingFrom && !validNodeIds.has(pathFindingFrom.id)) {{
                clearPathFinding();
            }}
        }}

        document.querySelectorAll('.cluster-btn').forEach(btn => {{
            btn.addEventListener('click', () => jumpToCluster(btn.dataset.cluster));
        }});

        document.querySelectorAll('.faction-filter').forEach(el => {{
            el.addEventListener('click', () => {{
                const fac = el.dataset.faction;
                if (activeFactionFilter === fac) {{
                    activeFactionFilter = null;
                    el.style.border = 'none';
                    el.style.background = 'transparent';
                }} else {{
                    activeFactionFilter = fac;
                    document.querySelectorAll('.faction-filter').forEach(f => {{
                        f.style.border = 'none'; f.style.background = 'transparent';
                    }});
                    el.style.border = '1px solid rgba(255,255,255,0.4)';
                    el.style.background = 'rgba(255,255,255,0.1)';
                    el.style.borderRadius = '4px';
                }}
            }});
        }});

        // Keyboard Shortcuts (Ctrl+K search, Esc close)
        document.addEventListener('keydown', e => {{
            if (e.target && e.target.id === 'search-input') return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {{
                e.preventDefault();
                if (searchOverlay.classList.contains('open')) {{
                    closeSearch();
                }} else {{
                    openSearch();
                }}
            }}
            if (e.key === 'Escape') {{
                if (searchOverlay.classList.contains('open')) {{
                    closeSearch();
                }} else if (currentNode || highlightedPathNodes.size > 0) {{
                    deselectNode();
                }}
            }}
        }});

        // Quick Search (Ctrl+K)
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        let activeIdx = -1;

        function openSearch() {{
            searchOverlay.classList.add('open');
            searchInput.value = '';
            searchResults.innerHTML = '';
            activeIdx = -1;
            setTimeout(() => searchInput.focus(), 50);
        }}

        function closeSearch() {{
            searchOverlay.classList.remove('open');
            searchInput.value = '';
            searchResults.innerHTML = '';
            activeIdx = -1;
        }}

        function navigateToNode(node) {{
            closeSearch();
            let activeNode = gData.nodes.find(n => n.id === node.id);
            if (!activeNode) {{
                jumpToCluster('all');
                activeNode = gData.nodes.find(n => n.id === node.id) || node;
            }}
            if (pathFindingFrom) {{
                executePathFinding(activeNode);
            }} else {{
                selectNode(activeNode, true);
            }}
        }}

        function renderResults(query) {{
            if (!query) {{ searchResults.innerHTML = ''; activeIdx = -1; return; }}
            const q = query.toLowerCase().trim();

            let matches = RAW_GRAPH.nodes.filter(n => n.name.toLowerCase().includes(q) || n.faction.toLowerCase().includes(q) || n.race.toLowerCase().includes(q)).slice(0, 12);

            if (matches.length === 0) {{
                activeIdx = -1;
                searchResults.innerHTML = '<div style="padding:16px 20px;font-size:12px;color:#888;text-align:center;line-height:1.6;">No character matching query.<br><span style="font-size:10px;color:#555;">Try searching another name or faction.</span></div>';
                return;
            }}

            activeIdx = 0;
            searchResults.innerHTML = matches.map((n, i) =>
                '<div class="search-result' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
                '<span class="dot" style="background:' + n.color + ';box-shadow:0 0 4px ' + n.color + '"></span>' +
                '<span class="sr-name">' + escapeHtml(n.name) + '</span>' +
                '<span class="sr-faction">' + escapeHtml(n.faction) + '</span>' +
                '</div>'
            ).join('');

            searchResults.querySelectorAll('.search-result').forEach((el, i) => {{
                el.addEventListener('click', () => navigateToNode(matches[i]));
            }});
        }}

        searchInput.addEventListener('input', e => {{
            renderResults(e.target.value);
        }});

        searchInput.addEventListener('keydown', e => {{
            const items = searchResults.querySelectorAll('.search-result');
            if (e.key === 'ArrowDown') {{
                e.preventDefault();
                activeIdx = Math.min(activeIdx + 1, items.length - 1);
                items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
                if (items[activeIdx]) items[activeIdx].scrollIntoView({{ block: 'nearest' }});
            }} else if (e.key === 'ArrowUp') {{
                e.preventDefault();
                activeIdx = Math.max(activeIdx - 1, 0);
                items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
                if (items[activeIdx]) items[activeIdx].scrollIntoView({{ block: 'nearest' }});
            }} else if (e.key === 'Enter') {{
                e.preventDefault();
                const q = searchInput.value.toLowerCase().trim();
                let matches = RAW_GRAPH.nodes.filter(n => n.name.toLowerCase().includes(q) || n.faction.toLowerCase().includes(q) || n.race.toLowerCase().includes(q)).slice(0, 12);
                if (matches[activeIdx]) navigateToNode(matches[activeIdx]);
            }} else if (e.key === 'Escape') {{
                closeSearch();
            }}
        }});

        searchOverlay.addEventListener('click', e => {{
            if (e.target === searchOverlay) closeSearch();
        }});

        // URL Hash Deep Linking
        window.addEventListener('load', () => {{
            setTimeout(() => {{
                if (window.location.hash) {{
                    const targetId = decodeURIComponent(window.location.hash.substring(1));
                    let targetNode = gData.nodes.find(n => n.id === targetId);
                    if (!targetNode) {{
                        jumpToCluster('all');
                        targetNode = gData.nodes.find(n => n.id === targetId);
                    }}
                    if (targetNode) {{
                        selectNode(targetNode, false);
                    }}
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
