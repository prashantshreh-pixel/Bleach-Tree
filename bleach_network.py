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
import random

# ═══════════════════════════════════════════════════════════════════
# TYBW PREMIUM THEME CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

BACKGROUND   = "#050508"
PAPER_BG     = "rgba(15, 15, 20, 0.85)"
TEXT_PRIMARY = "#F5F5F5"
TEXT_DIM     = "#9CA3AF"
EDGE_DEFAULT = "#4A4A5A"
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
}

RACE_SIZES = {
    "Human":       20,
    "Soul Reaper": 24,
    "Quincy":      22,
    "Hollow":      22,
    "Hybrid":      32,
    "Royal Guard": 28,
    "Noble":       26,
}

EDGE_STYLES = {
    "Parent":    {"dash": "solid", "width": 2.0, "category": "Family/Blood"},
    "Sibling":   {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Marriage":  {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Adopted":   {"dash": "solid", "width": 1.5, "category": "Family/Blood"},
    "Bloodline": {"dash": "solid", "width": 2.5, "category": "Family/Blood"},
    "Friend":    {"dash": "dash",  "width": 1.2, "category": "Social"},
    "Mentor":    {"dash": "dash",  "width": 1.5, "category": "Social"},
    "Clan":      {"dash": "dot",   "width": 1.2, "category": "Affiliation"},
    "Comrade":   {"dash": "dot",   "width": 1.2, "category": "Affiliation"},
    "Captain":   {"dash": "dot",   "width": 1.5, "category": "Affiliation"},
}

# ═══════════════════════════════════════════════════════════════════
# CHARACTER DATABASE
# ═══════════════════════════════════════════════════════════════════

CHARACTERS = {
    "ichigo": {"name": "Ichigo Kurosaki", "race": "Hybrid", "family": "Kurosaki", "faction": "Gotei 13", "squad": "Substitute Soul Reaper", "status": "Alive", "description": "Substitute Soul Reaper with Shinigami, Quincy, Hollow, and Fullbring powers.", "affiliations": "Kurosaki Family · Shiba Clan · Gotei 13", "generation": 2},
    "isshin": {"name": "Isshin Kurosaki", "race": "Soul Reaper", "family": "Kurosaki", "faction": "Gotei 13", "squad": "Former Captain — Squad 10", "status": "Alive", "description": "Former Captain of Squad 10 and former head of the Shiba Clan.", "affiliations": "Kurosaki Family · Shiba Clan", "generation": 1},
    "masaki": {"name": "Masaki Kurosaki", "race": "Quincy", "family": "Kurosaki", "faction": "Quincy", "squad": "—", "status": "Deceased", "description": "Last of the Kurosaki pure-blood Quincy line. Mother of Ichigo, Karin, and Yuzu.", "affiliations": "Kurosaki Family · Quincy", "generation": 1},
    "karin": {"name": "Karin Kurosaki", "race": "Human", "family": "Kurosaki", "faction": "Human World", "squad": "—", "status": "Alive", "description": "Ichigo's younger sister. Possesses latent spiritual awareness.", "affiliations": "Kurosaki Family", "generation": 2},
    "yuzu": {"name": "Yuzu Kurosaki", "race": "Human", "family": "Kurosaki", "faction": "Human World", "squad": "—", "status": "Alive", "description": "Ichigo's youngest sister. Kind and domestic.", "affiliations": "Kurosaki Family", "generation": 2},
    "kaien": {"name": "Kaien Shiba", "race": "Soul Reaper", "family": "Shiba", "faction": "Gotei 13", "squad": "Former Lieutenant — Squad 13", "status": "Deceased", "description": "Former Lieutenant of Squad 13. Mentor to Rukia Kuchiki.", "affiliations": "Shiba Clan · Gotei 13", "generation": 2},
    "kukaku": {"name": "Kukaku Shiba", "race": "Soul Reaper", "family": "Shiba", "faction": "Shiba Clan", "squad": "—", "status": "Alive", "description": "Self-proclaimed fireworks master of the Shiba Clan.", "affiliations": "Shiba Clan", "generation": 2},
    "ganju": {"name": "Ganju Shiba", "race": "Soul Reaper", "family": "Shiba", "faction": "Shiba Clan", "squad": "—", "status": "Alive", "description": "Youngest Shiba sibling. Skilled in earth-based kidō.", "affiliations": "Shiba Clan", "generation": 2},
    "byakuya": {"name": "Byakuya Kuchiki", "race": "Noble", "family": "Kuchiki", "faction": "Gotei 13", "squad": "Captain — Squad 6", "status": "Alive", "description": "28th Head of the Kuchiki Clan and Captain of Squad 6.", "affiliations": "Kuchiki Clan · Gotei 13", "generation": 1},
    "rukia": {"name": "Rukia Kuchiki", "race": "Noble", "family": "Kuchiki", "faction": "Gotei 13", "squad": "Captain — Squad 13", "status": "Alive", "description": "Adopted into the Kuchiki Clan. Captain of Squad 13.", "affiliations": "Kuchiki Clan · Gotei 13", "generation": 2},
    "hisana": {"name": "Hisana Kuchiki", "race": "Soul Reaper", "family": "Kuchiki", "faction": "Kuchiki Clan", "squad": "—", "status": "Deceased", "description": "Byakuya's late wife and Rukia's biological elder sister.", "affiliations": "Kuchiki Clan", "generation": 1},
    "ichibei": {"name": "Ichibē Hyōsube", "race": "Royal Guard", "family": "Zero Division", "faction": "Royal Guard", "squad": "Zero Division — Leader", "status": "Alive", "description": "Monk Who Calls the Real Name. Leader of the Zero Division.", "affiliations": "Royal Guard", "generation": 0},
    "senjumaru": {"name": "Senjumaru Shutara", "race": "Royal Guard", "family": "Zero Division", "faction": "Royal Guard", "squad": "Zero Division — Great Weave Guard", "status": "Alive", "description": "The Great Weave Guard. Creates the Ōken garments.", "affiliations": "Royal Guard", "generation": 0},
    "kirio": {"name": "Kirio Hikifune", "race": "Royal Guard", "family": "Zero Division", "faction": "Royal Guard", "squad": "Zero Division — Ruler of Grain", "status": "Alive", "description": "The Ruler of Grain. Inventor of the artificial soul.", "affiliations": "Royal Guard", "generation": 0},
    "tenjiro": {"name": "Tenjirō Kirinji", "race": "Royal Guard", "family": "Zero Division", "faction": "Royal Guard", "squad": "Zero Division — Hot Spring Demon", "status": "Alive", "description": "The Hot Spring Demon. Creator of healing hot springs.", "affiliations": "Royal Guard", "generation": 0},
    "oetsu": {"name": "Ōetsu Nimaiya", "race": "Royal Guard", "family": "Zero Division", "faction": "Royal Guard", "squad": "Zero Division — God of the Sword", "status": "Alive", "description": "The God of the Sword. Creator of the Zanpakutō.", "affiliations": "Royal Guard", "generation": 0},
    "yhwach": {"name": "Yhwach", "race": "Quincy", "family": "Quincy", "faction": "Wandenreich", "squad": "Emperor of the Wandenreich", "status": "Deceased", "description": "Father of all Quincy. Son of the Soul King. Possessed The Almighty.", "affiliations": "Wandenreich", "generation": 0},
    "jugram": {"name": "Jugram Haschwalth", "race": "Quincy", "family": "Quincy", "faction": "Wandenreich", "squad": "Sternritter Grandmaster", "status": "Deceased", "description": "Yhwach's advisor and other half.", "affiliations": "Wandenreich", "generation": 1},
    "uryu": {"name": "Uryū Ishida", "race": "Quincy", "family": "Ishida", "faction": "Wandenreich", "squad": "Sternritter — A", "status": "Alive", "description": "Last Quincy. Designated successor 'A — Antithesis'.", "affiliations": "Ishida Family · Wandenreich", "generation": 2},
    "ryuken": {"name": "Ryūken Ishida", "race": "Quincy", "family": "Ishida", "faction": "Human World", "squad": "Director — Karakura Hospital", "status": "Alive", "description": "Last Quincy standing according to himself.", "affiliations": "Ishida Family", "generation": 1},
    "soken": {"name": "Sōken Ishida", "race": "Quincy", "family": "Ishida", "faction": "Quincy", "squad": "—", "status": "Deceased", "description": "Uryū's grandfather and mentor.", "affiliations": "Ishida Family", "generation": 0},
}

RELATIONSHIPS = [
    ("isshin", "ichigo", "Parent", "Father of"), ("masaki", "ichigo", "Parent", "Mother of"),
    ("isshin", "karin", "Parent", "Father of"), ("masaki", "karin", "Parent", "Mother of"),
    ("isshin", "yuzu", "Parent", "Father of"), ("masaki", "yuzu", "Parent", "Mother of"),
    ("isshin", "masaki", "Marriage", "Married to"), ("ichigo", "karin", "Sibling", "Siblings"),
    ("ichigo", "yuzu", "Sibling", "Siblings"), ("karin", "yuzu", "Sibling", "Siblings"),
    ("kaien", "kukaku", "Sibling", "Siblings"), ("kaien", "ganju", "Sibling", "Siblings"),
    ("kukaku", "ganju", "Sibling", "Siblings"), ("isshin", "kaien", "Clan", "Same Clan (Shiba)"),
    ("isshin", "kukaku", "Clan", "Same Clan (Shiba)"), ("isshin", "ganju", "Clan", "Same Clan (Shiba)"),
    ("byakuya", "hisana", "Marriage", "Married to"), ("byakuya", "rukia", "Adopted", "Adopted"),
    ("hisana", "rukia", "Sibling", "Biological sisters"),
    ("kaien", "rukia", "Mentor", "Mentor of"), ("soken", "uryu", "Mentor", "Trained"),
    ("oetsu", "ichigo", "Mentor", "Reforged Zangetsu"),
    ("ichigo", "rukia", "Friend", "Close friends"), ("ichigo", "uryu", "Friend", "Rivals & friends"),
    ("yhwach", "masaki", "Bloodline", "Quincy progenitor"), ("yhwach", "soken", "Bloodline", "Quincy progenitor"),
    ("yhwach", "ryuken", "Bloodline", "Quincy progenitor"), ("yhwach", "uryu", "Bloodline", "Quincy progenitor"),
    ("yhwach", "jugram", "Bloodline", "Bestowed power"), ("yhwach", "ichigo", "Bloodline", "Quincy heritage"),
    ("soken", "ryuken", "Parent", "Father of"), ("ryuken", "uryu", "Parent", "Father of"),
    ("ichibei", "senjumaru", "Comrade", "Zero Division"), ("ichibei", "kirio", "Comrade", "Zero Division"),
    ("ichibei", "tenjiro", "Comrade", "Zero Division"), ("ichibei", "oetsu", "Comrade", "Zero Division"),
    ("senjumaru", "kirio", "Comrade", "Zero Division"), ("senjumaru", "tenjiro", "Comrade", "Zero Division"),
    ("senjumaru", "oetsu", "Comrade", "Zero Division"), ("kirio", "tenjiro", "Comrade", "Zero Division"),
    ("kirio", "oetsu", "Comrade", "Zero Division"), ("tenjiro", "oetsu", "Comrade", "Zero Division"),
    ("byakuya", "ichigo", "Friend", "Mutual respect"), ("rukia", "kaien", "Friend", "Deep bond"),
    ("yhwach", "ichibei", "Captain", "Opposed in war"),
]

def build_graph():
    G = nx.Graph()
    for cid, data in CHARACTERS.items(): G.add_node(cid, **data)
    for u, v, t, l in RELATIONSHIPS:
        if u in CHARACTERS and v in CHARACTERS: G.add_edge(u, v, rel_type=t, rel_label=l)
    return G

_FAMILY_CX = {"Kurosaki": -18.0, "Kuchiki": -6.0, "Shiba": 5.0, "Ishida": 16.0, "Quincy": 26.0, "Zero Division": -1.0}

def _hierarchical_layout(G):
    fam_nodes = defaultdict(lambda: defaultdict(list))
    for n in G.nodes(): fam_nodes[G.nodes[n].get("family", "Unknown")][G.nodes[n].get("generation", 1)].append(n)
    pos = {}
    for fam, gens in fam_nodes.items():
        cx = _FAMILY_CX.get(fam, 35.0)
        max_gen = max(gens.keys()) if gens else 0
        for gen, nodes in gens.items():
            for i, n in enumerate(nodes): pos[n] = (cx + (i - (len(nodes)-1)/2.0) * 3.5, (max_gen - gen) * 6.5)
    return pos

def _radial_layout(G):
    pos = nx.spring_layout(G, k=4.5, iterations=200, seed=42)
    return {k: (v[0]*22, v[1]*22) for k, v in pos.items()}

def _faction_layout(G):
    factions = defaultdict(list)
    for n in G.nodes(): factions[G.nodes[n].get("faction", "Unknown")].append(n)
    pos = {}
    for i, (fac, members) in enumerate(sorted(factions.items())):
        angle = 2 * math.pi * i / len(factions) - math.pi / 2
        cx, cy = 18.0 * math.cos(angle), 18.0 * math.sin(angle)
        for j, n in enumerate(members):
            a = 2 * math.pi * j / len(members) if len(members) > 1 else 0
            pos[n] = (cx + 3.8 * math.cos(a), cy + 3.8 * math.sin(a))
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

def _make_background_blobs(G, pos, layout_type):
    traces = []
    clusters = defaultdict(list)
    key = "family" if layout_type == "Family Tree" else "faction"
    for n in G.nodes(): clusters[G.nodes[n].get(key, "Unknown")].append(n)
    
    for name, nodes in clusters.items():
        if len(nodes) < 2: continue
        xs, ys = [pos[n][0] for n in nodes], [pos[n][1] for n in nodes]
        cx, cy = sum(xs)/len(xs), sum(ys)/len(ys)
        races = [G.nodes[n].get("race", "Human") for n in nodes]
        color = RACE_COLORS.get(max(set(races), key=races.count), "#333333")
        max_dist = max(math.sqrt((x-cx)**2 + (y-cy)**2) for x, y in zip(xs, ys))
        
        # Soft radial gradient effect via Plotly Scatter marker
        traces.append(go.Scatter(
            x=[cx], y=[cy], mode="markers",
            marker=dict(size=[max_dist * 40], color=color, opacity=0.035, line=dict(width=0)),
            hoverinfo="none", showlegend=False
        ))
    return traces

def _make_edge_traces(G, pos):
    traces = []
    pair_count = defaultdict(int)
    for u, v, d in G.edges(data=True):
        rt = d.get("rel_type", "Friend")
        style = EDGE_STYLES.get(rt, EDGE_STYLES["Friend"])
        key = tuple(sorted([u, v]))
        pair_count[key] += 1
        bx, by = _bezier_curve(pos[u][0], pos[u][1], pos[v][0], pos[v][1], curvature=0.15 * pair_count[key])
        
        traces.append(go.Scatter(
            x=bx + [None], y=by + [None], mode="lines",
            line=dict(color=EDGE_DEFAULT, width=style["width"], dash=style["dash"]),
            hoverinfo="none", showlegend=False, opacity=0.6,
            customdata=[rt]*len(bx), meta={"edge_type": rt, "u": u, "v": v}
        ))
    return traces

def _make_node_traces(G, pos, analytics):
    traces = []
    deg_cent = analytics["degree_centrality"]
    xs, ys, sizes, colors, customdata = [], [], [], [], []
    glow1_sizes, glow2_sizes = [], []
    
    for n in G.nodes():
        race = G.nodes[n].get("race", "Human")
        size = RACE_SIZES.get(race, 20) + deg_cent.get(n, 0) * 35
        xs.append(pos[n][0]); ys.append(pos[n][1]); customdata.append(n)
        colors.append(RACE_COLORS.get(race, "#aaa"))
        sizes.append(size)
        glow1_sizes.append(size * 2.5) # Outer faint glow
        glow2_sizes.append(size * 1.5) # Inner strong glow

    # Outer Glow (Reiatsu)
    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers",
        marker=dict(size=glow1_sizes, color=colors, opacity=0.06, line=dict(width=0)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"layer": "glow1", "base_sizes": glow1_sizes}
    ))
    # Inner Glow
    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers",
        marker=dict(size=glow2_sizes, color=colors, opacity=0.15, line=dict(width=0)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"layer": "glow2", "base_sizes": glow2_sizes}
    ))
    # Core Node (No plotly hover labels - handled by custom JS tooltip)
    traces.append(go.Scatter(
        x=xs, y=ys, mode="markers",
        marker=dict(size=sizes, color=colors, opacity=1.0, line=dict(color="#000", width=1.5)),
        hoverinfo="none", showlegend=False, customdata=customdata,
        meta={"layer": "core", "base_sizes": sizes}
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
            x=0.5, xanchor="center", y=0.95, yanchor="top",
            bgcolor=PAPER_BG, bordercolor=EDGE_DEFAULT, font=dict(color=TEXT_PRIMARY, size=12),
            buttons=[dict(args=[[lname], {"frame": {"duration": 800, "redraw": True}, "mode": "immediate"}], label=lname, method="animate") for lname in layouts]
        )]
    )
    return fig

