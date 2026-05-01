let currentStep = 1;
let profileSubStep = 0;
let isListening = false;
let recognition = null;
let awaitingName = false; // Flag: are we waiting for the user to say their name?

// ═══════════════════════════════════════════
//  SPEECH SYNTHESIS (TTS) — Car talks to you
// ═══════════════════════════════════════════
const voiceMessages = {
    1: "Welcome to AeroDrive. Let's create your profile. Tap the microphone, or say next when you're ready.",
    2: "Now let's get you comfortable. Tap the seat zones to adjust your position, or say the zone name like headrest or lumbar.",
    3: "Set your frequent destinations. You can say next when you're done.",
    4: "This section explains how your car drives. The take-over section is critical — please review it carefully.",
    5: "Time to practice. When the warning appears, press and hold the override button. Say next when complete.",
    6: "Final step. Tune how the AI drives with the sliders. Say complete or finish when you're happy.",
    7: "All set! AeroDrive is calibrated to you. Enjoy the ride."
};

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.0; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google'));
    if (pref) u.voice = pref;

    const bar = document.getElementById('voice-bar');
    const textEl = document.getElementById('voice-text');
    if (bar && textEl) {
        textEl.textContent = text;
        bar.classList.add('speaking');
        u.onend = () => bar.classList.remove('speaking');
    }
    window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════
//  SPEECH RECOGNITION — You talk to the car
// ═══════════════════════════════════════════
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function initRecognition() {
    if (!SpeechRecognition) {
        console.warn('Speech Recognition not supported');
        document.getElementById('voice-text').textContent = 'Voice commands not supported in this browser';
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript = event.results[i][0].transcript.trim().toLowerCase();
            const heardEl = document.getElementById('voice-heard');
            if (heardEl) heardEl.textContent = `"${transcript}"`;

            // Process immediately on interim results for blazing fast response
            const handled = handleVoiceCommand(transcript, event.results[i].isFinal);
            
            // If we successfully handled a command, stop recognition to flush the buffer
            if (handled) {
                recognition.stop();
                break;
            }
        }
    };

    recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.warn('Recognition error:', e.error);
    };

    recognition.onend = () => {
        // Auto-restart if we're supposed to be listening
        if (isListening) {
            try { recognition.start(); } catch(e) {}
        }
    };
}

function toggleMic() {
    if (!recognition) initRecognition();
    if (!recognition) return;
    const btn = document.getElementById('mic-toggle');
    if (isListening) {
        isListening = false;
        recognition.stop();
        btn.classList.remove('listening');
        document.getElementById('voice-text').textContent = 'Mic off — tap to listen';
    } else {
        isListening = true;
        try { recognition.start(); } catch(e) {}
        btn.classList.add('listening');
        document.getElementById('voice-text').textContent = 'Listening... try "next", "back", or zone names';
    }
}

// ═══════════════════════════════════════════
//  FUZZY MATCHING
// ═══════════════════════════════════════════
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i-1][j] + 1,
                dp[i][j-1] + 1,
                dp[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0)
            );
        }
    }
    return dp[m][n];
}

function fuzzyMatch(input, candidates, threshold = 3) {
    input = input.toLowerCase().trim();
    let bestMatch = null, bestDist = Infinity;
    for (const candidate of candidates) {
        // Check if input contains the candidate
        if (input.includes(candidate)) return candidate;
        const dist = levenshtein(input, candidate);
        if (dist < bestDist) { bestDist = dist; bestMatch = candidate; }
    }
    return bestDist <= threshold ? bestMatch : null;
}

// ═══════════════════════════════════════════
//  COMMAND HANDLER
// ═══════════════════════════════════════════
let lastCommandTime = 0;
const COMMAND_COOLDOWN = 1500; // 1.5 seconds

