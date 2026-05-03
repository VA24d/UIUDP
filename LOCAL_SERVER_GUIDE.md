# AeroDrive Local Server Guide

## 🚀 Server Status: RUNNING

Your AeroDrive system is now running locally!

### Access URLs

- **Main Application**: http://localhost:8000/
- **Onboarding Flow**: http://localhost:8000/index.html
- **Driving Simulator**: http://localhost:8000/driving_prototype/index.html
- **Or use the toggle**: http://localhost:8000/?sim=1 (starts in simulator mode)

### What's Available

#### 1. **First-Time Setup (Onboarding)**
   - 6-step interactive setup process
   - Voice-enabled profile creation
   - Seat comfort calibration
   - **Map-based location selection** (Home & Work with 6 predefined zones)
   - Educational slideshow
   - Take-over simulation
   - Drive tuning preferences

#### 2. **Driving Simulator**
   - 4 autonomous driving scenarios:
     - **Takeover**: Unmapped construction zone
     - **Fatigue**: Driver drowsiness detection
     - **Battery**: Range anxiety & rerouting
     - **Touring**: Voice-first journey guide
   - Real-time HUD updates
   - Voice interaction
   - System logging

### Task Flow Diagrams

Three comprehensive PlantUML diagrams have been generated:

1. **`task-flows/onboarding-flow.puml`**
   - Complete 6-step setup flow
   - Decision branches and validation
   - Voice and camera permission handling
   - Map-based location selection logic

2. **`task-flows/driving-scenarios-flow.puml`**
   - All 4 driving scenarios with split paths
   - Takeover, Fatigue, Battery, Touring modes
   - Emergency procedures (MRM, SOS)
   - Voice interaction flows

3. **`task-flows/system-initialization-flow.puml`**
   - Startup sequence with subsystem initialization
   - Voice engine, audio engine, physics engine
   - Permission requests and health checks
   - Graceful degradation handling

### Viewing PlantUML Diagrams

To render the `.puml` files:

**Option 1: Online Viewer**
```bash
# Copy content and paste at: http://www.plantuml.com/plantuml/uml/
```

**Option 2: VS Code Extension**
```bash
# Install: PlantUML extension by jebbs
# Then: Right-click .puml file → "Preview Current Diagram"
```

**Option 3: Command Line (requires PlantUML)**
```bash
# Install PlantUML first
brew install plantuml  # macOS

# Generate PNG
plantuml task-flows/onboarding-flow.puml
plantuml task-flows/driving-scenarios-flow.puml
plantuml task-flows/system-initialization-flow.puml
```

### Testing the System

1. **Open your browser** to http://localhost:8000/
2. **Toggle between modes** using the top navigation
3. **Test onboarding**:
   - Click through all 6 steps
   - Try voice input (requires microphone permission)
   - Test map location selection in Step 3
   - Complete take-over simulation in Step 5
4. **Test driving scenarios**:
   - Click each scenario in the sidebar
   - Interact with modals and buttons
   - Test voice commands in Touring mode
   - Observe HUD updates

### Stopping the Server

To stop the local server:
```bash
# Press Ctrl+C in the terminal where the server is running
# Or use the Kiro process management tools
```

### Project Structure

```
/
├── index.html              # Main entry (onboarding + simulator toggle)
├── style.css               # Shared styles
├── script.js               # Onboarding logic
├── steps/                  # 6 onboarding steps
│   ├── step1.html         # Profile creation
│   ├── step2.html         # Comfort settings
│   ├── step3.html         # Location selection (MAP-BASED)
│   ├── step4.html         # Educational slideshow
│   ├── step5.html         # Take-over simulation
│   ├── step6.html         # Drive tuning
│   └── success.html       # Completion screen
├── driving_prototype/      # Isolated simulator
│   ├── index.html         # Simulator UI
│   ├── styles.css         # Simulator styles
│   ├── app.js             # 4 scenario logic
│   └── context.md         # UC specifications
└── task-flows/            # PlantUML diagrams
    ├── onboarding-flow.puml
    ├── driving-scenarios-flow.puml
    └── system-initialization-flow.puml
```

### Key Features Implemented

✅ Side-by-side cockpit layout (Central Display + HUD)
✅ Glassmorphic design with Inter font
✅ Voice recognition & text-to-speech
✅ **Map-based location selection** with 6 predefined zones
✅ 4 driving scenarios with full interactions
✅ Real-time HUD synchronization
✅ System logging and debugging
✅ Comprehensive task flow documentation

### Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Full support
- **Voice features**: Require HTTPS or localhost

### Next Steps

- View the system at http://localhost:8000/
- Test all interactions
- Review PlantUML diagrams for flow documentation
- Provide feedback for any adjustments needed

---

**Server Port**: 8000
**Status**: ✅ Active
**Started**: May 4, 2026
