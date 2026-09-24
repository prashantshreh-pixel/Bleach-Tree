# -*- coding: utf-8 -*-
import json
import base64
import os
import networkx as nx

def generate_obsidian_graph():
    with open("data/characters.json", "r", encoding="utf-8") as f:
        chars = json.load(f)
    with open("data/relationships.json", "r", encoding="utf-8") as f:
        rels = json.load(f)

    G = nx.Graph()
    for char_id, data in chars.items():
        G.add_node(char_id, **data)
    for rel in rels:
        G.add_edge(rel["source"], rel["target"], type=rel["type"], label=rel["label"])

    deg_cent = nx.degree_centrality(G)

    # Ensure character sprite sheet and coordinate map are up-to-date
    from build_sprites import build_sprites
    sprite_meta = build_sprites()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    asset_dir = os.path.join(base_dir, "Asset")
    
    # Removed base64 GIF to optimize DOM weight and FCP

    # Load characters.webp as data URI fallback for local file:// testing
    sprite_webp_path = os.path.join(asset_dir, "sprites", "characters.webp")
    sprite_version = int(os.path.getmtime(sprite_webp_path))
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

        # Hierarchical node tier sizing
        # Tier 1: Supreme Leaders / Gods
        if char_id in ('aizen', 'ichigo', 'yhwach', 'yamamoto', 'soul_king'):
            tier = 1
            node_val = 16.0
        # Tier 2: Right-Hands, Top Espada, Supreme Captains, Faction Leaders, Original Gotei 13
        elif char_id in ('gin', 'tosen', 'starrk', 'baraggan', 'harribel', 'ulquiorra', 'grimmjow', 'nnoitra', 'shunsui', 'kenpachi', 'byakuya', 'urahara', 'shinji', 'ginjo', 'jugram', 'uryu', 'rukia', 'renji', 'hitsugaya', 'unohana', 'chika_shihoin', 'kinroku_izuhara', 'chigiri_shijima', 'danjiro_obana', 'furofushi_saito', 'nobutsuna_shigyo', 'batsuunsai_katori', 'entetsu_kumoi', 'furuoki_otogawa', 'uhin_zenjoji', 'saizo_sakahone', 'soi_fon', 'mayuri', 'komamura', 'ukitake', 'rose', 'kensei', 'lille_barro', 'gerard_valkyrie', 'pernida_parnkgjas', 'askin_nakk_le_vaar', 'gremmy_thoumeaux'):
            tier = 2
            node_val = 11.5
        # Tier 3: Core Espada, Captains, Elite Schutzstaffel, Key Lieutenants
        elif char_id in ('zommari', 'szayelaporro', 'aaroniero', 'yammy', 'luppi', 'nelliel', 'wonderweiss', 'bazz_b', 'bambietta_basterbine', 'as_nodt', 'cang_du', 'quilge_opie', 'bg9', 'pepe_waccabrada', 'robert_accutrone', 'driscoll_berci', 'meninas_mcallon', 'mask_de_masculine', 'candice_catnipp', 'giselle_gewelle', 'nanana_najahkoop', 'nianzol_weizol', 'royd_lloyd', 'loyd_lloyd', 'liltotto_lamperd', 'love', 'lisa', 'hachigen', 'yoruichi', 'isshin', 'ryuken', 'orihime', 'chad', 'tsukishima', 'tatsuki', 'omaeda', 'kira', 'isane', 'momo', 'nanao', 'hisagi', 'rangiku', 'yachiru', 'nemu', 'sasakibe'):
            tier = 3
            node_val = 8.5
        # Tier 5: Minor Fracción, Fodder, Servants, Minor Hollows
        elif 'Fracci' in fac or char_id in ('lilynette', 'loly', 'menoly', 'roka_paramia', 'charlotte', 'abirama', 'findorr', 'poww', 'ggio', 'nirgge', 'shawlong', 'edrad', 'ylfordt', 'diroy', 'nakim', 'apacci', 'milarose', 'sunsun', 'ayon', 'tesla', 'lumina', 'medazeppi', 'pesche', 'dondochakka', 'bawabawa', 'demoura', 'aisslinger', 'kukkapuro', 'aldegor', 'grand_fisher', 'jinta', 'ururu', 'kon', 'ririn', 'noba', 'kurodo', 'keigo', 'mizuiro', 'tatsuki', 'chizuru', 'ryo', 'michiru', 'mahana', 'misato', 'keisuke', 'mizuho', 'ikumi', 'kaoru', 'don_kanonji', 'kagine', 'asguiaro_ebern', 'luders_friegen', 'berenice_gabrielli', 'jerome_guizbatt', 'guenael_lee', 'shaz_domino'):
            tier = 5
            node_val = 3.5
        # Tier 4: Lieutenants, Privaron Espada, Officers, Seated Members
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

    # Build the legend HTML
    legend_items = "".join(
        f'<div class="faction-filter" data-faction="{race}" style="display:flex;align-items:center;cursor:pointer;padding:2px 0;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">'
        f'<span style="width:8px;height:8px;border-radius:50%;background:{color};'
        f'display:inline-block;margin-right:8px;box-shadow:0 0 5px {color};"></span>{race}</div>'
        for race, color in RACE_COLORS.items()
    )

    graph_json = json.dumps(graph_data)
    sprite_map_json = json.dumps(sprite_meta.get("sprites", {}))
    sprite_meta_json = json.dumps({
        "sheetWidth": sprite_meta.get("sheetWidth", 128),
        "sheetHeight": sprite_meta.get("sheetHeight", 128),
        "tileSize": sprite_meta.get("tileSize", 128)
    })

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>BLEACH - TYBW Intelligence</title>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://unpkg.com">
    <link rel="preconnect" href="https://unpkg.com" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" as="style">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://unpkg.com/force-graph"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        * {{ box-sizing: border-box; }}
        body {{ margin: 0; padding: 0; background-color: #0A0A0F; color: white; font-family: 'Inter', sans-serif; overflow: hidden; touch-action: none; }}
        #graph-container {{ width: 100vw; height: 100vh; position: absolute; z-index: 1; }}

        /* Loader */
        #loader {{
            position: fixed; inset: 0; background: #000; z-index: 9999;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            transition: opacity 0.8s ease-out, visibility 0.8s; cursor: pointer;
        }}
        #loader.fade-out {{ opacity: 0; pointer-events: none; }}
        .css-spinner {{
            width: 80px; height: 80px; border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #F59E0B; border-radius: 50%;
            animation: spin 1s linear infinite; margin-bottom: 20px;
        }}
        @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        .loader-text {{
            font-family: 'Cinzel', serif; font-size: 24px; letter-spacing: 4px;
            color: #fff; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            animation: pulse-glow 2s ease-in-out infinite; text-transform: uppercase;
        }}
        @keyframes pulse-glow {{ 0%, 100% {{ opacity: 0.8; text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }} 50% {{ opacity: 1; text-shadow: 0 0 20px rgba(255, 255, 255, 0.9); }} }}
        .loader-hint {{ margin-top: 15px; font-size: 13px; color: #888; font-weight: 300; letter-spacing: 1px; text-transform: uppercase; }}

        /* Sidebar */
        #sidebar {{
            position: fixed;
            top: 20px;
            bottom: 20px;
            right: -400px;
            width: 350px;
            background: rgba(10,10,15,0.85);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 12px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.9);
            z-index: 20;
            display: flex;
            flex-direction: column;
            gap: 0;
            transition: right 0.4s cubic-bezier(.175, .885, .32, 1.275);
            overflow: hidden; /* For border radius */
        }}
        #sidebar.open {{ right: 20px; }}

        #sidebar-bg {{
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-size: cover;
            background-position: center 20%;
            background-repeat: no-repeat;
            z-index: 0;
            transition: background-image 0.4s ease, opacity 0.4s ease;
            opacity: 0.35;
            filter: blur(14px) saturate(1.3) brightness(0.75);
            transform: scale(1.12);
            pointer-events: none;
        }}
        #sidebar-overlay {{
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(10,10,18,0.5) 0%, rgba(10,10,18,0.88) 45%, rgba(10,10,18,0.96) 100%);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 0;
            pointer-events: none;
        }}
        
        #sidebar-content {{
            padding: 28px 22px 40px 22px;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            z-index: 1;
            scrollbar-width: thin;
            scrollbar-color: rgba(220, 38, 38, 0.6) rgba(15, 15, 25, 0.4);
        }}
        #sidebar-content::-webkit-scrollbar {{
            width: 5px;
        }}
        #sidebar-content::-webkit-scrollbar-track {{
            background: rgba(10, 10, 20, 0.4);
            border-radius: 4px;
        }}
        #sidebar-content::-webkit-scrollbar-thumb {{
            background: rgba(220, 38, 38, 0.5);
            border-radius: 4px;
        }}
        #sidebar-content::-webkit-scrollbar-thumb:hover {{
            background: rgba(220, 38, 38, 0.9);
        }}
        #sidebar-content::-webkit-scrollbar-button {{
            display: none;
            width: 0;
            height: 0;
        }}

        .scroll-fade {{
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(to top, rgba(10,10,18,0.95), transparent);
            pointer-events: none;
            z-index: 5;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }}

        #sidebar-close {{
            position: absolute;
            top: 14px;
            right: 16px;
            background: none;
            border: 1px solid rgba(255,255,255,0.15);
            color: #fff;
            font-size: 18px;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }}
        #sidebar-close:hover {{ background: rgba(220,38,38,0.3); }}

        #sidebar-search {{
            position: absolute;
            top: 14px;
            right: 56px;
            background: none;
            border: 1px solid rgba(255,255,255,0.15);
            color: #fff;
            font-size: 14px;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            animation: searchPulse 3.5s infinite ease-in-out;
        }}
        @keyframes searchPulse {{
            0%, 100% {{ box-shadow: 0 0 0 rgba(220,38,38,0); border-color: rgba(255,255,255,0.15); }}
            50% {{ box-shadow: 0 0 8px rgba(220,38,38,0.7); border-color: rgba(220,38,38,0.8); }}
        }}
        #sidebar-search:hover {{ background: rgba(220,38,38,0.3); animation: none; }}

        #sidebar .brand {{ font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 2px; margin-bottom: 2px; }}
        #sidebar .brand span {{ color: #DC2626; }}
        #sidebar .sub {{ font-size: 9px; letter-spacing: 4px; color: #666; text-transform: uppercase; margin-bottom: 16px; }}

        /* Back navigation */
        .back-nav {{
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }}
        .back-btn {{
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            color: #ddd;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }}
        .back-btn:hover {{
            background: rgba(220,38,38,0.25);
            border-color: #DC2626;
            color: #fff;
        }}
        .back-btn span {{ color: #888; }}
        .back-btn strong {{
            color: #fff;
            max-width: 140px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }}

        /* Floating Dossier Avatar Header */
        #s-avatar-wrap {{
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
        }}
        #s-avatar {{
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background-color: #0F1318;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cinzel', serif;
            font-size: 22px;
            font-weight: 700;
            color: #fff;
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            background-repeat: no-repeat;
            flex-shrink: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        #s-avatar-meta {{
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
        }}

        #sidebar .char-name {{ font-family: 'Cinzel', serif; font-size: 20px; color: #fff; margin: 0 0 4px 0; }}
        #sidebar .char-meta {{ font-size: 11px; color: #DC2626; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0; }}
        #sidebar .char-desc {{ font-size: 12px; color: #aaa; line-height: 1.6; margin-bottom: 14px; }}

        /* Action buttons in profile (Trace path) */
        .action-bar {{
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }}
        .action-chip {{
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.12);
            color: #aaa;
            font-size: 10px;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }}
        .action-chip:hover {{
            background: rgba(220,38,38,0.25);
            border-color: #DC2626;
            color: #fff;
        }}
        .action-chip.active {{
            background: #DC2626;
            border-color: #DC2626;
            color: #fff;
        }}

        /* Floating Path Finding Banner */
        #path-banner {{
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 15, 25, 0.96);
            border: 1px solid #DC2626;
            box-shadow: 0 6px 25px rgba(220, 38, 38, 0.35);
            border-radius: 8px;
            padding: 10px 18px;
            z-index: 45;
            display: none;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(12px);
            font-size: 12px;
            color: #eee;
        }}
        #path-banner.active {{ display: flex; }}
        #path-banner .banner-text strong {{ color: #F59E0B; }}
        #path-banner button {{
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }}
        #path-banner button:hover {{ background: rgba(220,38,38,0.4); border-color: #DC2626; }}

        #sidebar .section-title {{ font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 2px; color: #888; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }}
        #sidebar .section-title span {{ font-size: 10px; color: #555; }}

        /* Connection filter chips */
        .conn-filter-bar {{
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 10px;
        }}
        .conn-chip {{
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            color: #777;
            font-size: 9px;
            padding: 3px 7px;
            border-radius: 8px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
            user-select: none;
        }}
        .conn-chip:hover, .conn-chip.active {{
            background: rgba(220,38,38,0.25);
            border-color: #DC2626;
            color: #fff;
        }}

        /* Connection items with category badges & colored left borders */
        #sidebar .conn-list {{
            list-style: none;
            padding: 0;
            margin: 0 0 20px 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        .conn-card {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 7px 10px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-left-width: 3px;
            border-left-style: solid;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }}
        .conn-card:hover {{
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.2);
            transform: translateX(3px);
        }}
        .conn-card-info {{
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
        }}
        .conn-card-name {{
            font-size: 11px;
            font-weight: 600;
            color: #eee;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}
        .conn-card-label {{
            font-size: 10px;
            color: #888;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}
        .conn-card-badge {{
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 2px 5px;
            border-radius: 3px;
            flex-shrink: 0;
            margin-left: 8px;
        }}

        #sidebar .legend-grid {{ display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.65); }}

        /* Tactical Cluster Navigation Bar */
        #cluster-bar {{
            position: fixed;
            top: 18px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 25;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 8px;
            background: rgba(10, 10, 16, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 30px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(14px);
            user-select: none;
        }}
        .cluster-btn {{
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.7);
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 10.5px;
            font-family: 'Cinzel', serif;
            letter-spacing: 0.8px;
            cursor: pointer;
            transition: all 0.22s ease;
            white-space: nowrap;
        }}
        .cluster-btn:hover {{
            background: rgba(255, 255, 255, 0.14);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.22);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }}
        .cluster-btn.active {{
            background: rgba(212, 175, 55, 0.22);
            border-color: #D4AF37;
            color: #F5E6C8;
            box-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
        }}

        /* Tactical Minimap HUD (Bottom-Left) */
        #minimap-container {{
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 15;
            width: 172px;
            background: rgba(10, 10, 16, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            overflow: hidden;
            user-select: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }}
        .minimap-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px 4px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.02);
        }}
        .minimap-title {{
            font-family: 'Cinzel', serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: rgba(255, 255, 255, 0.7);
        }}
        .minimap-stats {{
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            color: #D4AF37;
        }}
        #minimap-canvas {{
            display: block;
            cursor: crosshair;
            background: #08080C;
        }}
        .minimap-hint {{
            text-align: center;
            font-size: 7.5px;
            color: rgba(255, 255, 255, 0.35);
            padding: 2px 0 3px;
            letter-spacing: 0.5px;
        }}

        /* Mini legend (bottom-left, adjacent to radar) */
        #mini-legend {{ position: absolute; bottom: 20px; left: 202px; z-index: 5; background: rgba(10,10,15,0.5); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(5px); font-size: 10px; color: rgba(255,255,255,0.6); display: flex; flex-direction: column; gap: 6px; pointer-events: none; transition: opacity 0.3s ease, transform 0.3s ease; }}
        #mini-legend.hidden {{ opacity: 0; transform: translateY(20px); pointer-events: none; }}
        #mini-legend .title {{ font-family: 'Cinzel', serif; letter-spacing: 2px; font-weight: 700; color: rgba(255,255,255,0.8); font-size: 9px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 3px; margin-bottom: 3px; }}

        /* Search overlay */
        #search-overlay {{
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 50;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding-top: 18vh;
        }}
        #search-overlay.open {{ display: flex; }}
        #search-box {{
            width: 420px;
            background: rgba(15,15,22,0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        }}
        #search-input {{
            width: 100%;
            padding: 16px 20px;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 15px;
            outline: none;
        }}
        #search-input::placeholder {{ color: #555; }}
        #search-results {{
            max-height: 300px;
            overflow-y: auto;
        }}
        .search-result {{
            padding: 10px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.15s;
            border-bottom: 1px solid rgba(255,255,255,0.02);
        }}
        .search-result:hover, .search-result.active {{ background: rgba(220,38,38,0.15); }}
        .search-result .dot {{ width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }}
        .search-result .sr-name {{ font-size: 13px; color: #eee; }}
        .search-result .sr-faction {{ font-size: 10px; color: #666; margin-left: auto; text-transform: uppercase; letter-spacing: 1px; }}
        #search-hint {{ padding: 10px 20px; font-size: 10px; color: #444; text-align: center; letter-spacing: 1px; }}

        /* ── EASTER EGG STYLES ── */
        #bankai-overlay {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 90; display: none;
            align-items: center; justify-content: center;
            background: radial-gradient(circle, rgba(74, 158, 255, 0.4) 0%, rgba(220, 38, 38, 0.25) 60%, rgba(0,0,0,0.92) 100%);
        }}
        #bankai-overlay.active {{ display: flex; animation: bankaiFlash 2.5s forwards ease-out; }}
        @keyframes bankaiFlash {{
            0% {{ opacity: 0; transform: scale(0.9); }}
            15% {{ opacity: 1; transform: scale(1.05); }}
            35% {{ opacity: 0.9; transform: scale(1); }}
            100% {{ opacity: 0; transform: scale(1); }}
        }}
        .bankai-kanji {{
            font-family: 'Cinzel', serif; font-size: 64px; font-weight: 900;
            letter-spacing: 16px; color: #fff;
            text-shadow: 0 0 35px #4A9EFF, 0 0 70px #DC2626;
            text-align: center; line-height: 1.2;
        }}
        .bankai-sub {{
            font-size: 14px; letter-spacing: 12px; color: #4A9EFF;
            text-transform: uppercase; margin-top: 10px; text-shadow: 0 0 15px #4A9EFF;
        }}

        #getsuga-slash {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 92; display: none;
        }}
        #getsuga-slash.active {{ display: block; animation: getsugaFade 0.75s forwards ease-out; }}
        @keyframes getsugaFade {{ 0% {{ opacity: 1; }} 100% {{ opacity: 0; }} }}
        .slash-blade {{
            position: absolute; top: 50%; left: -20%; width: 140%; height: 7px;
            background: linear-gradient(90deg, transparent 0%, #fff 25%, #DC2626 50%, #000 75%, transparent 100%);
            box-shadow: 0 0 35px #DC2626, 0 0 70px #fff;
            transform: translateY(-50%) rotate(-28deg);
            animation: slashCut 0.45s ease-out;
        }}
        @keyframes slashCut {{
            0% {{ transform: translateY(-50%) rotate(-28deg) scaleX(0); }}
            50% {{ transform: translateY(-50%) rotate(-28deg) scaleX(1.1); }}
            100% {{ transform: translateY(-50%) rotate(-28deg) scaleX(1); }}
        }}

        body.screen-shake {{ animation: screenShake 0.4s ease-in-out; }}
        @keyframes screenShake {{
            0%, 100% {{ transform: translate(0, 0); }}
            20% {{ transform: translate(-6px, 4px); }}
            40% {{ transform: translate(6px, -4px); }}
            60% {{ transform: translate(-4px, 2px); }}
            80% {{ transform: translate(4px, -2px); }}
        }}

        body.hogyoku-mode {{
            animation: realityDistort 0.6s infinite alternate ease-in-out;
        }}
        @keyframes realityDistort {{
            0% {{ filter: contrast(1.4) hue-rotate(45deg) saturate(1.8); }}
            100% {{ filter: contrast(1.6) hue-rotate(280deg) saturate(2.2); }}
        }}

        body.midnight-mode {{ background-color: #06020c !important; }}
        body.midnight-mode #graph-container {{ filter: hue-rotate(25deg) brightness(0.9); }}

        #seireitei-barrier {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 85;
            box-shadow: inset 0 0 70px rgba(212, 175, 55, 0.8), inset 0 0 150px rgba(74, 158, 255, 0.4);
            border: 2px solid rgba(212, 175, 55, 0.6); display: none;
            animation: barrierPulse 2s infinite alternate ease-in-out;
        }}
        @keyframes barrierPulse {{ 0% {{ opacity: 0.6; }} 100% {{ opacity: 1; }} }}

        #love-banner {{
            position: fixed; top: 75px; left: 50%; transform: translateX(-50%);
            background: rgba(225, 29, 72, 0.92); color: #fff;
            border: 1px solid #fff; box-shadow: 0 0 30px rgba(225, 29, 72, 0.7);
            border-radius: 20px; padding: 9px 20px; font-size: 12px; z-index: 60;
            display: none; align-items: center; gap: 8px; backdrop-filter: blur(10px);
            animation: bounceIn 0.4s ease-out;
        }}
        @keyframes bounceIn {{
            0% {{ transform: translateX(-50%) scale(0.7); opacity: 0; }}
            100% {{ transform: translateX(-50%) scale(1); opacity: 1; }}
        }}

        #hollow-banner {{
            position: fixed; top: 25px; left: 50%; transform: translateX(-50%);
            background: rgba(10, 5, 20, 0.95); border: 2px solid #6B21A8;
            box-shadow: 0 0 35px #6B21A8, 0 0 60px #DC2626;
            color: #fff; padding: 10px 22px; border-radius: 6px;
            font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 2px;
            z-index: 65; display: none; text-align: center;
        }}

        #credits-modal {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
            z-index: 99; display: none; align-items: center; justify-content: center;
        }}
        #credits-modal.open {{ display: flex; }}
        .bounty-card {{
            width: 400px; background: #0E0B12; border: 2px solid #D4AF37;
            border-radius: 8px; padding: 32px 28px; box-shadow: 0 0 50px rgba(212, 175, 55, 0.4);
            text-align: center; position: relative;
        }}
        .bounty-seal {{
            font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 4px;
            color: #D4AF37; text-transform: uppercase; border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            padding-bottom: 8px; margin-bottom: 18px;
        }}
        .bounty-title {{ font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 6px; }}
        .bounty-sub {{ font-size: 11px; color: #DC2626; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; font-weight: 600; }}
        .bounty-body {{ font-size: 12px; color: #bbb; line-height: 1.7; margin-bottom: 22px; text-align: left; background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }}
        .bounty-close {{
            background: rgba(212, 175, 55, 0.15); border: 1px solid #D4AF37; color: #D4AF37;
            padding: 7px 20px; border-radius: 4px; cursor: pointer; font-family: 'Inter', sans-serif;
            font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; transition: all 0.2s; font-weight: 600;
        }}
        .bounty-close:hover {{ background: #D4AF37; color: #000; }}

        /* Large High-Quality Floating Hover Card */
        #node-hover-card {{
            position: fixed;
            pointer-events: none;
            z-index: 60;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 18px 10px 12px;
            background: rgba(10, 10, 18, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 14px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9), 0 0 24px rgba(220, 38, 38, 0.15);
            opacity: 0;
            transform: translate(-50%, -125%) scale(0.92);
            transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        #node-hover-card.visible {{
            opacity: 1;
            transform: translate(-50%, -125%) scale(1);
        }}
        #hover-avatar {{
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background-color: #0A0A0F;
            background-repeat: no-repeat;
            background-size: cover;
            border: 2px solid #DC2626;
            box-shadow: 0 0 18px rgba(220, 38, 38, 0.5);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cinzel', serif;
            font-size: 26px;
            font-weight: 700;
            overflow: hidden;
        }}
        .hover-text {{
            display: flex;
            flex-direction: column;
            gap: 3px;
        }}
        #hover-name {{
            font-family: 'Cinzel', serif;
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            letter-spacing: 1px;
            white-space: nowrap;
        }}
        #hover-meta {{
            font-size: 11px;
            color: #9CA3AF;
            white-space: nowrap;
        }}
        #hover-conns {{
            font-size: 10px;
            color: #DC2626;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }}
        /* Mobile Touch & Drawer Optimization */
        @media (max-width: 768px) {{
            #mobile-nav {{ display: flex !important; }}
            #sidebar {{
                top: auto; bottom: -120%; left: 0; right: 0; width: 100%; height: 50vh;
                border-left: none; border-top: 1px solid rgba(255,255,255,0.15);
                border-radius: 20px 20px 0 0;
                transition: bottom 0.3s cubic-bezier(0.1, 0.82, 0.25, 1);
            }}
            #sidebar.open {{ bottom: 0; right: 0; transform: none; }}
            #sidebar::before {{
                content: ''; position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
                width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px;
            }}
            #sidebar-content {{ padding: 20px 16px 30px 16px; }}
            #cluster-bar {{
                top: auto; bottom: 0; left: 0; right: 0; width: 100%;
                transform: none;
                flex-wrap: nowrap; justify-content: flex-start;
                overflow-x: auto; overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
                z-index: 10;
                border-radius: 0;
                padding: 8px 10px;
                gap: 4px;
                background: rgba(10, 10, 16, 0.95);
                border-top: 1px solid rgba(255,255,255,0.08);
            }}
            #cluster-bar::-webkit-scrollbar {{ display: none; }}
            .cluster-btn {{
                padding: 5px 10px; font-size: 10px; margin: 0;
                white-space: nowrap; flex-shrink: 0;
            }}
            #minimap-container {{ display: none !important; }}
            #mini-legend {{ display: none !important; }}
            #legend {{ display: none; }}
            #node-hover-card {{ display: none !important; }}
            #s-avatar-wrap {{ width: 60px; height: 60px; }}
        }}
        /* Dossier Tabs & Timeline */
        .dossier-tabs {{ display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px; }}
        .tab-btn {{ flex: 1; background: transparent; border: none; color: rgba(255,255,255,0.4); font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 2px; padding: 10px 0; cursor: pointer; transition: all 0.2s; border-bottom: 2px solid transparent; }}
        .tab-btn:hover {{ color: rgba(255,255,255,0.8); }}
        .tab-btn.active {{ color: #D4AF37; border-bottom-color: #D4AF37; }}
        .tab-pane {{ display: none; }}
        .tab-pane.active {{ display: block; animation: fadeIn 0.3s ease; }}
        
        .vertical-timeline {{ border-left: 1px dashed rgba(255,255,255,0.2); margin-left: 10px; padding-left: 20px; margin-top: 10px; }}
        .tl-item {{ position: relative; padding-bottom: 25px; font-size: 11px; letter-spacing: 1.5px; color: rgba(255,255,255,0.5); font-family: 'Cinzel', serif; }}
        .tl-item::before {{ content: ''; position: absolute; left: -24px; top: 2px; width: 7px; height: 7px; background: #0F1318; border: 1px solid rgba(255,255,255,0.3); border-radius: 50%; }}
        .tl-item.active {{ color: #D4AF37; }}
        .tl-item.active::before {{ border-color: #D4AF37; background: #D4AF37; box-shadow: 0 0 10px rgba(212,175,55,0.5); }}
        .tl-item:last-child {{ padding-bottom: 0; }}
    </style>
</head>
<body>
    <div id="dynamic-bg" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:0; background-size:cover; background-position:center; background-repeat:no-repeat; opacity:0; transition:opacity 1.2s ease; pointer-events:none; background-color:#0A0A0F;"></div>
    <div id="mobile-nav" style="position:fixed; top:20px; left:20px; z-index:40; display:none;">
        <button id="nav-search-btn" style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:10px 15px; border-radius:20px; font-size:13px; cursor:pointer; font-family:'Cinzel'; letter-spacing:1px; backdrop-filter:blur(5px);"><span style="margin-right:6px;">&#x1F50D;</span> SEARCH</button>
    </div>
    <!-- Large High-Quality Floating Hover Card -->
    <div id="node-hover-card">
        <div id="hover-avatar"></div>
        <div class="hover-text">
            <div id="hover-name"></div>
            <div id="hover-meta"></div>
            <div id="hover-conns"></div>
        </div>
    </div>
    <!-- Fullscreen Easter Egg Overlays -->
    <div id="bankai-overlay">
        <div>
            <div class="bankai-kanji">卍解</div>
            <div class="bankai-sub">Bankai Awakening &bull; Reiatsu Surging</div>
        </div>
    </div>

    <div id="getsuga-slash">
        <div class="slash-blade"></div>
    </div>

    <div id="seireitei-barrier"></div>

    <div id="love-banner">
        <span>❤️</span>
        <span>An eternal bond bridging Soul Reaper &amp; Quincy &mdash; Isshin &amp; Masaki</span>
    </div>

    <div id="hollow-banner">
        <span id="hollow-banner-text">HOLLOWFICATION AWAKENED</span>
    </div>

    <!-- Developer Credits Modal -->
    <div id="credits-modal">
        <div class="bounty-card">
            <div class="bounty-seal">Soul Society Intelligence &bull; Classified Dossier</div>
            <div class="bounty-title">Prashant</div>
            <div class="bounty-sub">Special War Potential &bull; System Architect</div>
            <div class="bounty-body">
                <div><strong>Zanpakuto:</strong> Code Releaser (Shikai: &ldquo;Decode&rdquo;)</div>
                <div style="margin-top:4px;"><strong>Reiatsu Class:</strong> Captain-Commander Level</div>
                <div style="margin-top:4px;"><strong>Mission:</strong> Reconstruct the entire Karakura &amp; TYBW spiritual network into an interactive intelligence database.</div>
                <div style="margin-top:4px;color:#888;font-size:10px;">Status: Active &bull; Observes the World of the Living from the Shadows</div>
            </div>
            <button class="bounty-close" id="credits-close">Close Dossier</button>
        </div>
    </div>

    <!-- Loader Screen -->
    <div id="loader" title="Click to skip">
        <div class="css-spinner"></div>
        <div class="loader-text">Loading Intelligence</div>
        <div class="loader-hint">Click anywhere to SKIP INTRO</div>
    </div>

    <div id="graph-container"></div>

    <!-- Tactical Cluster Navigation Bar -->
    <div id="cluster-bar">
        <button class="cluster-btn active" data-cluster="all">All Galaxy</button>
        <button class="cluster-btn" data-cluster="gotei">Gotei 13</button>
        <button class="cluster-btn" data-cluster="wandenreich">Wandenreich</button>
        <button class="cluster-btn" data-cluster="arrancar">Hueco Mundo</button>
        <button class="cluster-btn" data-cluster="royal">Royal Realm</button>
        <button class="cluster-btn" data-cluster="karakura">Karakura Town</button>
        <button class="cluster-btn" data-cluster="original">Original Gotei</button>
    </div>

    <!-- Floating Path Finding Banner -->
    <div id="path-banner">
        <span class="banner-text" id="path-banner-text">Select a target character to trace path from <strong>Ichigo</strong></span>
        <button id="path-cancel-btn">Cancel</button>
    </div>

    <!-- Sidebar -->
    <div id="sidebar">
        <div id="sidebar-bg"></div>
        <div id="sidebar-overlay"></div>
        <div class="scroll-fade"></div>
        <div id="sidebar-content">
            <button id="sidebar-close">&times;</button>
            <div id="sidebar-search" title="Search characters (Ctrl+K)" style="display:none;">&#x1F50D;</div>
            <div style="font-family:'Cinzel'; color:#D4AF37; font-size:10px; letter-spacing:4px; margin-bottom:15px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:6px; display: flex; justify-content: space-between;">
                <span>CLASSIFIED // INTEL</span>
                <span id="s-id-code">S-000</span>
            </div>

            <!-- Back Navigation Button -->
            <div class="back-nav" id="s-back-container" style="display:none;">
                <button class="back-btn" id="s-back-btn">
                    <span>&larr; Back to</span> <strong id="s-back-name"></strong>
                </button>
            </div>

            <!-- Character Profile Header -->
            <div class="char-header" style="margin-bottom: 15px;">
                <div class="avatar-ring">
                    <div class="char-avatar" id="s-avatar"></div>
                </div>
                <div class="char-title-block">
                    <div class="char-name" id="s-name" style="text-transform:uppercase; font-size: 18px;">Select Node</div>
                    <div class="char-meta" id="s-meta" style="color:#D4AF37; font-weight:600;">System Status</div>
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
                    <div id="s-intel-fields" style="font-size: 12px; margin-bottom: 20px; color: rgba(255,255,255,0.6); line-height: 1.6;">
                        <div style="margin-bottom: 8px;"><strong style="color:#888; display:inline-block; width:90px;">RACE</strong> <span id="s-field-race" style="color:#fff;"></span></div>
                        <div style="margin-bottom: 8px;"><strong style="color:#888; display:inline-block; width:90px;">AFFILIATION</strong> <span id="s-field-affil" style="color:#fff;"></span></div>
                        <div style="margin-bottom: 8px;"><strong style="color:#888; display:inline-block; width:90px;">FAMILY/CLAN</strong> <span id="s-field-family" style="color:#fff;"></span></div>
                        <div style="margin-bottom: 8px;"><strong style="color:#888; display:inline-block; width:90px;">REIATSU CLASS</strong> <span id="s-field-tier" style="color:#D4AF37; font-family:'Cinzel';"></span></div>
                    </div>
                    
                    <div class="char-desc" id="s-desc" style="font-size: 13px; font-style:italic;"></div>
                    
                    <div class="action-bar" id="s-action-bar" style="margin-top: 25px;">
                        <button class="action-btn" id="trace-path-btn" style="width:100%; justify-content:center;">
                            <span>&#x1F4CD;</span> TRACE CONNECTION
                        </button>
                    </div>
                </div>

                <!-- RELATIONS PANE -->
                <div id="pane-relations" class="tab-pane">
                    <div class="connections-section" id="conn-section" style="margin-top:0;">
                        <div class="section-title">
                            <span>KNOWN RELATIONSHIPS</span>
                            <span class="badge" id="conn-count">0</span>
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

            <!-- Initial placeholder description -->
            <div id="s-placeholder" style="font-size: 13px; font-style:italic; color:#888; margin-top:20px;">
                Click any character node in the spiritual network to inspect classified intelligence, examine family bloodlines, and trace tactical connections.
            </div>
        </div>
    </div>

    <!-- Tactical Minimap HUD (Bottom-Left) -->
    <div id="minimap-container">
        <div class="minimap-header">
            <span class="minimap-title">TACTICAL RADAR</span>
            <span class="minimap-stats" id="minimap-scale">1.00x</span>
        </div>
        <canvas id="minimap-canvas" width="172" height="110"></canvas>
        <div class="minimap-hint">Click / Drag to navigate</div>
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
        // Intro Skip Logic (Safe)
        const loader = document.getElementById('loader');
        try {{
            const skipIntro = localStorage.getItem('skipIntro');
            if (skipIntro === 'true') {{
                if (loader) loader.style.display = 'none';
            }} else {{
                setTimeout(() => {{
                    if (loader) loader.classList.add('fade-out');
                    try {{ localStorage.setItem('skipIntro', 'true'); }} catch(e) {{}}
                    setTimeout(() => {{ if (loader) loader.style.display = 'none'; }}, 800);
                }}, 1500); // 1.5 seconds max
            }}
        }} catch(e) {{
            // localStorage not available
            setTimeout(() => {{
                if (loader) loader.classList.add('fade-out');
                setTimeout(() => {{ if (loader) loader.style.display = 'none'; }}, 800);
            }}, 1500);
        }}

        const RAW_GRAPH = {graph_json};
        let gData = {{
            nodes: RAW_GRAPH.nodes.map(n => Object.assign({{}}, n)),
            links: RAW_GRAPH.links.map(l => Object.assign({{}}, l))
        }};

        // Pin Ichigo in the center on initial load
        const initIchigo = gData.nodes.find(n => n.id === 'ichigo');
        if (initIchigo) {{
            initIchigo.x = 0;
            initIchigo.y = 0;
            initIchigo.fx = 0;
            initIchigo.fy = 0;
        }}

        let hoverNode = null;
        let currentNode = null;
        let activeFactionFilter = null;
        const navHistory = [];

        // Web Audio Synthesizer (Zero dependencies)
        function playSfx(type) {{
            try {{
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume();

                if (type === 'slash') {{
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(600, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
                    gain.gain.setValueAtTime(0.4, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.35);
                }} else if (type === 'bankai') {{
                    const osc1 = ctx.createOscillator();
                    const gain1 = ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(140, ctx.currentTime);
                    osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.2);
                    gain1.gain.setValueAtTime(0.6, ctx.currentTime);
                    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                    osc1.connect(gain1);
                    gain1.connect(ctx.destination);
                    osc1.start();
                    osc1.stop(ctx.currentTime + 1.2);

                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                    osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.6);
                    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
                    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(ctx.currentTime + 0.1);
                    osc2.stop(ctx.currentTime + 1.0);
                }} else if (type === 'hollow') {{
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(90, ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);
                    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.6);
                    gain.gain.setValueAtTime(0.5, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.6);
                }} else if (type === 'hogyoku') {{
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.4);
                    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.8);
                    gain.gain.setValueAtTime(0.4, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.8);
                }}
            }} catch(e) {{}}
        }}

        // Relationship Categories mapping
        const REL_CATEGORIES = {{
            'Bloodline':   {{ name: 'Family',  color: '#F43F5E' }},
            'Parent':      {{ name: 'Family',  color: '#F43F5E' }},
            'Sibling':     {{ name: 'Family',  color: '#F43F5E' }},
            'Spouse':      {{ name: 'Family',  color: '#F43F5E' }},
            'Adopted':     {{ name: 'Family',  color: '#F43F5E' }},
            'Marriage':    {{ name: 'Family',  color: '#F43F5E' }},
            'Clan':        {{ name: 'Family',  color: '#F43F5E' }},
            'Enemy':       {{ name: 'Rival',   color: '#EF4444' }},
            'Enemies':     {{ name: 'Rival',   color: '#EF4444' }},
            'Rivals':      {{ name: 'Rival',   color: '#EF4444' }},
            'Rival':       {{ name: 'Rival',   color: '#EF4444' }},
            'Absorption':  {{ name: 'Rival',   color: '#A855F7' }},
            'Betrayal':    {{ name: 'Rival',   color: '#DC2626' }},
            'Friend':      {{ name: 'Social',  color: '#38BDF8' }},
            'Comrade':     {{ name: 'Social',  color: '#38BDF8' }},
            'Allies':      {{ name: 'Social',  color: '#38BDF8' }},
            'Bond':        {{ name: 'Social',  color: '#38BDF8' }},
            'Soul Bond':   {{ name: 'Social',  color: '#818CF8' }},
            'Mentor':      {{ name: 'Mentor',  color: '#34D399' }},
            'Mentorship':  {{ name: 'Mentor',  color: '#34D399' }},
            'Creator':     {{ name: 'Mentor',  color: '#34D399' }},
            'Captain':     {{ name: 'Faction', color: '#F59E0B' }},
            'Boss':        {{ name: 'Faction', color: '#F59E0B' }},
            'Command':     {{ name: 'Faction', color: '#F59E0B' }},
            'Fracci\u00f3n': {{ name: 'Faction', color: '#F59E0B' }},
            'Subordinate': {{ name: 'Faction', color: '#F59E0B' }},
            'Territory':   {{ name: 'Faction', color: '#9CA3AF' }}
        }};

        function getRelCategory(relType) {{
            return REL_CATEGORIES[relType] || {{ name: 'Other', color: '#9CA3AF' }};
        }}

        function escapeHtml(str) {{
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }}

        // Precompute adjacency map and connections from master intelligence database
        const neighbors = {{}};
        const nodeConnections = {{}};
        RAW_GRAPH.nodes.forEach(n => {{
            neighbors[n.id] = new Set();
            nodeConnections[n.id] = [];
        }});
        RAW_GRAPH.links.forEach(l => {{
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            neighbors[sid].add(tid);
            neighbors[tid].add(sid);
            nodeConnections[sid].push({{ id: tid, label: l.label, type: l.type }});
            nodeConnections[tid].push({{ id: sid, label: l.label, type: l.type }});
        }});

        // Node name lookup
        const nodeNameMap = {{}};
        RAW_GRAPH.nodes.forEach(n => {{ nodeNameMap[n.id] = n.name; }});

        // Character Sprite Sheet Architecture (Single HTTP Request)
        const SPRITE_MAP = {sprite_map_json};
        const SPRITE_META = {sprite_meta_json};
        const SPRITE_DATA_URI = "data:image/webp;base64,{sprite_webp_b64}";
        const SPRITE_SRC = 'Asset/sprites/characters.webp?v={sprite_version}';

        const spriteSheet = new Image();
        if (location.protocol !== 'file:') {{
            spriteSheet.crossOrigin = "anonymous";
        }}
        // Prefer relative path for GitHub Pages caching, with base64 data-URI fallback
        spriteSheet.src = SPRITE_SRC;
        spriteSheet.onerror = () => {{
            if (spriteSheet.src !== SPRITE_DATA_URI) {{
                spriteSheet.src = SPRITE_DATA_URI;
            }}
        }};
        spriteSheet.onload = () => {{
            if (typeof Graph !== 'undefined' && Graph.refresh) {{
                Graph.refresh();
            }}
            dismissLoader();
        }};

        // Instant & Smooth Reactive Loader Dismissal
        let loaderDismissed = false;
        function dismissLoader() {{
            if (loaderDismissed) return;
            loaderDismissed = true;
            const loader = document.getElementById('loader');
            if (loader && loader.style.display !== 'none') {{
                loader.classList.add('fade-out');
                setTimeout(() => {{ loader.style.display = 'none'; }}, 300);
            }}
        }}
        // Dismiss immediately once sprite cache or frame is available, with 350ms safety bound
        requestAnimationFrame(() => {{
            if (spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                dismissLoader();
            }} else {{
                setTimeout(dismissLoader, 350);
            }}
        }});
        document.getElementById('loader').addEventListener('click', dismissLoader);

        // Sidebar elements
        const sidebar = document.getElementById('sidebar');
        const sName = document.getElementById('s-name');
        const sMeta = document.getElementById('s-meta');
        const sDesc = document.getElementById('s-desc');
        const sConns = document.getElementById('s-connections');
        const connSection = document.getElementById('conn-section');
        const miniLegend = document.getElementById('mini-legend');
        const sActionBar = document.getElementById('s-action-bar');
        const sBackContainer = document.getElementById('s-back-container');
        const sBackName = document.getElementById('s-back-name');
        const sBackBtn = document.getElementById('s-back-btn');
        const tracePathBtn = document.getElementById('trace-path-btn');
        const pathBanner = document.getElementById('path-banner');
        const pathBannerText = document.getElementById('path-banner-text');
        const pathCancelBtn = document.getElementById('path-cancel-btn');

        function deselectNode() {{
            if (!currentNode && highlightedPathNodes.size === 0) return;
            currentNode = null;
            sidebar.classList.remove('open');
            miniLegend.classList.remove('hidden');
            if (pathFindingFrom || highlightedPathNodes.size > 0) {{
                clearPathFinding();
            }}
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }}

        document.getElementById('sidebar-close').addEventListener('click', () => {{
            deselectNode();
        }});

        document.getElementById('sidebar-search').addEventListener('click', () => {{
            openSearch();
        }});

        // Back button navigation
        sBackBtn.addEventListener('click', () => {{
            if (navHistory.length > 0) {{
                const prev = navHistory.pop();
                selectNode(prev, false);
            }}
        }});

        function updateBackNav() {{
            if (navHistory.length > 0) {{
                const prev = navHistory[navHistory.length - 1];
                sBackName.innerText = prev.name;
                sBackContainer.style.display = 'flex';
            }} else {{
                sBackContainer.style.display = 'none';
            }}
        }}

        // Dossier Tabs Logic
        document.querySelectorAll('.tab-btn').forEach(btn => {{
            btn.addEventListener('click', (e) => {{
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.target).classList.add('active');
            }});
        }});

        // Connection Filtering & Rendering
        let currentFilter = 'ALL';

        function renderConnections(node, filter = 'ALL') {{
            currentFilter = filter;
            const conns = nodeConnections[node.id] || [];
            const filterBar = document.getElementById('conn-filter-bar');
            const connCount = document.getElementById('conn-count');

            connCount.innerText = conns.length;

            if (conns.length === 0) {{
                filterBar.innerHTML = '';
                sConns.innerHTML = '<div style="font-size:11px;color:#666;padding:8px 0;">No recorded connections.</div>';
                return;
            }}

            // Count per category
            const catCounts = {{ 'ALL': conns.length }};
            conns.forEach(c => {{
                const cat = getRelCategory(c.type).name;
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            }});

            // Build filter chips
            const availableCats = Object.keys(catCounts);
            filterBar.innerHTML = availableCats.map(cat => {{
                const isActive = (cat === currentFilter) ? ' active' : '';
                return '<span class="conn-chip' + isActive + '" data-cat="' + cat + '">' + cat + ' (' + catCounts[cat] + ')</span>';
            }}).join('');

            // Filter connections
            const filtered = conns.filter(c => {{
                if (currentFilter === 'ALL') return true;
                return getRelCategory(c.type).name === currentFilter;
            }});

            // Render cards
            sConns.innerHTML = filtered.map(c => {{
                const targetNode = RAW_GRAPH.nodes.find(n => n.id === c.id);
                const targetName = targetNode ? targetNode.name : (nodeNameMap[c.id] || c.id);
                const cat = getRelCategory(c.type);
                const isDashed = (cat.name === 'Military' || cat.name === 'Organization') ? '- - - -' : (cat.name === 'Rival') ? '× × × ×' : (cat.name === 'Allies') ? '· · · ·' : '━━━━━━';
                return `<div class="conn-card" data-id="${{c.id}}" style="font-family:'Courier New', monospace; font-size:11px; margin-bottom:10px; cursor:pointer; padding:8px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.4); display:flex; flex-direction:column; transition: border 0.2s;" onmouseover="this.style.borderColor='${{cat.color}}'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:${{cat.color}};">
                        <span>[${{cat.name.toUpperCase()}}]</span>
                        <span>FILE: ${{escapeHtml(targetName).toUpperCase()}}</span>
                    </div>
                    <div style="color:rgba(255,255,255,0.7); display:flex; justify-content:space-between;">
                        <span>${{escapeHtml(c.label)}}</span>
                        <span style="letter-spacing:2px; opacity:0.5;">${{isDashed}}</span>
                    </div>
                </div>`;
            }}).join('');

            // Click chips to filter
            filterBar.querySelectorAll('.conn-chip').forEach(el => {{
                el.addEventListener('click', () => {{
                    renderConnections(node, el.dataset.cat);
                }});
            }});

            // Click cards to navigate
            sConns.querySelectorAll('.conn-card').forEach(el => {{
                el.addEventListener('click', () => {{
                    const targetId = el.dataset.id;
                    let target = gData.nodes.find(n => n.id === targetId);
                    if (!target) {{
                        jumpToCluster('all');
                        target = gData.nodes.find(n => n.id === targetId);
                    }}
                    if (target) {{
                        selectNode(target, true);
                    }}
                }});
            }});
        }}

        // Offscreen avatar generator for high-res frosted backgrounds & previews
        const charAvatarCache = {{}};
        function getCharacterAvatarUrl(nodeId, size = 256) {{
            if (charAvatarCache[nodeId]) return charAvatarCache[nodeId];
            const s = SPRITE_MAP[nodeId];
            if (!s || !spriteSheet.complete || spriteSheet.naturalWidth === 0) return null;
            try {{
                const offCanvas = document.createElement('canvas');
                offCanvas.width = size;
                offCanvas.height = size;
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

            if (sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0) {{
                sAvatar.innerText = '';
                sAvatar.style.backgroundImage = 'url(' + spriteSheet.src + ')';
                const avatarSize = 64;
                const scale = avatarSize / sSprite.w;
                sAvatar.style.backgroundSize = (SPRITE_META.sheetWidth * scale) + 'px ' + (SPRITE_META.sheetHeight * scale) + 'px';
                sAvatar.style.backgroundPosition = '-' + (sSprite.x * scale) + 'px -' + (sSprite.y * scale) + 'px';
                sAvatar.style.borderColor = node.color;
                sAvatar.style.boxShadow = '0 0 20px ' + node.color + '55';

                // High-resolution frosted glass background
                const avatarDataUrl = getCharacterAvatarUrl(node.id, 384);
                if (avatarDataUrl) {{
                    sidebarBg.style.backgroundImage = 'url(' + avatarDataUrl + ')';
                    sidebarBg.style.opacity = '0.38';
                }} else {{
                    sidebarBg.style.backgroundImage = 'radial-gradient(circle at 85% 15%, ' + node.color + '33, transparent 65%)';
                    sidebarBg.style.opacity = '1';
                }}
            }} else {{
                sAvatar.style.backgroundImage = 'none';
                sAvatar.style.backgroundColor = '#0F1318';
                sAvatar.style.borderColor = node.color;
                sAvatar.style.boxShadow = '0 0 16px ' + node.color + '44';
                sAvatar.innerText = node.initials || '??';
                sAvatar.style.color = node.color;

                sidebarBg.style.backgroundImage = 'radial-gradient(circle at 85% 15%, ' + node.color + '22, transparent 65%)';
                sidebarBg.style.opacity = '1';
            }}

            sName.innerText = node.name;
            sMeta.innerText = 'STATUS: ACTIVE'; // Or something thematic
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

        // Auto-fit & Camera Framing (solves off-screen nodes / cutoff issue)
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

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const screenShift = cardWidth / 2;
            const graphShiftX = screenShift / fitZoom;
            // On mobile, shift graph up slightly to account for bottom sheet
            const graphShiftY = isMobile ? -40 / fitZoom : 0;

            Graph.centerAt(centerX + graphShiftX, centerY + graphShiftY, 850);
            Graph.zoom(fitZoom, 850);
        }}

        function selectNode(node, pushHistory = true) {{
            if (!node) return;
            
            // Check Masaki & Isshin romance interaction
            if (currentNode) {{
                const isMasakiIsshin = (currentNode.id === 'isshin' && node.id === 'masaki') ||
                                       (currentNode.id === 'masaki' && node.id === 'isshin');
                if (isMasakiIsshin) {{
                    const loveBanner = document.getElementById('love-banner');
                    loveBanner.style.display = 'flex';
                    playSfx('bankai');
                    setTimeout(() => {{ loveBanner.style.display = 'none'; }}, 4000);
                }}
            }}

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

        // ── EASTER EGG STATES ──
        let isBankaiActive = false;
        let yhwachHoverTicks = 1.0;
        const nodeClickCounts = {{}};
        let rapidHollowNode = null;

        // Birthday check (July 15)
        const todayDate = new Date();
        const isIchigoBirthday = (todayDate.getMonth() === 6 && todayDate.getDate() === 15);

        // Midnight check (12:00 AM - 1:00 AM)
        if (todayDate.getHours() === 0) {{
            document.body.classList.add('midnight-mode');
        }}

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

            // Custom Canvas node rendering
            .nodeCanvasObject((node, ctx, globalScale) => {{
                // 1. Frustum / Viewport Culling with cached matrix transform
                if (node === gData.nodes[0] || !window.__cachedTransform) {{
                    window.__cachedTransform = ctx.getTransform();
                }}
                const transform = window.__cachedTransform;
                const dpr = window.devicePixelRatio || 1;
                // ctx.getTransform() returns physical canvas pixel coordinates (scaled by dpr).
                // Divide by dpr to convert to CSS pixels matching window.innerWidth / window.innerHeight.
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
                }}

                // Easter egg: Yhwach The Almighty growth
                let sizeMult = 1.0;
                if (node.id === 'yhwach') {{
                    if (isHovered) {{
                        yhwachHoverTicks = Math.min(yhwachHoverTicks + 0.03, 2.3);
                    }} else {{
                        yhwachHoverTicks = Math.max(1.0, yhwachHoverTicks - 0.04);
                    }}
                    sizeMult = yhwachHoverTicks;
                }}

                // Easter egg: Bankai pulse for Soul Reapers
                const isSoulReaper = (node.race === 'Soul Reaper' || node.race === 'Visored' || node.faction.includes('Soul Reaper'));
                const bankaiBoost = (isBankaiActive && isSoulReaper) ? 1.6 : 1.0;
                const isHollowGlitch = (rapidHollowNode === node.id);

                const size = node.val * sizeMult * bankaiBoost;

                // 2. Semantic Zoom & Level of Detail (LOD) for visual density
                const isTopPillar = node.is_top || ['ichigo', 'yhwach', 'yamamoto', 'aizen', 'soul_king', 'shunsui', 'kenpachi', 'urahara', 'byakuya', 'rukia', 'gin', 'ulquiorra', 'grimmjow', 'hitsugaya'].includes(node.id);

                let canRenderAvatar = false;
                if (globalScale >= 1.05) {{
                    canRenderAvatar = true;
                }} else if (globalScale >= 0.62) {{
                    canRenderAvatar = isTopPillar || isHovered || isSelected || isPathNode || isConnectedToHover || isConnectedToSelected;
                }} else {{
                    canRenderAvatar = isHovered || isSelected || (isTopPillar && globalScale >= 0.42);
                }}

                // Hierarchical node sizing: Supreme leaders are large, fodder nodes are small
                const tier = node.tier || 4;
                let baseRadius;
                if (tier === 1) {{
                    baseRadius = 26.0; // Aizen, Ichigo, Yhwach, Yamamoto, Soul King
                }} else if (tier === 2) {{
                    baseRadius = 18.0; // Gin, Tosen, Top Espada, Head Captains
                }} else if (tier === 3) {{
                    baseRadius = 13.5; // Other Espada, Captains, Schutzstaffel
                }} else if (tier === 4) {{
                    baseRadius = 9.5;  // Officers, Privaron Espada, Lieutenants
                }} else {{
                    baseRadius = 5.8;  // Fraccion, Fodder, Minor Hollows
                }}

                const stateMultiplier = isHovered ? 1.35 : (isSelected ? 1.2 : 1.0);
                const effectiveRadius = baseRadius * stateMultiplier * sizeMult * bankaiBoost;

                const sSprite = SPRITE_MAP[node.id];
                const hasAvatar = sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0;
                const imgSize = (hasAvatar && canRenderAvatar) ? effectiveRadius : (effectiveRadius * 0.85);

                // Sync floating hover card with screen position during animation/pan
                if (isHovered) {{
                    const hoverCard = document.getElementById('node-hover-card');
                    if (hoverCard && hoverCard.classList.contains('visible')) {{
                        hoverCard.style.left = screenX + 'px';
                        hoverCard.style.top = (screenY - 12) + 'px';
                    }}
                }}

                // Glow & Subtle Reiatsu
                if (!isDimmed) {{
                    ctx.beginPath();
                    let pulse = 1.0;
                    if (isSelected) {{
                        pulse = 1.0 + Math.sin(Date.now() / 250) * 0.12;
                    }}
                    const baseGlow = (hasAvatar && canRenderAvatar ? imgSize : effectiveRadius) * 1.8;
                    const finalGlow = isSelected ? (baseGlow * pulse * 1.3) : baseGlow;
                    
                    ctx.arc(node.x, node.y, finalGlow, 0, 2 * Math.PI);
                    
                    if (isHollowGlitch) {{
                        ctx.fillStyle = '#6B21A888';
                    }} else if (isBankaiActive && isSoulReaper) {{
                        ctx.fillStyle = '#4A9EFF66';
                    }} else if (node.id === 'yhwach' && sizeMult > 1.2) {{
                        ctx.fillStyle = '#DC262677';
                    }} else if (isSelected) {{
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
                    // 3. Circular Mask
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.clip();

                    // 5. Draw single sprite slice from sheet
                    ctx.drawImage(
                        spriteSheet,
                        sSprite.x, sSprite.y, sSprite.w, sSprite.h,
                        node.x - imgSize, node.y - imgSize, imgSize * 2, imgSize * 2
                    );

                    // 4. Subtle ambient tint for unhighlighted nodes (hardware accelerated, zero GPU filter stall)
                    if (!isHovered && !isSelected && !isPathNode && !isConnectedToHover && !isConnectedToSelected) {{
                        ctx.fillStyle = 'rgba(10, 10, 15, 0.18)';
                        ctx.fill();
                    }}
                    ctx.restore();

                    // 6. Colored ring border matching race/faction
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.lineWidth = (isHovered || isSelected || isPathNode || isHollowGlitch ? 2.5 : 1.5) / globalScale;
                    ctx.strokeStyle = isHollowGlitch ? '#6B21A8' : (isPathNode ? '#F59E0B' : (isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : node.color)));
                    ctx.stroke();
                }} else if (canRenderAvatar && !isDimmed && globalScale >= 1.15) {{
                    // 7. Graceful Initials Fallback for characters without image
                    const fallbackSize = Math.max(effectiveRadius, 7);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, fallbackSize, 0, 2 * Math.PI);
                    ctx.fillStyle = isHollowGlitch ? '#3B0764' : '#0F1318';
                    ctx.fill();

                    ctx.lineWidth = (isHovered || isSelected || isPathNode ? 2.0 : 1.0) / globalScale;
                    ctx.strokeStyle = isHollowGlitch ? '#C084FC' : (isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : node.color));
                    ctx.stroke();

                    const initials = node.initials || '??';
                    const initFontSize = Math.max(fallbackSize * 0.9, 7.5);
                    ctx.font = '600 ' + initFontSize + 'px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = (isHovered || isSelected) ? '#FFFFFF' : node.color;
                    ctx.fillText(initials, node.x, node.y + 0.5);
                }} else {{
                    // Minimalist colored glowing dot
                    const dotRadius = Math.max(effectiveRadius * 0.65, 2.8);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, dotRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = isDimmed ? (node.color + '18') : (isHollowGlitch ? '#6B21A8' : (isPathNode ? '#F59E0B' : (isBankaiActive && isSoulReaper ? '#4A9EFF' : node.color)));
                    ctx.fill();

                    if (!isDimmed) {{
                        ctx.lineWidth = (isHovered || isPathNode || isHollowGlitch ? 2.5 : 0.6) / globalScale;
                        ctx.strokeStyle = isHollowGlitch ? '#6B21A8' : (isPathNode ? '#F59E0B' : (isHovered ? '#fff' : '#000'));
                        ctx.stroke();
                    }}
                }}

                // Label with semantic density gating
                if (!node.__label) {{
                    node.__label = node.name.split(' ')[0].toUpperCase();
                }}
                const label = node.__label;
                const fontSize = Math.max(10 / globalScale, 2);
                const currentRadius = (canRenderAvatar && hasAvatar && !isDimmed) ? imgSize : ((canRenderAvatar && !isDimmed && globalScale >= 1.15) ? Math.max(effectiveRadius, 7) : Math.max(effectiveRadius * 0.65, 2.8));
                const labelY = node.y + currentRadius + 3;

                let shouldShowLabel = false;
                if (isHovered || isPathNode || isHollowGlitch) {{
                    shouldShowLabel = true;
                }} else if (globalScale >= 1.25) {{
                    shouldShowLabel = true;
                }} else if (globalScale >= 0.72 && (isTopPillar || isConnectedToHover || isConnectedToSelected)) {{
                    shouldShowLabel = true;
                }} else if (globalScale < 0.72 && isTopPillar && globalScale >= 0.42) {{
                    shouldShowLabel = true;
                }}

                if (!isDimmed && shouldShowLabel) {{
                    ctx.font = fontSize + 'px Cinzel';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = isHollowGlitch ? '#D8B4FE' : (isPathNode ? '#F59E0B' : (isHovered ? '#fff' : (isBankaiActive && isSoulReaper ? '#93C5FD' : 'rgba(255,255,255,0.7)')));
                    ctx.fillText(label, node.x, labelY);

                    // Birthday badge for Ichigo on July 15th
                    if (node.id === 'ichigo' && isIchigoBirthday) {{
                        ctx.font = (fontSize * 0.75) + 'px Inter';
                        ctx.fillStyle = '#F59E0B';
                        ctx.fillText('\\u2728 Birthday Boy!', node.x, labelY + fontSize + 2);
                    }}
                }}
            }})
            .onNodeHover(node => {{
                hoverNode = node || null;
                document.body.style.cursor = node ? 'pointer' : null;

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
                        const avatarSize = 76;
                        const scale = avatarSize / sSprite.w;
                        hoverAvatar.style.backgroundSize = (SPRITE_META.sheetWidth * scale) + 'px ' + (SPRITE_META.sheetHeight * scale) + 'px';
                        hoverAvatar.style.backgroundPosition = '-' + (sSprite.x * scale) + 'px -' + (sSprite.y * scale) + 'px';
                        hoverAvatar.style.borderColor = node.color;
                        hoverAvatar.style.boxShadow = '0 0 20px ' + node.color + '77';
                    }} else {{
                        hoverAvatar.style.backgroundImage = 'none';
                        hoverAvatar.style.backgroundColor = '#0F1318';
                        hoverAvatar.style.borderColor = node.color;
                        hoverAvatar.style.boxShadow = '0 0 16px ' + node.color + '44';
                        hoverAvatar.innerText = node.initials || '??';
                        hoverAvatar.style.color = node.color;
                    }}

                    hoverName.innerText = node.name;
                    hoverMeta.innerText = node.race + ' \u2022 ' + node.faction;
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
            .onLinkHover(() => {{}})
            .onNodeDragEnd(node => {{
                node.fx = node.x;
                node.fy = node.y;
            }})
            .onNodeClick(node => {{
                if (node) {{
                    // Clicking the currently selected node deselects it
                    if (currentNode && currentNode.id === node.id && !pathFindingFrom) {{
                        deselectNode();
                        return;
                    }}

                    // Rapid click detection for Hollowfication easter egg
                    const now = Date.now();
                    if (!nodeClickCounts[node.id] || (now - nodeClickCounts[node.id].lastTime > 2500)) {{
                        nodeClickCounts[node.id] = {{ count: 1, lastTime: now }};
                    }} else {{
                        nodeClickCounts[node.id].count++;
                        nodeClickCounts[node.id].lastTime = now;
                    }}

                    if (nodeClickCounts[node.id].count >= 8) {{
                        nodeClickCounts[node.id].count = 0;
                        triggerHollowfication(node);
                    }}

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

        // Physics optimization: cohesive clusters, generous spacing around Baraggan, no runaway nodes
        Graph.warmupTicks(35);
        Graph.cooldownTicks(95);
        Graph.d3Force('charge')
            .strength(-160)
            .distanceMax(480);
        Graph.d3Force('link')
            .distance(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                
                // Gin & Tosen flank Aizen closely in the inner sanctum
                if ((sid === 'aizen' && (tid === 'gin' || tid === 'tosen')) || (tid === 'aizen' && (sid === 'gin' || sid === 'tosen'))) {{
                    return 52;
                }}
                // Core 10 Espada ring around Aizen in mid ring (145px)
                const ESPADA_IDS = new Set(['starrk', 'baraggan', 'harribel', 'ulquiorra', 'nnoitra', 'grimmjow', 'zommari', 'szayelaporro', 'aaroniero', 'yammy']);
                if ((sid === 'aizen' && ESPADA_IDS.has(tid)) || (tid === 'aizen' && ESPADA_IDS.has(sid))) {{
                    return 145;
                }}
                // Outer subordinates, fodder, Privaron Espada, attendants, and creations connected to Aizen (245px)
                if (sid === 'aizen' || tid === 'aizen') {{
                    return 245;
                }}
                // Baraggan & Ikomikidomoe ancient rival spacing
                if ((sid === 'baraggan' && tid === 'ikomikidomoe') || (tid === 'baraggan' && sid === 'ikomikidomoe')) {{
                    return 130;
                }}
                // Baraggan & his 6 Fraccion (spread nicely without crowding)
                if (sid === 'baraggan' || tid === 'baraggan') {{
                    return 120;
                }}
                // Fraccion to their Espada (outer ring satellites)
                if (link.type === 'Fracci\u00f3n') return 115;
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

        // ── TACTICAL RADAR MINIMAP & CLUSTER NAVIGATION ──
        const minimapCanvas = document.getElementById('minimap-canvas');
        const mCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
        let isMinimapDragging = false;

        function renderMinimap() {{
            if (!mCtx || !Graph) return;
            const mw = minimapCanvas.width;
            const mh = minimapCanvas.height;

            mCtx.clearRect(0, 0, mw, mh);

            // Compute bounding box of all nodes
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            const nodes = gData.nodes;
            for (let i = 0; i < nodes.length; i++) {{
                const nx = nodes[i].x || 0;
                const ny = nodes[i].y || 0;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            }}

            const pad = 120;
            minX -= pad; maxX += pad;
            minY -= pad; maxY += pad;
            const rangeX = Math.max(maxX - minX, 1);
            const rangeY = Math.max(maxY - minY, 1);

            // Draw character constellation points
            for (let i = 0; i < nodes.length; i++) {{
                const n = nodes[i];
                const mx = (( (n.x || 0) - minX) / rangeX) * (mw - 14) + 7;
                const my = (( (n.y || 0) - minY) / rangeY) * (mh - 14) + 7;

                mCtx.beginPath();
                mCtx.arc(mx, my, n.is_top ? 2.2 : 1.2, 0, 2 * Math.PI);
                mCtx.fillStyle = n.color || '#4A9EFF';
                mCtx.fill();
            }}

            // Draw Viewport Frustum Box
            if (Graph.screen2GraphCoords) {{
                const tl = Graph.screen2GraphCoords(0, 0);
                const br = Graph.screen2GraphCoords(window.innerWidth, window.innerHeight);

                const vLeft = Math.max(0, Math.min(mw, ((tl.x - minX) / rangeX) * (mw - 14) + 7));
                const vTop = Math.max(0, Math.min(mh, ((tl.y - minY) / rangeY) * (mh - 14) + 7));
                const vRight = Math.max(0, Math.min(mw, ((br.x - minX) / rangeX) * (mw - 14) + 7));
                const vBottom = Math.max(0, Math.min(mh, ((br.y - minY) / rangeY) * (mh - 14) + 7));

                mCtx.fillStyle = 'rgba(212, 175, 55, 0.08)';
                mCtx.fillRect(vLeft, vTop, vRight - vLeft, vBottom - vTop);

                mCtx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
                mCtx.lineWidth = 1.2;
                mCtx.strokeRect(vLeft, vTop, vRight - vLeft, vBottom - vTop);
            }}

            const zoomScale = (Graph.zoom ? Graph.zoom() : 1.0);
            const scaleEl = document.getElementById('minimap-scale');
            if (scaleEl) scaleEl.innerText = zoomScale.toFixed(2) + 'x';
        }}

        function handleMinimapNav(e) {{
            if (!Graph || !minimapCanvas) return;
            const rect = minimapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            const nodes = gData.nodes;
            for (let i = 0; i < nodes.length; i++) {{
                const nx = nodes[i].x || 0;
                const ny = nodes[i].y || 0;
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
            }}
            const pad = 120;
            minX -= pad; maxX += pad;
            minY -= pad; maxY += pad;
            const rangeX = Math.max(maxX - minX, 1);
            const rangeY = Math.max(maxY - minY, 1);

            const targetGX = minX + ((clickX - 7) / (minimapCanvas.width - 14)) * rangeX;
            const targetGY = minY + ((clickY - 7) / (minimapCanvas.height - 14)) * rangeY;

            Graph.centerAt(targetGX, targetGY, 250);
        }}

        if (minimapCanvas) {{
            minimapCanvas.addEventListener('pointerdown', e => {{
                isMinimapDragging = true;
                handleMinimapNav(e);
            }});
            window.addEventListener('pointermove', e => {{
                if (isMinimapDragging) handleMinimapNav(e);
            }});
            window.addEventListener('pointerup', () => {{
                isMinimapDragging = false;
            }});
        }}

        // Performance optimization: Render minimap only when graph moves
        let minimapDirty = false;
        Graph.onEngineTick(() => {{ minimapDirty = true; }});
        Graph.onZoom(() => {{ minimapDirty = true; }});
        
        function checkMinimapDirty() {{
            if (minimapDirty && document.visibilityState === 'visible') {{
                renderMinimap();
                minimapDirty = false;
            }}
            requestAnimationFrame(checkMinimapDirty);
        }}
        requestAnimationFrame(checkMinimapDirty);

        // Global Visibility Pause
        document.addEventListener('visibilitychange', () => {{
            if (document.visibilityState === 'hidden') {{
                Graph.pauseAnimation();
            }} else {{
                Graph.resumeAnimation();
                minimapDirty = true;
            }}
        }});

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
            if (clusterType === 'all') {{
                return () => true;
            }}
            if (clusterType === 'gotei') {{
                return n => {{
                    const roster = ['yamamoto', 'sasakibe', 'soi_fon', 'omaeda', 'gin', 'kira', 'unohana', 'isane', 'aizen', 'momo', 'byakuya', 'renji', 'komamura', 'shunsui', 'nanao', 'tosen', 'hisagi', 'hitsugaya', 'rangiku', 'kenpachi', 'yachiru', 'mayuri', 'nemu', 'ukitake', 'rukia'];
                    return roster.includes(n.id);
                }};
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
                    // Hybrid allowed only if faction is Human World-linked (excludes Hikone Ubuginu / noble clans)
                    const isHybrid = n.race === 'Hybrid' && (isHumanWorldFac || n.id === 'ichigo');
                    return ['Human', 'Fullbringer', 'Mod Soul', 'Visored'].includes(n.race) ||
                        n.faction === 'Visored' ||
                        isHumanWorldFac || isHybrid ||
                        ['ichigo', 'urahara', 'yoruichi', 'tessai'].includes(n.id);
                }};
            }}
            if (clusterType === 'original') {{
                return n => n.faction === 'Original Gotei 13' || ['yamamoto', 'unohana'].includes(n.id);
            }}
            return () => true;
        }}

        let currentCluster = 'all';

        // Cluster & Faction Filtering with Center-Pinned Leaders
                // Responsive Framing: dynamically compute bounding box and framed camera
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
            // Visible safe areas (subtracting UI elements)
            // Desktop: top cluster bar (65px), bottom minimap/legend (140px on left, 50px general), right sidebar closed (40px) or open (380px)
            // Mobile: top mobile-nav (60px), bottom cluster bar (65px)
            const padTop = isMobile ? 65 : 75;
            const padBottom = isMobile ? 85 : 65;
            const padLeft = isMobile ? 25 : 45;
            const padRight = isMobile ? 25 : (sidebar && sidebar.classList.contains('open') ? 380 : 55);

            const availW = Math.max(window.innerWidth - padLeft - padRight, 200);
            const availH = Math.max(window.innerHeight - padTop - padBottom, 200);

            // Add node radius margin to the bounding box
            const margin = isMobile ? 40 : 50;
            const boxW = Math.max(maxX - minX + margin * 2, 100);
            const boxH = Math.max(maxY - minY + margin * 2, 100);

            const targetZoom = Math.min(availW / boxW, availH / boxH);
            const clampedZoom = Math.max(0.15, Math.min(targetZoom, isMobile ? 0.95 : 1.6));

            // Visual center of bounding box in graph coordinates
            const boxCenterX = (minX + maxX) / 2;
            const boxCenterY = (minY + maxY) / 2;

            // Shift camera center so the box sits exactly in the center of the available screen area
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

            // Dynamic Thematic Faction Backgrounds
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
                }} else {{
                    dynamicBg.style.opacity = '0';
                }}
            }}

            const filterFn = getFactionFilter(clusterType);
            const leaderId = FACTION_LEADERS[clusterType] || 'ichigo';

            // Filter nodes from master RAW_GRAPH
            const filteredNodes = RAW_GRAPH.nodes.filter(filterFn).map(n => {{
                const existing = gData.nodes.find(en => en.id === n.id);
                const clone = Object.assign({{}}, n);
                if (existing) {{
                    clone.x = existing.x;
                    clone.y = existing.y;
                    clone.vx = existing.vx;
                    clone.vy = existing.vy;
                }}
                delete clone.fx;
                delete clone.fy;
                return clone;
            }});

            const validNodeIds = new Set(filteredNodes.map(n => n.id));

            // Filter links to internal relationships only
            const filteredLinks = RAW_GRAPH.links.filter(l => {{
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return validNodeIds.has(sid) && validNodeIds.has(tid);
            }}).map(l => ({{
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target,
                type: l.type,
                label: l.label
            }}));

            if (clusterType === 'arrancar') {{
                // Pin Aizen at dead center
                const aizen = filteredNodes.find(n => n.id === 'aizen');
                if (aizen) {{
                    aizen.x = 0; aizen.y = 0;
                    aizen.fx = 0; aizen.fy = 0;
                }}

                // Pin Gin & Tosen flanking Aizen closely
                const gin = filteredNodes.find(n => n.id === 'gin');
                if (gin) {{
                    gin.x = -36; gin.y = -52;
                    gin.fx = -36; gin.fy = -52;
                }}
                const tosen = filteredNodes.find(n => n.id === 'tosen');
                if (tosen) {{
                    tosen.x = 36; tosen.y = -52;
                    tosen.fx = 36; tosen.fy = -52;
                }}

                // 10 Espada arranged in strict ANTICLOCKWISE rank order around Aizen
                // Order: 1: Starrk, 2: Baraggan, 3: Harribel, 4: Ulquiorra, 5: Nnoitra,
                //        6: Grimmjow, 7: Zommari, 8: Szayelaporro, 9: Aaroniero, 10: Yammy
                const ESPADA_ORDER = [
                    'starrk',       // 1 - 12:00 (top)
                    'baraggan',     // 2 - 10:48 (top-left)
                    'harribel',     // 3 - 09:36 (left)
                    'ulquiorra',    // 4 - 08:24 (bottom-left)
                    'nnoitra',      // 5 - 07:12 (bottom-left)
                    'grimmjow',     // 6 - 06:00 (bottom)
                    'zommari',      // 7 - 04:48 (bottom-right)
                    'szayelaporro', // 8 - 03:36 (right)
                    'aaroniero',    // 9 - 02:24 (top-right)
                    'yammy'         // 10 - 01:12 (top-right)
                ];

                const R_ESPADA = 145;
                const espCoords = {{}};
                ESPADA_ORDER.forEach((id, idx) => {{
                    // Screen coordinates (+x right, +y down):
                    // Top (12 o'clock) is -Math.PI / 2.
                    // Decreasing angle rotates anticlockwise: 12:00 -> 10:48 -> 9:36 -> ... -> 1:12.
                    const angle = -Math.PI / 2 - (idx * (2 * Math.PI / ESPADA_ORDER.length));
                    const ex = Math.round(Math.cos(angle) * R_ESPADA);
                    const ey = Math.round(Math.sin(angle) * R_ESPADA);
                    espCoords[id] = {{ x: ex, y: ey, angle: angle }};
                    const node = filteredNodes.find(n => n.id === id);
                    if (node) {{
                        node.x = ex;
                        node.y = ey;
                        node.fx = ex;
                        node.fy = ey;
                        node.vx = 0;
                        node.vy = 0;
                    }}
                }});

                // Seed outer / fodder / Fracción nodes outward along their Espada's radial sector
                // to cleanly establish the outer perimeter (radius 240-275px)
                const fracMasterMap = {{
                    'lilynette': 'starrk',
                    'charlotte': 'baraggan', 'findorr': 'baraggan', 'ggio': 'baraggan',
                    'poww': 'baraggan', 'abirama': 'baraggan', 'nirgge': 'baraggan', 'ikomikidomoe': 'baraggan',
                    'sunsun': 'harribel', 'milarose': 'harribel', 'apacci': 'harribel', 'ayon': 'harribel',
                    'tesla': 'nnoitra', 'nelliel': 'nnoitra', 'pesche': 'nnoitra', 'dondochakka': 'nnoitra', 'bawabawa': 'nnoitra',
                    'shawlong': 'grimmjow', 'edrad': 'grimmjow', 'yylfordt': 'grimmjow', 'diroy': 'grimmjow', 'nakim': 'grimmjow', 'luppi': 'grimmjow',
                    'lumina': 'szayelaporro', 'medazeppi': 'szayelaporro', 'roka_paramia': 'szayelaporro',
                    'kukkapuro': 'yammy',
                    'aldegor': 'ulquiorra'
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
            }} else if (clusterType === 'karakura') {{
                // ─────────────────────────────────────────────────────────────────
                // KARAKURA TOWN: 4-Sector Faction Layout
                // Ichigo at center, with 3 main leaders (Shinji, Urahara, Ginjo) 
                // in an inner triangle (radius ~120). Followers spread around them.
                // ─────────────────────────────────────────────────────────────────

                const VISORED_IDS      = ['shinji', 'hiyori', 'love', 'rose', 'kensei', 'mashiro', 'lisa', 'hachigen'];
                const URAHARA_SHOP_IDS = ['urahara', 'yoruichi', 'tessai', 'jinta', 'ururu'];
                const FULLBRINGER_IDS  = ['ginjo', 'tsukishima', 'riruka', 'yukio', 'jackie', 'moe', 'giriko', 'chad', 'aura_michibane'];

                // ─── CENTER: Ichigo ───────────────────────────────────────────
                const ichigo = filteredNodes.find(n => n.id === 'ichigo');
                if (ichigo) {{
                    ichigo.x = 0; ichigo.y = 0;
                    ichigo.fx = 0; ichigo.fy = 0;
                    ichigo.vx = 0; ichigo.vy = 0;
                }}

                // ─── SECTOR 1: Urahara Shop (West / -120, -60) ───────────────
                const urahara = filteredNodes.find(n => n.id === 'urahara');
                if (urahara) {{
                    urahara.x = -130; urahara.y = -60;
                    urahara.fx = -130; urahara.fy = -60;
                }}
                const shopNodes = filteredNodes.filter(n => URAHARA_SHOP_IDS.includes(n.id) && n.id !== 'urahara');
                shopNodes.forEach((node, i) => {{
                    const angle = Math.PI * 0.75 + (i * (Math.PI / Math.max(shopNodes.length, 1))); // fan outward left
                    node.x = -130 + Math.cos(angle) * 75;
                    node.y = -60 + Math.sin(angle) * 75;
                    node.vx = 0; node.vy = 0;
                }});

                // ─── SECTOR 2: Visored (East / 130, -60) ─────────────────────
                const shinji = filteredNodes.find(n => n.id === 'shinji');
                if (shinji) {{
                    shinji.x = 130; shinji.y = -60;
                    shinji.fx = 130; shinji.fy = -60;
                }}
                const visNodes = filteredNodes.filter(n => VISORED_IDS.includes(n.id) && n.id !== 'shinji');
                visNodes.forEach((node, i) => {{
                    const angle = -Math.PI * 0.25 + (i * (Math.PI / Math.max(visNodes.length, 1))); // fan outward right
                    node.x = 130 + Math.cos(angle) * 85;
                    node.y = -60 + Math.sin(angle) * 85;
                    node.vx = 0; node.vy = 0;
                }});

                // ─── SECTOR 3: Fullbringers (South / 0, 140) ──────────────────
                const ginjo = filteredNodes.find(n => n.id === 'ginjo');
                if (ginjo) {{
                    ginjo.x = 0; ginjo.y = 150;
                    ginjo.fx = 0; ginjo.fy = 150;
                }}
                const fbNodes = filteredNodes.filter(n => FULLBRINGER_IDS.includes(n.id) && n.id !== 'ginjo');
                fbNodes.forEach((node, i) => {{
                    const angle = Math.PI * 0.1 + (i * (Math.PI * 0.8 / Math.max(fbNodes.length, 1))); // fan downward
                    node.x = 0 + Math.cos(angle) * 90;
                    node.y = 150 + Math.sin(angle) * 90;
                    node.vx = 0; node.vy = 0;
                }});

                // ─── SECTOR 4: Human Beings (Outer Ring) ─────────────────────
                const PLACED_IDS = new Set(['ichigo', ...VISORED_IDS, ...URAHARA_SHOP_IDS, ...FULLBRINGER_IDS]);
                const humanNodes = filteredNodes.filter(n => !PLACED_IDS.has(n.id));
                const R_OUTER = 250;
                humanNodes.forEach((node, i) => {{
                    // Spread humans evenly around the far outer perimeter
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(humanNodes.length, 1)));
                    const jitter = (i % 2 === 0) ? 25 : -25; // Create 2 sub-rings for less crowding
                    node.x = Math.round(Math.cos(angle) * (R_OUTER + jitter));
                    node.y = Math.round(Math.sin(angle) * (R_OUTER + jitter));
                    node.vx = 0; node.vy = 0;
                }});

            }} else if (clusterType === 'gotei') {{
                // ─────────────────────────────────────────────────────────────────
                // MODERN GOTEI 13: Radial Branching Layout
                // Yamamoto at Center, 12 Captains in a perfect ring (R=200),
                // Lieutenants branching radially outward from their Captain (R=100).
                // ─────────────────────────────────────────────────────────────────
                
                // Pin Yamamoto at Center
                const yama = filteredNodes.find(n => n.id === 'yamamoto');
                if (yama) {{
                    yama.x = 0; yama.y = 0;
                    yama.fx = 0; yama.fy = 0;
                    yama.vx = 0; yama.vy = 0;
                }}
                
                const SQUADS = [
                    {{ cap: 'soi_fon',   subs: ['omaeda'] }},          // 2nd Div
                    {{ cap: 'gin',       subs: ['kira'] }},            // 3rd Div
                    {{ cap: 'unohana',   subs: ['isane'] }},           // 4th Div
                    {{ cap: 'aizen',     subs: ['momo'] }},            // 5th Div
                    {{ cap: 'byakuya',   subs: ['renji', 'rukia'] }},  // 6th Div
                    {{ cap: 'komamura',  subs: [] }},                  // 7th Div
                    {{ cap: 'shunsui',   subs: ['nanao'] }},           // 8th Div
                    {{ cap: 'tosen',     subs: ['hisagi'] }},          // 9th Div
                    {{ cap: 'hitsugaya', subs: ['rangiku'] }},         // 10th Div
                    {{ cap: 'kenpachi',  subs: ['yachiru'] }},         // 11th Div
                    {{ cap: 'mayuri',    subs: ['nemu'] }},            // 12th Div
                    {{ cap: 'ukitake',   subs: [] }}                   // 13th Div
                ];
                
                const R_CAPTAINS = 220;
                const R_SUBS = 100;
                
                let placedIds = new Set(['yamamoto', 'sasakibe']);
                
                // Sasakibe (1st Div Lt) branches off Yamamoto (upwards)
                const sasakibe = filteredNodes.find(n => n.id === 'sasakibe');
                if (sasakibe) {{
                    sasakibe.x = 0; sasakibe.y = -85;
                    sasakibe.fx = 0; sasakibe.fy = -85;
                    sasakibe.vx = 0; sasakibe.vy = 0;
                }}
                
                SQUADS.forEach((squad, i) => {{
                    const capNode = filteredNodes.find(n => n.id === squad.cap);
                    // Anticlockwise distribution: subtract angle instead of adding
                    const angle = -Math.PI / 2 - (i * (2 * Math.PI / SQUADS.length));
                    
                    if (capNode) {{
                        capNode.x = Math.round(Math.cos(angle) * R_CAPTAINS);
                        capNode.y = Math.round(Math.sin(angle) * R_CAPTAINS);
                        // Pinning Captains creates the perfect ring
                        capNode.fx = capNode.x;
                        capNode.fy = capNode.y;
                        capNode.vx = 0; capNode.vy = 0;
                        placedIds.add(capNode.id);
                        
                        // Seed subordinates radially outward from the captain
                        const subNodes = filteredNodes.filter(n => squad.subs.includes(n.id));
                        subNodes.forEach((subNode, j) => {{
                            // Spread subs in a small arc pointing outward
                            const subAngle = angle + (j - (subNodes.length - 1)/2) * 0.4;
                            subNode.x = capNode.x + Math.round(Math.cos(subAngle) * R_SUBS);
                            subNode.y = capNode.y + Math.round(Math.sin(subAngle) * R_SUBS);
                            // Strictly pin them to prevent force engine from pulling them to cross-linked characters!
                            subNode.fx = subNode.x;
                            subNode.fy = subNode.y;
                            subNode.vx = 0; subNode.vy = 0;
                            placedIds.add(subNode.id);
                        }});
                    }}
                }});
                
                // Other Gotei elements (like jidanbo, hachigen, tokinada, etc.)
                const otherNodes = filteredNodes.filter(n => !placedIds.has(n.id));
                const R_OUTER = 380;
                otherNodes.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(otherNodes.length, 1)));
                    node.x = Math.round(Math.cos(angle) * R_OUTER);
                    node.y = Math.round(Math.sin(angle) * R_OUTER);
                    node.vx = 0; node.vy = 0;
                }});

            }} else if (clusterType === 'wandenreich') {{
                // ─────────────────────────────────────────────────────────────────
                // WANDENREICH: Concentric Tiered Circular Rings
                // Yhwach at Center. Jugram/Uryu flanking. Elites in inner ring.
                // Standard Sternritter in middle ring. Fodder in outer ring.
                // ─────────────────────────────────────────────────────────────────
                const yhwach = filteredNodes.find(n => n.id === 'yhwach');
                if (yhwach) {{
                    yhwach.x = 0; yhwach.y = 0;
                    yhwach.fx = 0; yhwach.fy = 0;
                    yhwach.vx = 0; yhwach.vy = 0;
                }}
                
                // Ring 1: Jugram & Uryu (The Successor and Grandmaster)
                const rightHands = ['jugram', 'uryu'];
                rightHands.forEach((id, i) => {{
                    const node = filteredNodes.find(n => n.id === id);
                    if (node) {{
                        const angle = i === 0 ? Math.PI : 0; // Left and Right
                        node.x = Math.round(Math.cos(angle) * 120);
                        node.y = Math.round(Math.sin(angle) * 120);
                        node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                    }}
                }});

                // Ring 2: Schutzstaffel & Elites (Tier 2, excluding Yhwach and right hands)
                const elites = filteredNodes.filter(n => n.val === 11.5 && n.id !== 'yhwach' && !rightHands.includes(n.id));
                elites.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / elites.length));
                    node.x = Math.round(Math.cos(angle) * 260);
                    node.y = Math.round(Math.sin(angle) * 260);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});

                // Ring 3: Standard Sternritter (Tier 3)
                const standard = filteredNodes.filter(n => n.val === 8.5);
                standard.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / standard.length));
                    node.x = Math.round(Math.cos(angle) * 440);
                    node.y = Math.round(Math.sin(angle) * 440);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});

                // Ring 4: Fodder & Minor (Tier 5, value < 8.5)
                const minor = filteredNodes.filter(n => n.val < 8.5);
                minor.forEach((node, i) => {{
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(minor.length, 1)));
                    node.x = Math.round(Math.cos(angle) * 620);
                    node.y = Math.round(Math.sin(angle) * 620);
                    node.fx = node.x; node.fy = node.y; node.vx = 0; node.vy = 0;
                }});

            }} else if (clusterType === 'original') {{
                // ─────────────────────────────────────────────────────────────────
                // ORIGINAL GOTEI 13: Perfect Circle
                // Yamamoto at Center, 12 Captains in a perfect ring
                // ─────────────────────────────────────────────────────────────────
                
                // Pin Yamamoto at Center
                const yama = filteredNodes.find(n => n.id === 'yamamoto');
                if (yama) {{
                    yama.x = 0; yama.y = 0;
                    yama.fx = 0; yama.fy = 0;
                    yama.vx = 0; yama.vy = 0;
                }}
                
                const captains = filteredNodes.filter(n => n.id !== 'yamamoto');
                const R = 180; // Radius of the circle
                captains.forEach((node, i) => {{
                    // Start from 12 o'clock and go clockwise
                    const angle = -Math.PI / 2 + (i * (2 * Math.PI / Math.max(captains.length, 1)));
                    node.x = Math.round(Math.cos(angle) * R);
                    node.y = Math.round(Math.sin(angle) * R);
                    // Explicitly pinning them makes it a perfect circle
                    node.fx = node.x;
                    node.fy = node.y;
                    node.vx = 0; node.vy = 0;
                }});

            }} else {{
                // Pin designated faction leader at center (0, 0)
                const leader = filteredNodes.find(n => n.id === leaderId);
                if (leader) {{
                    leader.x = 0;
                    leader.y = 0;
                    leader.fx = 0;
                    leader.fy = 0;
                }}
            }}

            gData.nodes = filteredNodes;
            gData.links = filteredLinks;
            Graph.graphData({{ nodes: filteredNodes, links: filteredLinks }});

            Graph.d3ReheatSimulation();
            setTimeout(() => {{
                fitGraphToScreen(700);
            }}, 400);

            if (currentNode && !validNodeIds.has(currentNode.id)) {{
                sidebar.classList.remove('open');
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
                        f.style.border = 'none';
                        f.style.background = 'transparent';
                    }});
                    el.style.border = '1px solid rgba(255,255,255,0.4)';
                    el.style.background = 'rgba(255,255,255,0.1)';
                    el.style.borderRadius = '4px';
                }}
            }});
        }});

        // ── EASTER EGG TRIGGERS ──

        function triggerBankai() {{
            playSfx('bankai');
            const overlay = document.getElementById('bankai-overlay');
            overlay.classList.add('active');
            isBankaiActive = true;
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 400);
            setTimeout(() => {{
                overlay.classList.remove('active');
                isBankaiActive = false;
            }}, 6000);
        }}

        function triggerGetsuga() {{
            playSfx('slash');
            const slash = document.getElementById('getsuga-slash');
            slash.classList.add('active');
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 350);
            setTimeout(() => slash.classList.remove('active'), 800);
        }}

        function triggerHogyokuMode() {{
            playSfx('hogyoku');
            document.body.classList.add('hogyoku-mode');
            const originalColors = gData.nodes.map(n => n.color);
            const scrambleColors = ['#DC2626', '#4A9EFF', '#6B21A8', '#F59E0B', '#10B981', '#F472B6', '#D4AF37'];
            
            const interval = setInterval(() => {{
                gData.nodes.forEach(n => {{
                    n.color = scrambleColors[Math.floor(Math.random() * scrambleColors.length)];
                }});
            }}, 120);

            setTimeout(() => {{
                clearInterval(interval);
                gData.nodes.forEach((n, i) => {{ n.color = originalColors[i]; }});
                document.body.classList.remove('hogyoku-mode');
                playSfx('bankai');
            }}, 5000);
        }}

        function triggerHollowfication(node) {{
            playSfx('hollow');
            rapidHollowNode = node.id;
            const hollowBanner = document.getElementById('hollow-banner');
            document.getElementById('hollow-banner-text').innerText = 'HOLLOWFICATION AWAKENED - ' + node.name.toUpperCase();
            hollowBanner.style.display = 'block';
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 400);
            setTimeout(() => {{
                rapidHollowNode = null;
                hollowBanner.style.display = 'none';
            }}, 4000);
        }}

        // Developer Bounty Poster (Click brand 5x)
        let brandClickCount = 0;
        let lastBrandClick = 0;
        const brandEl = document.getElementById('brand-wordmark');
        if (brandEl) brandEl.addEventListener('click', () => {{
            const now = Date.now();
            if (now - lastBrandClick < 1500) {{
                brandClickCount++;
            }} else {{
                brandClickCount = 1;
            }}
            lastBrandClick = now;
            if (brandClickCount >= 5) {{
                brandClickCount = 0;
                playSfx('bankai');
                document.getElementById('credits-modal').classList.add('open');
            }}
        }});
        document.getElementById('credits-close').addEventListener('click', () => {{
            document.getElementById('credits-modal').classList.remove('open');
        }});

        // ── KEYBOARD SHORTCUTS & KONAMI CODE ──
        let keyBuffer = '';
        let konamiIdx = 0;
        const KONAMI_CODE = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];

        document.addEventListener('keydown', e => {{
            if (e.target && e.target.id === 'search-input') return;

            // Konami Code check
            if (e.key.toLowerCase() === KONAMI_CODE[konamiIdx]) {{
                konamiIdx++;
                if (konamiIdx === KONAMI_CODE.length) {{
                    konamiIdx = 0;
                    triggerHogyokuMode();
                }}
            }} else {{
                konamiIdx = 0;
            }}

            // Keystroke words
            if (e.key.length === 1 && /[a-zA-Z ]/.test(e.key)) {{
                keyBuffer += e.key.toLowerCase();
                if (keyBuffer.length > 30) keyBuffer = keyBuffer.slice(-30);

                if (keyBuffer.endsWith('bankai')) {{
                    keyBuffer = '';
                    triggerBankai();
                }} else if (keyBuffer.endsWith('getsuga') || keyBuffer.endsWith('getsugatensho')) {{
                    keyBuffer = '';
                    triggerGetsuga();
                }}
            }}

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
                document.getElementById('credits-modal').classList.remove('open');
            }}
        }});

        // ── Search (Ctrl+K) ──
        const mobileSearchBtn = document.getElementById('nav-search-btn');
        if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', openSearch);
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
            if (node.id === '__zangetsu') {{
                openSidebar({{
                    id: '__zangetsu',
                    name: 'Zangetsu (The Old Man & The Hollow)',
                    race: 'Quincy Heritage & Hollow Core',
                    faction: 'Zanpakuto Spirit',
                    desc: 'The manifestation of Ichigo\\'s spiritual power. The Old Man represents his Quincy lineage from Yhwach, while the White Hollow represents his true Shinigami and Hollow power. &ldquo;I am Zangetsu. What is the difference between a king and his horse? Instinct.&rdquo;',
                    img: ''
                }});
                return;
            }}
            if (node.id === '__soul_society') {{
                const barrier = document.getElementById('seireitei-barrier');
                barrier.style.display = 'block';
                playSfx('bankai');
                setTimeout(() => {{ barrier.style.display = 'none'; }}, 6000);
                Graph.zoom(0.85, 900);
                return;
            }}
            // If the target node is outside currently active cluster, switch to 'all'
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

            let matches = RAW_GRAPH.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 12);

            // Easter egg: Search "Zangetsu"
            if ('zangetsu'.includes(q) || q.includes('zangetsu')) {{
                matches.unshift({{
                    id: '__zangetsu',
                    name: 'Zangetsu (The Old Man & Hollow)',
                    faction: 'Zanpakuto Spirit',
                    color: '#D4AF37'
                }});
            }}

            // Easter egg: Search "Soul Society" or "Seireitei"
            if ('soul society'.includes(q) || 'seireitei'.includes(q)) {{
                matches.unshift({{
                    id: '__soul_society',
                    name: '\\u26E9\\uFE0F Seireitei (Soul Society Realm)',
                    faction: 'Soul Reaper Territory',
                    color: '#4A9EFF'
                }});
            }}

            if (matches.length === 0) {{
                activeIdx = -1;
                searchResults.innerHTML = '<div style="padding:16px 20px;font-size:12px;color:#888;text-align:center;line-height:1.6;">Even Ichigo can\\'t sense that reiatsu.<br><span style="font-size:10px;color:#555;">Try another name or faction.</span></div>';
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
                let matches = RAW_GRAPH.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 12);
                if ('zangetsu'.includes(q) || q.includes('zangetsu')) {{
                    matches.unshift({{ id: '__zangetsu', name: 'Zangetsu', faction: 'Zanpakuto Spirit', color: '#D4AF37' }});
                }}
                if ('soul society'.includes(q) || 'seireitei'.includes(q)) {{
                    matches.unshift({{ id: '__soul_society', name: 'Seireitei', faction: 'Soul Reaper Realm', color: '#4A9EFF' }});
                }}
                if (matches[activeIdx]) navigateToNode(matches[activeIdx]);
            }} else if (e.key === 'Escape') {{
                closeSearch();
            }}
        }});

        searchOverlay.addEventListener('click', e => {{
            if (e.target === searchOverlay) closeSearch();
        }});

        // URL hash sync on load
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

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Obsidian Canvas Database saved to: index.html")

generate_obsidian_graph()