def generate_dashboard_html(G, fig):
    adj = {}
    for n in G.nodes():
        nbs = [{"id": nb, "name": G.nodes[nb]["name"], "rel_label": G.edges[n, nb].get("rel_label", ""), "race": G.nodes[nb].get("race", "Human")} for nb in G.neighbors(n)]
        adj[n] = {
            "name": G.nodes[n]["name"], "race": G.nodes[n].get("race", ""),
            "family": G.nodes[n].get("family", ""), "faction": G.nodes[n].get("faction", ""),
            "squad": G.nodes[n].get("squad", ""), "description": G.nodes[n].get("description", ""),
            "affiliations": G.nodes[n].get("affiliations", ""), "neighbors": nbs
        }
    
    fig_html = fig.to_html(full_html=False, include_plotlyjs=False, div_id="plotly-graph", config={"displayModeBar": False, "scrollZoom": True})

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>BLEACH — TYBW Intelligence</title>
<script src="https://cdn.plot.ly/plotly-2.35.0.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  background: radial-gradient(circle at center, #111118 0%, {BACKGROUND} 100%);
  color: {TEXT_PRIMARY}; font-family: 'Inter', sans-serif; overflow: hidden; height: 100vh;
}}
/* Ambient Dust Particles */
.particles {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }}
.particle {{ position: absolute; background: rgba(255,255,255,0.15); border-radius: 50%; animation: float 20s infinite linear; }}
@keyframes float {{ 0% {{ transform: translateY(100vh) translateX(0); opacity: 0; }} 10% {{ opacity: 1; }} 90% {{ opacity: 1; }} 100% {{ transform: translateY(-100px) translateX(50px); opacity: 0; }} }}

