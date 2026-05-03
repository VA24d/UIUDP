# Location Feature - Quick Guide

## How to Use

### 1. Navigate to Step 3
- Complete Steps 1 (Profile) and 2 (Comfort)
- Or click "Locations" in the sidebar

### 2. Set Your Home Location
```
┌─────────────────────────────────────────┐
│ Click on the map to set your Home      │ ← Instruction
│                                         │
│              [Click Here]               │ ← Click anywhere
│                                         │
│                                         │
│         🏠 Home                         │ ← Marker appears
│                                         │
└─────────────────────────────────────────┘

Result:
✓ Blue house marker appears
✓ Address auto-fills: "123 Main St, Techville"
✓ Coordinates shown: "45.2%, 32.1%"
✓ HUD alert: "Home location set" ✓
```

### 3. Set Your Work Location
```
Click "Work" in the right sidebar:

┌─────────────────────────────────┐
│ 💼 Work              [🎯]       │ ← Click crosshair
│ [Enter address...___________]   │
│                                 │
└─────────────────────────────────┘

Then click on map:

┌─────────────────────────────────────────┐
│ Click on the map to set your Work      │
│                                         │
│    🏠 Home                              │
│                                         │
│              [Click Here]               │
│                                         │
│                   💼 Work               │ ← Green marker
└─────────────────────────────────────────┘
```

### 4. Add Custom Locations (Optional)
```
Click "+ Add Custom Location" button:

┌─────────────────────────────────┐
│ [+ Add Custom Location]         │ ← Click this
└─────────────────────────────────┘

New item appears:

┌─────────────────────────────────┐
│ 📍 Custom 1      [🎯] [🗑️]     │ ← Auto-selected
│ [Click map or enter...______]   │
│                                 │
└─────────────────────────────────┘

Click map to place:

┌─────────────────────────────────────────┐
│    🏠 Home                              │
│                                         │
│              📍 Custom 1                │ ← Amber marker
│                                         │
│                   💼 Work               │
└─────────────────────────────────────────┘
```

### 5. Save and Continue
```
Click "Save & Continue" button:

Validation:
✓ Home location is set → Proceed
✗ Home location missing → Error message

On success:
✓ Locations saved to browser storage
✓ HUD progress updates to 50%
✓ Voice: "Location presets saved"
✓ Navigate to Step 4 (Learn)
```

## Visual Reference

### Complete Layout
```
┌──────────────────────────────────────────────────────────────────┐
│                    AeroDrive Onboarding                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────┬──────────────────────────────┐ │
│  │ Interactive Map             │ Location List                │ │
│  │                             │                              │ │
│  │  ┌─────────────────────┐    │ ┌──────────────────────────┐ │ │
│  │  │ Instructions        │    │ │ 🏠 Home          [🎯]    │ │ │
│  │  └─────────────────────┘    │ │ [123 Main St_________]   │ │ │
│  │                             │ │ 45.2%, 32.1%             │ │ │
│  │         [Grid]              │ └──────────────────────────┘ │ │
│  │                             │                              │ │
│  │    🏠 Home                  │ ┌──────────────────────────┐ │ │
│  │                             │ │ 💼 Work          [🎯]    │ │ │
│  │         📍 Custom 1         │ │ [456 Oak Ave_________]   │ │ │
│  │                             │ │ 67.8%, 54.3%             │ │ │
│  │              💼 Work        │ └──────────────────────────┘ │ │
│  │                             │                              │ │
│  │  ┌─────────────────────┐    │ ┌──────────────────────────┐ │ │
│  │  │ Legend              │    │ │ 📍 Custom 1  [🎯] [🗑️]  │ │ │
│  │  │ 🏠 Home             │    │ │ [789 Pine Rd_________]   │ │ │
│  │  │ 💼 Work             │    │ │ 23.4%, 78.9%             │ │ │
│  │  │ 📍 Custom           │    │ └──────────────────────────┘ │ │
│  │  └─────────────────────┘    │                              │ │
│  │                             │ [+ Add Custom Location]      │ │
│  └─────────────────────────────┴──────────────────────────────┘ │
│                                                                  │
│  [Back]                                    [Save & Continue →]  │
└──────────────────────────────────────────────────────────────────┘
```

## Color Coding

### Markers
- **🏠 Home**: Blue (#38BDF8) - Primary destination
- **💼 Work**: Green (#10B981) - Commute destination  
- **📍 Custom**: Amber (#FBBF24) - Additional locations

### States
- **Active**: Blue glow border
- **Hover**: Lighter background
- **Focus**: Blue border on input
- **Error**: Red text/border

## Keyboard Shortcuts

### Navigation
- **Tab**: Move between inputs
- **Shift+Tab**: Move backwards
- **Enter**: Activate button/input

### Actions
- **Click Map**: Place marker
- **Click Crosshair**: Select location type
- **Click Trash**: Remove custom location

## Tips & Tricks

### Quick Setup
1. Click map for Home (required)
2. Click map for Work (optional)
3. Click "Save & Continue"

### Precision Placement
- Zoom browser for finer control
- Use coordinate display for exact position
- Re-click to adjust marker position

### Multiple Locations
- Add unlimited custom locations
- Name them in the input field
- Remove unwanted ones with trash icon

### Manual Entry
- Type address directly if preferred
- Coordinates auto-calculate
- Marker updates on map (future)

## Common Issues

### Marker Not Appearing
**Problem**: Clicked map but no marker
**Solution**: 
- Check location type is selected (blue border)
- Click inside the map area (not on legend)
- Refresh page if needed

### Can't Continue
**Problem**: "Save & Continue" shows error
**Solution**:
- Home location is required
- Click map to set Home first
- Look for blue house marker

### Address Not Updating
**Problem**: Input field stays empty
**Solution**:
- Marker must be placed on map first
- Address auto-generates from coordinates
- Can manually type if needed

## Integration Notes

### For Developers

#### Accessing Location Data
```javascript
// Get saved locations
const locations = JSON.parse(
    localStorage.getItem('aerodrive_locations')
);

console.log(locations.home);    // { x, y, address }
console.log(locations.work);    // { x, y, address }
console.log(locations.custom);  // [{ id, x, y, address }]
```

#### Adding New Location Types
```javascript
// In step3.html, add new location item:
<div class="location-item" id="gym-location">
    <div class="location-header">
        <i class="ph-fill ph-barbell"></i>
        <span class="location-title">Gym</span>
        <button onclick="setActiveLocation('gym')">
            <i class="ph ph-crosshair"></i>
        </button>
    </div>
    <input id="gym-input" placeholder="...">
</div>

// Add marker to map:
<div id="gym-marker" class="map-marker">
    <i class="ph-fill ph-barbell"></i>
    <span class="marker-label">Gym</span>
</div>
```

#### Customizing Mock Addresses
```javascript
function generateMockAddress(x, y, type) {
    // Add your own street names
    const streets = ['Your St', 'Custom Ave'];
    
    // Add your own cities
    const cities = ['Your City', 'Your Town'];
    
    // Custom logic
    return `${streetNum} ${street}, ${city}`;
}
```

## Future Features

### Coming Soon
- Real map integration (Mapbox/Google Maps)
- Drag-and-drop marker repositioning
- Address search/autocomplete
- Route preview between locations
- Import from contacts

### Planned
- Location categories (Restaurant, Shop, etc.)
- Favorite routes
- Traffic-aware routing
- Calendar integration
- Share locations with others

---

**Ready to use!** Navigate to Step 3 in the onboarding flow to try it out.

**File Location**: `/steps/step3.html`
**Documentation**: `MAP_LOCATION_FEATURE.md`
