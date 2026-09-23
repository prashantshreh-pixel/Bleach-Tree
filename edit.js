const fs = require('fs');
let code = fs.readFileSync('obsidian_network.py', 'utf8');

// 1. Change Ctrl+T to Ctrl+K
code = code.replace(/e\.key === 't'/g, "e.key === 'k'");
code = code.replace(/\(Ctrl\+T\)/g, '(Ctrl+K)');
code = code.replace(/Click anywhere to skip/g, 'Click anywhere to SKIP INTRO');

// 2. Hide Loader if localStorage says so
code = code.replace(/const RAW_GRAPH = \{graph_json\};/g, 
\// Loader Logic
const skipIntro = localStorage.getItem('skipIntro');
const loader = document.getElementById('loader');
if (skipIntro === 'true') {
    if(loader) loader.style.display = 'none';
} else {
    setTimeout(() => {
        if(loader) loader.classList.add('fade-out');
        localStorage.setItem('skipIntro', 'true');
        setTimeout(() => { if(loader) loader.style.display = 'none'; }, 800);
    }, 1500);
    if(loader) {
        loader.addEventListener('click', () => {
            loader.classList.add('fade-out');
            localStorage.setItem('skipIntro', 'true');
            setTimeout(() => loader.style.display = 'none', 800);
        });
    }
}
const RAW_GRAPH = {graph_json};\);

// 3. Remove mini-legend entirely
code = code.replace(/<div id="mini-legend">[\s\S]*?<\/div>/g, '');
code = code.replace(/miniLegend\.classList\.add\('hidden'\);/g, '');
code = code.replace(/miniLegend\.classList\.remove\('hidden'\);/g, '');
code = code.replace(/const miniLegend = document\.getElementById\('mini-legend'\);/g, '');

// 4. Compact Faction Bar (replace old cluster-bar)
code = code.replace(/<button class="cluster-btn active" data-cluster="all">All Galaxy<\/button>[\s\S]*?<button class="cluster-btn" data-cluster="original">Original Gotei<\/button>/g, \<button class="cluster-btn active" data-cluster="all">ALL</button>
        <button class="cluster-btn" data-cluster="gotei">SOUL REAPER</button>
        <button class="cluster-btn" data-cluster="wandenreich">QUINCY</button>
        <button class="cluster-btn" data-cluster="arrancar">HOLLOW</button>\);

fs.writeFileSync('obsidian_network.py', code);
console.log('Done script edits.');
