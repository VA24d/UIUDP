/**
 * UIUDP Vehicle State & Logic Controller (High-Fidelity)
 */

// --- DYNAMIC CAR PHYSICS ---
const CarPhysics = {
    currentSpeed: 65,
    targetSpeed: 65,
    interval: null,
    arcElement: null,
    
    init: function() {
        this.arcElement = document.getElementById('speed-arc');
        this.interval = setInterval(() => { this.tick(); }, 50);
    },
    tick: function() {
        if(this.currentSpeed > this.targetSpeed) this.currentSpeed -= 1;
        else if(this.currentSpeed < this.targetSpeed) this.currentSpeed += 1;
        
        document.getElementById('speed-val').innerText = this.currentSpeed;
        
        // Max dasharray is 157. Offset 157 = 0 speed. Offset 0 = Max speed.
        const percentage = this.currentSpeed / 120; // Assume 120kmh max display
        const offset = 157 - (157 * percentage);
        this.arcElement.style.strokeDashoffset = offset;
    },
    setSpeed: function(speed) { this.targetSpeed = speed; }
};

// --- PROCEDURAL AUDIO ---
const AudioEngine = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    playTone: function(freq, type, duration, vol=0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    },
    chimeInfo: function() { this.playTone(600, 'sine', 1); this.playTone(800, 'sine', 1.5); },
    chimeAlert: function() { this.playTone(400, 'square', 0.5); setTimeout(()=>this.playTone(400, 'square', 0.5), 200); },
    buzzerJarring: function() { this.playTone(150, 'sawtooth', 2, 0.3); }
};

// --- VOICE RECOGNITION (WEB SPEECH API) ---
const VoiceEngine = {
    recognition: null,
    init: function() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if(SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onstart = () => {
                document.getElementById('mic-status').innerText = "🎙️ Listening";
                document.getElementById('mic-status').style.color = "var(--sys-active)";
            };
            
            this.recognition.onend = () => {
                document.getElementById('mic-status').innerText = "🎙️ Standby";
                document.getElementById('mic-status').style.color = "var(--text-main)";
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                SystemLogic.logHardware(`Voice Input: "${transcript}"`, "default");
                this.parseCommand(transcript);
            };
        }
    },
    listen: function() {
        if(this.recognition) {
            try { this.recognition.start(); } catch(e) {}
        }
    },
    parseCommand: function(text) {
        if(CarState.currentScenario === 'battery') {
            if(text.includes('yes') || text.includes('reroute') || text.includes('accept')) {
                Scenarios['battery'].accept();
            } else if (text.includes('no') || text.includes('ignore') || text.includes('dismiss')) {
                Scenarios['battery'].ignore();
            }
        }
    }
};

// --- SYSTEM STATE & UTILS ---
const CarState = { mode: 'autonomous', timer: null, currentScenario: null };

const UI = {
    overlay: document.getElementById('ambient-overlay'), map: document.getElementById('map-background'),
    modal: document.getElementById('tablet-modal'), modalTitle: document.getElementById('modal-title'),
    modalReason: document.getElementById('modal-reason'), modalTimer: document.getElementById('modal-timer'),
    modalActions: document.getElementById('modal-actions'), wheel: document.getElementById('steering-column'),
    squeezeBtn: document.getElementById('squeeze-btn'), hudStatus: document.getElementById('hud-status'),
    hudAlert: document.getElementById('hud-alert'), hudAlertText: document.getElementById('hud-alert-text'),
    speedArc: document.getElementById('speed-arc'), log: document.getElementById('log-list'),
    voiceUI: document.getElementById('voice-ui')
};

