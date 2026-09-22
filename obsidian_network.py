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
    
    with open(os.path.join(asset_dir, "Image", "ICHIGOAT.gif"), "rb") as f:
        loader_gif_b64 = base64.b64encode(f.read()).decode("ascii")

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
    top_nodes = set(sorted(deg_cent.keys(), key=lambda x: deg_cent[x], reverse=True)[:8])

    for char_id, data in chars.items():
        race = data.get("race", "Human")
        color = RACE_COLORS.get(race, "#9CA3AF")
        size = 3 + (deg_cent.get(char_id, 0) * 15)

        graph_data["nodes"].append({
            "id": char_id,
            "name": data.get("name", char_id),
            "race": race,
            "faction": data.get("faction", "Unknown"),
            "family": data.get("family", "Unknown"),
            "desc": data.get("description", ""),
            "color": color,
            "val": size,
            "is_top": char_id in top_nodes,
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
        f'<div style="display:flex;align-items:center;">'
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
    <title>BLEACH - TYBW Intelligence</title>
    <link rel="preconnect" href="https://unpkg.com" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <script src="https://unpkg.com/force-graph"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        * {{ box-sizing: border-box; }}
        body {{ margin: 0; padding: 0; background-color: #0A0A0F; color: white; font-family: 'Inter', sans-serif; overflow: hidden; }}
        #graph-container {{ width: 100vw; height: 100vh; position: absolute; z-index: 1; }}

        /* Loader */
        #loader {{
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #0A0A0F;
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.6s ease;
        }}
        #loader.fade-out {{ opacity: 0; pointer-events: none; }}
        #loader img {{ max-width: 200px; max-height: 200px; margin-bottom: 20px; }}
        #loader .loader-text {{ font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 6px; color: rgba(255,255,255,0.5); text-transform: uppercase; }}

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
    </style>
</head>
<body>
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
        <img src="data:image/gif;base64,{loader_gif_b64}" alt="Loading..." />
        <div class="loader-text">Loading Intelligence</div>
        <div class="loader-hint">Click anywhere to skip</div>
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
            <button id="sidebar-search" title="Search characters (Ctrl+T)">&#x1F50D;</button>
            <div class="brand" id="brand-wordmark" title="Click 5x for architect dossier">BLEACH <span>TYBW</span></div>
            <div class="sub">Intelligence Database</div>

            <!-- Back Navigation Button -->
            <div class="back-nav" id="s-back-container" style="display:none;">
                <button class="back-btn" id="s-back-btn">
                    <span>&larr; Back to</span> <strong id="s-back-name"></strong>
                </button>
            </div>

            <!-- Character Profile Header -->
            <div class="char-header">
                <div class="avatar-ring">
                    <div class="char-avatar" id="s-avatar"></div>
                </div>
                <div class="char-title-block">
                    <div class="char-name" id="s-name">Select Node</div>
                    <div class="char-meta" id="s-meta">Race &bull; Faction</div>
                </div>
            </div>

            <!-- Description -->
            <div class="char-desc" id="s-desc">
                Click any character node in the spiritual network to inspect classified intelligence, examine family bloodlines, and trace tactical connections.
            </div>

            <!-- Actions -->
            <div class="action-bar" id="s-action-bar" style="display:none;">
                <button class="action-btn" id="trace-path-btn">
                    <span>&#x1F4CD;</span> Trace Path
                </button>
            </div>

            <!-- Connections Section -->
            <div class="connections-section" id="conn-section" style="display:none;">
                <div class="section-title">
                    <span>CONNECTIONS</span>
                    <span class="badge" id="conn-count">0</span>
                </div>
                <!-- Filter bar -->
                <div class="conn-filter-bar" id="conn-filter-bar"></div>
                <div class="connections-list" id="s-connections"></div>
            </div>

            <!-- Faction Overview -->
            <div id="sidebar-factions" style="margin-top:auto; border-top:1px solid rgba(255,255,255,0.08); padding-top:15px;">
                <div class="section-title">FACTIONS</div>
                <div class="legend-grid">
                    {legend_items}
                </div>
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

    <!-- Search overlay (Ctrl+T) -->
    <div id="search-overlay">
        <div id="search-box">
            <input type="text" id="search-input" placeholder="Search characters... (Ctrl+T)" autocomplete="off" />
            <div id="search-results"></div>
            <div id="search-hint">ESC to close &middot; &uarr;&darr; to navigate &middot; ENTER to select</div>
        </div>
    </div>

    <script>
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

        document.getElementById('sidebar-close').addEventListener('click', () => {{
            sidebar.classList.remove('open');
            miniLegend.classList.remove('hidden');
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
                return '<div class="conn-card" style="border-left-color:' + cat.color + '" data-id="' + c.id + '" title="View ' + escapeHtml(targetName) + '">' +
                    '<div class="conn-card-info">' +
                        '<span class="conn-card-name">' + escapeHtml(targetName) + '</span>' +
                        '<span class="conn-card-label">' + escapeHtml(c.label) + '</span>' +
                    '</div>' +
                    '<span class="conn-card-badge" style="background:' + cat.color + '22;color:' + cat.color + ';border:1px solid ' + cat.color + '44">' + cat.name + '</span>' +
                '</div>';
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
            sMeta.innerText = node.race + ' \\u2022 ' + node.faction;
            sDesc.innerText = node.desc || 'No intelligence data available.';

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
            
            const cardWidth = 390;
            const availW = Math.max(screenW - cardWidth - 60, screenW * 0.5);
            const availH = Math.max(screenH - 120, 320);

            let fitZoom = Math.min(availW / boxW, availH / boxH);
            fitZoom = Math.max(0.65, Math.min(fitZoom, 1.8));

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const screenShift = cardWidth / 2;
            const graphShiftX = screenShift / fitZoom;

            Graph.centerAt(centerX + graphShiftX, centerY, 850);
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
                const pZoom = Math.min((window.innerWidth - 450) / Math.max(maxX - minX + 220, 250), (window.innerHeight - 150) / Math.max(maxY - minY + 220, 250));
                Graph.centerAt((minX + maxX) / 2 + 150 / pZoom, (minY + maxY) / 2, 850);
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
            .backgroundColor('#0A0A0F')

            // Link styling: clearly visible connections by default; highlighted on focus/hover/path
            .linkWidth(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                if (highlightedPathLinks.size > 0) {{
                    return highlightedPathLinks.has(sid + '--' + tid) ? 3.2 : 0.35;
                }}
                if (hoverNode) {{
                    return (sid === hoverNode.id || tid === hoverNode.id) ? 2.2 : 0.35;
                }}
                if (currentNode) {{
                    return (sid === currentNode.id || tid === currentNode.id) ? 2.0 : 0.35;
                }}
                const zoom = (typeof Graph !== 'undefined' && Graph.zoom) ? Graph.zoom() : 1.0;
                if (zoom < 0.6) return 0.95;
                if (zoom < 1.2) return 1.15;
                return 1.35;
            }})
            .linkColor(link => {{
                const sid = typeof link.source === 'object' ? link.source.id : link.source;
                const tid = typeof link.target === 'object' ? link.target.id : link.target;
                if (highlightedPathLinks.size > 0) {{
                    return highlightedPathLinks.has(sid + '--' + tid) ? '#F59E0B' : 'rgba(255,255,255,0.025)';
                }}
                if (hoverNode) {{
                    return (sid === hoverNode.id || tid === hoverNode.id) ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.025)';
                }}
                if (currentNode) {{
                    return (sid === currentNode.id || tid === currentNode.id) ? 'rgba(245,158,11,0.90)' : 'rgba(255,255,255,0.025)';
                }}
                // Crisp, visible connection lines by default when nothing is selected
                const zoom = (typeof Graph !== 'undefined' && Graph.zoom) ? Graph.zoom() : 1.0;
                if (zoom < 0.6) {{
                    return 'rgba(255,255,255,0.18)';
                }} else if (zoom < 1.2) {{
                    return 'rgba(255,255,255,0.22)';
                }}
                return 'rgba(255,255,255,0.26)';
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
                const screenX = node.x * transform.a + transform.e;
                const screenY = node.y * transform.d + transform.f;
                const margin = 80;
                if (screenX < -margin || screenX > window.innerWidth + margin || screenY < -margin || screenY > window.innerHeight + margin) {{
                    return;
                }}

                const isHovered = node === hoverNode;
                const isSelected = (currentNode && currentNode.id === node.id);
                const isPathNode = highlightedPathNodes.has(node.id);
                const isConnectedToHover = hoverNode && neighbors[hoverNode.id] && neighbors[hoverNode.id].has(node.id);
                const isConnectedToSelected = currentNode && neighbors[currentNode.id] && neighbors[currentNode.id].has(node.id);

                let isDimmed = false;
                if (highlightedPathNodes.size > 0) {{
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

                const sSprite = SPRITE_MAP[node.id];
                const hasAvatar = sSprite && spriteSheet.complete && spriteSheet.naturalWidth > 0;
                const imgSize = hasAvatar ? (isHovered ? Math.max(size * 2.8, 22) : (isSelected ? Math.max(size * 2.4, 16) : Math.max(size * 2.0, 13))) : size;

                // Sync floating hover card with screen position during animation/pan
                if (isHovered) {{
                    const hoverCard = document.getElementById('node-hover-card');
                    if (hoverCard && hoverCard.classList.contains('visible')) {{
                        hoverCard.style.left = screenX + 'px';
                        hoverCard.style.top = (screenY - 12) + 'px';
                    }}
                }}

                // Glow
                if (!isDimmed) {{
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, (hasAvatar && canRenderAvatar ? imgSize : size) * 1.8, 0, 2 * Math.PI);
                    if (isHollowGlitch) {{
                        ctx.fillStyle = '#6B21A888';
                    }} else if (isBankaiActive && isSoulReaper) {{
                        ctx.fillStyle = '#4A9EFF66';
                    }} else if (node.id === 'yhwach' && sizeMult > 1.2) {{
                        ctx.fillStyle = '#DC262677';
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
                    const fallbackSize = Math.max(size * 1.5, 11);
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
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
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
                const currentRadius = (canRenderAvatar && hasAvatar && !isDimmed) ? imgSize : ((canRenderAvatar && !isDimmed && globalScale >= 1.15) ? Math.max(size * 1.5, 11) : size);
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
            }});

        // Physics optimization for 190+ nodes
        Graph.warmupTicks(35);
        Graph.cooldownTicks(95);
        Graph.d3Force('charge')
            .strength(-220)
            .distanceMax(650);
        Graph.d3Force('link')
            .distance(link => {{
                if (link.type === 'Fracci\u00f3n' || link.type === 'Soul Bond' || link.type === 'Parent') return 45;
                return 68;
            }});
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

        // Render minimap periodically and upon engine updates
        setInterval(renderMinimap, 120);

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
                    const isSR = n.race === 'Soul Reaper' || n.race === 'Visored' || n.race === 'Noble';
                    const fac = n.faction || '';
                    const isGoteiFac = fac.includes('Gotei') || fac.includes('Division') || fac.includes('Kuchiki') || fac.includes('Shiba') || fac.includes('Tsunayashiro') || fac.includes('Seireitei') || fac.includes('Visored');
                    return (isSR || isGoteiFac) &&
                        fac !== 'Original Gotei 13' &&
                        fac !== 'Soul King Palace' &&
                        n.race !== 'Royal Guard' &&
                        fac !== 'Urahara Shop' &&
                        fac !== 'Human World' &&
                        !['aizen', 'gin', 'tosen'].includes(n.id);
                }};
            }}
            if (clusterType === 'wandenreich') {{
                return n => n.faction === 'Wandenreich' || n.faction === 'Quincy' || n.race === 'Quincy';
            }}
            if (clusterType === 'arrancar') {{
                return n => {{
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
                    return ['Human', 'Fullbringer', 'Mod Soul', 'Hybrid'].includes(n.race) ||
                        fac.includes('Karakura') || fac.toUpperCase().includes('XCUTION') ||
                        fac === 'Urahara Shop' || fac === 'Human World' || fac === 'Substitute Soul Reaper' ||
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
        function jumpToCluster(clusterType) {{
            currentCluster = clusterType;
            document.querySelectorAll('.cluster-btn').forEach(btn => {{
                btn.classList.toggle('active', btn.dataset.cluster === clusterType);
            }});

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

            // Pin designated faction leader at center (0, 0)
            const leader = filteredNodes.find(n => n.id === leaderId);
            if (leader) {{
                leader.x = 0;
                leader.y = 0;
                leader.fx = 0;
                leader.fy = 0;
            }}

            gData.nodes = filteredNodes;
            gData.links = filteredLinks;
            Graph.graphData({{ nodes: filteredNodes, links: filteredLinks }});

            Graph.d3ReheatSimulation();
            Graph.centerAt(0, 0, 500);
            setTimeout(() => {{
                Graph.zoomToFit(600, 70);
            }}, 300);

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
        document.getElementById('brand-wordmark').addEventListener('click', () => {{
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

            if ((e.ctrlKey || e.metaKey) && e.key === 't') {{
                e.preventDefault();
                if (searchOverlay.classList.contains('open')) {{
                    closeSearch();
                }} else {{
                    openSearch();
                }}
            }}
            if (e.key === 'Escape') {{
                if (searchOverlay.classList.contains('open')) closeSearch();
                if (pathFindingFrom || highlightedPathNodes.size > 0) clearPathFinding();
                document.getElementById('credits-modal').classList.remove('open');
            }}
        }});

        // ── Search (Ctrl+T) ──
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

    with open("bleach_intelligence_database.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Obsidian Canvas Database saved to: bleach_intelligence_database.html")

generate_obsidian_graph()
