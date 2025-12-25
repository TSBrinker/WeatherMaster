# Sprint 32 - Marble

**Date**: 2025-12-25
**Focus**: UI/UX - iOS Weather-inspired Location Menu

---

## Completed

### 1. Floating Menu Button
Moved the hamburger menu trigger from the header to a floating pill button:
- New `FloatingMenuButton` component with frosted glass effect (backdrop blur)
- Fixed position bottom-right corner
- Removed hamburger from `WeatherHeader`
- Fixed layout shift when modal/offcanvas opens (`scrollbar-gutter` and overflow fixes)

### 2. Location Cards with Weather Preview
Enhanced the location list in HamburgerMenu:
- Each location shows current temperature (large), condition, and H/L
- Daily high/low calculated by sampling all 24 hours
- Removed climate band for cleaner layout
- Complete CSS restyle for legibility and theme consistency

### 3. Edit List Mode
Replaced "Nuke All Regions" with granular deletion:
- "Edit List" button appears in settings panel
- Edit mode shows checkboxes on each location
- "Select All" checkbox in header area
- Selected items highlighted with red tint
- "Delete Selected (n)" button with confirmation dialog
- Removed "Nuke All Regions" from both inline and dropdown SettingsMenu

### 4. Form/Modal Styling
Comprehensive dark theme styling for modal forms:
- Form labels, controls, placeholders properly themed
- Help text (`.form-text`) properly muted
- Alert boxes (template descriptions) styled
- Horizontal rules styled
- Focus states with blue accent

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/v2/components/menu/FloatingMenuButton.jsx` | NEW | Floating pill button component |
| `src/v2/components/menu/FloatingMenuButton.css` | NEW | Frosted glass styling |
| `src/v2/components/menu/HamburgerMenu.jsx` | MOD | Weather preview, edit mode logic |
| `src/v2/components/menu/HamburgerMenu.css` | MOD | Complete restyle + edit mode styles |
| `src/v2/components/menu/SettingsMenu.jsx` | MOD | Removed Nuke All Regions |
| `src/v2/components/header/WeatherHeader.jsx` | MOD | Removed hamburger button + props |
| `src/v2/App.jsx` | MOD | Added FloatingMenuButton, deleteRegion prop |
| `src/v2/styles/app.css` | MOD | Modal/form styling, scroll shift fix |

---

## Stretch Goals Noted for Future

- Biome color themes for location cards
- Search/filter for locations list
- Drag-to-reorder locations (needs dnd library)
- °C/°F and Miles/Km toggles in settings

---

## Reference Images Used

- `/ref images/Weather - Primary Display.png` - iOS Weather bottom toolbar inspiration
- `/ref images/Weather - Location Menu.PNG` - iOS Weather dropdown menu
- `/ref images/Weather - Location List.PNG` - iOS Weather location cards with weather preview

---

*Marble out. Happy holidays!*
