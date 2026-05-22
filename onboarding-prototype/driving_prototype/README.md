# AeroDrive Autonomous Driving Simulator

A high-fidelity UI/UX prototype demonstrating autonomous vehicle scenarios with professional design and smooth interactions.

## Features

### Scenario Simulations
1. **Takeover Request** - Construction zone requiring manual control
2. **Fatigue Detection** - Driver unresponsiveness with escalating alerts
3. **Battery Management** - Range anxiety with voice-based decision making

### UI Components
- **Central Display** - Infotainment screen with map and modals
- **Steering Wheel** - Interactive grip detection
- **Dashboard HUD** - Real-time speed and system status
- **System Log** - Hardware event monitoring
- **Voice Recognition** - Speech-based commands

### Design Highlights
- Glassmorphic panels with backdrop blur
- Smooth animations and transitions
- Professional typography (Inter font)
- Icon-based visual language (Phosphor Icons)
- Responsive color-coded alerts
- Real-time physics simulation

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone access for voice commands
- HTTPS connection (for camera/mic permissions)

### Running Locally

1. Open `index.html` in a web browser
2. Allow microphone permissions when prompted
3. Click scenario buttons to trigger simulations
4. Use voice commands: "yes", "no", "accept", "dismiss"

### File Structure
```
driving_prototype/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling system
├── app.js          # Simulation logic and interactions
├── IMPROVEMENTS.md # Detailed changelog
└── README.md       # This file
```

## Usage

### Scenario Controls
- **Takeover** - Simulates unmapped zone requiring driver intervention
- **Fatigue** - Simulates driver drowsiness detection
- **Battery** - Simulates low battery with rerouting decision
- **Reset** - Returns system to initial state

### Voice Commands
The system responds to natural language:
- "Yes" / "Accept" / "Reroute" - Confirm actions
- "No" / "Dismiss" / "Ignore" - Decline actions

### Visual Feedback
- **Blue** - Autonomous mode active
- **Amber** - Warning state
- **Red** - Critical alert requiring immediate action
- **Green** - Success confirmation

## Technical Details

### Technologies
- HTML5 semantic markup
- CSS3 with custom properties
- Vanilla JavaScript (ES6+)
- Web Speech API (recognition & synthesis)
- Web Audio API (procedural sounds)
- SVG graphics for dials

### Key Features
- Dynamic speedometer with SVG arc animation
- Procedural audio feedback
- Real-time physics simulation
- Voice recognition with fuzzy matching
- Countdown timers with visual feedback
- Ambient lighting effects

### Performance
- Hardware-accelerated animations
- Efficient DOM updates
- Minimal reflows and repaints
- Optimized event listeners

## Design System

### Colors
- **Primary**: #38BDF8 (Cyan) - Autonomous mode
- **Warning**: #FBBF24 (Amber) - Caution states
- **Critical**: #EF4444 (Red) - Urgent alerts
- **Success**: #10B981 (Green) - Confirmations

### Typography
- **Font**: Inter (300, 400, 500, 600, 700)
- **Monospace**: SF Mono / Monaco / Consolas (logs)

### Spacing
- Base unit: 4px
- Common values: 8px, 12px, 16px, 20px, 24px, 32px

### Border Radius
- Small: 6-8px
- Medium: 10-12px
- Large: 16-20px
- Circular: 50%

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |

### Required Features
- CSS Grid & Flexbox
- CSS Custom Properties
- backdrop-filter
- Web Speech API
- SVG support

## Known Limitations

1. Voice recognition requires HTTPS in production
2. Microphone access must be granted by user
3. Speech synthesis voices vary by platform
4. Backdrop blur may have performance impact on older devices

## Future Roadmap

- [ ] Mobile responsive design
- [ ] Haptic feedback simulation
- [ ] Additional scenarios (weather, traffic)
- [ ] Customizable voice profiles
- [ ] Data logging and analytics
- [ ] Multi-language support
- [ ] Accessibility enhancements

## Credits

- **Design**: Inspired by modern automotive HMI systems
- **Icons**: Phosphor Icons (https://phosphoricons.com)
- **Font**: Inter by Rasmus Andersson

## License

This is a prototype for demonstration purposes.

---

**Note**: This is a UI/UX prototype and does not represent actual autonomous driving capabilities. All scenarios are simulated for demonstration purposes only.
