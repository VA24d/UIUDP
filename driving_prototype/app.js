/**
 * UIUDP Vehicle State & Logic Controller (High-Fidelity)
 */

// --- DYNAMIC CAR PHYSICS ---
const CarPhysics = {
    currentSpeed: 65,
    targetSpeed: 65,
    interval: null,

    init: function () {
        this.interval = setInterval(() => { this.tick(); }, 50);
    },
    tick: function () {
        if (this.currentSpeed > this.targetSpeed) this.currentSpeed -= 1;
        else if (this.currentSpeed < this.targetSpeed) this.currentSpeed += 1;

        const speedEl = document.getElementById('speed-val');
        if (speedEl) speedEl.innerText = this.currentSpeed;
    },
    setSpeed: function (speed) { this.targetSpeed = speed; }
};

// --- PROCEDURAL AUDIO ---
const AudioEngine = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    playTone: function (freq, type, duration, vol = 0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq;
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    },
    chimeInfo: function () { this.playTone(600, 'sine', 1); this.playTone(800, 'sine', 1.5); },
    chimeAlert: function () { this.playTone(400, 'square', 0.5); setTimeout(() => this.playTone(400, 'square', 0.5), 200); },
    buzzerJarring: function () { this.playTone(150, 'sawtooth', 2, 0.3); }
};

// --- VOICE RECOGNITION (WEB SPEECH API) ---
const VoiceEngine = {
    recognition: null,
    init: function () {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                const micStatus = document.getElementById('mic-status');
                micStatus.innerHTML = '<i class="ph-fill ph-microphone"></i> Listening';
                micStatus.classList.add('active');
            };

            this.recognition.onend = () => {
                const micStatus = document.getElementById('mic-status');
                micStatus.innerHTML = '<i class="ph-microphone-slash"></i> Standby';
                micStatus.classList.remove('active');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                SystemLogic.logHardware(`Voice Input: "${transcript}"`, "default");
                this.parseCommand(transcript);
            };
        }
    },
    listen: function () {
        if (this.recognition) {
            try { this.recognition.start(); } catch (e) { }
        }
    },
    toggleMic: function () {
        const btn = document.getElementById('mic-toggle');
        const textBar = document.getElementById('voice-text-bar');
        if (!this.recognition) this.init();
        if (!this.recognition) return;

        if (this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            btn.classList.remove('listening');
            if (textBar) textBar.textContent = 'Mic off — tap to listen';
        } else {
            this.isListening = true;
            try { this.recognition.start(); } catch (e) { }
            btn.classList.add('listening');
            if (textBar) textBar.textContent = 'Listening... try "yes", "no", or "accept"';
        }
    },
    parseCommand: function (text) {
        if (CarState.currentScenario === 'battery') {
            if (text.includes('yes') || text.includes('reroute') || text.includes('accept')) {
                Scenarios['battery'].accept();
            } else if (text.includes('no') || text.includes('ignore') || text.includes('dismiss')) {
                Scenarios['battery'].ignore();
            }
        }
        if (CarState.currentScenario === 'weather') {
            if (text.includes('yes') || text.includes('safer') || text.includes('accept') || text.includes('detour')) {
                Scenarios['weather'].acceptSaferRoute();
            } else if (text.includes('keep') || text.includes('no') || text.includes('highway') || text.includes('dismiss')) {
                Scenarios['weather'].keepPlannedRoute();
            }
        }
    }
};

// --- SYSTEM STATE & UTILS ---
const CarState = { mode: 'autonomous', timer: null, currentScenario: null };