/* Graph container */
.graph-container {{ position: absolute; width: 100%; height: 100%; z-index: 2; animation: fade-in 1.5s ease-out; }}
@keyframes fade-in {{ from {{ opacity: 0; transform: scale(0.95); }} to {{ opacity: 1; transform: scale(1); }} }}
#plotly-graph {{ width: 100%; height: 100%; }}

/* UI Panels */
.overlay-panel {{
  position: absolute; top: 20px; bottom: 20px;
  background: {PAPER_BG}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  display: flex; flex-direction: column; z-index: 10;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}}
#leftPanel {{ left: 20px; width: 280px; }}
#rightPanel {{ right: 20px; width: 340px; transform: translateX(120%); opacity: 0; }}
.panel-header {{ padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }}
.panel-title {{ font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; letter-spacing: 3px; color: {TEXT_PRIMARY}; }}
.close-btn {{ cursor: pointer; color: {TEXT_DIM}; font-size: 20px; font-weight: 300; transition: color 0.2s; }}
.close-btn:hover {{ color: {TEXT_PRIMARY}; }}
.panel-content {{ padding: 20px; overflow-y: auto; flex: 1; }}

/* Typography & Details */
.search-box {{ width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; color: {TEXT_PRIMARY}; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; margin-bottom: 24px; transition: border-color 0.3s; }}
.search-box:focus {{ border-color: {ACCENT_GOLD}; box-shadow: 0 0 12px rgba(201, 162, 39, 0.2); }}
.info-name {{ font-family: 'Cinzel', serif; font-size: 26px; font-weight: 700; color: {TEXT_PRIMARY}; margin-bottom: 8px; letter-spacing: 1px; }}
.info-race {{ font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 20px; display: inline-block; }}
.info-label {{ font-size: 10px; color: {TEXT_DIM}; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 20px; margin-bottom: 6px; font-weight: 600; }}
.info-val {{ font-size: 13px; line-height: 1.6; font-weight: 300; color: rgba(255,255,255,0.85); }}
.conn-list {{ list-style: none; margin-top: 10px; }}
.conn-item {{ display: flex; align-items: center; padding: 8px 10px; margin-bottom: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: background 0.2s, border-color 0.2s; }}
.conn-item:hover {{ background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }}
.dot {{ width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }}