const SystemLogic = {
    logHardware: function(msg, type='default') {
        const li = document.createElement('li');
        li.className = `log-item ${type}`; li.innerText = `> ${msg}`;
        UI.log.prepend(li);
    },
    speak: function(text, triggerListening = false) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => { if(triggerListening) VoiceEngine.listen(); };
        window.speechSynthesis.speak(utterance);
    },
    resetSystem: function() {
        clearInterval(CarState.timer); window.speechSynthesis.cancel();
        CarState.mode = 'autonomous'; CarState.currentScenario = null;
        CarPhysics.setSpeed(65);
        
        UI.overlay.className = ''; UI.map.classList.remove('dim-map');
        UI.modal.classList.add('hidden'); UI.squeezeBtn.classList.add('hidden');
        UI.wheel.classList.remove('shake-hard'); UI.voiceUI.classList.add('hidden');
        UI.hudAlert.classList.add('hidden');
        
        UI.hudStatus.className = 'status-badge sys-active'; UI.hudStatus.innerText = 'AUTONOMOUS';
        UI.speedArc.style.stroke = 'var(--sys-active)';
        this.logHardware("System Reset", "default");
    },
    triggerScenario: function(id) {
        this.resetSystem(); CarState.currentScenario = id;
        if(Scenarios[id]) Scenarios[id].execute();
    },
    handleUserGrip: function() {
        if(['takeover', 'fatigue'].includes(CarState.currentScenario)) {
            clearInterval(CarState.timer); AudioEngine.chimeInfo();
            this.speak("Handover confirmed."); CarState.mode = 'manual';
            this.resetSystem();
            UI.hudStatus.className = 'status-badge sys-warn'; UI.hudStatus.innerText = 'MANUAL CONTROL';
            UI.speedArc.style.stroke = 'var(--sys-warn)';
            this.logHardware("Squeeze confirmed. Manual Control Active.", "warning");
        }
    }
};

