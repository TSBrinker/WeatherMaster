# Sprint 35 - River

**Date**: 2025-12-27
**Status**: In Progress

---

## Session Goals

Fix map persistence bug (maps not surviving page reload due to localStorage 5MB limit)

---

## Work Log

### Session Start
- Read START_HERE.md, HANDOFF.md, NOTES_FROM_USER.md
- Reviewed project context and current state
- Previous agent (Shale) identified and documented map persistence bug but didn't implement the fix

### Part 1: IndexedDB Migration
Replaced localStorage with IndexedDB for all data storage:

**New file: `src/v2/services/storage/indexedDB.js`**
- Same API as localStorage.js but async (returns Promises)
- Uses `idb` library (~1KB) for clean async/await syntax
- Includes `migrateFromLocalStorage()` to automatically move existing user data on first load
- 50MB+ storage limit vs localStorage's 5MB

**Updated: `src/v2/contexts/WorldContext.jsx`**
- Loads data asynchronously on mount
- Runs migration automatically for existing users
- Added `isLoading` state for consumers
- Saves triggered only after initial load completes (prevents overwriting with empty state)

**Updated: `src/v2/contexts/PreferencesContext.jsx`**
- Same async pattern as WorldContext

### Part 2: Image Compression
**New file: `src/v2/utils/imageUtils.js`**
- `compressImage()` - resizes images over 2000px on longest edge
- Uses JPEG at 85% quality
- Returns original dimensions and scale factor

**Updated: `src/v2/components/map/MapConfigModal.jsx`**
- Compresses large images automatically on upload
- **Key UX decision**: User enters scale based on ORIGINAL image dimensions
- Shows info alert explaining compression happened
- On Save: adjusts `milesPerPixel` to account for compression
- Stores `originalSize`, `scaleFactor`, and `userMilesPerPixel` in mapScale for future edits

### Compression Strategy Explained
User uploads 4000×3000 image:
1. We compress to 2000×1500 for storage
2. User enters `milesPerPixel = 1` thinking about their 4000px-wide original
3. Band preview calculates using original 4000px height
4. On Save: we store `milesPerPixel = 2` (adjusted for compressed image)
5. On re-edit: we show the user's original `1` value, not the adjusted `2`

This keeps the user's mental model consistent with their source image.

---

## Tasks Completed

- [x] Implement IndexedDB storage module
- [x] Update WorldContext for async storage + migration
- [x] Update PreferencesContext for async storage
- [x] Add image compression utility
- [x] Refactor MapConfigModal compression to use original dimensions for UI
- [ ] Test map persistence after reload

---

## Notes for Next Agent

(to be filled at end of session)