function handleVoiceCommand(transcript, isFinal) {
    // If we're waiting for the user to say their name (Step 1 mic flow)
    if (awaitingName) {
        // Name capture should ideally wait for final to get the full name
        if (isFinal) {
            awaitingName = false;
            captureSpokenName(transcript);
            return true;
        }
        return false;
    }

    const now = Date.now();
    if (now - lastCommandTime < COMMAND_COOLDOWN) return false;

    const words = transcript.toLowerCase();

    // Navigation commands
    const navNext = ['next', 'continue', 'proceed', 'forward', 'go ahead', 'move on', 'skip'];
    const navBack = ['back', 'previous', 'go back', 'return'];
    const navComplete = ['complete', 'finish', 'done', 'finalize'];

    if (fuzzyMatch(words, navNext)) {
        lastCommandTime = now;
        triggerNext();
        return true;
    }
    if (fuzzyMatch(words, navBack)) {
        lastCommandTime = now;
        if (currentStep > 1) loadStep(currentStep - 1);
        return true;
    }
    if (fuzzyMatch(words, navComplete)) {
        lastCommandTime = now;
        if (currentStep === 6) { completeSetup(); return true; }
        triggerNext();
        return true;
    }

    // Step 2: Comfort zone commands
    if (currentStep === 2) {
        const zones = ['headrest', 'backrest', 'lumbar', 'cushion', 'seat base'];
        const match = fuzzyMatch(words, zones);
        if (match) {
            lastCommandTime = now;
            const zone = match === 'seat base' ? 'cushion' : match;
            selectZone(zone);
            return true;
        }
    }

    // Step 4: Learn slideshow commands
    if (currentStep === 4) {
        const slideNames = { 'capabilities': 1, 'safety': 2, 'charging': 3, 'takeover': 4, 'take over': 4, 'critical': 4 };
        for (const [key, id] of Object.entries(slideNames)) {
            if (words.includes(key) || fuzzyMatch(words, [key])) {
                lastCommandTime = now;
                goSlide(id);
                return true;
            }
        }
    }

    // Wake word — toggle listening
    if (words.includes('hey aerodrive') || words.includes('hey aero drive')) {
        lastCommandTime = now;
        speak("I'm listening. What would you like to do?");
        return true;
    }

    return false;
}

function triggerNext() {
    // Step 1 has sub-steps
    if (currentStep === 1 && profileSubStep < 3) {
        advanceProfileSetup();
        return;
    }
    // Step 4 has slides
    if (currentStep === 4 && currentSlide < totalSlides) {
        nextSlide();
        return;
    }
    const maxStep = 6;
    const nextStep = currentStep + 1;
    if (nextStep <= maxStep) loadStep(nextStep);
    else if (currentStep === 6) completeSetup();
}