// --- SCENARIO LOGIC ---
const Scenarios = {
    'takeover': {
        execute: function() {
            SystemLogic.logHardware("Unmapped zone detected.", "warning");
            AudioEngine.chimeAlert();
            SystemLogic.speak("Construction zone ahead. Please take manual control.");

            UI.map.classList.add('dim-map'); UI.modal.classList.remove('hidden');
            UI.modal.style.borderColor = 'var(--sys-crit)'; UI.modalTitle.innerText = "TAKE MANUAL CONTROL";
            UI.modalTitle.style.color = "var(--sys-crit)"; UI.modalReason.innerText = "Construction zone. Grab wheel and squeeze.";
            UI.modalActions.innerHTML = ""; 
            
            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-crit)';
            UI.hudAlertText.innerText = "EYES ON ROAD"; UI.hudAlertText.style.color = "var(--sys-crit)";
            UI.overlay.className = 'strobe-amber'; UI.squeezeBtn.classList.remove('hidden');

            UI.modalTimer.classList.remove('hidden'); UI.modalTimer.style.color = "var(--sys-crit)";
            let timeLeft = 8; UI.modalTimer.innerText = timeLeft;
            
            CarState.timer = setInterval(() => {
                timeLeft--; UI.modalTimer.innerText = timeLeft;
                if (timeLeft <= 0) { clearInterval(CarState.timer); this.triggerMRM(); }
            }, 1000);
        },
        triggerMRM: function() {
            SystemLogic.logHardware("MRM Triggered.", "critical");
            SystemLogic.speak("No response. Engaging hazard stop.");
            UI.hudStatus.className = 'status-badge sys-crit'; UI.hudStatus.innerText = 'HAZARD STOP';
            UI.speedArc.style.stroke = 'var(--sys-crit)';
            UI.modalTitle.innerText = "AUTONOMOUS STOP"; UI.modalReason.innerText = "Vehicle pulling over.";
            UI.overlay.className = 'strobe-red'; UI.squeezeBtn.classList.add('hidden');
            UI.modalTimer.classList.add('hidden');
            CarPhysics.setSpeed(0); // Dynamically decelerate to 0
        }
    },
    'fatigue': {
        execute: function() {
            SystemLogic.logHardware("Unresponsiveness detected.", "critical");
            CarState.mode = 'autonomous';
            UI.hudStatus.className = 'status-badge sys-crit'; UI.hudStatus.innerText = 'EMERGENCY AUTO';
            UI.speedArc.style.stroke = 'var(--sys-crit)';

            AudioEngine.chimeAlert();
            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-crit)';
            UI.hudAlertText.innerText = "WAKE UP"; UI.hudAlertText.style.color = "var(--sys-crit)";
            SystemLogic.speak("Aditya, please respond.");
            
            CarState.timer = setTimeout(() => { this.escalate(); }, 4000);
        },
        escalate: function() {
            AudioEngine.buzzerJarring(); UI.overlay.className = 'strobe-red';
            UI.wheel.classList.add('shake-hard'); UI.squeezeBtn.classList.remove('hidden');

            UI.map.classList.add('dim-map'); UI.modal.classList.remove('hidden');
            UI.modal.style.borderColor = 'var(--sys-crit)';
            UI.modalTitle.innerText = "FATIGUE DETECTED"; UI.modalTitle.style.color = "var(--sys-crit)";
            UI.modalReason.innerText = "Squeeze wheel to cancel SOS.";
            
            UI.modalTimer.classList.remove('hidden'); UI.modalTimer.style.color = "var(--sys-crit)";
            let timeLeft = 10; UI.modalTimer.innerText = timeLeft;
            
            CarState.timer = setInterval(() => {
                timeLeft--; UI.modalTimer.innerText = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(CarState.timer);
                    SystemLogic.speak("Calling emergency services.");
                    UI.modalTitle.innerText = "SOS ACTIVE";
                    CarPhysics.setSpeed(0); // Force pull over
                }
            }, 1000);
        }
    },
    'battery': {
        execute: function() {
            SystemLogic.logHardware("Range insufficient.", "warning");
            AudioEngine.chimeAlert();
            
            // Pass 'true' to trigger the microphone after speaking
            SystemLogic.speak("Aditya, we will not reach the chargers in time. Reroute to station?", true);
            UI.voiceUI.classList.remove('hidden'); // Show listening wave

            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-warn)';
            UI.hudAlertText.innerText = "CRITICAL RANGE"; UI.hudAlertText.style.color = "var(--sys-warn)";

            UI.modal.classList.remove('hidden'); UI.modal.style.borderColor = 'var(--sys-warn)';
            UI.modalTitle.innerText = "RECOMMENDED STOP"; UI.modalTitle.style.color = "var(--sys-warn)";
            UI.modalReason.innerText = "Insufficient charge for highway. Reroute +5 mins. Say 'Yes' or tap below.";
            UI.modalTimer.classList.add('hidden');
            
            UI.modalActions.innerHTML = `
                <button class="action-btn" onclick="Scenarios['battery'].accept()">Reroute</button>
                <button class="action-btn secondary" onclick="Scenarios['battery'].ignore()">Dismiss</button>
            `;
        },
        accept: function() {
            UI.voiceUI.classList.add('hidden'); VoiceEngine.recognition?.stop();
            SystemLogic.speak("Rerouting to station.");
            SystemLogic.logHardware("Reroute confirmed. Low power active.", "warning");
            this.forceLowPower();
        },
        ignore: function() {
            UI.voiceUI.classList.add('hidden'); VoiceEngine.recognition?.stop();
            SystemLogic.speak("Engaging low battery mode to prevent stall.");
            SystemLogic.logHardware("Driver dismissed. Forcing low power.", "critical");
            this.forceLowPower();
            UI.hudAlertText.innerText = "STALL IMMINENT"; UI.hudAlertText.style.color = "var(--sys-crit)";
            UI.hudAlert.style.borderColor = 'var(--sys-crit)';
        },
        forceLowPower: function() {
            UI.modal.classList.add('hidden');
            UI.map.style.filter = "brightness(0.3)";
            UI.overlay.className = 'strobe-amber';
            CarPhysics.setSpeed(50); // Automatically slow down to conserve battery
        }
    }
};

// Initialize systems on load
window.onload = () => { CarPhysics.init(); VoiceEngine.init(); };