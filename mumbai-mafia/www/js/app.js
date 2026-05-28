// Mafia Streets Ext JS Game Application Code

// --- Global Game State ---
var GameState = {
    player: {
        username: "MAYA",
        characterClass: "MAYA",
        level: 1,
        exp: 0,
        expNeeded: 100,
        cash: 350,
        health: 100,
        maxHealth: 100,
        energy: 50,
        maxEnergy: 50,
        baseAttack: 15,
        baseDefense: 10,
        attack: 15,
        defense: 10,
        equippedWeapon: null,
        equippedArmor: null,
        specialCooldown: 0,
        specialActiveTurns: 0
    },
    enemy: {
        name: "Gabbar's Gunda",
        level: 1,
        health: 100,
        maxHealth: 100,
        attack: 12,
        defense: 6,
        cashReward: 120,
        expReward: 35
    },
    currentFightArea: null,
    inventory: [
        { id: 1, name: "Desi Katta", type: "Weapon", stat: 12, statLabel: "+12 Attack", rating: 1, qty: 1, description: "A crude local single-shot pistol.", value: 150, equipped: false },
        { id: 2, name: "Lathi", type: "Weapon", stat: 5, statLabel: "+5 Attack", rating: 1, qty: 1, description: "A simple, solid wooden staff.", value: 30, equipped: false },
        { id: 3, name: "Bulletproof Vest", type: "Armor", stat: 10, statLabel: "+10 Defense", rating: 1, qty: 0, description: "Basic street chest protection.", value: 200, equipped: false },
        { id: 4, name: "Vada Pav", type: "Consumable", stat: 30, statLabel: "+30 Health", rating: 0, qty: 3, description: "Spicy Mumbai's Mafia Streets snack. Restores Health.", value: 15, equipped: false }
    ],
    areas: [
        { id: 'dharavi', name: 'Dharavi Slums', danger: 'Low', dangerCls: 'area-danger-low', desc: 'The heart of local manufacturing. Local gangs run small extortions and bootlegging operations.', reward: 'Cash +60, Exp +20', energyCost: 5, enemyName: "Local Thug", enemyLevel: 1, enemyHealth: 60, enemyAttack: 8, enemyDefense: 4 },
        { id: 'andheri', name: 'Andheri Clubs', danger: 'Medium', dangerCls: 'area-danger-med', desc: 'Commercial hub. Local clubs, bars, and shops pay hafta (weekly protection money) to the Area Don.', reward: 'Cash +150, Exp +45', energyCost: 10, enemyName: "Bouncer Gunda", enemyLevel: 3, enemyHealth: 120, enemyAttack: 15, enemyDefense: 8 },
        { id: 'colaba', name: 'Colaba Docks', danger: 'High', dangerCls: 'area-danger-high', desc: 'Elite shipping docks. Highly guarded smuggling operations controlled by the Top Don, Gabbar.', reward: 'Cash +350, Exp +90', energyCost: 20, enemyName: "Gabbar's Right Hand", enemyLevel: 5, enemyHealth: 200, enemyAttack: 22, enemyDefense: 14 }
    ],
    fightLog: []
};

// --- Sound Effects Synthesizer using Web Audio API ---
var SoundFX = {
    ctx: null,
    
    init: function() {
        if (!this.ctx) {
            var AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    playHit: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    },
    
    playHeal: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var now = ctx.currentTime;
        
        var notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
        notes.forEach(function(freq, index) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.08);
            
            gain.gain.setValueAtTime(0.0, now + index * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + index * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.2);
            
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.2);
        });
    },
    
    playVictory: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var now = ctx.currentTime;
        
        var scheduleNote = function(freq, start, duration) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            
            gain.gain.setValueAtTime(0.0, start);
            gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            
            osc.start(start);
            osc.stop(start + duration);
        };
        
        scheduleNote(261.63, now, 0.2); // C4
        scheduleNote(329.63, now, 0.2); // E4
        scheduleNote(392.00, now, 0.2); // G4
        
        scheduleNote(349.23, now + 0.2, 0.2); // F4
        scheduleNote(440.00, now + 0.2, 0.2); // A4
        scheduleNote(523.25, now + 0.2, 0.2); // C5
        
        scheduleNote(392.00, now + 0.4, 0.2); // G4
        scheduleNote(493.88, now + 0.4, 0.2); // B4
        scheduleNote(587.33, now + 0.4, 0.2); // D5
        
        scheduleNote(523.25, now + 0.6, 0.6); // C5
        scheduleNote(659.25, now + 0.6, 0.6); // E5
        scheduleNote(783.99, now + 0.6, 0.6); // G5
    },
    
    playDefeat: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var now = ctx.currentTime;
        
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.8);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
    },
    
    playLevelUp: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var now = ctx.currentTime;
        
        var notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // Scale C5 to C6
        notes.forEach(function(freq, index) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.05);
            
            gain.gain.setValueAtTime(0.0, now + index * 0.05);
            gain.gain.linearRampToValueAtTime(0.2, now + index * 0.05 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.15);
            
            osc.start(now + index * 0.05);
            osc.stop(now + index * 0.05 + 0.15);
        });
    },
    
    playBribe: function() {
        this.init();
        if (!this.ctx) return;
        var ctx = this.ctx;
        var now = ctx.currentTime;
        
        var scheduleTinkle = function(freq, start) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            
            gain.gain.setValueAtTime(0.0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
            
            osc.start(start);
            osc.stop(start + 0.1);
        };
        
        scheduleTinkle(987.77, now);     // B5
        scheduleTinkle(1318.51, now + 0.06); // E6
        scheduleTinkle(1567.98, now + 0.12); // G6
    }
};

// --- Ext JS Stores ---
var inventoryStore;
var areaStore;

// --- Helper Functions to Recalculate Player Stats ---
function recalculatePlayerStats() {
    var p = GameState.player;
    p.attack = p.baseAttack;
    p.defense = p.baseDefense;
    
    // Add weapon stats
    if (p.equippedWeapon) {
        p.attack += p.equippedWeapon.stat;
    }
    // Add armor stats
    if (p.equippedArmor) {
        p.defense += p.equippedArmor.stat;
    }
    
    // Apply Vikra's Rage buff if active
    if (p.characterClass === 'VIKRA' && p.specialActiveTurns > 0) {
        p.attack = Math.round(p.attack * 1.5);
    }
}

// --- Apply Character Stats for Selected Class ---
function applyCharacterStats(charName) {
    var p = GameState.player;
    p.characterClass = charName;
    p.username = charName;
    
    // Auto-equip Lathi
    var lathi = GameState.inventory.find(function(item) { return item.id === 2; });
    if (lathi) {
        lathi.equipped = true;
        p.equippedWeapon = lathi;
    }
    
    if (charName === 'MAYA') {
        p.maxHealth = 100;
        p.health = 100;
        p.maxEnergy = 60; // Maya starts with higher energy
        p.energy = 60;
        p.baseAttack = 12;
        p.baseDefense = 15; // Maya has higher base defense
    } else {
        // VIKRA
        p.maxHealth = 120; // Vikra starts with higher health
        p.health = 120;
        p.maxEnergy = 50;
        p.energy = 50;
        p.baseAttack = 18; // Vikra has higher base attack
        p.baseDefense = 8;
    }
    recalculatePlayerStats();
}

// --- App Initialization Function ---
function setupGameApp() {
    // 1. Define Stores
    inventoryStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'type', 'stat', 'statLabel', 'rating', 'qty', 'description', 'value', 'equipped'],
        data: GameState.inventory
    });

    areaStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'danger', 'dangerCls', 'desc', 'reward', 'energyCost', 'enemyName', 'enemyLevel', 'enemyHealth', 'enemyAttack', 'enemyDefense'],
        data: GameState.areas
    });

    // 2. Create the Viewport Container with Card Layout
    var mainViewport = Ext.create('Ext.container.Viewport', {
        layout: 'card',
        id: 'appViewport',
        items: [
            // Screen 1: Mock Login Form
            createLoginScreen(),
            // Screen 2: Game Main Container (Header + Content Cards + Bottom Nav)
            createMainGameContainer()
        ]
    });

    // Make state global accessible for convenience
    window.gameViewport = mainViewport;
    
    // Check local storage for session
    var savedUser = localStorage.getItem('mafia_streets_user');
    var savedChar = localStorage.getItem('mafia_streets_char') || 'MAYA';
    if (savedUser) {
        GameState.player.username = savedUser;
        GameState.player.characterClass = savedChar;
        applyCharacterStats(savedChar);
        // Skip login
        mainViewport.setActiveItem(1);
        updateUI();
    }
}

// --- Character Selection Global Variable & Selection Handler ---
var selectedChar = 'MAYA';

window.selectCharacter = function(charName) {
    selectedChar = charName;
    SoundFX.playBribe();
    
    var mayaEl = document.getElementById('char-card-maya');
    var vikraEl = document.getElementById('char-card-vikra');
    
    if (mayaEl && vikraEl) {
        if (charName === 'MAYA') {
            mayaEl.classList.add('selected-maya');
            vikraEl.classList.remove('selected-vikra');
        } else {
            vikraEl.classList.add('selected-vikra');
            mayaEl.classList.remove('selected-maya');
        }
    }
};

