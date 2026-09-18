# Bleach Intelligence Database

An interactive, high-performance character relationship intelligence database for the Bleach universe — built to visually explore the intricate web of bloodlines, rivalries, factions, and alliances across the series, from the Kurosaki lineage to the Gotei 13 and the Wandenreich Quincy hierarchy.

Inspired by Obsidian's graph architecture and themed around the *Thousand-Year Blood War* aesthetic.

---

## 🌟 Overview

Instead of sifting through wikis to piece together who is related to who, allied with who, or fighting who, this project visualizes the entire Bleach character network as a hardware-accelerated **interactive force-directed graph**. 

Click any character to inspect their classified dossier, examine their direct connections, and watch the viewport automatically pan and zoom to keep their allies, family, and enemies in focus.

---

## ✨ Features

- **Obsidian Force-Directed Graph**: Hardware-accelerated HTML5 Canvas + D3.js v7 physics engine delivering smooth 60 FPS pan, zoom, and node dragging without freezing.
- **Single WebP Sprite Sheet (`characters.webp`)**: All character portraits are auto-cropped (face-centered), compressed to 128x128px WebP, and packed into a single sprite sheet, converting 100+ separate HTTP requests into 1 single ultra-compact request (~3 KB).
- **Level of Detail (LOD) & Frustum Culling**: Canvas intelligently skips off-screen nodes and renders clean glowing dots when zoomed out, smoothly transitioning into circular masked portraits only when zoomed in (`zoom >= 0.72`) to eliminate clutter and maximize frame rates.
- **Grayscale-to-Color Interaction**: Avatars render slightly desaturated at rest for a sleek aesthetic and bloom into full vibrant color upon hover or selection.
- **Graceful Initials Fallback**: Nodes without portraits dynamically render high-tech circular badges with character initials (e.g. "IK", "BK", "YR") and race/faction colored rings — preventing broken image icons.
- **Floating Frosted-Glass Dossier**: Detached, modern floating card featuring character avatars, faction badges, status indicators, and categorized relationship pills (Bloodline, Social, Affiliation).
- **Intelligent Viewport Auto-Fit**: Selecting any character smoothly frames and zooms the camera to guarantee all directly connected nodes fit within your screen with safe margins.
- **Command Palette & Quick Search (`Ctrl + T`)**: Instant search overlay to query characters, factions, or bloodlines and immediately teleport to any node.
- **Race & Faction Visual Hierarchy**: Soul Reapers, Quincy, Hybrids, Humans, Nobles, and Royal Guard are color-coded with distinct spiritual pressure (Reiatsu) glows.
- **Zero-Dependency Procedural Audio**: In-browser sound effects powered by the Web Audio API (no external MP3/WAV assets required).
- **Custom Loading Experience**: Animated ICHIGOAT sequence with click-to-skip and automatic safety fallbacks.

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
| `Double Click Background` | Reset camera view and clear active selections |
| `Scroll Wheel` | Zoom in / out |
| `Click & Drag Node` | Pin and reposition character in physical simulation |
| `Click & Drag Background` | Pan the camera across the Soul Society canvas |

---

## 🛠️ Tech Stack

- **Physics & Layout Engine**: [D3.js](https://d3js.org/) (Force Simulation, Zoom behaviors, Drag gestures).
- **Graphics Pipeline**: HTML5 Canvas with dual-pass glow shaders and hardware-accelerated transforms.
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

This compiles the network and generates **`bleach_intelligence_database.html`**. 

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
│   ├── Image/
│   │   ├── ICHIGOAT.gif             # Custom loader animation
│   │   ├── Ichigo Kurosaki.jpg      # High-res source character portrait
│   │   └── bankai_favicon.svg       # Soul Reaper badge favicon
│   └── sprites/
│       ├── characters.webp          # Compiled 128x128 WebP sprite sheet
│       └── characters-map.json      # Coordinate lookup for CSS & Canvas slices
├── data/
│   ├── characters.json              # Canonical character registry & affiliations
│   └── relationships.json           # Directed edge database & relationship types
├── build_sprites.py                 # Automated face-crop & WebP sprite sheet compiler
├── obsidian_network.py              # Main compiler generating the standalone HTML
├── bleach_intelligence_database.html# Standalone, zero-dependency interactive web application
└── README.md                        # Documentation
```

---

## 📜 Disclaimer

This is an unofficial, non-commercial fan project created for data visualization and educational purposes. *Bleach* and all associated characters, names, and lore are the property of **Tite Kubo**, **Shueisha**, and **Studio Pierrot**.