// ═══════════════════════════════════════════
//  STEP LOADER
// ═══════════════════════════════════════════
async function loadStep(n) {
    try {
        const url = n === 7 ? 'steps/success.html' : `steps/step${n}.html`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Step ${n} not found`);
        const html = await res.text();
        const c = document.getElementById('module-container');
        c.style.animation = 'none'; c.offsetHeight;
        c.innerHTML = html; c.style.animation = null;
        currentStep = n;
        updateNav(n);
        updateHudContext(n);
        initStepLogic(n);
        if (voiceMessages[n]) speak(voiceMessages[n]);
    } catch (e) { console.error(e); }
}

// ── HUD Context — dynamic per-step feedback ──
const hudContextMap = {
    1: { label: 'PROFILE: SETTING UP', progress: 16, warning: false },
    2: { label: 'CABIN: CALIBRATING', progress: 33, warning: false },
    3: { label: 'NAV: CONFIGURING', progress: 50, warning: false },
    4: { label: 'LEARNING: REVIEW', progress: 66, warning: false },
    5: { label: '⚠ TAKE-OVER DRILL', progress: 83, warning: true },
    6: { label: 'TUNING: PREFERENCES', progress: 95, warning: false },
    7: { label: '✓ SETUP COMPLETE', progress: 100, warning: false }
};

function updateHudContext(step) {
    const ctx = hudContextMap[step];
    if (!ctx) return;
    const label = document.getElementById('hud-context-label');
    const fill = document.getElementById('hud-progress-fill');
    if (label) {
        label.textContent = ctx.label;
        label.classList.toggle('warning', ctx.warning);
    }
    if (fill) {
        fill.style.width = ctx.progress + '%';
        fill.classList.toggle('warning', ctx.warning);
    }
}

function updateNav(step) {
    document.querySelectorAll('.nav-steps li').forEach((li, i) => {
        li.classList.remove('active');
        if (i < step - 1) li.classList.add('completed');
        else li.classList.remove('completed');
    });
    const el = document.getElementById(`nav-${step}`);
    if (el) el.classList.add('active');
}

function showHudAlert(msg, color) {
    const a = document.getElementById('hud-alert'), t = document.getElementById('hud-alert-text');
    if (!a || !t) return;
    t.innerText = msg;
    if (color) { a.style.color = color; a.style.textShadow = `0 0 20px ${color}`; }
    a.classList.remove('hidden');
    a.style.animation = 'none'; a.offsetHeight; a.style.animation = null;
    setTimeout(() => a.classList.add('hidden'), 2500);
}

function initStepLogic(step) {
    if (step === 1) initProfile();
    if (step === 2) initComfort();
    if (step === 4) initLearn();
    if (step === 5) initSimulation();
    if (step === 6) initTuning();
}

// ═══════════════════════════════════════════
//  STEP 1: Profile — uses actual spoken name
// ═══════════════════════════════════════════
function initProfile() {
    profileSubStep = 0;
    const mic = document.getElementById('mic-ring');
    if (mic) mic.addEventListener('click', startNameCapture);
}

function startNameCapture() {
    const mic = document.getElementById('mic-ring');
    if (!mic || mic.classList.contains('done')) return;
    mic.classList.add('active');
    speak("Listening. Please say your full name.");

    // Use speech recognition to capture the name
    if (SpeechRecognition) {
        awaitingName = true;
        if (!isListening) {
            // Temporarily start recognition just for name capture
            if (!recognition) initRecognition();
            try { recognition.start(); isListening = true;
                document.getElementById('mic-toggle').classList.add('listening');
            } catch(e) {}
        }
    } else {
        // Fallback if no speech recognition
        setTimeout(() => finishNameCapture('Alex Chen'), 2500);
    }
}

function captureSpokenName(transcript) {
    // Capitalize each word properly
    const name = transcript.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    finishNameCapture(name);
}

function finishNameCapture(name) {
    const mic = document.getElementById('mic-ring');
    if (mic) {
        mic.classList.remove('active'); mic.classList.add('done');
        mic.innerHTML = '<i class="ph-fill ph-check" style="font-size:32px;"></i>';
    }
    document.getElementById('name-fields').classList.remove('hidden');
    document.getElementById('input-name').value = name;
    // Use first word as display name
    const displayName = name.split(' ')[0];
    document.getElementById('input-display').value = displayName;
    document.querySelector('.voice-label').textContent = `Heard: "${name}"`;
    showHudAlert('Voice Recognized', '#00ff88');
    speak(`Nice to meet you, ${displayName}. You can edit your display name, then say next.`);
}

function advanceProfileSetup() {
    const nameEl = document.getElementById('setup-name'), face = document.getElementById('setup-face'), voice = document.getElementById('setup-voice');
    const dots = document.querySelectorAll('.step-dot'), btn = document.getElementById('btn-next-1');
    profileSubStep++;
    if (profileSubStep === 1) {
        nameEl.classList.add('hidden'); face.classList.remove('hidden');
        dots[0].classList.replace('active', 'done'); dots[1].classList.add('active');
        showHudAlert('Profile Name Saved', '#00ff88');
        speak("Now let's register your face. Please look at the display.");
        setTimeout(() => {
            const sc = document.getElementById('face-scanner');
            if (sc) {
                sc.classList.add('scanning');
                setTimeout(() => {
                    sc.classList.remove('scanning'); sc.style.borderColor = '#00ff88';
                    sc.innerHTML = '<i class="ph-fill ph-check-circle" style="color:#00ff88;font-size:36px;"></i>';
                    showHudAlert('Face Registered', '#00ff88');
                    speak("Face registered. Say next for voice profile setup.");
                }, 2000);
            }
        }, 400);
    } else if (profileSubStep === 2) {
        face.classList.add('hidden'); voice.classList.remove('hidden');
        dots[1].classList.replace('active', 'done'); dots[2].classList.add('active');
        btn.textContent = 'Complete Profile';
        speak("Please say: Hey AeroDrive, take me home.");
        setTimeout(() => {
            const w = document.getElementById('voice-wave');
            if (w) {
                w.innerHTML = '<i class="ph-fill ph-check-circle" style="color:#00ff88;font-size:36px;"></i>';
                showHudAlert('Voice Profile Created', '#00ff88');
                speak("Voice profile saved. Say next or tap Complete Profile.");
            }
        }, 3500);
    } else { loadStep(2); }
}

// ═══════════════════════════════════════════
//  STEP 2: Comfort — Interactive Seat
// ═══════════════════════════════════════════
let seatValues = { headrest: 5, backrest: 5, lumbar: 5, cushion: 5 };
let seatTilts = { headrest: 0, backrest: 0, lumbar: 0, cushion: 0 };
let activeZone = null;

function initComfort() { activeZone = null; }

function selectZone(zone) {
    activeZone = zone;
    document.querySelectorAll('.hotspot').forEach(h => h.classList.remove('active'));
    const hs = document.getElementById('hs-' + zone);
    if (hs) hs.classList.add('active');
    document.getElementById('zone-label').textContent = zone.charAt(0).toUpperCase() + zone.slice(1) + ' Adjustment';
    document.getElementById('zone-controls').classList.remove('hidden');
    document.getElementById('adj-val').textContent = seatValues[zone];
    document.getElementById('tilt-val').textContent = seatTilts[zone] + '°';
    speak(`${zone} selected. Use buttons to adjust height and tilt.`);
    updateSeatVisual();
}

function adjustSeat(dir) {
    if (!activeZone) return;
    seatValues[activeZone] = Math.max(1, Math.min(10, seatValues[activeZone] + dir));
    document.getElementById('adj-val').textContent = seatValues[activeZone];
    updateSeatVisual();
}

function adjustTilt(dir) {
    if (!activeZone) return;
    seatTilts[activeZone] = Math.max(-15, Math.min(15, seatTilts[activeZone] + dir * 3));
    document.getElementById('tilt-val').textContent = seatTilts[activeZone] + '°';
    updateSeatVisual();
}

function updateSeatVisual() {
    const img = document.getElementById('seat-img');
    if (!img) return;
    const tilt = seatTilts[activeZone] || 0;
    const scale = 0.95 + (seatValues[activeZone] || 5) * 0.01;
    img.style.transform = `rotate(${tilt}deg) scale(${scale})`;
}

let tempValue = 72;
function changeTemp(dir) {
    tempValue = Math.max(60, Math.min(85, tempValue + dir));
    document.getElementById('temp-display').textContent = tempValue + '°F';
}

function pickColor(el) {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}

// ═══ Step 4: Learn — Slideshow ═══
let currentSlide = 1;
const totalSlides = 4;
const slideVoice = {
    1: "Your car has Level 4 autonomy. It can drive on highways and mapped city roads, but not off-road or through heavy construction.",
    2: "The safety shield uses 12 cameras, LIDAR, and radar. Emergency braking and pedestrian detection are always active.",
    3: "You get 320 miles of range. Fast charging to 80% takes just 20 minutes.",
    4: "This is critical. When the car encounters something it can't handle, it gives you 10 seconds to take over. If you don't, it will park itself safely."
};

function initLearn() {
    currentSlide = 1;
    updateSlideUI();
    // Animate charge bar when slide 3 appears
}

function goSlide(n) {
    currentSlide = n;
    updateSlideUI();
    if (slideVoice[n]) speak(slideVoice[n]);
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        updateSlideUI();
        if (slideVoice[currentSlide]) speak(slideVoice[currentSlide]);
    } else {
        // Done with learn, go to simulation
        loadStep(5);
    }
}

function prevSlide() {
    if (currentSlide > 1) {
        currentSlide--;
        updateSlideUI();
        if (slideVoice[currentSlide]) speak(slideVoice[currentSlide]);
    }
}

function updateSlideUI() {
    document.querySelectorAll('.learn-slide').forEach(s => s.classList.remove('active'));
    const slide = document.getElementById('ls-' + currentSlide);
    if (slide) slide.classList.add('active');

    document.querySelectorAll('.s-ind').forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide - 1);
    });

    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = `${currentSlide} / ${totalSlides}`;

    const prevBtn = document.getElementById('btn-slide-prev');
    if (prevBtn) prevBtn.disabled = (currentSlide === 1);

    const nextBtn = document.getElementById('btn-slide-next');
    if (nextBtn) {
        if (currentSlide === totalSlides) {
            nextBtn.innerHTML = 'Practice Take-Over <i class="ph ph-arrow-right"></i>';
        } else {
            nextBtn.innerHTML = 'Next Topic <i class="ph ph-arrow-right"></i>';
        }
    }

    // Animate charge bar on slide 3
    if (currentSlide === 3) {
        setTimeout(() => {
            const bar = document.getElementById('charge-bar-fill');
            if (bar) bar.style.width = '80%';
        }, 200);
    }
}

// ═══ Step 5: Simulation — Multi-stage ═══
let simCountdown = 10;
let simCountdownTimer = null;
let simStartTime = 0;
let simAttempt = 1;

function initSimulation() {
    const btnNext = document.getElementById('btn-next-5');
    const btnHold = document.getElementById('btn-hold');
    const fill = document.getElementById('hold-fill');
    let holdTimer, progress = 0;

    // Update attempt counter
    const counter = document.getElementById('attempt-counter');
    if (counter) counter.textContent = 'ATTEMPT ' + simAttempt;

    // Reset hold button state
    if (btnHold) {
        btnHold.classList.remove('secured', 'holding');
        btnHold.querySelector('span').innerHTML = '<i class="ph ph-hand-grabbing" style="margin-right:6px;"></i> GRIP STEERING WHEEL';
    }
    if (fill) fill.style.width = '0%';

    // Stage 1: Autonomous driving (3 seconds)
    speak("You are now driving autonomously at 65 miles per hour. Watch what happens next.");
    
    setTimeout(() => {
        // Stage 2: Warning appears
        document.getElementById('sim-stage-1').classList.remove('active');
        document.getElementById('sim-stage-2').classList.add('active');
        document.getElementById('sim-action').classList.remove('hidden');
        speak("Warning! Unmapped zone detected. You have 10 seconds. Grab the steering wheel!");
        showHudAlert('⚠ TAKE OVER', '#ff3366');
        
        simStartTime = Date.now();
        simCountdown = 10;
        
        // Start countdown
        const circumference = 276.46;
        const circle = document.getElementById('countdown-circle');
        const numEl = document.getElementById('countdown-num');
        
        // Reset countdown visual
        if (circle) circle.style.strokeDashoffset = 0;
        if (numEl) { numEl.textContent = '10'; numEl.style.fontSize = ''; numEl.style.color = ''; }
        
        simCountdownTimer = setInterval(() => {
            simCountdown--;
            if (numEl) numEl.textContent = simCountdown;
            if (circle) {
                const offset = circumference * (1 - simCountdown / 10);
                circle.style.strokeDashoffset = offset;
            }
            if (simCountdown <= 3 && numEl) {
                numEl.style.fontSize = '22px';
                numEl.style.color = '#ff0000';
            }
            if (simCountdown <= 0) {
                clearInterval(simCountdownTimer);
                // Show failsafe stage instead of silently resetting
                document.getElementById('sim-stage-2').classList.remove('active');
                const failsafe = document.getElementById('sim-stage-4');
                if (failsafe) failsafe.classList.add('active');
                document.getElementById('sim-action').classList.add('hidden');
                showHudAlert('Failsafe Engaged', '#FBBF24');
                speak("Time expired. The car's failsafe system would engage: hazard lights on, gradual deceleration, and a safe stop on the shoulder. Let's practice again.");
                // Reset simulation after showing failsafe
                setTimeout(() => resetSimulation(), 4000);
            }
        }, 1000);
    }, 3000);

    // Hold button logic
    if (btnHold && fill) {
        const start = () => {
            if (btnHold.classList.contains('secured')) return;
            btnHold.classList.add('holding');
            holdTimer = setInterval(() => {
                progress += 4;
                fill.style.width = progress + '%';
                if (progress >= 100) {
                    clearInterval(holdTimer);
                    clearInterval(simCountdownTimer);
                    btnHold.classList.remove('holding');
                    btnHold.classList.add('secured');
                    btnHold.querySelector('span').innerHTML = '<i class="ph-fill ph-check-circle" style="margin-right:6px;"></i> CONTROL SECURED';
                    
                    // Calculate response time
                    const responseTime = ((Date.now() - simStartTime) / 1000).toFixed(1);
                    
                    // Stage 3: Success
                    setTimeout(() => {
                        document.getElementById('sim-stage-2').classList.remove('active');
                        document.getElementById('sim-stage-3').classList.add('active');
                        document.getElementById('sim-action').classList.add('hidden');
                        document.getElementById('response-time').textContent = responseTime;
                        if (btnNext) btnNext.disabled = false;
                        showHudAlert('Override Successful', '#10B981');
                        speak(`Excellent! You took over in ${responseTime} seconds. You're ready for the road.`);
                    }, 500);
                }
            }, 40);
        };
        const stop = () => {
            if (progress < 100) {
                clearInterval(holdTimer);
                btnHold.classList.remove('holding');
                progress = 0;
                fill.style.width = '0%';
            }
        };
        btnHold.addEventListener('mousedown', start);
        btnHold.addEventListener('mouseup', stop);
        btnHold.addEventListener('mouseleave', stop);
        btnHold.addEventListener('touchstart', e => { e.preventDefault(); start(); });
        btnHold.addEventListener('touchend', stop);
    }
}

