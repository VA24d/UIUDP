# Simple Map Location Selection - Quick Guide

## Overview
Simplified map interface with **6 predefined zones**. Click a zone to select a standard location for Home or Work.

## How It Works

### Map Layout
```
┌─────────────────────────────────────────┐
│  Click to set your Home location       │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Residential  │  │  Downtown    │   │
│  │  District    │  │  Business    │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │  Tech Park   │  │  Suburban    │   │
│  │              │  │   Area       │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Industrial   │  │   Uptown     │   │
│  │    Zone      │  │              │   │
│  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────┘
```

## Predefined Locations

### Home Locations (Residential)
1. **Residential District**
   - Address: `123 Maple Street, Greenwood Heights`
   - Type: Quiet residential neighborhood

2. **Suburban Area**
   - Address: `456 Oak Avenue, Riverside Suburbs`
   - Type: Family-friendly suburbs

3. **Uptown**
   - Address: `789 Park Boulevard, Uptown District`
   - Type: Urban living

### Work Locations (Commercial)
1. **Downtown Business**
   - Address: `AeroSpace HQ, 100 Corporate Plaza, Downtown`
   - Type: Corporate headquarters

2. **Tech Park**
   - Address: `Innovation Center, 200 Tech Drive, Silicon Valley`
   - Type: Technology campus

3. **Industrial Zone**
   - Address: `Manufacturing Hub, 300 Industry Road, East District`
   - Type: Industrial facility

## Step-by-Step Usage

### 1. Set Home Location
```
1. "Home" is pre-selected (blue border)
2. Click any residential zone:
   - Residential District (top-left)
   - Suburban Area (middle-right)
   - Uptown (bottom-right)
3. Blue house marker appears
4. Address fills in automatically
5. Status shows "Set to [Zone Name]"
```

### 2. Set Work Location
```
1. System auto-switches to "Work" (or click manually)
2. Click any business zone:
   - Downtown Business (top-right)
   - Tech Park (middle-left)
   - Industrial Zone (bottom-left)
3. Green briefcase marker appears
4. Address fills in automatically
5. Status shows "Set to [Zone Name]"
```

### 3. Save and Continue
```
1. Click "Save & Continue"
2. Validation: Home must be set
3. Locations saved to browser storage
4. Progress to Step 4 (Learn)
```

## Visual Feedback

### Zone Hover
- Border brightens
- Background lightens
- Label becomes more visible
- Slight scale increase

### Marker Placement
- Animated drop-in effect
- Positioned at zone center
- Icon with label
- Stays visible on map

### Status Updates
- Input field shows full address
- Status text: "Set to [Zone Name]"
- HUD alert: "Home location set" ✓
- Voice: "Home location set to..."

## Example Flow

```
User opens Step 3
  ↓
"Home" is active (blue border)
  ↓
User clicks "Residential District"
  ↓
🏠 Blue marker appears
  ↓
Input shows: "123 Maple Street, Greenwood Heights"
  ↓
Status: "Set to Residential District" ✓
  ↓
System auto-switches to "Work"
  ↓
User clicks "Downtown Business"
  ↓
💼 Green marker appears
  ↓
Input shows: "AeroSpace HQ, 100 Corporate Plaza..."
  ↓
Status: "Set to Downtown Business" ✓
  ↓
User clicks "Save & Continue"
  ↓
Locations saved → Step 4
```

## Smart Features

### Auto-Type Detection
- Clicking residential zones → Sets Home (if Home active)
- Clicking business zones → Sets Work (if Work active)
- Auto-switches if wrong type selected

### Auto-Progression
- After setting Home → Auto-switches to Work
- Voice prompt: "Now select your work location"
- Smooth workflow

### Validation
- Home is required
- Work is optional
- Clear error messages
- Voice feedback

## Saved Data Structure

```javascript
{
  home: {
    id: "home-1",
    name: "Residential District",
    address: "123 Maple Street, Greenwood Heights",
    position: { x: 27.5, y: 22.5 }
  },
  work: {
    id: "work-2",
    name: "Tech Park",
    address: "Innovation Center, 200 Tech Drive...",
    position: { x: 27.5, y: 52.5 }
  }
}
```

## Tips

### Quick Setup
1. Click any residential zone (Home)
2. Click any business zone (Work)
3. Click "Save & Continue"

### Changing Selection
- Click a different zone to update
- Marker moves to new position
- Address updates automatically

### Skip Work
- Only Home is required
- Can skip Work and continue
- Can add Work later

## Comparison: Before vs After

### Before (Manual Entry)
```
❌ Type full address
❌ No visual reference
❌ Prone to typos
❌ No validation
```

### After (Zone Selection)
```
✅ Click to select
✅ Visual map reference
✅ Standard addresses
✅ Validated locations
✅ Faster setup
```

## Technical Details

### Zone Positioning
- 6 zones in 3×2 grid
- Each zone: 35% width × 25% height
- 10% margins from edges
- Responsive percentage-based

### Marker Positioning
- Centered in selected zone
- Percentage-based coordinates
- Animated drop-in
- Persistent visibility

### Address Generation
- Predefined for each zone
- Realistic street addresses
- City/district names
- Consistent formatting

---

**Result**: Simple, fast, and user-friendly location selection with standard addresses!

**File**: `/steps/step3.html`
**Integration**: Main onboarding flow