/** Press-and-hold grip control (root onboarding pattern). Used for Take-Over and Fatigue escalate. */
const TakeoverHold = {
    timer: null,
    scenarioMode: null,
    teardown: function () {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.scenarioMode = null;
        const panel = document.getElementById('takeover-hold-action');
        if (panel) panel.classList.add('hidden');
        const btn = document.getElementById('takeover-hold-btn');
        if (btn) {
            btn.classList.remove('holding', 'secured');
            const lab = btn.querySelector('.hold-btn-label');
            if (lab) lab.innerHTML = '<i class="ph ph-hand-grabbing"></i> GRIP STEERING WHEEL';
            const fill = btn.querySelector('.hold-fill');
            if (fill) fill.style.width = '0%';
        }
    },
    /** @param {'takeover'|'fatigue'} mode */
    attachForScenario: function (mode) {
        const panel = document.getElementById('takeover-hold-action');
        const btnEl = document.getElementById('takeover-hold-btn');
        if (!panel || !btnEl) return;

        TakeoverHold.scenarioMode = mode;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        panel.classList.remove('hidden');
        btnEl.classList.remove('holding', 'secured');
        const labelInit = btnEl.querySelector('.hold-btn-label');
        if (labelInit) labelInit.innerHTML = '<i class="ph ph-hand-grabbing"></i> GRIP STEERING WHEEL';
        const fillInit = btnEl.querySelector('.hold-fill');
        if (fillInit) fillInit.style.width = '0%';

        const newBtn = btnEl.cloneNode(true);
        btnEl.parentNode.replaceChild(newBtn, btnEl);

        let progress = 0;
        const fill = newBtn.querySelector('.hold-fill');
        const expect = mode;

        const pulse = () => {
            progress += 4;
            if (fill) fill.style.width = `${progress}%`;
            if (progress >= 100) {
                if (TakeoverHold.timer) {
                    clearInterval(TakeoverHold.timer);
                    TakeoverHold.timer = null;
                }
                newBtn.classList.remove('holding');
                newBtn.classList.add('secured');
                const l = newBtn.querySelector('.hold-btn-label');
                if (l) l.innerHTML = '<i class="ph-fill ph-check-circle"></i> CONTROL SECURED';
                if (CarState.currentScenario === expect) SystemLogic.handleUserGrip();
            }
        };

        const start = () => {
            if (CarState.currentScenario !== expect) return;
            if (newBtn.classList.contains('secured')) return;
            newBtn.classList.add('holding');
            if (TakeoverHold.timer) clearInterval(TakeoverHold.timer);
            progress = 0;
            if (fill) fill.style.width = '0%';
            TakeoverHold.timer = setInterval(pulse, 40);
        };
        const stop = () => {
            if (progress >= 100) return;
            if (TakeoverHold.timer) {
                clearInterval(TakeoverHold.timer);
                TakeoverHold.timer = null;
            }
            newBtn.classList.remove('holding');
            progress = 0;
            if (fill) fill.style.width = '0%';
        };

        newBtn.addEventListener('mousedown', start);
        newBtn.addEventListener('mouseup', stop);
        newBtn.addEventListener('mouseleave', stop);
        newBtn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
        newBtn.addEventListener('touchend', stop);
    }
};