function resetSimulation() {
    // Hide all stages
    document.querySelectorAll('.sim-stage').forEach(s => s.classList.remove('active'));
    document.getElementById('sim-stage-1').classList.add('active');
    document.getElementById('sim-action').classList.add('hidden');
    simAttempt++;
    // Restart after a beat
    setTimeout(() => initSimulation(), 1500);
}

// ═══ Step 6: Tuning — Visual Preview ═══
let tuneState = { accel: 2, dist: 3, lane: 2 };

function initTuning() {
    tuneState = { accel: 2, dist: 3, lane: 2 };
    updateTunePreview();
}

function setAccel(val) {
    tuneState.accel = val;
    updateOptionButtons('tune-speed', val);
    document.getElementById('val-accel').textContent = ['Smooth','Standard','Dynamic'][val-1];
    updateTunePreview();
    // HUD sync
    const bar = document.getElementById('hud-accel-bar');
    if (bar) bar.style.width = (val * 33.3) + '%';
    speak(['Smooth acceleration selected. Gentle and relaxed.', 'Standard acceleration. Balanced response.', 'Dynamic mode engaged. Seat bolsters will tighten during acceleration.'][val-1]);
}

function setDist(val) {
    tuneState.dist = val;
    updateOptionButtons('tune-dist', val);
    document.getElementById('val-dist').textContent = ['Close','Medium','Far'][val-1];
    updateTunePreview();
    // HUD sync
    const d = document.getElementById('hud-dist-dots');
    if (d) { let h = ''; for (let i = 0; i < 3; i++) h += `<div class="dot ${i < val ? 'active' : ''}"></div>`; d.innerHTML = h; }
}