/* Custom Glass Tooltip */
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
.tt-race {{ font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }}

/* Initializer Screen */
#loader {{ position: fixed; inset: 0; background: {BACKGROUND}; z-index: 999; display: flex; align-items: center; justify-content: center; color: {ACCENT_GOLD}; font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 6px; animation: fade-out 2s forwards 0.5s; pointer-events: none; }}
@keyframes fade-out {{ to {{ opacity: 0; visibility: hidden; }} }}
</style>
</head>
<body>

<div id="loader">INITIALIZING DATABASE...</div>

<!-- Ambient Particles -->
<div class="particles" id="particles"></div>

<div class="graph-container">
  {fig_html}
  <div style="position:absolute; top:20px; left:50%; transform:translateX(-50%); z-index:5;">
    <button onclick="togglePanel('leftPanel')" style="background:{PAPER_BG}; border:1px solid rgba(255,255,255,0.1); color:{TEXT_PRIMARY}; padding:8px 16px; border-radius:4px; cursor:pointer; font-family:'Inter', sans-serif; font-size:12px; backdrop-filter:blur(5px);">☰ MENU</button>
    <button onclick="resetView()" style="background:{PAPER_BG}; border:1px solid rgba(255,255,255,0.1); color:{TEXT_PRIMARY}; padding:8px 16px; border-radius:4px; cursor:pointer; font-family:'Inter', sans-serif; font-size:12px; margin-left:10px; backdrop-filter:blur(5px);">RESET VIEW</button>
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
for(let i=0; i<30; i++) {{
  let p = document.createElement('div'); p.className = 'particle';
  p.style.width = Math.random()*3+1+'px'; p.style.height = p.style.width;
  p.style.left = Math.random()*100+'vw'; p.style.animationDuration = (Math.random()*15+15)+'s';
  p.style.animationDelay = (Math.random()*20)+'s'; pContainer.appendChild(p);
}}

