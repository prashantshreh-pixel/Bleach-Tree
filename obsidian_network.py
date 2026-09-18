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

    # Embed images as base64 data URIs
    asset_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Asset", "Image")
    
    with open(os.path.join(asset_dir, "ICHIGOAT.gif"), "rb") as f:
        loader_gif_b64 = base64.b64encode(f.read()).decode("ascii")
    
    with open(os.path.join(asset_dir, "Ichigo Kurosaki.jpg"), "rb") as f:
        ichigo_img_b64 = base64.b64encode(f.read()).decode("ascii")

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
            "img": f"data:image/jpeg;base64,{ichigo_img_b64}" if char_id == "ichigo" else ""
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

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BLEACH - TYBW Intelligence</title>
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
            background-position: center 15%;
            z-index: -2;
            transition: background-image 0.4s ease;
            opacity: 0.8;
        }}
        #sidebar-overlay {{
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(10,10,18,0.4) 0%, rgba(10,10,18,0.95) 45%);
            backdrop-filter: blur(15px);
            z-index: -1;
        }}
        
        #sidebar-content {{
            padding: 28px 24px;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            z-index: 1;
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
            transition: background 0.2s;
        }}
        #sidebar-search:hover {{ background: rgba(220,38,38,0.3); }}

        #sidebar .brand {{ font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 2px; margin-bottom: 2px; }}
        #sidebar .brand span {{ color: #DC2626; }}
        #sidebar .sub {{ font-size: 9px; letter-spacing: 4px; color: #666; text-transform: uppercase; margin-bottom: 24px; }}

        #sidebar .char-name {{ font-family: 'Cinzel', serif; font-size: 20px; color: #fff; margin: 0 0 4px 0; }}
        #sidebar .char-meta {{ font-size: 11px; color: #DC2626; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; }}
        #sidebar .char-desc {{ font-size: 12px; color: #aaa; line-height: 1.6; margin-bottom: 20px; }}

        #sidebar .section-title {{ font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 2px; color: #888; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px; }}
        #sidebar .conn-list {{ list-style: none; padding: 0; margin: 0 0 20px 0; }}
        #sidebar .conn-list li {{ font-size: 11px; color: #ccc; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }}
        #sidebar .conn-list li span {{ color: #666; font-size: 10px; }}

        #sidebar .legend-grid {{ display: flex; flex-direction: column; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.65); }}

        /* Mini legend (bottom-left) */
        #mini-legend {{ position: absolute; bottom: 20px; left: 20px; z-index: 5; background: rgba(10,10,15,0.5); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(5px); font-size: 10px; color: rgba(255,255,255,0.6); display: flex; flex-direction: column; gap: 6px; pointer-events: none; transition: opacity 0.3s ease, transform 0.3s ease; }}
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
    </style>
