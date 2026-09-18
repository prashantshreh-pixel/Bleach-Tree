#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║  BLEACH INTELLIGENCE DATABASE                                    ║
║  Premium TYBW Edition — Interactive Network Explorer             ║
╚══════════════════════════════════════════════════════════════════╝
"""

import networkx as nx
import plotly.graph_objects as go
import json
import math
import os
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════
# TYBW PREMIUM THEME CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

BACKGROUND   = "#050508"
PAPER_BG     = "rgba(15, 15, 20, 0.85)"
TEXT_PRIMARY = "#F5F5F5"
TEXT_DIM     = "#9CA3AF"
EDGE_ACTIVE  = "#FFFFFF"
ACCENT_GOLD  = "#C9A227"

RACE_COLORS = {
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

RACE_SIZES = {
    "Human":       22,
    "Soul Reaper": 26,
    "Quincy":      24,
    "Hollow":      24,
    "Hybrid":      34,
    "Royal Guard": 30,
    "Noble":       28,
}

EDGE_STYLES = {
    "Parent":    {"dash": "solid", "width": 2.0, "category": "Family/Blood"},
    "Sibling":   {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Marriage":  {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Adopted":   {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Bloodline": {"dash": "solid", "width": 2.5, "category": "Family/Blood"},
    "Friend":    {"dash": "dash",  "width": 1.5, "category": "Social"},
    "Mentor":    {"dash": "dash",  "width": 1.8, "category": "Social"},
    "Clan":      {"dash": "dot",   "width": 1.5, "category": "Affiliation"},
    "Comrade":   {"dash": "dot",   "width": 1.5, "category": "Affiliation"},
    "Captain":   {"dash": "dot",   "width": 1.8, "category": "Affiliation"},
}

# ═══════════════════════════════════════════════════════════════════
# CHARACTER DATABASE
# ═══════════════════════════════════════════════════════════════════

def load_data():
    import sys
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    try:
        with open(os.path.join(data_dir, "characters.json"), "r", encoding="utf-8") as f:
            chars = json.load(f)
        with open(os.path.join(data_dir, "relationships.json"), "r", encoding="utf-8") as f:
            raw_rels = json.load(f)
    except FileNotFoundError as e:
        print(f"Error loading data: {e}. Please ensure data/characters.json and data/relationships.json exist.")
        sys.exit(1)
        
    # Basic Validation
    rels = []
    for i, r in enumerate(raw_rels):
        if r["source"] not in chars:
            print(f"Warning: Edge {i} source '{r['source']}' not found in characters.json. Skipping.")
            continue
        if r["target"] not in chars:
            print(f"Warning: Edge {i} target '{r['target']}' not found in characters.json. Skipping.")
            continue
        rels.append((r["source"], r["target"], r["type"], r["label"]))
        
    return chars, rels

CHARACTERS, RELATIONSHIPS = load_data()

def build_graph():
    G = nx.Graph()
    for cid, data in CHARACTERS.items(): G.add_node(cid, **data)
    for u, v, t, l in RELATIONSHIPS:
        if u in CHARACTERS and v in CHARACTERS: G.add_edge(u, v, rel_type=t, rel_label=l)
    return G

_FAMILY_CX = {"Kurosaki": -20.0, "Kuchiki": -7.0, "Shiba": 6.0, "Ishida": 18.0, "Quincy": 30.0, "Zero Division": -2.0}

def _hierarchical_layout(G):
    fam_nodes = defaultdict(lambda: defaultdict(list))
    for n in G.nodes(): fam_nodes[G.nodes[n].get("family", "Unknown")][G.nodes[n].get("generation", 1)].append(n)
    pos = {}
    for fam, gens in fam_nodes.items():
        cx = _FAMILY_CX.get(fam, 40.0)
        max_gen = max(gens.keys()) if gens else 0
        for gen, nodes in gens.items():
            for i, n in enumerate(nodes): pos[n] = (cx + (i - (len(nodes)-1)/2.0) * 4.0, (max_gen - gen) * 7.0)
    return pos

def _radial_layout(G):
    pos = nx.spring_layout(G, k=5.0, iterations=250, seed=42)
    return {k: (v[0]*25, v[1]*25) for k, v in pos.items()}

def _faction_layout(G):
    factions = defaultdict(list)
    for n in G.nodes(): factions[G.nodes[n].get("faction", "Unknown")].append(n)
    pos = {}
    for i, (fac, members) in enumerate(sorted(factions.items())):
        angle = 2 * math.pi * i / len(factions) - math.pi / 2
        cx, cy = 20.0 * math.cos(angle), 20.0 * math.sin(angle)
        for j, n in enumerate(members):
            a = 2 * math.pi * j / len(members) if len(members) > 1 else 0
            pos[n] = (cx + 4.5 * math.cos(a), cy + 4.5 * math.sin(a))
    return pos

def compute_all_layouts(G):
    return {"Family Tree": _hierarchical_layout(G), "Network": _radial_layout(G), "Faction": _faction_layout(G)}

def compute_analytics(G):
    return {"degree_centrality": nx.degree_centrality(G)}

def _bezier_curve(x0, y0, x1, y1, curvature=0.15, n_pts=20):
    mx, my, dx, dy = (x0+x1)/2, (y0+y1)/2, x1-x0, y1-y0
    length = math.sqrt(dx*dx + dy*dy) or 1
    cx, cy = mx + curvature * (-dy) / length * length, my + curvature * dx / length * length
    xs, ys = [], []
    for k in range(n_pts + 1):
        t = k / n_pts
        xs.append((1-t)**2 * x0 + 2*(1-t)*t * cx + t**2 * x1)
        ys.append((1-t)**2 * y0 + 2*(1-t)*t * cy + t**2 * y1)
    return xs, ys

def _hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def _blend_colors(c1, c2, alpha=0.5):
    r1, g1, b1 = _hex_to_rgb(c1)
    r2, g2, b2 = _hex_to_rgb(c2)
    return f"rgba({(r1+r2)//2}, {(g1+g2)//2}, {(b1+b2)//2}, {alpha})"

def pad_points(points, r=0.4):
    padded = []
    for x, y in points:
        padded.extend([(x-r, y-r), (x+r, y-r), (x-r, y+r), (x+r, y+r)])
    return padded

def convex_hull(points):
    points = sorted(list(set(points)))
    if len(points) <= 1: return points
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def _make_background_blobs(G, pos, layout_type):
    # Collect all possible unique keys across both 'family' and 'faction' to guarantee trace count matches!
    all_groups = set()
    for n in G.nodes():
        all_groups.add(G.nodes[n].get("family", "Unknown"))
        all_groups.add(G.nodes[n].get("faction", "Unknown"))
    
    # Sort them to guarantee stable trace order!
    all_groups = sorted(list(all_groups))
    
    traces = []
    key = "family" if layout_type == "Family Tree" else "faction"
    clusters = defaultdict(list)
    for n in G.nodes(): clusters[G.nodes[n].get(key, "Unknown")].append(n)
        
    for name in all_groups:
        nodes = clusters.get(name, [])
        if len(nodes) < 1:
            # Add dummy empty trace to maintain exact trace array alignment!
            traces.append(go.Scatter(x=[None], y=[None], mode="lines", hoverinfo="none", showlegend=False))
            continue
            
        races = [G.nodes[n].get("race", "Human") for n in nodes]
        color = RACE_COLORS.get(max(set(races), key=races.count), "#333333")
        
        pts = [(pos[n][0], pos[n][1]) for n in nodes]
        hull_pts = convex_hull(pad_points(pts, r=0.2))
        if not hull_pts:
            traces.append(go.Scatter(x=[None], y=[None], mode="lines", hoverinfo="none", showlegend=False))
            continue
            
        hull_pts.append(hull_pts[0])
        hx, hy = zip(*hull_pts)
        
        traces.append(go.Scatter(
            x=hx, y=hy, mode="lines",
            fill="toself", fillcolor=color.replace("rgb", "rgba").replace(")", ", 0.05)") if "rgb" in color else color,
            line=dict(color=color, width=1, dash="dot"),
            opacity=0.3, hoverinfo="none", showlegend=False
        ))
    return traces

def _make_edge_traces(G, pos):
    traces = []
    pair_count = defaultdict(int)
    # One trace per edge for individual color blending & hover highlight support
    for u, v, d in G.edges(data=True):
        rt = d.get("rel_type", "Friend")
        style = EDGE_STYLES.get(rt, EDGE_STYLES["Friend"])
        key = tuple(sorted([u, v]))
        pair_count[key] += 1
        bx, by = _bezier_curve(pos[u][0], pos[u][1], pos[v][0], pos[v][1], curvature=0.15 * pair_count[key])
        
        c1 = RACE_COLORS.get(G.nodes[u].get("race", "Human"), "#888")
        c2 = RACE_COLORS.get(G.nodes[v].get("race", "Human"), "#888")
        edge_color = _blend_colors(c1, c2, alpha=0.15)
        
        traces.append(go.Scatter(
            x=bx, y=by, mode="lines",
            line=dict(color=edge_color, width=style["width"], dash=style["dash"]),
            hoverinfo="none", showlegend=False, opacity=1.0,  # Opacity controlled by line color alpha
            meta={"type": "edge", "edge_type": rt, "u": u, "v": v, "base_color": edge_color, "base_width": style["width"]}
        ))
    return traces

def _make_node_traces(G, pos, analytics):
    traces = []
    deg_cent = analytics["degree_centrality"]
    xs, ys, sizes, colors, customdata, texts = [], [], [], [], [], []
    glow1_sizes, glow2_sizes = [], []
    
    top_nodes = set(sorted(deg_cent.keys(), key=lambda x: deg_cent[x], reverse=True)[:6])
    
    for n in G.nodes():
        race = G.nodes[n].get("race", "Human")
        size = RACE_SIZES.get(race, 20) + deg_cent.get(n, 0) * 35
        xs.append(pos[n][0]); ys.append(pos[n][1]); customdata.append(n)
        colors.append(RACE_COLORS.get(race, "#aaa"))
        sizes.append(size)
        glow1_sizes.append(size * 2.8)
        glow2_sizes.append(size * 1.6)
        texts.append(G.nodes[n].get("name", "").split(" ")[0].upper() if n in top_nodes else "")

    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers",
        marker=dict(size=glow1_sizes, color=colors, opacity=0.08, line=dict(width=0)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"type": "node", "layer": "glow1", "base_sizes": glow1_sizes}
    ))
    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers",
        marker=dict(size=glow2_sizes, color=colors, opacity=0.18, line=dict(width=0)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"type": "node", "layer": "glow2", "base_sizes": glow2_sizes}
    ))
    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers+text", text=texts, textposition="bottom center",
        textfont=dict(family="Cinzel", size=11, color="rgba(255,255,255,0.7)"),
        marker=dict(size=sizes, color=colors, opacity=1.0, line=dict(color="#000", width=1.5)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"type": "node", "layer": "core", "base_sizes": sizes}
    ))
    return traces

def build_figure(G, layouts, analytics):
    pos = layouts["Family Tree"]
    all_traces = _make_background_blobs(G, pos, "Family Tree") + _make_edge_traces(G, pos) + _make_node_traces(G, pos, analytics)
    fig = go.Figure(data=all_traces)

    fig.update_layout(
        template="plotly_dark", paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False, scaleanchor="x", scaleratio=1),
        hovermode="closest", dragmode="pan", margin=dict(l=0, r=0, t=0, b=0),
    )

    frames = []
    for lname, lpos in layouts.items():
        tr = _make_background_blobs(G, lpos, lname) + _make_edge_traces(G, lpos) + _make_node_traces(G, lpos, analytics)
        frames.append(go.Frame(data=tr, name=lname))
    fig.frames = frames

    fig.update_layout(
        updatemenus=[dict(
            type="dropdown", direction="down", showactive=True,
            x=0.01, xanchor="left", y=0.98, yanchor="top",
            bgcolor="#0A0A0F", bordercolor="#DC2626", font=dict(color="#DC2626", size=12, family="Cinzel"),
            buttons=[dict(args=[[lname], {"frame": {"duration": 800, "redraw": True}, "mode": "immediate"}], label=f"LAYOUT: {lname.upper()}", method="animate") for lname in layouts]
        )]
    )
    return fig

def generate_dashboard_html(G, fig):
    adj = {}
    for n in G.nodes():
        nbs = [{"id": nb, "name": G.nodes[nb]["name"], "rel_type": G.edges[n, nb].get("rel_type", ""), "rel_label": G.edges[n, nb].get("rel_label", ""), "race": G.nodes[nb].get("race", "Human")} for nb in G.neighbors(n)]
        adj[n] = {
            "name": G.nodes[n]["name"], "race": G.nodes[n].get("race", ""),
            "family": G.nodes[n].get("family", ""), "faction": G.nodes[n].get("faction", ""),
            "description": G.nodes[n].get("description", ""), "affiliations": G.nodes[n].get("affiliations", ""),
            "neighbors": nbs
        }
    
    fig_html = fig.to_html(full_html=False, include_plotlyjs=False, div_id="plotly-graph", config={"displayModeBar": False, "scrollZoom": True})

    import base64
    favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#000000"/>
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="#FFFFFF" stroke-width="4"/>
  <text x="50" y="46" font-family="'Inter', sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">BAN</text>
  <text x="50" y="80" font-family="'Inter', sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">KAI</text>
</svg>'''
    favicon_b64 = base64.b64encode(favicon_svg.encode('utf-8')).decode('utf-8')
    favicon_uri = f"data:image/svg+xml;base64,{favicon_b64}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>BLEACH — TYBW Intelligence</title>
<link rel="icon" type="image/svg+xml" href="{favicon_uri}">
<script src="https://cdn.plot.ly/plotly-2.35.0.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  background: radial-gradient(circle at center, #111118 0%, {BACKGROUND} 100%);
  color: {TEXT_PRIMARY}; font-family: 'Inter', sans-serif; overflow: hidden; height: 100vh;
}}
.particles {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }}
.particle {{ position: absolute; background: rgba(255,255,255,0.15); border-radius: 50%; animation: float 20s infinite linear; will-change: transform, opacity; }}
@keyframes float {{ 0% {{ transform: translateY(100vh) translateX(0); opacity: 0; }} 10% {{ opacity: 1; }} 90% {{ opacity: 1; }} 100% {{ transform: translateY(-100px) translateX(50px); opacity: 0; }} }}

.graph-container {{ position: absolute; width: 100%; height: 100%; z-index: 2; animation: fade-in 1.5s ease-out; }}
@keyframes fade-in {{ from {{ opacity: 0; transform: scale(0.95); }} to {{ opacity: 1; transform: scale(1); }} }}
#plotly-graph {{ width: 100%; height: 100%; }}

/* Pulse Animation Overlay */
#activePulse {{
  position: absolute; width: 80px; height: 80px; border-radius: 50%;
  border: 2px solid #fff; box-shadow: 0 0 15px #fff;
  transform: translate(-50%, -50%); pointer-events: none; z-index: 4;
  animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  display: none;
}}
@keyframes pulse-ring {{ 0% {{ width: 20px; height: 20px; opacity: 1; }} 100% {{ width: 100px; height: 100px; opacity: 0; }} }}

.overlay-panel {{
  position: absolute; top: 20px; bottom: 20px;
  background: {PAPER_BG}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  display: flex; flex-direction: column; z-index: 10;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}}
#leftPanel {{ left: 20px; width: 300px; transform: translateX(-120%); opacity: 0; }}
#rightPanel {{ right: 20px; width: 340px; transform: translateX(120%); opacity: 0; }}
.panel-header {{ padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }}
.panel-title {{ font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; letter-spacing: 3px; color: {TEXT_PRIMARY}; }}
.close-btn {{ cursor: pointer; color: {TEXT_DIM}; font-size: 20px; font-weight: 300; transition: color 0.2s; }}
.close-btn:hover {{ color: {TEXT_PRIMARY}; }}
.panel-content {{ padding: 20px; overflow-y: auto; flex: 1; }}

.search-box {{ width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; color: {TEXT_PRIMARY}; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; margin-bottom: 24px; transition: border-color 0.3s; }}
.search-box:focus {{ border-color: {ACCENT_GOLD}; box-shadow: 0 0 12px rgba(201, 162, 39, 0.2); }}

.profile-header {{ display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }}
.info-name {{ font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: {TEXT_PRIMARY}; letter-spacing: 1px; }}
.race-icon {{ width: 28px; height: 28px; filter: drop-shadow(0 0 5px currentColor); flex-shrink:0; }}
.info-race {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 20px; display: inline-block; }}
.info-label {{ font-family: 'Inter', sans-serif; font-size: 10px; color: {TEXT_DIM}; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 20px; margin-bottom: 6px; font-weight: 600; }}
.info-val {{ font-size: 13px; line-height: 1.6; font-weight: 300; color: rgba(255,255,255,0.85); }}

.conn-list {{ list-style: none; margin-top: 10px; }}
.conn-item {{ display: flex; align-items: center; padding: 8px 10px; margin-bottom: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: background 0.2s, border-color 0.2s; }}
.conn-item:hover, .conn-item.hovered {{ background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }}
.dot {{ width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }}
.rel-icon {{ width: 14px; height: 14px; margin-right: 6px; color: {TEXT_DIM}; }}

#customTooltip {{
  position: fixed; pointer-events: none; opacity: 0; z-index: 100;
  background: rgba(20, 15, 18, 0.92); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-radius: 6px; padding: 16px; min-width: 200px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.08);
  transition: opacity 0.2s;
  transform: translate(15px, -50%);
}}
.tt-name {{ font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; margin-bottom: 4px; }}
.tt-race {{ font-family: 'Inter', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight:600; }}

#loader {{ position: fixed; inset: 0; background: {BACKGROUND}; z-index: 999; display: flex; align-items: center; justify-content: center; color: {ACCENT_GOLD}; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 6px; animation: fade-out 2s forwards 0.5s; pointer-events: none; }}
@keyframes fade-out {{ to {{ opacity: 0; visibility: hidden; }} }}
</style>
</head>
<body>

<div id="loader">INITIALIZING DATABASE...</div>
<div class="particles" id="particles"></div>

<div class="graph-container">
  {fig_html}
  <div id="activePulse"></div>
  <div style="position:absolute; top:20px; right:20px; z-index:5;">
    <button onclick="togglePanel('leftPanel')" style="background:{PAPER_BG}; border:1px solid rgba(255,255,255,0.1); color:{TEXT_PRIMARY}; padding:8px 16px; border-radius:4px; cursor:pointer; font-family:'Inter', sans-serif; font-size:12px; font-weight:600; letter-spacing:1px; backdrop-filter:blur(5px);">☰ DATABASE</button>
    <button onclick="resetView()" style="background:{PAPER_BG}; border:1px solid rgba(255,255,255,0.1); color:{TEXT_PRIMARY}; padding:8px 16px; border-radius:4px; cursor:pointer; font-family:'Inter', sans-serif; font-size:12px; font-weight:600; letter-spacing:1px; margin-left:10px; backdrop-filter:blur(5px);">RESET VIEW</button>
  </div>
  
  <div id="hero-title" style="position:absolute; bottom:30px; right:30px; z-index:5; font-family:'Cinzel', serif; font-size:24px; font-weight:700; color:rgba(255,255,255,0.4); letter-spacing:4px; pointer-events:none; text-align:right;">
    BLEACH <span style="color:rgba(220,38,38,0.6)">TYBW</span><br><span style="font-size:14px; letter-spacing:8px; opacity:0.6;">INTELLIGENCE</span>
  </div>

  <div id="mini-legend" style="position:absolute; bottom:30px; left:30px; z-index:5; background:rgba(10,10,15,0.6); padding:12px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.05); backdrop-filter:blur(5px); font-family:'Inter', sans-serif; font-size:11px; color:rgba(255,255,255,0.7); display:flex; flex-direction:column; gap:8px;">
    <div style="font-family:'Cinzel', serif; letter-spacing:2px; font-weight:700; color:#fff; margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">FACTIONS</div>
    {"".join(f'<div style="display:flex; align-items:center;"><span style="width:10px; height:10px; border-radius:50%; background:{color}; display:inline-block; margin-right:8px; box-shadow:0 0 5px {color};"></span>{race}</div>' for race, color in RACE_COLORS.items())}
  </div>
</div>

<div id="leftPanel" class="overlay-panel">
  <div class="panel-header">
    <div class="panel-title">DATABASE</div>
    <div class="close-btn" onclick="togglePanel('leftPanel')">×</div>
  </div>
  <div class="panel-content">
    <input type="text" class="search-box" id="searchInput" placeholder="Search entity..." oninput="handleSearch(this.value)" />
    
    <div class="info-label">LEGEND</div>
    <div style="font-size:13px; line-height:2.2; margin-bottom:30px; font-weight:300;">
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Soul Reaper']}; background:{RACE_COLORS['Soul Reaper']}"></span> Soul Reaper</div>
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Quincy']}; background:{RACE_COLORS['Quincy']}"></span> Quincy</div>
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Hybrid']}; background:{RACE_COLORS['Hybrid']}"></span> Hybrid</div>
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Royal Guard']}; background:{RACE_COLORS['Royal Guard']}"></span> Royal Guard</div>
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Noble']}; background:{RACE_COLORS['Noble']}"></span> Noble</div>
      <div style="display:flex; align-items:center;"><span class="dot" style="color:{RACE_COLORS['Human']}; background:{RACE_COLORS['Human']}"></span> Human</div>
    </div>
    
    <div class="info-label">EDGE STYLES</div>
    <div style="font-size:12px; line-height:2.2; color:rgba(255,255,255,0.7); font-weight:300;">
      <div>━━━ Family & Blood</div>
      <div>- - - Social (Friend/Mentor)</div>
      <div>··· Affiliation (Clan/Squad)</div>
    </div>
  </div>
</div>

<div id="rightPanel" class="overlay-panel">
  <div class="panel-header">
    <div class="panel-title">PROFILE</div>
    <div class="close-btn" onclick="closeProfile()">×</div>
  </div>
  <div class="panel-content" id="profileContent"></div>
</div>

<div id="customTooltip"></div>

<script>
// Particles
const pContainer = document.getElementById('particles');
for(let i=0; i<15; i++) {{
  let p = document.createElement('div'); p.className = 'particle';
  p.style.width = Math.random()*3+1+'px'; p.style.height = p.style.width;
  p.style.left = Math.random()*100+'vw'; p.style.animationDuration = (Math.random()*15+15)+'s';
  p.style.animationDelay = (Math.random()*20)+'s'; pContainer.appendChild(p);
}}

// SVG Icons
const RACE_ICONS = {{
  "Soul Reaper": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><path d="M12 2L12 22M8 6L16 6M8 18L16 18"/></svg>`,
  "Quincy": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"/></svg>`,
  "Hollow": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><circle cx="12" cy="12" r="8"/><path d="M9 10L10 12M15 10L14 12"/></svg>`,
  "Hybrid": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12H4C4 7.58 7.58 4 12 4Z" fill="currentColor"/></svg>`,
  "Human": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><circle cx="12" cy="8" r="4"/><path d="M4 20C4 16 8 14 12 14C16 14 20 16 20 20"/></svg>`,
  "Noble": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><path d="M4 6L12 2L20 6L20 18L12 22L4 18Z"/></svg>`,
  "Royal Guard": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="race-icon"><path d="M12 2L15 8L22 9L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9L9 8Z"/></svg>`,
}};
const REL_ICONS = {{
  "Family": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rel-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  "Social": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rel-icon"><path d="M14.5 21a2.5 2.5 0 0 0 5 0V6.5a2.5 2.5 0 0 0-5 0V21z"></path><path d="M14.5 12h-5"></path><path d="M4.5 21a2.5 2.5 0 0 0 5 0V6.5a2.5 2.5 0 0 0-5 0V21z"></path></svg>`,
  "Affiliation": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rel-icon"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
}};
function getRelIcon(type) {{
  if(type === 'Parent' || type === 'Sibling' || type === 'Marriage' || type === 'Adopted' || type === 'Bloodline') return REL_ICONS.Family;
  if(type === 'Friend' || type === 'Mentor') return REL_ICONS.Social;
  return REL_ICONS.Affiliation;
}}

var GRAPH = {json.dumps(adj)};
var RACE_COLORS = {json.dumps(RACE_COLORS)};
var EDGE_ACTIVE = "{EDGE_ACTIVE}";

var graphDiv = document.getElementById('plotly-graph');
var rightPanel = document.getElementById('rightPanel');
var tooltip = document.getElementById('customTooltip');
var pulseDiv = document.getElementById('activePulse');

var activeNodeId = null;
var activeNodePos = null;

function togglePanel(id) {{
  var el = document.getElementById(id);
  var isClosed = (el.style.opacity === '0' || el.style.opacity === '');
  if (isClosed) {{
    el.style.opacity = '1'; el.style.transform = 'translateX(0)';
  }} else {{
    el.style.opacity = '0'; el.style.transform = id === 'leftPanel' ? 'translateX(-120%)' : 'translateX(120%)';
  }}
}}

function closeProfile() {{ 
  rightPanel.style.opacity = '0'; rightPanel.style.transform = 'translateX(120%)'; 
  activeNodeId = null; pulseDiv.style.display = 'none';
  resetView(); 
}}

function baseSizes(trace) {{ return trace.meta && trace.meta.base_sizes ? trace.meta.base_sizes : trace.customdata.map(x=>20); }}

function highlightState(idSet, highlightEdgesOf) {{
  var edgeUpdates = {{'line.color': [], 'opacity': [], 'line.width': []}};
  var edgeIndices = [];
  var nodeUpdates = {{'marker.size': [], 'marker.opacity': []}};
  var nodeIndices = [];

  for (var i = 0; i < graphDiv.data.length; i++) {{
    var trace = graphDiv.data[i];
    if (trace.meta && trace.meta.type === 'edge') {{
      var isActive = highlightEdgesOf && (trace.meta.u === highlightEdgesOf || trace.meta.v === highlightEdgesOf);
      edgeUpdates['opacity'].push(isActive ? 1.0 : (highlightEdgesOf ? 0.03 : 1.0));
      edgeUpdates['line.color'].push(isActive ? EDGE_ACTIVE : trace.meta.base_color);
      edgeUpdates['line.width'].push(isActive ? trace.meta.base_width * 1.5 : trace.meta.base_width);
      edgeIndices.push(i);
    }} else if (trace.meta && trace.meta.type === 'node') {{
      var base = baseSizes(trace);
      var layer = trace.meta.layer;
      var newSizes = trace.customdata.map((cid, j) => idSet.has(cid) ? (layer.includes('glow') ? base[j]*1.2 : base[j]) : 0);
      var newOps = trace.customdata.map(cid => idSet.has(cid) ? (layer==='glow1'?0.2 : layer==='glow2'?0.4 : 1.0) : 0);
      nodeUpdates['marker.size'].push(newSizes);
      nodeUpdates['marker.opacity'].push(newOps);
      nodeIndices.push(i);
    }}
  }}
  if(edgeIndices.length) Plotly.restyle(graphDiv, edgeUpdates, edgeIndices);
  if(nodeIndices.length) Plotly.restyle(graphDiv, nodeUpdates, nodeIndices);
}}

function resetView() {{
  var edgeUpdates = {{'line.color': [], 'opacity': [], 'line.width': []}};
  var edgeIndices = [];
  var nodeUpdates = {{'marker.size': [], 'marker.opacity': []}};
  var nodeIndices = [];

  for (var i = 0; i < graphDiv.data.length; i++) {{
    var trace = graphDiv.data[i];
    if (trace.meta && trace.meta.type === 'edge') {{
      edgeUpdates['opacity'].push(1.0); 
      edgeUpdates['line.color'].push(trace.meta.base_color);
      edgeUpdates['line.width'].push(trace.meta.base_width); 
      edgeIndices.push(i);
    }} else if (trace.meta && trace.meta.type === 'node') {{
      var base = baseSizes(trace);
      var layer = trace.meta.layer;
      nodeUpdates['marker.size'].push(base);
      nodeUpdates['marker.opacity'].push(base.map(x => layer==='glow1'?0.08 : layer==='glow2'?0.18 : 1.0));
      nodeIndices.push(i);
    }}
  }}
  if(edgeIndices.length) Plotly.restyle(graphDiv, edgeUpdates, edgeIndices);
  if(nodeIndices.length) Plotly.restyle(graphDiv, nodeUpdates, nodeIndices);
}}

function updatePulse() {{
  if(!activeNodeId || !activeNodePos) {{ pulseDiv.style.display = 'none'; return; }}
  var xaxis = graphDiv._fullLayout.xaxis;
  var yaxis = graphDiv._fullLayout.yaxis;
  if(xaxis && yaxis) {{
    pulseDiv.style.left = (xaxis.l2p(activeNodePos.x) + xaxis._offset) + 'px';
    pulseDiv.style.top = (yaxis.l2p(activeNodePos.y) + yaxis._offset) + 'px';
    pulseDiv.style.borderColor = RACE_COLORS[GRAPH[activeNodeId].race] || '#fff';
    pulseDiv.style.boxShadow = `0 0 20px ${{pulseDiv.style.borderColor}}`;
    pulseDiv.style.display = 'block';
  }}
}}
graphDiv.on('plotly_relayout', updatePulse);
graphDiv.on('plotly_afterplot', updatePulse);

graphDiv.on('plotly_hover', function(data) {{
  if(!data.points[0].customdata || (data.points[0].meta && data.points[0].meta.type === 'edge')) return;
  var id = data.points[0].customdata;
  if(!id || !GRAPH[id]) return;
  var d = GRAPH[id];
  var color = RACE_COLORS[d.race] || '#fff';
  
  tooltip.innerHTML = `
    <div style="border-left: 3px solid ${{color}}; padding-left: 10px;">
      <div class="tt-name" style="color: ${{color}}; text-shadow: 0 0 10px ${{color}}88;">${{d.name}}</div>
      <div class="tt-race" style="color: rgba(255,255,255,0.7);">${{d.race}}</div>
    </div>
  `;
  tooltip.style.left = (data.event.clientX) + 'px';
  tooltip.style.top = data.event.clientY + 'px';
  tooltip.style.opacity = '1';
  
  if (rightPanel.style.opacity !== '1') {{
    var ids = new Set([id]);
    d.neighbors.forEach(nb => ids.add(nb.id));
    highlightState(ids, id);
  }}
}});

graphDiv.on('plotly_unhover', function() {{
  tooltip.style.opacity = '0';
  if (rightPanel.style.opacity !== '1') resetView();
}});

function hoverLinkedNode(id) {{
  if(!id) return;
  var ids = new Set([activeNodeId, id]);
  highlightState(ids, activeNodeId);
}}
function unhoverLinkedNode() {{
  if(activeNodeId) {{
    var ids = new Set([activeNodeId]);
    GRAPH[activeNodeId].neighbors.forEach(nb => ids.add(nb.id));
    highlightState(ids, activeNodeId);
  }} else {{
    resetView();
  }}
}}

graphDiv.on('plotly_click', function(data) {{
  if(!data.points[0].customdata || (data.points[0].meta && data.points[0].meta.type === 'edge')) return;
  var id = data.points[0].customdata;
  if(!id || !GRAPH[id]) return;
  
  activeNodeId = id;
  activeNodePos = {{x: data.points[0].x, y: data.points[0].y}};
  Plotly.relayout(graphDiv, {{'xaxis.range': [activeNodePos.x-35, activeNodePos.x+35], 'yaxis.range': [activeNodePos.y-35, activeNodePos.y+35]}});

  var d = GRAPH[id];
  var ids = new Set([id]);
  var c = RACE_COLORS[d.race];
  var icon = RACE_ICONS[d.race] || RACE_ICONS['Human'];
  
  var html = `
    <div class="profile-header">
      <div style="color:${{c}}">${{icon}}</div>
      <div class="info-name" style="color:${{c}}; text-shadow: 0 0 15px ${{c}}55;">${{d.name}}</div>
    </div>
    <div class="info-race" style="color:${{c}}">${{d.race}}</div>
    <div class="info-val"><i>${{d.description}}</i></div>
    <div class="info-label">FACTION / AFFILIATION</div>
    <div class="info-val">${{d.faction}}<br>${{d.affiliations}}</div>
    <div class="info-label">CONNECTIONS</div>
    <ul class="conn-list">
  `;
  
  d.neighbors.forEach(nb => {{
    ids.add(nb.id);
    html += `
      <li class="conn-item" onmouseenter="hoverLinkedNode('${{nb.id}}')" onmouseleave="unhoverLinkedNode()" onclick="triggerNode('${{nb.id}}')">
        ${{getRelIcon(nb.rel_type)}}
        <span class="dot" style="color:${{RACE_COLORS[nb.race]}}; background:${{RACE_COLORS[nb.race]}}"></span>
        <div style="flex:1">
          <div style="color:{TEXT_PRIMARY}; font-size:12px; font-weight:600; font-family:'Cinzel', serif;">${{nb.name}}</div>
          <div style="color:rgba(255,255,255,0.6); font-size:10px;">${{nb.rel_label}}</div>
        </div>
      </li>
    `;
  }});
  html += '</ul>';
  
  document.getElementById('profileContent').innerHTML = html;
  rightPanel.style.opacity = '1';
  rightPanel.style.transform = 'translateX(0)';
  
  highlightState(ids, id);
  updatePulse();
}});

function triggerNode(id) {{
  var data = graphDiv.data;
  for(var i=0; i<data.length; i++) {{
    if(data[i].meta && data[i].meta.type === 'node') {{
      var idx = data[i].customdata.indexOf(id);
      if(idx > -1) {{
        graphDiv.emit('plotly_click', {{points: [{{customdata: id, x: data[i].x[idx], y: data[i].y[idx], mode: data[i].mode}}]}});
        return;
      }}
    }}
  }}
}}

function handleSearch(q) {{
  q = q.toLowerCase().trim();
  if(!q) {{ resetView(); return; }}
  var ids = new Set();
  Object.keys(GRAPH).forEach(k => {{
    if(GRAPH[k].name.toLowerCase().includes(q) || GRAPH[k].faction.toLowerCase().includes(q)) ids.add(k);
  }});
  highlightState(ids, null);
}}

  // Node Dragging Logic
  var dragInfo = null;
  graphDiv.addEventListener('mousedown', function(e) {{
      if (graphDiv._hoverdata && graphDiv._hoverdata.length > 0) {{
          let pt = graphDiv._hoverdata[0];
          if (pt.meta && pt.meta.type === 'node') {{
              dragInfo = {{ c: pt.curveNumber, p: pt.pointNumber }};
              Plotly.relayout(graphDiv, {{'dragmode': false}}); // Disable pan to allow drag
          }}
      }}
  }}, true);

  let isDragging = false;
  window.addEventListener('mousemove', function(e) {{
      if (dragInfo && graphDiv._fullLayout && !isDragging) {{
          isDragging = true;
          requestAnimationFrame(() => {{
              let xaxis = graphDiv._fullLayout.xaxis;
              let yaxis = graphDiv._fullLayout.yaxis;
              let b = graphDiv.getBoundingClientRect();
              let xPx = e.clientX - b.left - graphDiv._fullLayout.margin.l;
              let yPx = e.clientY - b.top - graphDiv._fullLayout.margin.t;
              
              let xData = xaxis.p2d(xPx);
              let yData = yaxis.p2d(yPx);
              
              let tracesToUpdate = [];
              let xArrays = [];
              let yArrays = [];
              for(let i=0; i<graphDiv.data.length; i++) {{
                 if(graphDiv.data[i].meta && graphDiv.data[i].meta.type === 'node') {{
                     graphDiv.data[i].x[dragInfo.p] = xData;
                     graphDiv.data[i].y[dragInfo.p] = yData;
                     tracesToUpdate.push(i);
                     xArrays.push(graphDiv.data[i].x);
                     yArrays.push(graphDiv.data[i].y);
                 }}
              }}
              Plotly.restyle(graphDiv, {{'x': xArrays, 'y': yArrays}}, tracesToUpdate);
              isDragging = false;
          }});
      }}
  }});

  window.addEventListener('mouseup', function(e) {{
      if (dragInfo) {{
          dragInfo = null;
          Plotly.relayout(graphDiv, {{'dragmode': 'pan'}}); // Restore pan
      }}
  }});

window.addEventListener('resize', () => Plotly.Plots.resize(graphDiv));
</script>
</body>
</html>"""
    return html

def main():
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    G = build_graph()
    layouts = compute_all_layouts(G)
    analytics = compute_analytics(G)
    fig = build_figure(G, layouts, analytics)
    html = generate_dashboard_html(G, fig)
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bleach_intelligence_database.html")
    with open(out, "w", encoding="utf-8") as f: f.write(html)
    print(f"Premium Dashboard saved to: {out}")

if __name__ == "__main__": main()
