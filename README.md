# Bleach Intelligence Database

An interactive character relationship graph for the Bleach universe — built to visually explore the tangled web of family ties, rivalries, factions, and alliances across the series, from the Kurosaki family line to the Wandenreich's Quincy hierarchy.

## Overview
Instead of reading through wikis to piece together who's related to who, allied with who, or fighting who, this project renders the entire Bleach character network as an interactive force-directed graph. Click any character to see their full profile, faction, and connections — and watch the graph highlight exactly how they fit into the larger world.

## Features
*   **Interactive network graph** — Plotly-powered canvas showing every character as a node and every relationship as an edge.
*   **Character profiles** — click any node to open a detail panel with faction, affiliations, status, and a short bio.
*   **Relationship types** — distinct edge styles for Family & Blood, Social (Friend/Mentor), and Affiliation (Clan/Squad) connections.
*   **Race & faction color-coding** — Soul Reapers, Quincy, Hybrids, Humans, Nobles, and Royal Guard are each visually distinct.
*   **Search & filter** — quickly locate a character by name, or explore factions.
*   **Centrality insights** — degree centrality scores surface the most "connected" characters in the story, scaling their visual aura (Reiatsu).
*   **Atmospheric UI** — a dark, moody visual theme inspired by the Thousand-Year Blood War arc featuring glassmorphism, glowing nodes, and particle effects.

## Screenshots
*(Add screenshots or a short GIF of the graph in action here — this is the kind of project that sells itself visually.)*

## Tech Stack
*   **Graph Processing:** Python & `networkx` for data structure, graph analytics (centrality), and layout algorithms (hierarchical, radial, faction).
*   **Rendering & Interactivity:** `plotly.graph_objects` combined with vanilla JavaScript for highly customized hover states, click events, and CSS animations.
*   **Frontend & Styling:** A single portable HTML payload featuring custom CSS, backdrop filters, and dual-layered SVG glows.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/prashantshreh-pixel/Bleach-Tree.git
cd Bleach-Tree

# Install dependencies
pip install networkx plotly

# Run the generator script
python bleach_network.py
```
This will process the data and generate `bleach_intelligence_database.html`. Simply open this file in any web browser to view the interactive dashboard.

## Data Structure
Character and relationship data lives natively in Python dictionaries, heavily structured for easy expansion:

```python
CHARACTERS = {
    "ichigo": {
        "name": "Ichigo Kurosaki", 
        "race": "Hybrid", 
        "faction": "Gotei 13", 
        "family": "Kurosaki",
        "description": "Substitute Soul Reaper with Shinigami, Quincy, Hollow, and Fullbring powers."
    }
}

RELATIONSHIPS = [
    # (source_id, target_id, category, label)
    ("isshin", "ichigo", "Parent", "Father of"),
    ("kaien", "rukia", "Mentor", "Mentor of")
]
```

## Roadmap
- [ ] Expand character/relationship dataset beyond the initial core cast
- [x] Add faction/family cluster highlighting (visual grouping by clan or squad)
- [ ] Timeline mode — show how relationships and alliances shift across arcs
- [ ] Mobile-responsive graph controls
- [ ] Exportable character relationship summaries (PDF/image)

## Contributing
This is a personal/fan project built for learning and portfolio purposes. Suggestions, bug reports, and data corrections (character details, relationship accuracy) are welcome via issues or pull requests.

## Disclaimer
This is an unofficial, non-commercial fan project. Bleach and all associated characters, names, and imagery are the property of Tite Kubo, Shueisha, and Studio Pierrot. This project uses no copyrighted artwork — all visuals are original UI/data-visualization design.