function setLane(val) {
    tuneState.lane = val;
    updateOptionButtons('tune-lane', val);
    document.getElementById('val-lane').textContent = ['Left','Center','Right'][val-1];
    updateTunePreview();
}

function updateOptionButtons(cardId, activeVal) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.querySelectorAll('.tune-opt').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.val) === activeVal);
    });
}

function updateTunePreview() {
    // Car lane position
    const yourCar = document.getElementById('your-car');
    const leadCar = document.getElementById('lead-car');
    const lanePositions = { 1: '30%', 2: '50%', 3: '70%' };
    if (yourCar) yourCar.style.left = lanePositions[tuneState.lane];
    if (leadCar) leadCar.style.left = lanePositions[tuneState.lane];

    // Following distance — move lead car up/down
    const distPositions = { 1: '45%', 2: '35%', 3: '18%' };
    const distMeters = { 1: '25m', 2: '35m', 3: '45m' };
    const distLabelPos = { 1: '55%', 2: '45%', 3: '38%' };
    if (leadCar) leadCar.style.top = distPositions[tuneState.dist];
    const distLabel = document.getElementById('dist-label');
    if (distLabel) distLabel.style.top = distLabelPos[tuneState.dist];
    const distM = document.getElementById('dist-meters');
    if (distM) distM.textContent = distMeters[tuneState.dist];

    // Acceleration — speed, G-force, bolsters, seat tilt
    const speeds = { 1: '55', 2: '65', 3: '80' };
    const gforces = { 1: '0.2', 2: '0.3', 3: '0.6' };
    const tiltLabels = { 1: 'Gentle', 2: 'Normal', 3: 'Sport' };
    const tiltIcons = { 1: 'ph-arrow-bend-up-right', 2: 'ph-arrow-right', 3: 'ph-arrow-bend-down-right' };
    
    const speedEl = document.getElementById('preview-speed');
    const gforceEl = document.getElementById('preview-gforce');
    const tiltIcon = document.getElementById('seat-tilt-icon');
    const tiltLabel = document.getElementById('tilt-label');
    
    if (speedEl) speedEl.textContent = speeds[tuneState.accel];
    if (gforceEl) gforceEl.textContent = gforces[tuneState.accel];
    if (tiltLabel) tiltLabel.textContent = tiltLabels[tuneState.accel];
    if (tiltIcon) {
        tiltIcon.querySelector('i').className = 'ph ' + tiltIcons[tuneState.accel];
        tiltIcon.classList.toggle('dynamic', tuneState.accel === 3);
    }

    // Bolster bars — only active in Dynamic mode
    const bl = document.getElementById('bolster-l');
    const br = document.getElementById('bolster-r');
    if (bl) bl.classList.toggle('active', tuneState.accel === 3);
    if (br) br.classList.toggle('active', tuneState.accel === 3);
}

function completeSetup() {
    const s = document.getElementById('hud-status');
    if (s) { s.innerHTML = '<i class="ph-fill ph-check-circle"></i> Calibrated'; s.style.color = '#00ff88'; }
    document.querySelectorAll('.nav-steps li').forEach(li => { li.classList.remove('active'); li.classList.add('completed'); });
    showHudAlert('Setup Complete', '#00ff88');
    loadStep(7);
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    // Pre-request mic access for the entire session
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Mic access granted");
    } catch (err) {
        console.warn("Mic access denied or error:", err);
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    
    initRecognition();
    // Auto-start listening mode for a seamless voice experience
    toggleMic(); 
    
    loadStep(1);
});
