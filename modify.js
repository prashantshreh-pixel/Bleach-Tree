const fs = require('fs');
let code = fs.readFileSync('obsidian_network.py', 'utf8');

const oldSidebar = code.substring(code.indexOf('    <!-- Sidebar -->'), code.indexOf('    <!-- Tactical Minimap HUD (Bottom-Left) -->'));

const newSidebar = \    <!-- Sidebar -->
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
\;

code = code.replace(oldSidebar, newSidebar);
fs.writeFileSync('obsidian_network.py', code);
console.log('Sidebar replaced');