window.initLoginAnimations = function() {
    var maya = document.getElementById('char-card-maya');
    var vikra = document.getElementById('char-card-vikra');
    var container = document.querySelector('.char-select-container');
    
    if (!maya || !vikra || !container) {
        // Retry in case DOM hasn't rendered yet
        setTimeout(window.initLoginAnimations, 100);
        return;
    }
    
    // 1. Mouse Move Parallax Tilt Effect on Character Cards
    function setupTilt(card) {
        card.addEventListener('mousemove', function(e) {
            if (card.classList.contains('dragging')) return;
            var box = card.getBoundingClientRect();
            var x = e.clientX - box.left - box.width / 2;
            var y = e.clientY - box.top - box.height / 2;
            var rotateX = -(y / (box.height / 2)) * 15; // tilt angle max 15deg
            var rotateY = (x / (box.width / 2)) * 15;
            card.style.transform = 'perspective(500px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.06, 1.06, 1.06)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (card.classList.contains('dragging')) return;
            card.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    }
    setupTilt(maya);
    setupTilt(vikra);
    
    // 2. Drag & Drop Movable Physics
    function setupDrag(card, charName) {
        var startX = 0, startY = 0;
        var isDragging = false;
        
        function onStart(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            
            // Immediately select on touch/click
            window.selectCharacter(charName);
            
            isDragging = true;
            card.classList.add('dragging');
            
            var clientX = e.clientX || (e.touches && e.touches[0].clientX);
            var clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            var currentTransform = window.getComputedStyle(card).transform;
            var tx = 0, ty = 0;
            if (currentTransform && currentTransform !== 'none') {
                var matrix = currentTransform.split('(')[1].split(')')[0].split(',');
                if (matrix.length === 6) {
                    tx = parseFloat(matrix[4]);
                    ty = parseFloat(matrix[5]);
                } else if (matrix.length === 16) {
                    tx = parseFloat(matrix[12]);
                    ty = parseFloat(matrix[13]);
                }
            }
            
            card.dataset.dragTx = tx;
            card.dataset.dragTy = ty;
            
            startX = clientX;
            startY = clientY;
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        }
        
        function onMove(e) {
            if (!isDragging) return;
            // Prevent scrolling on touch screens
            if (e.cancelable) e.preventDefault();
            
            var clientX = e.clientX || (e.touches && e.touches[0].clientX);
            var clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            var dx = clientX - startX;
            var dy = clientY - startY;
            
            var origTx = parseFloat(card.dataset.dragTx) || 0;
            var origTy = parseFloat(card.dataset.dragTy) || 0;
            
            var newTx = origTx + dx;
            var newTy = origTy + dy;
            
            card.style.transform = 'translate3d(' + newTx + 'px, ' + newTy + 'px, 100px) scale(1.1)';
            card.style.zIndex = '999';
        }
        
        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('dragging');
            
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            
            // Spring/snap back to origin with smooth cubic-bezier transition
            card.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
            card.style.transform = 'translate3d(0px, 0px, 0px)';
            card.style.zIndex = '';
            
            setTimeout(function() {
                card.style.transition = '';
            }, 600);
        }
        
        card.addEventListener('mousedown', onStart);
        card.addEventListener('touchstart', onStart, { passive: false });
    }
    
    setupDrag(maya, 'MAYA');
    setupDrag(vikra, 'VIKRA');
};

// --- Screen 1: Login Screen Definition ---
function createLoginScreen() {
    return Ext.create('Ext.container.Container', {
        id: 'loginScreen',
        style: 'background: radial-gradient(circle, #1a0a0f 0%, #050508 100%);',
        layout: {
            type: 'vbox',
            align: 'center',
            pack: 'center'
        },
        listeners: {
            afterrender: function() {
                window.initLoginAnimations();
            }
        },
        items: [
            {
                xtype: 'box',
                html: '<div class="dynamic-logo-banner">' +
                      '  <div class="dynamic-logo-subtitle-top">War for the Streets</div>' +
                      '  <div class="dynamic-logo-title-animated">' +
                      '    <span style="--char-index:1" class="logo-char">M</span>' +
                      '    <span style="--char-index:2" class="logo-char">a</span>' +
                      '    <span style="--char-index:3" class="logo-char">f</span>' +
                      '    <span style="--char-index:4" class="logo-char">i</span>' +
                      '    <span style="--char-index:5" class="logo-char">a</span>' +
                      '    <span class="logo-space">&nbsp;</span>' +
                      '    <span style="--char-index:7" class="logo-char">S</span>' +
                      '    <span style="--char-index:8" class="logo-char">t</span>' +
                      '    <span style="--char-index:9" class="logo-char">r</span>' +
                      '    <span style="--char-index:10" class="logo-char">e</span>' +
                      '    <span style="--char-index:11" class="logo-char">e</span>' +
                      '    <span style="--char-index:12" class="logo-char">t</span>' +
                      '    <span style="--char-index:13" class="logo-char">s</span>' +
                      '  </div>' +
                      '  <div class="dynamic-logo-subtitle-bottom">The Underworld Rises</div>' +
                      '</div>'
            },
            {
                xtype: 'panel',
                cls: 'mafia-glass-panel',
                width: 340,
                maxHeight: 460,
                padding: '20 15',
                layout: 'anchor',
                items: [
                    {
                        xtype: 'box',
                        html: '<div class="mafia-title" style="padding-top: 0; font-size: 22px; line-height: 1.1; margin-bottom: 5px;">Mafia Streets</div>' +
                              '<div class="mafia-subtitle" style="font-size: 11px; margin-bottom: 10px;">Select your identity to claim the streets.</div>'
                    },
                    {
                        xtype: 'box',
                        id: 'loginCharSelectHTML',
                        html: '<div class="char-select-container">' +
                              '  <div id="char-card-maya" class="char-card selected-maya">' +
                              '    <div class="char-avatar-box" style="border-radius: 50%; overflow: hidden; border: 2px solid rgba(255,255,255,0.1);"><img src="img/maya.jpg" style="width: 100%; height: 100%; object-fit: cover;"></div>' +
                              '    <div class="char-name">Maya</div>' +
                              '    <div class="char-role">Mastermind</div>' +
                              '    <div class="char-desc">Tactical boss. Starts with high defense & max energy.</div>' +
                              '    <span class="char-stat-badge maya-badge">+Energy</span>' +
                              '  </div>' +
                              '  <div id="char-card-vikra" class="char-card">' +
                              '    <div class="char-avatar-box" style="border-radius: 50%; overflow: hidden; border: 2px solid rgba(255,255,255,0.1);"><img src="img/vikra.png" style="width: 100%; height: 100%; object-fit: cover;"></div>' +
                              '    <div class="char-name">Vikra</div>' +
                              '    <div class="char-role">Enforcer</div>' +
                              '    <div class="char-desc">Tough brawler. Starts with high health & max attack.</div>' +
                              '    <span class="char-stat-badge vikra-badge">+Attack</span>' +
                              '  </div>' +
                              '</div>'
                    },
                    {
                        xtype: 'button',
                        text: 'Claim the Streets',
                        cls: 'mafia-btn mafia-btn-red',
                        anchor: '100%',
                        height: 45,
                        margin: '15 0 0 0',
                        handler: handleLogin
                    }
                ]
            }
        ]
    });
}

function handleLogin() {
    // Save selection
    localStorage.setItem('mafia_streets_user', selectedChar);
    localStorage.setItem('mafia_streets_char', selectedChar);
    
    applyCharacterStats(selectedChar);
    
    Ext.getCmp('appViewport').setActiveItem(1);
    updateUI();
    
    SoundFX.playVictory();
    
    // Add a small notification
    Ext.toast({
        html: 'Assumed identity: ' + selectedChar,
        title: 'Welcome to Mafia Streets',
        align: 't',
        bodyStyle: 'background-color: rgba(25,25,35,0.9); border: 1px solid #9b59b6; color: #fff;',
        headerStyle: 'background-color: #9b59b6; color: #fff;',
        width: 250
    });
}

// --- Screen 2: Game Main Container (Top Stats + Center Card Stack + Bottom Nav) ---
function createMainGameContainer() {
    return Ext.create('Ext.container.Container', {
        id: 'mainGameContainer',
        layout: 'border',
        items: [
            // Top Stats Bar
            {
                xtype: 'container',
                region: 'north',
                cls: 'stats-container',
                layout: 'hbox',
                height: 65,
                items: [
                    {
                        xtype: 'container',
                        flex: 1,
                        layout: 'vbox',
                        pack: 'center',
                        items: [
                            {
                                xtype: 'label',
                                id: 'lblPlayerName',
                                style: 'font-weight: 800; font-size: 15px; color: #ffd700;',
                                text: 'ROOKIE'
                            },
                            {
                                xtype: 'label',
                                id: 'lblPlayerLevel',
                                style: 'font-size: 11px; color: #a4b0be;',
                                text: 'Level 1 (0/100 EXP)'
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        width: 90,
                        layout: 'vbox',
                        align: 'center',
                        pack: 'center',
                        items: [
                            {
                                xtype: 'label',
                                style: 'font-size: 10px; color: #ffd700; font-weight: 600; text-transform: uppercase;',
                                text: 'CASH'
                            },
                            {
                                xtype: 'label',
                                id: 'lblPlayerCash',
                                style: 'font-size: 16px; font-weight: 800; color: #2ecc71;',
                                text: '₹350'
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        flex: 1.5,
                        layout: 'vbox',
                        pack: 'center',
                        margin: '0 0 0 10',
                        items: [
                            {
                                xtype: 'progressbar',
                                id: 'barPlayerHealth',
                                cls: 'mafia-progress-health',
                                width: '100%',
                                value: 1.0,
                                text: 'HP: 100/100'
                            },
                            {
                                xtype: 'progressbar',
                                id: 'barPlayerEnergy',
                                cls: 'mafia-progress-energy',
                                width: '100%',
                                margin: '4 0 0 0',
                                value: 1.0,
                                text: 'ENERGY: 50/50'
                            }
                        ]
                    }
                ]
            },
            
            // Central Content Panels (Card Layout)
            {
                xtype: 'container',
                region: 'center',
                id: 'gameContentPanel',
                layout: 'card',
                style: 'background-color: #0b0b0f;',
                items: [
                    createDashboardScreen(),
                    createFightScreen(),
                    createMapScreen(),
                    createInventoryScreen()
                ]
            },
            
            // Bottom Nav Bar
            {
                xtype: 'toolbar',
                region: 'south',
                height: 60,
                style: 'background-color: #121218; border-top: 1px solid rgba(255,255,255,0.08); padding: 5px;',
                layout: {
                    type: 'hbox',
                    align: 'stretch',
                    pack: 'center'
                },
                defaults: {
                    flex: 1,
                    cls: 'mafia-btn mafia-btn-dark',
                    scale: 'medium',
                    iconAlign: 'top',
                    margin: '0 2'
                },
                items: [
                    {
                        id: 'navBtnDashboard',
                        iconCls: 'fa fa-home',
                        text: 'Dashboard',
                        handler: function() { switchSubScreen(0); }
                    },
                    {
                        id: 'navBtnFight',
                        iconCls: 'fa fa-crosshairs',
                        text: 'Fight',
                        handler: function() { 
                            // Initialize fight with default enemy if none active
                            if (!GameState.currentFightArea) {
                                initFightState(null);
                            }
                            switchSubScreen(1); 
                        }
                    },
                    {
                        id: 'navBtnMap',
                        iconCls: 'fa fa-globe',
                        text: 'Map',
                        handler: function() { switchSubScreen(2); }
                    },
                    {
                        id: 'navBtnInventory',
                        iconCls: 'fa fa-briefcase',
                        text: 'Stash',
                        handler: function() { switchSubScreen(3); }
                    },
                    {
                        iconCls: 'fa fa-sign-out',
                        text: 'Logout',
                        flex: 0.8,
                        cls: 'mafia-btn mafia-btn-dark',
                        style: 'border: 1px solid rgba(231,76,60,0.3) !important;',
                        handler: handleLogout
                    }
                ]
            }
        ]
    });
}

function handleLogout() {
    Ext.Msg.confirm('Leave Mafia Streets?', 'Are you sure you want to log out of the underworld?', function(choice) {
        if (choice === 'yes') {
            localStorage.removeItem('mafia_streets_user');
            localStorage.removeItem('mafia_streets_char');
            Ext.getCmp('appViewport').setActiveItem(0);
            
            // Reset state to default
            GameState.player = {
                username: "MAYA",
                characterClass: "MAYA",
                level: 1,
                exp: 0,
                expNeeded: 100,
                cash: 350,
                health: 100,
                maxHealth: 100,
                energy: 50,
                maxEnergy: 50,
                baseAttack: 15,
                baseDefense: 10,
                attack: 15,
                defense: 10,
                equippedWeapon: null,
                equippedArmor: null,
                specialCooldown: 0,
                specialActiveTurns: 0
            };
            GameState.inventory.forEach(function(item) {
                if (item.id === 4) item.qty = 3; // Refill vada pavs
                else if (item.id === 3) item.qty = 0; // Lock vest
                else item.qty = 1;
                item.equipped = false;
                item.rating = 1;
                if (item.id === 1) item.stat = 12;
                if (item.id === 2) item.stat = 5;
            });
            inventoryStore.loadData(GameState.inventory);
            GameState.currentFightArea = null;
        }
    });
}

function switchSubScreen(index) {
    var contentPanel = Ext.getCmp('gameContentPanel');
    contentPanel.setActiveItem(index);
    
    // Highlight active nav button
    var buttons = ['navBtnDashboard', 'navBtnFight', 'navBtnMap', 'navBtnInventory'];
    buttons.forEach(function(btnId, i) {
        var btn = Ext.getCmp(btnId);
        if (btn) {
            if (i === index) {
                btn.setStyle('background', 'linear-gradient(135deg, #e74c3c, #c0392b) !important');
                btn.setStyle('border', 'none !important');
            } else {
                btn.setStyle('background', 'rgba(40, 40, 50, 0.8) !important');
                btn.setStyle('border', '1px solid rgba(255, 255, 255, 0.1) !important');
            }
        }
    });

    if (index === 3) {
        // Refresh inventory store
        inventoryStore.loadData(GameState.inventory);
    }
}

// --- Screen 2a: Dashboard Screen ---
function createDashboardScreen() {
    return Ext.create('Ext.container.Container', {
        id: 'dashboardScreen',
        scrollable: 'y',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            // Logo Banner
            {
                xtype: 'box',
                html: '<div style="display:flex; justify-content:center; margin: 10px 0;"><div class="dynamic-logo-banner" style="margin-bottom:0; max-width:280px; padding:12px 10px;">' +
                      '  <div class="dynamic-logo-subtitle-top" style="font-size:9px; letter-spacing:3px;">War for the Streets</div>' +
                      '  <div class="dynamic-logo-title-animated" style="font-size:24px;">' +
                      '    <span style="--char-index:1" class="logo-char">M</span>' +
                      '    <span style="--char-index:2" class="logo-char">a</span>' +
                      '    <span style="--char-index:3" class="logo-char">f</span>' +
                      '    <span style="--char-index:4" class="logo-char">i</span>' +
                      '    <span style="--char-index:5" class="logo-char">a</span>' +
                      '    <span class="logo-space" style="width:6px;">&nbsp;</span>' +
                      '    <span style="--char-index:7" class="logo-char">S</span>' +
                      '    <span style="--char-index:8" class="logo-char">t</span>' +
                      '    <span style="--char-index:9" class="logo-char">r</span>' +
                      '    <span style="--char-index:10" class="logo-char">e</span>' +
                      '    <span style="--char-index:11" class="logo-char">e</span>' +
                      '    <span style="--char-index:12" class="logo-char">t</span>' +
                      '    <span style="--char-index:13" class="logo-char">s</span>' +
                      '  </div>' +
                      '  <div class="dynamic-logo-subtitle-bottom" style="font-size:8px; letter-spacing:2px;">The Underworld Rises</div>' +
                      '</div></div>'
            },
            // Rhea Guide Section
            {
                xtype: 'panel',
                cls: 'mafia-glass-panel',
                layout: 'hbox',
                padding: 15,
                items: [
                    {
                        xtype: 'container',
                        width: 90,
                        height: 110,
                        cls: 'portrait-container red-glow',
                        items: [
                            {
                                xtype: 'box',
                                html: '<img src="img/rhea.png" class="portrait-image">'
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        flex: 1,
                        margin: '0 0 0 15',
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        items: [
                            {
                                xtype: 'box',
                                html: '<div class="dialogue-speaker">RHEA (Mafia Don)</div>' +
                                      '<div class="dialogue-text" id="rheaDialogue">"Listen up. Mafia Streets aren\'t for the soft-hearted. If you want respect, you earn it by fighting Gabbar\'s gundas. Go raid territories on the Map or jump straight into a Fight!"</div>'
                            }
                        ]
                    }
                ]
            },
            // Stats Panel
            {
                xtype: 'panel',
                cls: 'mafia-glass-panel',
                padding: 15,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [
                    {
                        xtype: 'box',
                        html: '<div style="font-size: 16px; font-weight: 700; color: #ffd700; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase;"><i class="fa fa-sliders" style="margin-right: 8px;"></i>UNDERWORLD STATS</div>'
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        defaults: {
                            flex: 1,
                            xtype: 'container',
                            layout: 'vbox',
                            align: 'center'
                        },
                        items: [
                            {
                                items: [
                                    { xtype: 'label', cls: 'stat-label', text: 'ATTACK' },
                                    { xtype: 'label', id: 'lblPlayerAttack', cls: 'stat-value stat-value-red', text: '15' },
                                    { xtype: 'label', id: 'lblEquippedWeapon', style: 'font-size: 10px; color:#a4b0be;', text: 'No Weapon' }
                                ]
                            },
                            {
                                items: [
                                    { xtype: 'label', cls: 'stat-label', text: 'DEFENSE' },
                                    { xtype: 'label', id: 'lblPlayerDefense', cls: 'stat-value stat-value-gold', text: '10' },
                                    { xtype: 'label', id: 'lblEquippedArmor', style: 'font-size: 10px; color:#a4b0be;', text: 'No Armor' }
                                ]
                            },
                            {
                                items: [
                                    { xtype: 'label', cls: 'stat-label', text: 'EXPERIENCE' },
                                    { xtype: 'label', id: 'lblPlayerExpText', cls: 'stat-value', style: 'color: #3498db;', text: '0 / 100' },
                                    {
                                        xtype: 'progressbar',
                                        id: 'barPlayerExp',
                                        width: 80,
                                        height: 10,
                                        value: 0,
                                        style: 'border-radius: 4px; margin-top: 4px;'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            // Fast Travel Actions
            {
                xtype: 'container',
                layout: 'hbox',
                padding: '0 5',
                items: [
                    {
                        xtype: 'button',
                        text: '<i class="fa fa-crosshairs"></i> Attack Rival',
                        cls: 'mafia-btn mafia-btn-red',
                        flex: 1,
                        height: 48,
                        margin: 5,
                        handler: function() { 
                            if (!GameState.currentFightArea) {
                                initFightState(null);
                            }
                            switchSubScreen(1); 
                        }
                    },
                    {
                        xtype: 'button',
                        text: '<i class="fa fa-globe"></i> Explore Map',
                        cls: 'mafia-btn mafia-btn-gold',
                        flex: 1,
                        height: 48,
                        margin: 5,
                        handler: function() { switchSubScreen(2); }
                    }
                ]
            },
            // Underworld News Ticker
            {
                xtype: 'container',
                cls: 'news-ticker-container',
                height: 28,
                margin: '10 0 0 0',
                html: '<div class="news-ticker-label">🚨 Street Gossip</div>' +
                      '<div class="news-ticker-wrapper">' +
                      '  <div class="news-ticker-text" id="tickerText">LOADING LATEST STREET NEWS...</div>' +
                      '</div>',
                listeners: {
                    afterrender: function() {
                        var news = [
                            "POLICE DEPLOY ADDITIONAL FORCE IN DHARAVI SLUMS...",
                            "GABBAR PLOTS TO STRIKE BACK IN ANDHERI CLUBS...",
                            "LOCAL GANGS REPORT MAYA ASSUMING CONTROL OVER TERRITORIES...",
                            "VIKRA RAIDED A STASH IN COLABA DOCKS - LOOTED ₹10,000 CASH...",
                            "INSPECTOR SHINDE DECLARES ACTIVE CRACKDOWN ON MAFIA STREETS...",
                            "VADA PAV DEMAND SHOT UP BY 200% FOLLOWING SYNDICATE WARS...",
                            "MAFIA STREETS WITNESS MAYA & VIKRA RISING TO THE TOP..."
                        ];
                        setTimeout(function() {
                            var tickerEl = document.getElementById('tickerText');
                            if (tickerEl) {
                                tickerEl.innerHTML = news.join(' &nbsp; &nbsp; ⚡ &nbsp; &nbsp; ');
                            }
                        }, 500);
                    }
                }
            }
        ]
    });
}

// --- Screen 2b: Fight Screen ---
function createFightScreen() {
    return Ext.create('Ext.container.Container', {
        id: 'fightScreen',
        scrollable: 'y',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            // Fighter Comparison Layout
            {
                xtype: 'container',
                layout: 'hbox',
                padding: '15 10 5 10',
                items: [
                    // Player Side
                    {
                        xtype: 'container',
                        flex: 1,
                        layout: 'vbox',
                        align: 'center',
                        items: [
                            {
                                xtype: 'label',
                                id: 'lblFightPlayerName',
                                style: 'font-weight: 800; font-size: 14px; color: #ffd700; text-transform: uppercase;',
                                text: 'ROOKIE'
                            },
                            {
                                xtype: 'box',
                                width: 80,
                                height: 100,
                                cls: 'portrait-container',
                                margin: '5 0',
                                id: 'playerFightAvatarContainer',
                                html: '<div style="background-color:#1e272e; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><i class="fa fa-user-secret" style="font-size: 45px; color:#a4b0be;"></i></div>'
                            },
                            {
                                xtype: 'progressbar',
                                id: 'barFightPlayerHealth',
                                cls: 'mafia-progress-health',
                                width: 90,
                                value: 1.0,
                                text: '100 HP'
                            }
                        ]
                    },
                    // VS Icon
                    {
                        xtype: 'container',
                        width: 50,
                        layout: {
                            type: 'vbox',
                            align: 'center',
                            pack: 'center'
                        },
                        height: 140,
                        items: [
                            {
                                xtype: 'box',
                                html: '<div style="font-family:\'Outfit\',sans-serif; font-size:24px; font-weight:800; color:#e74c3c; font-style:italic; text-shadow:0 0 10px rgba(231,76,60,0.6);">VS</div>'
                            }
                        ]
                    },
                    // Enemy Side
                    {
                        xtype: 'container',
                        flex: 1,
                        layout: 'vbox',
                        align: 'center',
                        items: [
                            {
                                xtype: 'label',
                                id: 'lblFightEnemyName',
                                style: 'font-weight: 800; font-size: 14px; color: #e74c3c; text-transform: uppercase;',
                                text: "GABBAR'S GUNDA"
                            },
                            {
                                xtype: 'container',
                                width: 80,
                                height: 100,
                                cls: 'portrait-container red-glow',
                                id: 'enemyFightAvatarContainer',
                                margin: '5 0',
                                items: [
                                    {
                                        xtype: 'box',
                                        html: '<img src="img/gunda.png" class="portrait-image">'
                                    }
                                ]
                            },
                            {
                                xtype: 'progressbar',
                                id: 'barFightEnemyHealth',
                                cls: 'mafia-progress-enemy',
                                width: 90,
                                value: 1.0,
                                text: '100 HP'
                            }
                        ]
                    }
                ]
            },
            
            // Action Buttons
            {
                xtype: 'panel',
                cls: 'mafia-glass-panel',
                padding: 10,
                layout: 'hbox',
                defaults: {
                    flex: 1,
                    xtype: 'button',
                    cls: 'mafia-btn',
                    height: 40,
                    margin: '0 3'
                },
                items: [
                    {
                        text: '<i class="fa fa-hand-rock-o"></i> Attack',
                        cls: 'mafia-btn mafia-btn-red',
                        id: 'btnFightAttack',
                        handler: performAttack
                    },
                    {
                        text: '<i class="fa fa-shield"></i> Dodge',
                        cls: 'mafia-btn mafia-btn-gold',
                        id: 'btnFightDodge',
                        handler: performDodge
                    },
                    {
                        text: '<i class="fa fa-plus-circle"></i> Heal',
                        cls: 'mafia-btn mafia-btn-dark',
                        id: 'btnFightHeal',
                        handler: performHeal
                    },
                    {
                        text: '<i class="fa fa-bolt"></i> Special',
                        cls: 'mafia-btn mafia-btn-purple',
                        id: 'btnFightSpecial',
                        handler: performSpecialAbility
                    }
                ]
            },
            
            // Battle Log Console
            {
                xtype: 'panel',
                cls: 'mafia-glass-panel',
                title: 'BATTLE LOG',
                id: 'fightLogPanel',
                height: 180,
                layout: 'fit',
                bodyPadding: 10,
                items: [
                    {
                        xtype: 'container',
                        id: 'fightLogContainer',
                        scrollable: 'y',
                        cls: 'fight-log-panel',
                        style: 'padding: 8px; color: #fff;',
                        html: '<div class="fight-log-entry fight-log-system">Click Attack to strike down the enemy! Costs 2 Energy.</div>'
                    }
                ]
            }
        ]
    });
}

function initFightState(areaObj) {
    if (areaObj) {
        // Specific area thug fight
        GameState.currentFightArea = areaObj;
        GameState.enemy = {
            name: areaObj.enemyName,
            level: areaObj.enemyLevel,
            health: areaObj.enemyHealth,
            maxHealth: areaObj.enemyHealth,
            attack: areaObj.enemyAttack,
            defense: areaObj.enemyDefense,
            cashReward: Math.round(areaObj.enemyHealth * 1.5 + Math.random() * 40),
            expReward: Math.round(areaObj.enemyLevel * 15 + Math.random() * 10)
        };
    } else {
        // Default random thug fight
        GameState.currentFightArea = null;
        var pLevel = GameState.player.level;
        GameState.enemy = {
            name: "Gabbar's Thug",
            level: pLevel,
            health: 80 + pLevel * 10,
            maxHealth: 80 + pLevel * 10,
            attack: 10 + pLevel * 2,
            defense: 5 + pLevel,
            cashReward: 100 + pLevel * 15,
            expReward: 30 + pLevel * 5
        };
    }
    
    GameState.fightLog = ['<div class="fight-log-entry fight-log-system">A wild ' + GameState.enemy.name + ' (Level ' + GameState.enemy.level + ') blocks your path!</div>'];
    GameState.player.specialCooldown = 0;
    GameState.player.specialActiveTurns = 0;
    recalculatePlayerStats();
    updateFightUI();
}

function updateFightUI() {
    var p = GameState.player;
    var e = GameState.enemy;
    
    // Labels
    var lblPlayer = Ext.getCmp('lblFightPlayerName');
    if (lblPlayer) lblPlayer.setText(p.username);
    
    var lblEnemy = Ext.getCmp('lblFightEnemyName');
    if (lblEnemy) lblEnemy.setText(e.name + " [LVL " + e.level + "]");
    
    // Update player avatar based on character
    var playerAvatar = Ext.getCmp('playerFightAvatarContainer');
    if (playerAvatar) {
        if (p.characterClass === 'MAYA') {
            playerAvatar.setHtml('<img src="img/maya.jpg" class="portrait-image" style="object-fit: cover; width: 100%; height: 100%;">');
        } else {
            playerAvatar.setHtml('<img src="img/vikra.png" class="portrait-image" style="object-fit: cover; width: 100%; height: 100%;">');
        }
    }
    
    // Progress Bars
    var barPlayer = Ext.getCmp('barFightPlayerHealth');
    if (barPlayer) {
        var pct = p.health / p.maxHealth;
        barPlayer.setValue(pct);
        barPlayer.updateText(Math.round(p.health) + ' / ' + p.maxHealth + ' HP');
    }
    
    var barEnemy = Ext.getCmp('barFightEnemyHealth');
    if (barEnemy) {
        var pct = e.health / e.maxHealth;
        barEnemy.setValue(pct);
        barEnemy.updateText(Math.round(e.health) + ' / ' + e.maxHealth + ' HP');
    }
    
    // Log
    var logContainer = Ext.getCmp('fightLogContainer');
    if (logContainer) {
        logContainer.setHtml(GameState.fightLog.join(''));
        
        // Auto scroll to bottom
        setTimeout(function() {
            var el = logContainer.getEl();
            if (el && el.dom) {
                var scroller = el.down('.x-scroll-container');
                if (scroller && scroller.dom) {
                    scroller.dom.scrollTop = scroller.dom.scrollHeight;
                }
            }
        }, 100);
    }
    
    // Disable buttons if player is knocked out
    var btnAttack = Ext.getCmp('btnFightAttack');
    var btnDodge = Ext.getCmp('btnFightDodge');
    var btnHeal = Ext.getCmp('btnFightHeal');
    var btnSpecial = Ext.getCmp('btnFightSpecial');
    
    var isDead = p.health <= 0 || e.health <= 0;
    if (btnAttack) btnAttack.setDisabled(isDead);
    if (btnDodge) btnDodge.setDisabled(isDead);
    
    // Disable heal if no vada pavs left
    var vadaPav = GameState.inventory.find(function(item) { return item.id === 4; });
    if (btnHeal) btnHeal.setDisabled(isDead || !vadaPav || vadaPav.qty <= 0);
    
    // Manage Special button
    if (btnSpecial) {
        var specName = p.characterClass === 'MAYA' ? 'Calculated' : 'Rage';
        var isSpecialCD = p.specialCooldown > 0;
        btnSpecial.setDisabled(isDead || isSpecialCD);
        if (isSpecialCD) {
            btnSpecial.setText('<i class="fa fa-bolt"></i> ' + specName + ' (CD: ' + p.specialCooldown + ')');
        } else {
            btnSpecial.setText('<i class="fa fa-bolt"></i> ' + specName);
        }
    }
}

function addFightLog(msg, type) {
    var cls = 'fight-log-system';
    if (type === 'player') cls = 'fight-log-player';
    else if (type === 'enemy') cls = 'fight-log-enemy';
    
    GameState.fightLog.push('<div class="fight-log-entry ' + cls + '">' + msg + '</div>');
    updateFightUI();
}

// Fight action: Special Ability
function performSpecialAbility() {
    var p = GameState.player;
    var e = GameState.enemy;
    
    if (p.health <= 0 || e.health <= 0) return;
    
    if (p.specialCooldown > 0) {
        Ext.Msg.alert('On Cooldown', 'Special ability is on cooldown for ' + p.specialCooldown + ' more turns.');
        return;
    }
    
    if (p.characterClass === 'MAYA') {
        // Maya: Calculated Strike
        var cost = 5;
        if (p.energy < cost) {
            Ext.Msg.alert('Out of Energy', 'You need ' + cost + ' energy for Calculated Strike.');
            return;
        }
        p.energy -= cost;
        
        // Armor piercing double damage
        var dmgDealt = Math.round(p.attack * 2 * (0.9 + Math.random() * 0.2));
        e.health = Math.max(0, e.health - dmgDealt);
        
        // Restore 10 Energy (net gain +5 energy)
        p.energy = Math.min(p.maxEnergy, p.energy + 10);
        p.specialCooldown = 3;
        
        // Shake enemy avatar
        var enemyAvatar = Ext.getCmp('enemyFightAvatarContainer');
        if (enemyAvatar && enemyAvatar.getEl()) {
            enemyAvatar.getEl().addCls('animate-shake');
            setTimeout(function() {
                if (enemyAvatar.getEl()) enemyAvatar.getEl().removeCls('animate-shake');
            }, 300);
        }
        
        SoundFX.playLevelUp();
        addFightLog('Maya uses Calculated Strike! Armor bypassed, dealt ' + dmgDealt + ' damage and gained +10 Energy!', 'player');
        showDamageText(enemyAvatar, dmgDealt + ' CRIT', 'enemy');
        
        if (e.health <= 0) {
            handleFightEnd(true);
            return;
        }
        
        enemyCounterStrike();
        
    } else {
        // Vikra: Underworld Rage
        var cost = 8;
        if (p.energy < cost) {
            Ext.Msg.alert('Out of Energy', 'You need ' + cost + ' energy for Underworld Rage.');
            return;
        }
        p.energy -= cost;
        
        // Instant Heal 15 HP
        p.health = Math.min(p.maxHealth, p.health + 15);
        p.specialActiveTurns = 2;
        p.specialCooldown = 3;
        
        recalculatePlayerStats();
        
        // Show float text
        var playerAvatar = Ext.getCmp('playerFightAvatarContainer');
        showDamageText(playerAvatar, '+15 HP', 'player-heal');
        
        SoundFX.playHeal();
        addFightLog('Vikra unleashes Underworld Rage! Heals 15 HP, Attack power boosted by 50% for 2 turns!', 'player');
        
        updateUI();
        updateFightUI();
        
        enemyCounterStrike();
    }
}

// Fight action: Attack
function performAttack() {
    var p = GameState.player;
    var e = GameState.enemy;
    
    if (p.energy < 2) {
        Ext.Msg.alert('Out of Energy', 'You need at least 2 Energy to attack. Rest or wait for energy.');
        return;
    }
    
    p.energy -= 2;
    
    // Player hits Enemy
    var dmgDealt = Math.max(3, Math.round((p.attack - e.defense/2) * (0.8 + Math.random() * 0.4)));
    e.health = Math.max(0, e.health - dmgDealt);
    
    // Shake Enemy Avatar
    var enemyAvatar = Ext.getCmp('enemyFightAvatarContainer');
    if (enemyAvatar && enemyAvatar.getEl()) {
        enemyAvatar.getEl().addCls('animate-shake');
        setTimeout(function() {
            if (enemyAvatar.getEl()) enemyAvatar.getEl().removeCls('animate-shake');
        }, 300);
    }
    
    SoundFX.playHit();
    addFightLog('You strike ' + e.name + ' for ' + dmgDealt + ' damage!', 'player');
    showDamageText(enemyAvatar, dmgDealt, 'enemy');
    
    if (e.health <= 0) {
        handleFightEnd(true);
        return;
    }
    
    // Enemy strikes back
    enemyCounterStrike();
}

function performDodge() {
    var p = GameState.player;
    var e = GameState.enemy;
    
    if (p.energy < 1) {
        Ext.Msg.alert('Out of Energy', 'You need at least 1 Energy to dodge.');
        return;
    }
    
    p.energy -= 1;
    addFightLog('You take a defensive stance, preparing to dodge!', 'system');
    
    // Enemy strikes back but with halved attack power
    enemyCounterStrike(true);
}

function performHeal() {
    var p = GameState.player;
    var vadaPav = GameState.inventory.find(function(item) { return item.id === 4; });
    
    if (vadaPav && vadaPav.qty > 0) {
        vadaPav.qty--;
        var healAmt = vadaPav.stat;
        p.health = Math.min(p.maxHealth, p.health + healAmt);
        
        // Refresh stores
        inventoryStore.loadData(GameState.inventory);
        
        SoundFX.playHeal();
        addFightLog('You ate a Vada Pav and restored ' + healAmt + ' HP! (' + vadaPav.qty + ' remaining)', 'player');
        
        // Show floating heal number
        var playerAvatar = Ext.getCmp('playerFightAvatarContainer');
        showDamageText(playerAvatar, '+' + healAmt, 'player-heal');
        
        updateUI();
        updateFightUI();
        
        // Enemy still attacks
        enemyCounterStrike();
    }
}

function enemyCounterStrike(isDodged) {
    var p = GameState.player;
    var e = GameState.enemy;
    
    setTimeout(function() {
        var baseDmg = e.attack - p.defense/2;
        if (isDodged) {
            baseDmg = baseDmg * 0.3; // 70% damage reduction
        }
        var dmgReceived = Math.max(1, Math.round(baseDmg * (0.8 + Math.random() * 0.4)));
        p.health = Math.max(0, p.health - dmgReceived);
        
        // Shake Player Avatar
        var playerAvatar = Ext.getCmp('playerFightAvatarContainer');
        if (playerAvatar && playerAvatar.getEl()) {
            playerAvatar.getEl().addCls('animate-shake');
            setTimeout(function() {
                if (playerAvatar.getEl()) playerAvatar.getEl().removeCls('animate-shake');
            }, 300);
        }
        
        if (isDodged) {
            addFightLog('You successfully dodged! You only received ' + dmgReceived + ' damage from ' + e.name + '.', 'enemy');
        } else {
            addFightLog(e.name + ' retaliates and hits you for ' + dmgReceived + ' damage!', 'enemy');
        }
        showDamageText(playerAvatar, dmgReceived, 'player');
        
        // Decrement special cooldown
        if (p.specialCooldown > 0) {
            p.specialCooldown--;
        }
        
        // Decrement special active turns (e.g. Vikra's Rage)
        if (p.specialActiveTurns > 0) {
            p.specialActiveTurns--;
            if (p.specialActiveTurns === 0) {
                // Restore normal stats
                recalculatePlayerStats();
                addFightLog("Underworld Rage has worn off.", "system");
            }
        }

        updateUI();
        updateFightUI();
        
        if (p.health <= 0) {
            handleFightEnd(false);
        }
    }, 600);
}

function showDamageText(targetComp, text, type) {
    if (!targetComp || !targetComp.getEl()) return;
    var el = targetComp.getEl();
    var box = el.getBox();
    
    var color = '#e74c3c'; // red for damage to player
    var cls = 'damage-text-player';
    if (type === 'enemy') {
        color = '#2ecc71'; // green for damage to enemy
        cls = 'damage-text-enemy';
    } else if (type === 'player-heal') {
        color = '#2ecc71';
        cls = 'damage-text-enemy';
    }
    
    var floatingEl = Ext.dom.Helper.insertHtml('afterBegin', document.body, 
        '<div class="damage-text-indicator ' + cls + '" style="left: ' + (box.left + box.width/2 - 10) + 'px; top: ' + (box.top + 20) + 'px;">' + text + '</div>'
    );
    
    // Remove element after animation
    setTimeout(function() {
        if (floatingEl) {
            if (typeof floatingEl.remove === 'function') {
                floatingEl.remove();
            } else if (floatingEl.parentNode) {
                floatingEl.parentNode.removeChild(floatingEl);
            }
        }
    }, 800);
}

function handleFightEnd(isWin) {
    var p = GameState.player;
    var e = GameState.enemy;
    
    // Show Overlay popup window
    var title = isWin ? 'VICTORY' : 'DEFEATED';
    var bgCls = isWin ? 'background-color: #2ecc71;' : 'background-color: #e74c3c;';
    var text = '';
    
    if (isWin) {
        p.cash += e.cashReward;
        p.exp += e.expReward;
        text = '<div style="text-align:center; padding:15px; font-size:14px;">' +
               '<h2 style="color:#2ecc71; margin-bottom:10px;">YOU WON THE FIGHT!</h2>' +
               '<p>You knocked out <b>' + e.name + '</b>.</p>' +
               '<div style="background-color:rgba(255,255,255,0.05); padding:10px; margin:15px 0; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">' +
               '💰 <b>LOOTED CASH:</b> <span style="color:#2ecc71; font-weight:bold;">₹' + e.cashReward + '</span><br>' +
               '⭐ <b>EXP GAINED:</b> <span style="color:#3498db; font-weight:bold;">+' + e.expReward + '</span>' +
               '</div>' +
               '</div>';
               
        var isLevelUp = false;
        // Check Level Up
        if (p.exp >= p.expNeeded) {
            p.level++;
            p.exp -= p.expNeeded;
            p.expNeeded = Math.round(p.expNeeded * 1.5);
            p.maxHealth += 10;
            p.health = p.maxHealth;
            p.maxEnergy += 5;
            p.energy = p.maxEnergy;
            p.baseAttack += 3;
            p.baseDefense += 2;
            recalculatePlayerStats();
            text += '<div style="text-align:center; color:#f1c40f; font-weight:bold; font-size:16px; margin-top:10px; animation:shake 0.5s;">' +
                    '🎉 LEVEL UP! You are now Level ' + p.level + '! 🎉</div>';
            isLevelUp = true;
        }
        
        if (isLevelUp) {
            SoundFX.playLevelUp();
        } else {
            SoundFX.playVictory();
        }
    } else {
        // Lost
        SoundFX.playDefeat();
        var cashLost = Math.round(p.cash * 0.1);
        p.cash = Math.max(0, p.cash - cashLost);
        p.health = 20; // Rhea revives you with 20 HP
        text = '<div style="text-align:center; padding:15px; font-size:14px;">' +
               '<h2 style="color:#e74c3c; margin-bottom:10px;">YOU GOT KNOCKED OUT!</h2>' +
               '<p><b>Rhea</b> dragged your unconscious body out of the fight.</p>' +
               '<div style="background-color:rgba(255,255,255,0.05); padding:10px; margin:15px 0; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">' +
               '💀 <b>PENALTY:</b> Lost ₹' + cashLost + ' cash.<br>' +
               '🩺 Rhea patched you up to <span style="color:#e74c3c; font-weight:bold;">20 HP</span>.' +
               '</div>' +
               '<p style="font-size:12px; color:#a4b0be; font-style:italic;">"Eat some Vada Pav to recover before fighting again!"</p>' +
               '</div>';
    }
    
    updateUI();
    
    // Reset fight area so subsequent clicks on Fight tab start a new fight
    GameState.currentFightArea = null;
    
    var win = Ext.create('Ext.window.Window', {
        title: title,
        modal: true,
        width: 320,
        closable: false,
        resizable: false,
        cls: 'mafia-glass-panel',
        bodyStyle: 'background-color: #121216; color: #fff;',
        items: [
            {
                xtype: 'box',
                html: text
            }
        ],
        buttons: [
            {
                text: 'Back to Dashboard',
                cls: 'mafia-btn mafia-btn-red',
                width: '100%',
                height: 40,
                handler: function() {
                    win.close();
                    switchSubScreen(0); // return to dashboard
                    
                    // Reset dialogue text based on win/loss
                    var dial = document.getElementById('rheaDialogue');
                    if (dial) {
                        if (isWin) {
                            dial.innerHTML = '"Nice work! You put that thug in his place. But don\'t get cocky. Mafia Streets are dangerous, and Gabbar is still watching."';
                        } else {
                            dial.innerHTML = '"Damn it! I had to pay off the local doctors to save your neck. Buy some gear or use some Vada Pavs before you try that again!"';
                        }
                    }
                }
            }
        ]
    });
    
    win.show();
}

// --- Screen 2c: Map / Area Navigation Screen ---
function createMapScreen() {
    return Ext.create('Ext.container.Container', {
        id: 'mapScreen',
        scrollable: 'y',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            {
                xtype: 'box',
                html: '<div class="mafia-title" style="font-size:22px; padding: 12px 0 2px 0;"><i class="fa fa-map-marker" style="margin-right:8px;"></i>Mafia Streets Territories</div>' +
                      '<div class="mafia-subtitle" style="font-size:12px; margin-bottom:10px;">Select an area to explore or challenge local bosses.</div>'
            },
            {
                xtype: 'dataview',
                id: 'areaListView',
                store: areaStore,
                itemSelector: 'div.area-card',
                tpl: new Ext.XTemplate(
                    '<div style="padding: 0 10px;">',
                    '<tpl for=".">',
                        '<div class="area-card" style="margin-bottom: 12px;">',
                            '<div style="display:flex; justify-content:space-between; align-items:center;">',
                                '<span class="area-title">{name}</span>',
                                '<span class="area-danger {dangerCls}">{danger} Risk</span>',
                            '</div>',
                            '<div style="color: #a4b0be; font-size:12px; margin: 6px 0;">{desc}</div>',
                            '<div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:6px; margin-top:6px; font-size:11px; display:flex; justify-content:space-between;">',
                                '<span>⭐ Rewards: <span style="color:#ffd700;">{reward}</span></span>',
                                '<span style="color:#3498db; font-weight:bold;">⚡ Cost: {energyCost} Energy</span>',
                            '</div>',
                        '</div>',
                    '</tpl>',
                    '</div>'
                ),
                listeners: {
                    itemclick: function(view, record) {
                        showAreaActionPopup(record.data);
                    }
                }
            }
        ]
    });
}

function showAreaActionPopup(area) {
    var p = GameState.player;
    var cost = area.energyCost;
    
    var win = Ext.create('Ext.window.Window', {
        title: area.name,
        modal: true,
        width: 320,
        resizable: false,
        bodyPadding: 15,
        bodyStyle: 'background-color: #121216; color: #fff;',
        items: [
            {
                xtype: 'box',
                html: '<div style="font-size: 13px; line-height:1.5;">' +
                      '<p>' + area.desc + '</p>' +
                      '<div style="background-color:rgba(255,255,255,0.05); padding:10px; margin:15px 0; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">' +
                      '⚡ <b>Energy Required:</b> ' + cost + ' (Current: ' + p.energy + ')<br>' +
                      '☠️ <b>Local Boss:</b> ' + area.enemyName + ' (Level ' + area.enemyLevel + ')<br>' +
                      '🎁 <b>Rewards:</b> ' + area.reward +
                      '</div>' +
                      '</div>'
            }
        ],
        buttons: [
            {
                text: 'Fight Boss',
                cls: 'mafia-btn mafia-btn-red',
                handler: function() {
                    if (p.energy < cost) {
                        Ext.Msg.alert('Insufficient Energy', 'You need ' + cost + ' energy to fight in this territory. Rest to recover energy.');
                        return;
                    }
                    win.close();
                    
                    // Consume energy
                    p.energy -= cost;
                    updateUI();
                    
                    // Load fight state
                    initFightState(area);
                    switchSubScreen(1); // Go to Fight
                }
            },
            {
                text: 'Raid (Quick Cash)',
                cls: 'mafia-btn mafia-btn-gold',
                handler: function() {
                    if (p.energy < cost) {
                        Ext.Msg.alert('Insufficient Energy', 'You need ' + cost + ' energy to raid this territory.');
                        return;
                    }
                    win.close();
                    
                    // Consume energy
                    p.energy -= cost;
                    
                    // Check for Corrupt Cop Encounter (25% chance)
                    if (Math.random() <= 0.25) {
                        var copWin = Ext.create('Ext.window.Window', {
                            title: '🚨 CORRUPT COP DETECTED',
                            modal: true,
                            width: 320,
                            closable: false,
                            resizable: false,
                            bodyPadding: 15,
                            bodyStyle: 'background-color: #121216; color: #fff;',
                            items: [
                                {
                                    xtype: 'box',
                                    html: '<div style="font-size: 13px; line-height: 1.5; text-align: center;">' +
                                          '  <div style="font-size: 32px; margin-bottom: 10px;">👮‍♂️</div>' +
                                          '  <p><b>Inspector Shinde</b> blocks your exit path!</p>' +
                                          '  <p><i>"Well, well. What do we have here? Pay ₹80 to clear your record, or step into the station."</i></p>' +
                                          '</div>'
                                }
                            ],
                            buttons: [
                                {
                                    text: 'Pay Bribe (₹80)',
                                    cls: 'mafia-btn mafia-btn-gold',
                                    disabled: p.cash < 80,
                                    handler: function() {
                                        copWin.close();
                                        p.cash -= 80;
                                        p.exp += 30;
                                        SoundFX.playBribe();
                                        
                                        var lvlUp = false;
                                        if (p.exp >= p.expNeeded) {
                                            p.level++;
                                            p.exp -= p.expNeeded;
                                            p.expNeeded = Math.round(p.expNeeded * 1.5);
                                            p.maxHealth += 10;
                                            p.health = p.maxHealth;
                                            p.maxEnergy += 5;
                                            p.energy = p.maxEnergy;
                                            p.baseAttack += 3;
                                            p.baseDefense += 2;
                                            recalculatePlayerStats();
                                            lvlUp = true;
                                        }
                                        updateUI();
                                        
                                        var alertMsg = '<h3>Bribe Accepted</h3><p>Shinde pockets the notes and walks away whistling.</p><p>⭐ Gained <b>+30 EXP</b>.</p>';
                                        if (lvlUp) {
                                            alertMsg += '<p style="color:#f1c40f; font-weight:bold;">🎉 LEVEL UP! You are now Level ' + p.level + '! 🎉</p>';
                                        }
                                        Ext.Msg.alert('Encounter Cleared', alertMsg);
                                    }
                                },
                                {
                                    text: 'Fight Him!',
                                    cls: 'mafia-btn mafia-btn-red',
                                    handler: function() {
                                        copWin.close();
                                        
                                        // Set up cop boss fight
                                        GameState.currentFightArea = { name: 'Police Station' };
                                        GameState.enemy = {
                                            name: 'Inspector Shinde',
                                            level: p.level + 1,
                                            health: 120,
                                            maxHealth: 120,
                                            attack: 16 + p.level,
                                            defense: 8 + p.level,
                                            cashReward: 250,
                                            expReward: 60
                                        };
                                        GameState.fightLog = ['<div class="fight-log-entry fight-log-enemy">Inspector Shinde raises his lathi! "You are going down, criminal!"</div>'];
                                        updateFightUI();
                                        switchSubScreen(1);
                                    }
                                }
                            ]
                        });
                        copWin.show();
                        return;
                    }
                    
                    // Simulate Raid
                    var successChance = area.id === 'dharavi' ? 0.85 : (area.id === 'andheri' ? 0.65 : 0.45);
                    var rolled = Math.random();
                    
                    if (rolled <= successChance) {
                        // Success
                        var baseCash = area.id === 'dharavi' ? 60 : (area.id === 'andheri' ? 150 : 350);
                        var expGained = area.id === 'dharavi' ? 20 : (area.id === 'andheri' ? 45 : 90);
                        var actualCash = Math.round(baseCash * (0.8 + Math.random() * 0.4));
                        
                        p.cash += actualCash;
                        p.exp += expGained;
                        
                        // Check Level Up
                        var lvlUp = false;
                        if (p.exp >= p.expNeeded) {
                            p.level++;
                            p.exp -= p.expNeeded;
                            p.expNeeded = Math.round(p.expNeeded * 1.5);
                            p.maxHealth += 10;
                            p.health = p.maxHealth;
                            p.maxEnergy += 5;
                            p.energy = p.maxEnergy;
                            p.baseAttack += 3;
                            p.baseDefense += 2;
                            recalculatePlayerStats();
                            lvlUp = true;
                        }
                        
                        updateUI();
                        
                        var resultText = '<h3>Raid Success!</h3><p>You raided ' + area.name + ' and escaped successfully.</p>' +
                                         '<p>💰 Looted <b>₹' + actualCash + '</b> cash.<br>⭐ Gained <b>+' + expGained + ' EXP</b>.</p>';
                        if (lvlUp) {
                            resultText += '<p style="color:#f1c40f; font-weight:bold;">🎉 LEVEL UP! You are now Level ' + p.level + '! 🎉</p>';
                        }
                        
                        Ext.Msg.alert('Raid Report', resultText);
                    } else {
                        // Failed, fought and lost some HP
                        var hpLost = Math.round(p.health * 0.25 + 10);
                        p.health = Math.max(5, p.health - hpLost);
                        updateUI();
                        Ext.Msg.alert('Raid Failed', '<h3>Ambushed!</h3><p>Local thugs ambushed you during the raid. You had to fight your way out.</p>' +
                                                     '<p>💀 HP Damage Taken: <span style="color:#e74c3c; font-weight:bold;">-' + hpLost + ' HP</span>.</p>');
                    }
                }
            },
            {
                text: 'Cancel',
                cls: 'mafia-btn mafia-btn-dark',
                handler: function() { win.close(); }
            }
        ]
    });
    
    win.show();
}

// --- Screen 2d: Inventory / Stash Screen ---
function createInventoryScreen() {
    return Ext.create('Ext.container.Container', {
        id: 'inventoryScreen',
        scrollable: 'y',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [
            {
                xtype: 'box',
                html: '<div class="mafia-title" style="font-size:22px; padding: 12px 0 2px 0;"><i class="fa fa-briefcase" style="margin-right:8px;"></i>Your Stash</div>' +
                      '<div class="mafia-subtitle" style="font-size:12px; margin-bottom:10px;">Equip weapons, use medical supplies, or upgrade gear.</div>'
            },
            // Inventory Grid
            {
                xtype: 'gridpanel',
                store: inventoryStore,
                cls: 'mafia-glass-panel',
                margin: '0 10 15 10',
                rowLines: false,
                columnLines: false,
                hideHeaders: true,
                columns: [
                    {
                        xtype: 'gridcolumn',
                        flex: 1,
                        renderer: function(value, metaData, record) {
                            var r = record.data;
                            var badge = r.equipped ? '<span style="background-color:#e74c3c; color:#fff; font-size:10px; padding:1px 5px; border-radius:4px; font-weight:bold; margin-left:8px;">EQUIPPED</span>' : '';
                            var qtyStr = r.qty > 0 ? ' (Qty: ' + r.qty + ')' : ' <span style="color:#e74c3c;">(Out of Stock)</span>';
                            
                            var stars = '';
                            if (r.rating > 0) {
                                stars = '<div class="item-stars">';
                                for(var i=0; i<r.rating; i++) stars += '★ ';
                                stars += '</div>';
                            }
                            
                            return '<div class="item-card">' +
                                        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                                            '<span class="item-title">' + r.name + qtyStr + badge + '</span>' +
                                            '<span class="item-type">' + r.type + '</span>' +
                                        '</div>' +
                                        '<div style="color:#a4b0be; font-size:11px; margin-top:4px;">' + r.description + '</div>' +
                                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">' +
                                            '<span class="item-stat">' + r.statLabel + '</span>' +
                                            stars +
                                        '</div>' +
                                   '</div>';
                        }
                    }
                ],
                listeners: {
                    rowclick: function(grid, record) {
                        if (record.data.qty > 0 || record.data.equipped) {
                            showItemActionMenu(record);
                        } else {
                            showBuyPopup(record);
                        }
                    }
                }
            }
        ]
    });
}

function showItemActionMenu(record) {
    var r = record.data;
    var p = GameState.player;
    var menuItems = [];
    
    if (r.type === 'Weapon' || r.type === 'Armor') {
        menuItems.push({
            xtype: 'button',
            text: r.equipped ? 'Unequip Item' : 'Equip Gear',
            cls: 'mafia-btn mafia-btn-red',
            handler: function() {
                win.close();
                if (r.equipped) {
                    r.equipped = false;
                    if (r.type === 'Weapon') p.equippedWeapon = null;
                    else p.equippedArmor = null;
                    Ext.toast('Unequipped ' + r.name);
                } else {
                    // Unequip current item of same type
                    GameState.inventory.forEach(function(item) {
                        if (item.type === r.type && item.equipped) {
                            item.equipped = false;
                        }
                    });
                    
                    r.equipped = true;
                    if (r.type === 'Weapon') p.equippedWeapon = r;
                    else p.equippedArmor = r;
                    
                    Ext.toast('Equipped ' + r.name);
                }
                
                recalculatePlayerStats();
                updateUI();
                inventoryStore.loadData(GameState.inventory);
            }
        });
        
        // Upgrade option
        var upgradeCost = r.rating * 150;
        menuItems.push({
            xtype: 'button',
            text: 'Upgrade Gear (Cost: ₹' + upgradeCost + ')',
            cls: 'mafia-btn mafia-btn-gold',
            disabled: p.cash < upgradeCost || r.rating >= 5,
            handler: function() {
                win.close();
                if (p.cash >= upgradeCost) {
                    p.cash -= upgradeCost;
                    r.rating++;
                    
                    // Boost stats
                    var oldStat = r.stat;
                    r.stat = Math.round(r.stat * 1.4);
                    r.statLabel = (r.type === 'Weapon' ? '+ ' : '+') + r.stat + ' ' + (r.type === 'Weapon' ? 'Attack' : 'Defense');
                    
                    recalculatePlayerStats();
                    updateUI();
                    inventoryStore.loadData(GameState.inventory);
                    
                    Ext.toast('Upgraded ' + r.name + ' to Star ' + r.rating + '!');
                }
            }
        });
    } else if (r.type === 'Consumable') {
        menuItems.push({
            xtype: 'button',
            text: 'Eat / Use (Restores ' + r.stat + ' HP)',
            cls: 'mafia-btn mafia-btn-red',
            disabled: p.health >= p.maxHealth,
            handler: function() {
                win.close();
                if (p.health < p.maxHealth) {
                    r.qty--;
                    p.health = Math.min(p.maxHealth, p.health + r.stat);
                    updateUI();
                    inventoryStore.loadData(GameState.inventory);
                    Ext.toast('Ate Vada Pav. Health restored.');
                }
            }
        });
    }
    
    // Sell action
    var sellPrice = Math.round(r.value * 0.6);
    menuItems.push({
        xtype: 'button',
        text: 'Sell Stash (Get ₹' + sellPrice + ')',
        cls: 'mafia-btn mafia-btn-dark',
        disabled: r.equipped,
        handler: function() {
            win.close();
            r.qty--;
            p.cash += sellPrice;
            updateUI();
            inventoryStore.loadData(GameState.inventory);
            Ext.toast('Sold ' + r.name + ' for ₹' + sellPrice);
        }
    });

    var win = Ext.create('Ext.window.Window', {
        title: r.name,
        modal: true,
        width: 280,
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        bodyPadding: 15,
        bodyStyle: 'background-color: #121216; color: #fff;',
        defaults: {
            margin: '5 0',
            height: 38
        },
        items: [
            {
                xtype: 'box',
                html: '<p style="font-size:12px; color:#a4b0be; margin-bottom:12px;">' + r.description + '</p>',
                height: 'auto'
            },
            ...menuItems
        ]
    });
    
    win.show();
}

function showBuyPopup(record) {
    var r = record.data;
    var p = GameState.player;
    var buyPrice = r.value;
    
    var win = Ext.create('Ext.window.Window', {
        title: 'Buy ' + r.name,
        modal: true,
        width: 280,
        bodyPadding: 15,
        bodyStyle: 'background-color: #121216; color: #fff;',
        items: [
            {
                xtype: 'box',
                html: '<p>' + r.description + '</p>' +
                      '<p>💰 <b>Price:</b> ₹' + buyPrice + '<br>💳 <b>Your Cash:</b> ₹' + p.cash + '</p>'
            }
        ],
        buttons: [
            {
                text: 'Buy Item',
                cls: 'mafia-btn mafia-btn-gold',
                disabled: p.cash < buyPrice,
                handler: function() {
                    win.close();
                    if (p.cash >= buyPrice) {
                        p.cash -= buyPrice;
                        r.qty++;
                        updateUI();
                        inventoryStore.loadData(GameState.inventory);
                        Ext.toast('Purchased ' + r.name + '!');
                    }
                }
            },
            {
                text: 'Cancel',
                cls: 'mafia-btn mafia-btn-dark',
                handler: function() { win.close(); }
            }
        ]
    });
    
    win.show();
}

// --- Global UI Sync ---
function updateUI() {
    var p = GameState.player;
    
    // Top Bar Name & Level
    var lblName = Ext.getCmp('lblPlayerName');
    if (lblName) lblName.setText(p.username.toUpperCase());
    
    var lblLevel = Ext.getCmp('lblPlayerLevel');
    if (lblLevel) lblLevel.setText('Level ' + p.level + ' (' + p.exp + ' / ' + p.expNeeded + ' EXP)');
    
    // Top Bar Cash
    var lblCash = Ext.getCmp('lblPlayerCash');
    if (lblCash) lblCash.setText('₹' + p.cash);
    
    // Top Bar Health Progress Bar
    var barHealth = Ext.getCmp('barPlayerHealth');
    if (barHealth) {
        var pct = p.health / p.maxHealth;
        barHealth.setValue(pct);
        barHealth.updateText('HP: ' + Math.round(p.health) + ' / ' + p.maxHealth);
        
        // Critical Health Pulse Glow Effect
        if (pct < 0.25) {
            barHealth.getEl().addCls('animate-pulse-red');
        } else {
            if (barHealth.getEl()) barHealth.getEl().removeCls('animate-pulse-red');
        }
    }
    
    // Top Bar Energy Progress Bar
    var barEnergy = Ext.getCmp('barPlayerEnergy');
    if (barEnergy) {
        barEnergy.setValue(p.energy / p.maxEnergy);
        barEnergy.updateText('ENERGY: ' + p.energy + ' / ' + p.maxEnergy);
    }
    
    // Dashboard Stats Panel Detail
    var lblAttack = Ext.getCmp('lblPlayerAttack');
    if (lblAttack) lblAttack.setText(p.attack);
    
    var lblDefense = Ext.getCmp('lblPlayerDefense');
    if (lblDefense) lblDefense.setText(p.defense);
    
    var lblWpn = Ext.getCmp('lblEquippedWeapon');
    if (lblWpn) lblWpn.setText(p.equippedWeapon ? p.equippedWeapon.name : 'No Weapon');
    
    var lblArm = Ext.getCmp('lblEquippedArmor');
    if (lblArm) lblArm.setText(p.equippedArmor ? p.equippedArmor.name : 'No Armor');
    
    var lblExpText = Ext.getCmp('lblPlayerExpText');
    if (lblExpText) lblExpText.setText(p.exp + ' / ' + p.expNeeded);
    
    var barExp = Ext.getCmp('barPlayerExp');
    if (barExp) barExp.setValue(p.exp / p.expNeeded);
}

// --- Energy Recovery Tick ---
setInterval(function() {
    var p = GameState.player;
    if (p.energy < p.maxEnergy) {
        p.energy = Math.min(p.maxEnergy, p.energy + 1);
        updateUI();
        
        // If on fight screen, update fight too
        var content = Ext.getCmp('gameContentPanel');
        if (content && content.getActiveItem().id === 'fightScreen') {
            updateFightUI();
        }
    }
}, 4000); // recover 1 energy every 4 seconds

// --- Device Ready / Start Entry Point ---
function initApp() {
    if (window.appInitialized) return;
    window.appInitialized = true;
    
    Ext.onReady(function() {
        // Build app components
        setupGameApp();
        
        // Default highlight of Dashboard nav
        switchSubScreen(0);
    });
}

document.addEventListener('deviceready', initApp, false);

// Fallback for browser testing (if cordova.js is not present or slow to fire)
setTimeout(function() {
    initApp();
}, 800);