var GRAPH = {json.dumps(adj)};
var RACE_COLORS = {json.dumps(RACE_COLORS)};
var EDGE_DEFAULT = "{EDGE_DEFAULT}";
var EDGE_ACTIVE = "{EDGE_ACTIVE}";

var graphDiv = document.getElementById('plotly-graph');
var rightPanel = document.getElementById('rightPanel');
var tooltip = document.getElementById('customTooltip');

function togglePanel(id) {{
  var el = document.getElementById(id);
  if(el.style.opacity === '0' || el.style.transform.includes('translate')) {{
    el.style.opacity = '1'; el.style.transform = 'translateX(0)';
  }} else {{
    el.style.opacity = '0'; el.style.transform = id === 'leftPanel' ? 'translateX(-120%)' : 'translateX(120%)';
  }}
}}

function closeProfile() {{ rightPanel.style.opacity = '0'; rightPanel.style.transform = 'translateX(120%)'; resetView(); }}

function baseSizes(trace) {{ return trace.meta && trace.meta.base_sizes ? trace.meta.base_sizes : trace.customdata.map(x=>20); }}

// Edge Spotlight & Glow Intensity on Hover/Click
function highlightState(idSet, highlightEdgesOf) {{
  var data = graphDiv.data;
  var updates = {{'marker.size': [], 'marker.opacity': [], 'line.color': [], 'opacity': [], 'line.width': []}};
  var updateIndices = [];

  for (var i = 0; i < data.length; i++) {{
    var trace = data[i];
    if (trace.mode === 'lines') {{
      var isActive = highlightEdgesOf && trace.meta && (trace.meta.u === highlightEdgesOf || trace.meta.v === highlightEdgesOf);
      updates['opacity'].push(isActive ? 1.0 : 0.1);
      updates['line.color'].push(isActive ? EDGE_ACTIVE : EDGE_DEFAULT);
      // Plotly restyle requires an array of line.width for the trace, but Plotly supports scalar for line.width in Scatter
      updates['line.width'].push(isActive ? trace.line.width * 1.5 : trace.line.width);
      updateIndices.push(i);
    }} else if (trace.customdata) {{
      var base = baseSizes(trace);
      var layer = trace.meta ? trace.meta.layer : 'core';
      
      var newSizes = trace.customdata.map((cid, j) => idSet.has(cid) ? (layer.includes('glow') ? base[j]*1.2 : base[j]) : 0);
      var newOps = trace.customdata.map(cid => idSet.has(cid) ? (layer==='glow1'?0.15 : layer==='glow2'?0.3 : 1.0) : 0);
      
      updates['marker.size'].push(newSizes);
      updates['marker.opacity'].push(newOps);
      updateIndices.push(i);
    }}
  }}
  if(updateIndices.length) Plotly.restyle(graphDiv, updates, updateIndices);
}}

