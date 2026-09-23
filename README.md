# Bleach Intelligence Database

An interactive, high-performance character relationship intelligence database for the Bleach universe — built to visually explore the intricate web of bloodlines, rivalries, factions, and alliances across the series, from the Kurosaki lineage to the Gotei 13, the Espada, the Wandenreich Quincy hierarchy, the Original Gotei 13 founders, and the light novel continuations (*Can't Fear Your Own World* and *Spirits Are Forever With You*).

Inspired by Obsidian's graph architecture and themed around the *Thousand-Year Blood War* aesthetic.

---

## 🌟 Overview

Instead of sifting through wikis to piece together who is related to who, allied with who, or fighting who, this project visualizes the entire Bleach character network as a hardware-accelerated **interactive force-directed graph** containing **189 characters** and **368 canonical relationships**.

Click any character to inspect their classified dossier, examine their direct connections, and watch the viewport automatically pan and zoom to keep their allies, family, and enemies in focus.

---

## ✨ Features

- **Obsidian Force-Directed Graph**: Hardware-accelerated HTML5 Canvas + D3.js physics engine delivering smooth 60–120 FPS pan, zoom, and node dragging across 189 characters without hitching.
- **Hierarchical Node Sizing (5 Lore-Accurate Tiers)**: Clear visual hierarchy across all factions:
  - **Tier 1 (Supreme Gods & Sovereign Leaders)**: Aizen, Ichigo, Yhwach, Yamamoto, Soul King tower with commanding **26px radius (52px diameter)** avatars.
  - **Tier 2 (Elite Commanders & Top Espada)**: Gin, Tōsen, Starrk, Baraggan, Harribel, Ulquiorra, Grimmjow, Shunsui, Kenpachi, Byakuya rendered at **18px radius**.
  - **Tier 3 (Core Espada & Captains)**: Yammy, Zommari, Szayelaporro, Nelliel, Schutzstaffel, Visored captains at **13.5px radius**.
  - **Tier 4 (Lieutenants & Privaron Espada)**: Dordoni, Cirucci, Gantenbainne, Rudbornn, Lieutenants at **9.5px radius**.
  - **Tier 5 (Fracción, Fodder & Minor Minions)**: Charlotte, Abirama, Findorr, Poww, Ggio, Nirgge, Tesla, Lumina, Medazeppi, etc. rendered as compact **5.8px satellite nodes**.
- **Tactical Radar Minimap (Bottom-Left HUD)**: Real-time bird's-eye radar displaying the entire galaxy of character nodes and a dynamic viewport frustum rectangle. Click or drag anywhere on the minimap to instantly navigate across the universe.
- **Interactive Faction Filter Navigation Bar**: Dedicated floating navigation bar that filters the graph to display only the selected faction's characters and internal relationships, pinning the faction's supreme leader in the exact center `(0, 0)`:
  - **All Galaxy**: Displays all 189 characters and 368 relationships with **Ichigo Kurosaki** anchored at the cosmic center.
  - **Gotei 13**: Filters exclusively to Gotei 13 captains, lieutenants, and seated officers with **Genryūsai Shigekuni Yamamoto** pinned at the center.
  - **Wandenreich**: Isolates the Quincy empire, Schutzstaffel, and Sternritter with **Yhwach** commanding the center.
  - **Hueco Mundo**: Displays the true throne hierarchy with **Sōsuke Aizen** at the center, flanked closely by **Gin** and **Tōsen**, circled by the **Espada**, while their Fracción orbit outward around their respective masters.
  - **Royal Realm**: Focuses on the Soul King Palace and Zero Squad with the **Soul King (Reiō)** at the core.
  - **Karakura Town**: Displays the human world defenders, Fullbringers, and allies with **Ichigo Kurosaki** at the heart.
  - **Original Gotei**: Displays the legendary founding captains of the original Gotei 13 with **Genryūsai Shigekuni Yamamoto** at the center.
- **Dynamic Connection Line Visibility & Clean Deselection**:
  - **Crisp Default Threads**: Relationship links remain clearly visible by default (~1.15px, `0.20`–`0.26` opacity) across the dark canvas even when no node is selected, preserving the spiritual network structure at all zoom levels.
  - **Interactive Focus & Highlighting**: Selecting or hovering any character intensifies incident connections into high-contrast glowing trails (`0.95` opacity / amber `#F59E0B`), while unobtrusively dimming unrelated lines.
  - **Instant Deselection**: Clicking the active node again, clicking anywhere on the background canvas, clicking the dossier close button, or pressing `Escape` immediately deselects the node and cleanly restores all connection lines to their original state.
  - **Tiered Level of Detail (LOD)**: Smoothly transitions between constellation view and full portrait avatars as you zoom into clusters.
- **Single High-Res 192px Sprite Sheet (`characters.webp`)**: 163 character portraits are auto-cropped (face-centered), lanczos-filtered, and packed into a unified 192×192px WebP sprite sheet (~1.1 MB), replacing 160+ individual HTTP network requests with 1 single cached request.
- **Floating High-Definition Hover HUD Card**: Hovering any node renders a sleek frosted-glass HUD card with a 76px circular avatar, faction-colored ring, race/faction metadata pills, and real-time live connection counters.
- **Frosted-Glass Dossier & Character Backdrop**: Inspecting any character reveals a detailed sidebar with their portrait scaled, blurred, and softened as a background behind dark frosted glass.
- **Shortest Path Tracing**: Select any character, hit "Trace Path", and click another character to calculate and visualize degrees of separation with directional glowing energy particles.
- **Command Palette & Quick Search (`Ctrl + T`)**: Instant search overlay to query characters, factions, or bloodlines and immediately teleport to any node.
- **Zero-Dependency Procedural Audio**: In-browser sound effects powered by the Web Audio API (no external audio assets required).
- **Sub-Second Load Time**: Precomputed layout warmup (`warmupTicks: 35`), idle simulation cooling (`cooldownTicks: 95`), and instant reactive loader dismissal (< 350ms).

---

## 🗡️ Bleach Easter Eggs & Secret Interactions

The intelligence database is packed with hidden interactions and secret triggers inspired by Bleach lore:

| Trigger | Name | Visual & Audio Effect |
| :--- | :--- | :--- |
| **Type `bankai`** | Bankai Release | Screen-wide spiritual flash, synthesized reiatsu roar, and synchronized pulsing glow on all Soul Reaper nodes. |
| **Type `getsuga`** | Getsuga Tenshō | High-velocity animated blade slash streak cuts across the screen with sword impact audio and camera tremor. |
| **`↑ ↑ ↓ ↓ ← → ← → B A`** | Hōgyoku Mode | Konami code trigger: reality distorts and node colors/factions scramble chaotically for 3.5 seconds before snapping back. |
| **Rapid click 8+ times** | Hollowfication | Rapidly clicking any node triggers a glitching red/black Hollow aura and mask distortion audio. |
| **Hover Yhwach 3s** | The Almighty | Hovering over Yhwach's node without clicking causes him to steadily expand by 1.6x with dark Quincy reiatsu. |
| **Isshin + Masaki** | Eternal Bond | Selecting Isshin while Masaki's dossier is open (or vice versa) generates an interlocking pink spiritual tether and lore message. |
| **Search `zangetsu`** | Zanpakutō Spirit | Surfaces a classified dual-spirit profile detailing Old Man Zangetsu and the White Hollow. |
| **Search `soul society`** | Seireitei Barrier | Deploys a golden spherical barrier and illuminates all Gotei 13 and Royal Guard members. |
| **Click Brand Logo 5x** | Creator Bounty | Clicking the top-bar **BLEACH** wordmark 5 times reveals a Soul Society classified wanted poster / credits dossier. |
| **Midnight (12 AM - 1 AM)** | Hueco Mundo Hour | The database shifts into an eerie purple/black Hueco Mundo palette. |
| **July 15th** | Ichigo's Birthday | Celebratory birthday badge and spiritual confetti appear across the interface. |

---

## ⌨️ Shortcuts & Navigation

| Key / Action | Function |
| :--- | :--- |
| `Ctrl + T` | Open Command Palette / Quick Search |
| `Escape` | Close active dossier or search modal |
| `Click Node` | Open floating character dossier and auto-fit connected network |
| `Click / Drag Minimap` | Instantly pan the viewport from the bottom-left tactical radar |
| `Cluster Buttons` | Jump camera directly to Gotei 13, Wandenreich, Hueco Mundo, etc. |
| `Double Click Background` | Reset camera view and clear active selections |
| `Scroll Wheel` | Zoom in / out (activates semantic zoom transitions) |
| `Click & Drag Node` | Pin and reposition character in physical simulation |
| `Click & Drag Background` | Pan the camera across the Soul Society canvas |

---

## 🛠️ Tech Stack

- **Physics & Layout Engine**: [D3.js](https://d3js.org/) (Force Simulation, Zoom behaviors, Drag gestures).
- **Graphics Pipeline**: HTML5 Canvas with dual-pass glow shaders, matrix caching, and hardware-accelerated transforms.
- **Sprite Generation**: Python Pillow (PIL) lanczos face-cropping to unified WebP format.
- **Audio Engine**: Native HTML5 Web Audio API synthesizer (oscillators, noise buffers, and biquad filters).
- **Backend / Data Pipeline**: Python generator (`obsidian_network.py`), JSON data sources (`data/characters.json`, `data/relationships.json`).
- **Typography & Styling**: Google Fonts (*Cinzel*, *Inter*), CSS backdrop filters, and custom scrollbar theming.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ (for generating/updating the database)
- Any modern web browser (Chrome, Firefox, Edge, Safari, Brave)

### Installation & Execution

```bash
# Clone the repository
git clone https://github.com/prashantshreh-pixel/Bleach-Tree.git
cd Bleach-Tree

# Generate the standalone intelligence database
python obsidian_network.py
```

This compiles the network, discovers all character portraits in `Asset/`, builds `Asset/sprites/characters.webp`, and outputs **`bleach_intelligence_database.html`**. 

Open `bleach_intelligence_database.html` directly in your browser:
```bash
# Windows
start bleach_intelligence_database.html

# macOS
open bleach_intelligence_database.html

# Linux
xdg-open bleach_intelligence_database.html
```

---

## 📁 Project Structure

```text
Bleach Tree/
├── Asset/
│   ├── Image/                       # Synchronized repository of character portraits
│   │   ├── ICHIGOAT.gif             # Custom loader animation
│   │   ├── Ichigo Kurosaki.jpg      # High-res source character portrait
│   │   └── ...                      # 160+ character portraits
│   └── sprites/
│       ├── characters.webp          # Compiled 192x192 WebP sprite sheet (161 portraits)
│       └── characters-map.json      # Coordinate lookup for CSS & Canvas slices
├── data/
│   ├── characters.json              # Canonical character registry (189 entities)
│   └── relationships.json           # Canonical relationship database (355 edges)
├── build_sprites.py                 # Automated face-crop & WebP sprite sheet compiler
├── obsidian_network.py              # Main compiler generating the standalone HTML
├── bleach_intelligence_database.html# Standalone, zero-dependency interactive web application
└── README.md                        # Documentation
```

---

## 📜 Disclaimer

This is an unofficial, non-commercial fan project created for data visualization and educational purposes. *Bleach* and all associated characters, names, and lore are the property of **Tite Kubo**, **Shueisha**, and **Studio Pierrot**.