const WeatherRouting = {
    resetVehicle: function () {
        const g = document.getElementById('weather-vehicle');
        if (g) g.setAttribute('transform', 'translate(48,174)');
    },
    animateAlong: function (pathId, durationMs) {
        const pathEl = document.getElementById(pathId);
        const vehicle = document.getElementById('weather-vehicle');
        if (!pathEl || !vehicle || typeof pathEl.getTotalLength !== 'function') return;
        const len = pathEl.getTotalLength();
        if (len <= 0) return;
        const start = performance.now();
        function frame(now) {
            const t = Math.min(1, (now - start) / durationMs);
            const pt = pathEl.getPointAtLength(t * len);
            vehicle.setAttribute('transform', `translate(${pt.x},${pt.y})`);
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    },
    teardown: function () {
        const layer = document.getElementById('weather-route-layer');
        const central = document.getElementById('central-display');
        if (layer) {
            layer.classList.add('hidden');
            layer.classList.remove('rerouted', 'reject-planned');
            layer.setAttribute('aria-hidden', 'true');
        }
        if (central) central.classList.remove('weather-map-open');
        this.resetVehicle();
        const cap = document.getElementById('weather-map-caption');
        if (cap) cap.innerHTML = 'Heavy rain on segment A4 — traction limit reduced ahead.';
    }
};

const BatteryRouting = {
    teardown: function () {
        const layer = document.getElementById('battery-route-layer');
        const central = document.getElementById('central-display');
        if (layer) {
            layer.classList.add('hidden');
            layer.setAttribute('aria-hidden', 'true');
        }
        if (central) central.classList.remove('battery-map-open');
        const cap = document.getElementById('battery-map-caption');
        if (cap) {
            cap.innerHTML = 'Reserve math: highway ETA exceeds remaining electrons to destination.';
        }
    }
};

const UI = {
    overlay: document.getElementById('ambient-overlay'),
    log: document.getElementById('hardware-log'),
    map: document.getElementById('map-background'),
    weatherLayer: document.getElementById('weather-route-layer'),
    batteryLayer: document.getElementById('battery-route-layer'),
    modal: document.getElementById('tablet-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalReason: document.getElementById('modal-reason'),
    modalTimer: document.getElementById('modal-timer'),
    modalActions: document.getElementById('modal-actions'),
    wheel: document.getElementById('steering-column'),
    squeezeBtn: document.getElementById('squeeze-btn'),
    hudStatus: document.getElementById('hud-status'),
    hudAlert: document.getElementById('hud-alert'),
    hudAlertText: document.getElementById('hud-alert-text'),
    voiceUI: document.getElementById('voice-ui')
};

const SystemLogic = {
    logHardware: function (msg, type = 'default') {
        if (!UI.log) return;
        const li = document.createElement('li');
        li.className = `log-item ${type}`;

        // Add icon based on type
        const icon = document.createElement('i');
        if (type === 'critical') icon.className = 'ph-fill ph-x-circle';
        else if (type === 'warning') icon.className = 'ph-fill ph-warning-circle';
        else icon.className = 'ph ph-circle';

        li.appendChild(icon);
        li.appendChild(document.createTextNode(msg));
        UI.log.prepend(li);

        // Keep only last 20 logs
        while (UI.log.children.length > 20) {
            UI.log.removeChild(UI.log.lastChild);
        }
    },
    speak: function (text, triggerListening = false) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => { if (triggerListening) VoiceEngine.listen(); };
        window.speechSynthesis.speak(utterance);
    },
    resetSystem: function () {
        clearInterval(CarState.timer); window.speechSynthesis.cancel();
        CarState.mode = 'autonomous'; CarState.currentScenario = null;
        CarPhysics.setSpeed(65);

        WeatherRouting.teardown();
        BatteryRouting.teardown();
        TakeoverHold.teardown();
        UI.map.style.filter = '';
        if (UI.overlay) UI.overlay.className = '';
        UI.map.classList.remove('dim-map');
        UI.modal.classList.add('hidden'); UI.squeezeBtn.classList.add('hidden');
        UI.wheel.classList.remove('shake-hard'); UI.voiceUI.classList.add('hidden');
        UI.hudAlert.classList.add('hidden');

        const hudContext = document.getElementById('hud-context-label');
        if (hudContext) {
            hudContext.innerText = 'AUTONOMOUS MODE';
            hudContext.classList.remove('warning');
        }
        const hudProgress = document.getElementById('hud-progress-fill');
        if (hudProgress) {
            hudProgress.classList.remove('warning');
            hudProgress.style.width = '100%';
        }

        UI.hudStatus.className = 'system-status text-green';
        UI.hudStatus.innerHTML = '<i class="ph-fill ph-check-circle"></i> <span id="hud-status-text">Autonomous</span>';
        this.logHardware("System Reset", "default");
    },
    triggerScenario: function (id) {
        this.resetSystem(); CarState.currentScenario = id;
        if (Scenarios[id]) Scenarios[id].execute();
    },
    handleUserGrip: function () {
        if (['takeover', 'fatigue'].includes(CarState.currentScenario)) {
            const scen = CarState.currentScenario;
            clearInterval(CarState.timer); AudioEngine.chimeInfo();
            this.speak("Handover confirmed."); CarState.mode = 'manual';
            this.resetSystem();
            UI.hudStatus.className = 'system-status';
            UI.hudStatus.style.color = 'var(--hud-alert)';
            UI.hudStatus.innerHTML = '<i class="ph-fill ph-warning-circle"></i> <span id="hud-status-text">Manual Control</span>';
            const logMsg = scen === 'takeover'
                ? "Take-over grip confirmed. Manual control active."
                : "Fatigue grip confirmed. SOS cancelled — manual control active.";
            this.logHardware(logMsg, "warning");
        }
    }
};

// --- SCENARIO LOGIC ---
const Scenarios = {
    'takeover': {
        execute: function () {
            SystemLogic.logHardware("Unmapped zone detected.", "warning");
            AudioEngine.chimeAlert();
            SystemLogic.speak("Construction zone ahead. Please take manual control.");

            UI.map.classList.add('dim-map'); UI.modal.classList.remove('hidden');
            UI.modal.style.borderColor = 'var(--sys-crit)'; UI.modalTitle.innerText = "TAKE MANUAL CONTROL";
            UI.modalTitle.style.color = "var(--sys-crit)";
            UI.modalReason.innerText = "Construction zone. Press and hold GRIP STEERING WHEEL below to confirm manual control.";
            UI.modalActions.innerHTML = "";

            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-crit)';
            UI.hudAlertText.innerText = "EYES ON ROAD"; UI.hudAlertText.style.color = "var(--sys-crit)";
            UI.overlay.className = 'strobe-amber';
            UI.squeezeBtn.classList.add('hidden');
            TakeoverHold.attachForScenario('takeover');

            UI.modalTimer.classList.remove('hidden');
            const timerValue = UI.modalTimer.querySelector('.countdown-value');
            let timeLeft = 8;
            if (timerValue) timerValue.innerText = timeLeft;

            CarState.timer = setInterval(() => {
                timeLeft--;
                if (timerValue) timerValue.innerText = timeLeft;
                if (timeLeft <= 0) { clearInterval(CarState.timer); this.triggerMRM(); }
            }, 1000);
        },
        triggerMRM: function () {
            SystemLogic.logHardware("MRM Triggered.", "critical");
            SystemLogic.speak("No response. Engaging hazard stop.");
            UI.hudStatus.className = 'system-status';
            UI.hudStatus.style.color = 'var(--danger)';
            UI.hudStatus.innerHTML = '<i class="ph-fill ph-x-circle"></i> <span id="hud-status-text">Hazard Stop</span>';
            UI.modalTitle.innerText = "AUTONOMOUS STOP"; UI.modalReason.innerText = "Vehicle pulling over.";
            UI.overlay.className = 'strobe-red'; UI.squeezeBtn.classList.add('hidden');
            TakeoverHold.teardown();
            UI.modalTimer.classList.add('hidden');
            UI.modalActions.innerHTML = "";
            CarPhysics.setSpeed(0); // Dynamically decelerate to 0
        }
    },
    'fatigue': {
        execute: function () {
            SystemLogic.logHardware("Unresponsiveness detected.", "critical");
            CarState.mode = 'autonomous';
            UI.hudStatus.className = 'system-status';
            UI.hudStatus.style.color = 'var(--danger)';
            UI.hudStatus.innerHTML = '<i class="ph-fill ph-warning-circle"></i> <span id="hud-status-text">Emergency Auto</span>';

            AudioEngine.chimeAlert();
            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-crit)';
            UI.hudAlertText.innerText = "WAKE UP"; UI.hudAlertText.style.color = "var(--sys-crit)";
            SystemLogic.speak("Aditya, please respond.");

            CarState.timer = setTimeout(() => { this.escalate(); }, 4000);
        },
        escalate: function () {
            AudioEngine.buzzerJarring(); UI.overlay.className = 'strobe-red';
            UI.wheel.classList.add('shake-hard'); UI.squeezeBtn.classList.add('hidden');

            UI.map.classList.add('dim-map'); UI.modal.classList.remove('hidden');
            UI.modal.style.borderColor = 'var(--sys-crit)';
            UI.modalTitle.innerText = "FATIGUE DETECTED"; UI.modalTitle.style.color = "var(--sys-crit)";
            UI.modalReason.innerText = "Fatigue SOS. Press and hold GRIP STEERING WHEEL below to cancel SOS and take control.";
            UI.modalActions.innerHTML = "";
            TakeoverHold.attachForScenario('fatigue');

            UI.modalTimer.classList.remove('hidden');
            const timerValue = UI.modalTimer.querySelector('.countdown-value');
            let timeLeft = 10;
            if (timerValue) timerValue.innerText = timeLeft;

            CarState.timer = setInterval(() => {
                timeLeft--;
                if (timerValue) timerValue.innerText = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(CarState.timer);
                    TakeoverHold.teardown();
                    SystemLogic.speak("Calling emergency services.");
                    UI.modalTitle.innerText = "SOS ACTIVE";
                    CarPhysics.setSpeed(0); // Force pull over
                }
            }, 1000);
        }
    },
    'battery': {
        execute: function () {
            SystemLogic.logHardware("Range insufficient.", "warning");
            AudioEngine.chimeAlert();

            if (UI.batteryLayer) {
                UI.batteryLayer.classList.remove('hidden');
                UI.batteryLayer.removeAttribute('aria-hidden');
            }
            document.getElementById('central-display')?.classList.add('battery-map-open');
            UI.map.classList.add('dim-map');

            // Pass 'true' to trigger the microphone after speaking
            SystemLogic.speak("Aditya, we will not reach the chargers in time. Reroute to station?", true);
            UI.voiceUI.classList.remove('hidden'); // Show listening indicator

            UI.hudAlert.classList.remove('hidden'); UI.hudAlert.style.borderColor = 'var(--sys-warn)';
            UI.hudAlertText.innerText = "CRITICAL RANGE"; UI.hudAlertText.style.color = "var(--sys-warn)";

            UI.modal.classList.remove('hidden'); UI.modal.style.borderColor = 'var(--sys-warn)';
            UI.modalTitle.innerText = "RECOMMENDED STOP"; UI.modalTitle.style.color = "var(--sys-warn)";
            UI.modalReason.innerText = "Map shows the amber shortfall and the green detour to the nearest charger (+5 min). Say 'Yes' or tap below.";
            UI.modalTimer.classList.add('hidden');

            UI.modalActions.innerHTML = `
                <button class="action-btn" onclick="Scenarios['battery'].accept()">Reroute</button>
                <button class="action-btn secondary" onclick="Scenarios['battery'].ignore()">Dismiss</button>
            `;
        },
        accept: function () {
            UI.voiceUI.classList.add('hidden'); VoiceEngine.recognition?.stop();
            SystemLogic.speak("Rerouting to station.");
            SystemLogic.logHardware("Reroute confirmed. Low power active.", "warning");
            this.forceLowPower();
        },
        ignore: function () {
            UI.voiceUI.classList.add('hidden'); VoiceEngine.recognition?.stop();
            SystemLogic.speak("Engaging low battery mode to prevent stall.");
            SystemLogic.logHardware("Driver dismissed. Forcing low power.", "critical");
            this.forceLowPower();
            UI.hudAlertText.innerText = "STALL IMMINENT"; UI.hudAlertText.style.color = "var(--sys-crit)";
            UI.hudAlert.style.borderColor = 'var(--sys-crit)';
        },
        forceLowPower: function () {
            UI.modal.classList.add('hidden');
            BatteryRouting.teardown();
            UI.map.style.filter = "brightness(0.3)";
            UI.overlay.className = 'strobe-amber';
            CarPhysics.setSpeed(50); // Automatically slow down to conserve battery
        }
    },
    'touring': {
        execute: function () {
            SystemLogic.logHardware("Touring mode activated.", "default");
            AudioEngine.chimeInfo();
            SystemLogic.speak("Welcome to touring mode. I'll share interesting facts about places we pass. You can ask me questions anytime.");

            UI.modal.classList.remove('hidden');
            const modalIcon = document.getElementById('modal-icon');
            if (modalIcon) {
                modalIcon.style.background = 'rgba(56, 189, 248, 0.1)';
                modalIcon.style.borderColor = 'var(--accent-blue)';
                modalIcon.style.color = 'var(--accent-blue)';
                modalIcon.innerHTML = '<i class="ph-fill ph-compass"></i>';
            }
            UI.modalTitle.innerText = "TOURING MODE";
            UI.modalTitle.style.color = "var(--accent-blue)";
            UI.modalReason.innerText = "I'll share interesting facts about landmarks and places we pass. Ask me anything about our surroundings!";
            UI.modalTimer.classList.add('hidden');
            UI.modalActions.innerHTML = `
                <button class="action-btn" onclick="Scenarios['touring'].startTour()">Start Tour</button>
                <button class="action-btn secondary" onclick="Scenarios['touring'].cancel()">Cancel</button>
            `;

            // Show voice UI
            UI.voiceUI.classList.remove('hidden');
            const voiceText = document.getElementById('voice-text');
            if (voiceText) voiceText.innerText = 'Try asking: "What\'s that building?" or "Tell me about this area"';
        },
        startTour: function () {
            UI.modal.classList.add('hidden');
            SystemLogic.speak("Tour started. We're currently passing through a historic district. Did you know this area was founded in 1850?");
            SystemLogic.logHardware("Tour guide active. Voice commands enabled.", "default");

            // Update HUD context
            const contextLabel = document.getElementById('hud-context-label');
            if (contextLabel) contextLabel.innerText = 'TOURING MODE ACTIVE';

            // Simulate periodic tour commentary
            setTimeout(() => {
                SystemLogic.speak("On your left, you'll see the old town hall, built in Victorian style.");
                SystemLogic.logHardware("Tour: Old Town Hall", "default");
            }, 8000);

            setTimeout(() => {
                SystemLogic.speak("Coming up ahead is the riverside park, a popular spot for locals.");
                SystemLogic.logHardware("Tour: Riverside Park", "default");
            }, 16000);
        },
        cancel: function () {
            UI.modal.classList.add('hidden');
            UI.voiceUI.classList.add('hidden');
            SystemLogic.speak("Touring mode cancelled.");
            SystemLogic.logHardware("Touring mode deactivated.", "default");

            // Reset HUD context
            const contextLabel = document.getElementById('hud-context-label');
            if (contextLabel) contextLabel.innerText = 'AUTONOMOUS MODE';
        }
    },
    'weather': {
        execute: function () {
            if (!UI.weatherLayer) return;

            SystemLogic.logHardware("Weather mesh: heavy precipitation on corridor ahead.", "warning");
            WeatherRouting.resetVehicle();

            UI.weatherLayer.classList.remove('hidden');
            UI.weatherLayer.removeAttribute('aria-hidden');
            document.getElementById('central-display')?.classList.add('weather-map-open');

            AudioEngine.chimeAlert();
            SystemLogic.speak("Radar shows heavy rain on your highway segment. I can reroute inland for safer traction—it adds four minutes.", true);
            UI.voiceUI.classList.remove('hidden');
            const voiceText = document.getElementById('voice-text');
            if (voiceText) voiceText.innerText = 'Try: "yes reroute", "accept", or "keep highway".';

            UI.hudAlert.classList.remove('hidden');
            UI.hudAlert.style.borderColor = 'var(--accent-blue)';
            UI.hudAlertText.innerText = "WEATHER REROUTE";
            UI.hudAlertText.style.color = "var(--accent-blue)";

            UI.modal.classList.remove('hidden');
            UI.modal.style.borderColor = 'var(--accent-blue)';
            UI.modalTimer.classList.add('hidden');
            UI.modalTitle.style.color = "var(--accent-blue)";
            UI.modalTitle.innerText = "DETOUR OPTIONS";
            UI.modalReason.innerText = "Radar + cloud mesh confirm reduced grip on Segment A4. Preview the cyan safer path on the map.";

            const modalIcon = document.getElementById('modal-icon');
            if (modalIcon) {
                modalIcon.style.background = 'rgba(56,189,248,0.12)';
                modalIcon.style.borderColor = 'var(--accent-blue)';
                modalIcon.style.color = 'var(--accent-blue)';
                modalIcon.innerHTML = '<i class="ph-fill ph-cloud-rain"></i>';
            }

            UI.modalActions.innerHTML = `
                <button type="button" class="action-btn" onclick="Scenarios['weather'].acceptSaferRoute()">Use safer route</button>
                <button type="button" class="action-btn secondary" onclick="Scenarios['weather'].keepPlannedRoute()">Keep highway</button>
            `;
        },
        acceptSaferRoute: function () {
            UI.voiceUI.classList.add('hidden');
            VoiceEngine.recognition?.stop();
            SystemLogic.logHardware("Driver accepted inland weather detour. Recalculated.", "default");
            SystemLogic.speak("Rerouting. Following the cyan path around the precipitation core.");
            UI.modal.classList.add('hidden');
            UI.weatherLayer.classList.add('rerouted');
            UI.weatherLayer.classList.remove('reject-planned');

            const cap = document.getElementById('weather-map-caption');
            if (cap) cap.innerHTML = 'Active safer corridor — ETA +4&nbsp;min. Traction planner limits lateral G in wet residuals.';

            const contextLabel = document.getElementById('hud-context-label');
            if (contextLabel) {
                contextLabel.innerText = 'WEATHER ROUTE ACTIVE';
                contextLabel.classList.remove('warning');
            }
            WeatherRouting.animateAlong('weather-path-detour', 2800);

            UI.hudAlertText.innerText = "SAFER ROUTE";
            AudioEngine.chimeInfo();
            CarPhysics.setSpeed(55);
            const progressFill = document.getElementById('hud-progress-fill');
            if (progressFill) progressFill.style.width = '78%';
        },
        keepPlannedRoute: function () {
            UI.voiceUI.classList.add('hidden');
            VoiceEngine.recognition?.stop();
            SystemLogic.logHardware("Driver kept planned lane at reduced wet-road speed.", "warning");
            SystemLogic.speak("Understood—holding the dashed route. I'm lowering cruising speed through the storm footprint.");
            UI.modal.classList.add('hidden');
            UI.weatherLayer.classList.remove('rerouted');
            UI.weatherLayer.classList.add('reject-planned');

            const cap = document.getElementById('weather-map-caption');
            if (cap) cap.innerHTML = 'Grip management on dashed path — longitudinal limit engaged through cell.';

            const contextLabel = document.getElementById('hud-context-label');
            if (contextLabel) contextLabel.innerText = 'STORM CORRIDOR — SPEED LIMITED';

            UI.hudAlertText.innerText = "WET SURFACE";
            UI.hudAlert.style.borderColor = 'var(--hud-alert)';
            UI.hudAlertText.style.color = 'var(--hud-alert)';
            WeatherRouting.animateAlong('weather-path-planned', 3200);

            AudioEngine.chimeAlert();
            CarPhysics.setSpeed(48);
            const progressFill = document.getElementById('hud-progress-fill');
            if (progressFill) {
                progressFill.style.width = '62%';
                progressFill.classList.add('warning');
            }
        }
    }
};