function resetView() {{
  var data = graphDiv.data;
  var updates = {{'marker.size': [], 'marker.opacity': [], 'line.color': [], 'opacity': [], 'line.width': []}};
  var updateIndices = [];

  for (var i = 0; i < data.length; i++) {{
    var trace = data[i];
    if (trace.mode === 'lines') {{
      updates['opacity'].push(0.6);
      updates['line.color'].push(EDGE_DEFAULT);
      // Restore original width based on style logic is tricky without base widths, but we fallback gracefully
      updates['line.width'].push(trace.line.width > 3 ? trace.line.width/1.5 : trace.line.width); 
      updateIndices.push(i);
    }} else if (trace.customdata) {{
      var base = baseSizes(trace);
      var layer = trace.meta ? trace.meta.layer : 'core';
      updates['marker.size'].push(base);
      updates['marker.opacity'].push(base.map(x => layer==='glow1'?0.06 : layer==='glow2'?0.15 : 1.0));
      updateIndices.push(i);
    }}
  }}
  if(updateIndices.length) Plotly.restyle(graphDiv, updates, updateIndices);
}}

// Hover Tooltip Logic
graphDiv.on('plotly_hover', function(data) {{
  if(data.points[0].mode === 'lines') return;
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

// Click Logic
graphDiv.on('plotly_click', function(data) {{
  if(data.points[0].mode === 'lines') return;
  var id = data.points[0].customdata;
  if(!id || !GRAPH[id]) return;
  
  var x = data.points[0].x, y = data.points[0].y;
  Plotly.relayout(graphDiv, {{'xaxis.range': [x-35, x+35], 'yaxis.range': [y-35, y+35]}});

  var d = GRAPH[id];
  var ids = new Set([id]);
  var c = RACE_COLORS[d.race];
  
  var html = `
    <div class="info-name" style="color:${{c}}; text-shadow: 0 0 15px ${{c}}55;">${{d.name}}</div>
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
      <li class="conn-item" onclick="triggerNode('${{nb.id}}')">
        <span class="dot" style="color:${{RACE_COLORS[nb.race]}}; background:${{RACE_COLORS[nb.race]}}"></span>
        <div style="flex:1">
          <div style="color:{TEXT_PRIMARY}; font-size:12px; font-weight:600;">${{nb.name}}</div>
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
}});

function triggerNode(id) {{
  var data = graphDiv.data;
  for(var i=0; i<data.length; i++) {{
    if(data[i].customdata) {{
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