</head>
<body>
    <!-- Loader -->
    <div id="loader">
        <img src="data:image/gif;base64,{loader_gif_b64}" alt="Loading..." />
        <div class="loader-text">Loading Intelligence</div>
    </div>

    <div id="graph-container"></div>

    <!-- Sidebar -->
    <div id="sidebar">
        <div id="sidebar-bg"></div>
        <div id="sidebar-overlay"></div>
        <div id="sidebar-content">
            <button id="sidebar-close">&times;</button>
            <button id="sidebar-search" title="Search (Ctrl+T)">&#x1F50D;</button>
            <div class="brand">BLEACH <span>TYBW</span></div>
            <div class="sub">Intelligence Database</div>

            <div id="char-info">
                <div class="char-name" id="s-name">Select an Entity</div>
                <div class="char-meta" id="s-meta">TYBW Archive</div>
                <div class="char-desc" id="s-desc">Click on any node in the network graph to inspect detailed intelligence records, affiliations, and relationships.</div>
            </div>

            <div id="conn-section" style="display:none;">
                <div class="section-title">CONNECTIONS</div>
                <ul class="conn-list" id="s-connections"></ul>
            </div>

            <div style="margin-top:auto; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;">
                <div class="section-title">FACTIONS</div>
                <div class="legend-grid">
                    {legend_items}
                </div>
            </div>
        </div>
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
        const gData = {graph_json};

        let hoverNode = null;

        // Precompute adjacency map for O(1) neighbor lookups
        const neighbors = {{}};
        const nodeConnections = {{}};
        gData.nodes.forEach(n => {{
            neighbors[n.id] = new Set();
            nodeConnections[n.id] = [];
        }});
        gData.links.forEach(l => {{
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            neighbors[sid].add(tid);
            neighbors[tid].add(sid);
            nodeConnections[sid].push({{ name: tid, label: l.label }});
            nodeConnections[tid].push({{ name: sid, label: l.label }});
        }});

        // Node name lookup
        const nodeNameMap = {{}};
        gData.nodes.forEach(n => {{ nodeNameMap[n.id] = n.name; }});

        // Preload node images for canvas drawing
        const nodeImages = {{}};
        gData.nodes.forEach(n => {{
            if (n.img) {{
                const img = new Image();
                img.src = n.img;
                nodeImages[n.id] = img;
            }}
        }});

        // Dismiss loader after short delay
        setTimeout(() => {{
            const loader = document.getElementById('loader');
            loader.classList.add('fade-out');
            setTimeout(() => loader.style.display = 'none', 600);
        }}, 2200);

        // Sidebar elements
        const sidebar = document.getElementById('sidebar');
        const sName = document.getElementById('s-name');
        const sMeta = document.getElementById('s-meta');
        const sDesc = document.getElementById('s-desc');
        const sConns = document.getElementById('s-connections');
        const connSection = document.getElementById('conn-section');
        const miniLegend = document.getElementById('mini-legend');

        document.getElementById('sidebar-close').addEventListener('click', () => {{
            sidebar.classList.remove('open');
            miniLegend.classList.remove('hidden');
        }});

        document.getElementById('sidebar-search').addEventListener('click', () => {{
            openSearch();
        }});

        function openSidebar(node) {{
            // Set sidebar background image
            const sidebarBg = document.getElementById('sidebar-bg');
            if (node.img) {{
                sidebarBg.style.backgroundImage = 'url(' + node.img + ')';
                sidebarBg.style.opacity = '1';
            }} else {{
                sidebarBg.style.backgroundImage = 'none';
                sidebarBg.style.opacity = '0';
            }}

            sName.innerText = node.name;
            sMeta.innerText = node.race + ' \\u2022 ' + node.faction;
            sDesc.innerText = node.desc || 'No intelligence data available.';

            // Build connections list
            const conns = nodeConnections[node.id] || [];
            if (conns.length > 0) {{
                connSection.style.display = 'block';
                sConns.innerHTML = conns.map(c =>
                    '<li>' + (nodeNameMap[c.name] || c.name) + ' <span>\\u2014 ' + c.label + '</span></li>'
                ).join('');
            }} else {{
                connSection.style.display = 'none';
            }}

            sidebar.classList.add('open');
            miniLegend.classList.add('hidden');
        }}

        const Graph = ForceGraph()(document.getElementById('graph-container'))
            .graphData(gData)
            .nodeId('id')
            .nodeRelSize(4)
            .backgroundColor('#0A0A0F')

            // Link styling
            .linkWidth(link => link === hoverNode ? 2 : 1)
            .linkColor(link => {{
                if (hoverNode) {{
                    const sid = typeof link.source === 'object' ? link.source.id : link.source;
                    const tid = typeof link.target === 'object' ? link.target.id : link.target;
                    return (sid === hoverNode.id || tid === hoverNode.id) ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.02)';
                }}
                return 'rgba(255,255,255,0.15)';
            }})
            .linkDirectionalParticles(0)

            // Custom Canvas node rendering
            .nodeCanvasObject((node, ctx, globalScale) => {{
                const isHovered = node === hoverNode;
                const isConnected = hoverNode && neighbors[hoverNode.id] && neighbors[hoverNode.id].has(node.id);
                const isDimmed = hoverNode && !isHovered && !isConnected;

                const size = node.val;
                const hasImg = nodeImages[node.id] && nodeImages[node.id].complete;
                const imgSize = hasImg ? Math.max(size * 2.2, 12) : size;

                // Glow (skip when dimmed for perf)
                if (!isDimmed) {{
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, (hasImg ? imgSize : size) * 1.8, 0, 2 * Math.PI);
                    ctx.fillStyle = node.color + '22';
                    ctx.fill();
                }}

                if (hasImg && !isDimmed) {{
                    // Draw circular image
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.clip();
                    
                    const img = nodeImages[node.id];
                    const minDim = Math.min(img.width, img.height);
                    const sx = (img.width - minDim) / 2;
                    const sy = 0; // Top align to show face
                    
                    ctx.drawImage(img, sx, sy, minDim, minDim, node.x - imgSize, node.y - imgSize, imgSize * 2, imgSize * 2);
                    ctx.restore();

                    // Glowing ring
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, imgSize, 0, 2 * Math.PI);
                    ctx.lineWidth = (isHovered ? 3 : 1.5) / globalScale;
                    ctx.strokeStyle = isHovered ? '#fff' : node.color;
                    ctx.stroke();
                }} else {{
                    // Core dot
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                    ctx.fillStyle = isDimmed ? node.color + '18' : node.color;
                    ctx.fill();

                    // Stroke
                    if (!isDimmed) {{
                        ctx.lineWidth = isHovered ? 2 / globalScale : 0.5 / globalScale;
                        ctx.strokeStyle = isHovered ? '#fff' : '#000';
                        ctx.stroke();
                    }}
                }}

                // Label
                const label = node.name.split(' ')[0].toUpperCase();
                const fontSize = Math.max(10 / globalScale, 2);
                const labelY = node.y + (hasImg && !isDimmed ? imgSize : size) + 3;

                if (!isDimmed && (isHovered || globalScale > 1.5 || node.is_top)) {{
                    ctx.font = fontSize + 'px Cinzel';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.65)';
                    ctx.fillText(label, node.x, labelY);
                }}
            }})
            .onNodeHover(node => {{
                hoverNode = node || null;
                document.body.style.cursor = node ? 'pointer' : null;
            }})
            .onLinkHover(link => {{}})
            .onNodeDragEnd(node => {{
                node.fx = node.x;
                node.fy = node.y;
            }})
            .onNodeClick(node => {{
                if (node) {{
                    openSidebar(node);
                    Graph.centerAt(node.x, node.y, 800);
                    Graph.zoom(2.5, 1000);
                }}
            }});

        // Physics
        Graph.d3Force('charge').strength(-400);
        Graph.d3Force('link').distance(60);

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
            openSidebar(node);
            Graph.centerAt(node.x, node.y, 800);
            Graph.zoom(2.5, 1000);
        }}

        function renderResults(query) {{
            if (!query) {{ searchResults.innerHTML = ''; activeIdx = -1; return; }}
            const q = query.toLowerCase();
            const matches = gData.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 12);
            activeIdx = matches.length > 0 ? 0 : -1;
            searchResults.innerHTML = matches.map((n, i) =>
                '<div class="search-result' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
                '<span class="dot" style="background:' + n.color + ';box-shadow:0 0 4px ' + n.color + '"></span>' +
                '<span class="sr-name">' + n.name + '</span>' +
                '<span class="sr-faction">' + n.faction + '</span>' +
                '</div>'
            ).join('');

            // Click handlers
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
                const q = searchInput.value.toLowerCase();
                const matches = gData.nodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 12);
                if (matches[activeIdx]) navigateToNode(matches[activeIdx]);
            }} else if (e.key === 'Escape') {{
                closeSearch();
            }}
        }});

        // Close on clicking backdrop
        searchOverlay.addEventListener('click', e => {{
            if (e.target === searchOverlay) closeSearch();
        }});

        // Ctrl+T shortcut
        document.addEventListener('keydown', e => {{
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {{
                e.preventDefault();
                if (searchOverlay.classList.contains('open')) {{
                    closeSearch();
                }} else {{
                    openSearch();
                }}
            }}
            if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {{
                closeSearch();
            }}
        }});
    </script>
</body>
</html>"""

    with open("bleach_intelligence_database.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Obsidian Canvas Database saved to: bleach_intelligence_database.html")

generate_obsidian_graph()