// Initialize systems on load
window.onload = () => {
    console.log('Initializing AeroDrive systems...');
    CarPhysics.init();
    VoiceEngine.init();

    // Add click handlers to sidebar scenarios
    const scenario1 = document.getElementById('nav-scenario-1');
    const scenario2 = document.getElementById('nav-scenario-2');
    const scenario3 = document.getElementById('nav-scenario-3');
    const scenario4 = document.getElementById('nav-scenario-4');
    const scenario5 = document.getElementById('nav-scenario-5');

    console.log('Scenario elements:', { scenario1, scenario2, scenario3, scenario4, scenario5 });

    if (scenario1) {
        scenario1.addEventListener('click', () => {
            console.log('Takeover clicked');
            SystemLogic.triggerScenario('takeover');
            updateNavActive(1);
        });
    }

    if (scenario2) {
        scenario2.addEventListener('click', () => {
            console.log('Fatigue clicked');
            SystemLogic.triggerScenario('fatigue');
            updateNavActive(2);
        });
    }

    if (scenario3) {
        scenario3.addEventListener('click', () => {
            console.log('Battery clicked');
            SystemLogic.triggerScenario('battery');
            updateNavActive(3);
        });
    }

    if (scenario4) {
        scenario4.addEventListener('click', () => {
            console.log('Touring clicked');
            SystemLogic.triggerScenario('touring');
            updateNavActive(4);
        });
    }

    if (scenario5) {
        scenario5.addEventListener('click', () => {
            console.log('Weather reroute clicked');
            SystemLogic.triggerScenario('weather');
            updateNavActive(5);
        });
    }

    console.log('All event listeners attached');
};

function updateNavActive(num) {
    document.querySelectorAll('.nav-steps li').forEach(li => li.classList.remove('active'));
    document.getElementById(`nav-scenario-${num}`)?.classList.add('active');
}