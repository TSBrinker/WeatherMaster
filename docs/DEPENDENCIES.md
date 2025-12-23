# WeatherMaster v2 - Dependencies & Setup

**Last Updated**: 2025-12-21 (Sprint 5 - Sage)

---

## System Requirements

- **Node.js**: v14.0.0 or higher (v18+ recommended)
- **npm**: v6.0.0 or higher (comes with Node.js)
- **Git**: For version control

---

## npm Dependencies

All dependencies are tracked in `package.json`. No additional packages are required beyond what's already installed.

### Core Dependencies (from package.json)

**React & React DOM**:
- `react`: ^18.x
- `react-dom`: ^18.x
- `react-scripts`: 5.x (Create React App)

**UI Framework**:
- `react-bootstrap`: ^2.x - Bootstrap components for React
- `bootstrap`: ^5.x - Bootstrap CSS framework

**Icons**:
- `react-icons`: ^4.x or ^5.x - Includes `react-icons/wi` (Weather Icons) and `react-icons/fa` (Font Awesome)
- `lucide-react`: ^0.x - Modern icon library (used in modals)

**Utilities**:
- Various other dependencies as listed in package.json

### Dev Dependencies

- Standard Create React App dev dependencies
- No additional dev tools required

---

## Fresh Workstation Setup

### 1. Install Node.js

Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

### 2. Clone Repository

```bash
git clone https://github.com/[your-username]/WeatherMaster.git
cd WeatherMaster
```

### 3. Install Dependencies

```bash
npm install
```

This will install all dependencies from `package.json`.

### 4. Verify Installation

Run the development server:
```bash
npm start
```

Build for production:
```bash
npm run build
```

---

## No Additional Packages Required for Sprint 5

Sprint 5 (Sage - Educational Modals) did **not** add any new npm packages.

**Packages used**:
- `react-bootstrap` (Modal, Accordion, Button) - already installed
- `lucide-react` (Cloud, Shield, Eye, etc. icons) - already installed
- `react-icons/wi` (Weather Icons) - already installed
- `react-icons/fa` (Font Awesome) - already installed

---

## IDE Setup (Optional)

### VS Code Extensions (Recommended)

- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Auto Rename Tag** - HTML/JSX tag renaming
- **Path Intellisense** - File path autocomplete

### VS Code Settings

The project may include `.vscode/settings.json` for consistent formatting.

---

## Troubleshooting

### npm install fails

Try clearing npm cache:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build warnings about browserslist

Update browserslist data:
```bash
npx update-browserslist-db@latest
```

### Port 3000 already in use

Kill the process on port 3000 or specify a different port:
```bash
PORT=3001 npm start
```

---

## Project Structure Reminder

```
WeatherMaster/
├── public/              # Static assets
├── src/                 # Original v1 implementation (legacy)
├── src/v2/              # v2 implementation (active development)
│   ├── components/      # React components
│   │   ├── modals/      # Modal components (Sprint 5)
│   │   ├── weather/     # Weather display components
│   │   ├── menu/        # Menu components
│   │   └── ...
│   ├── services/        # Weather & celestial services
│   ├── contexts/        # React contexts
│   ├── data/            # Region templates & climate data
│   └── styles/          # Global styles
├── docs/                # Documentation
│   ├── sprint-logs/     # Sprint documentation
│   └── NOTES_FROM_USER.md  # Tyler's ongoing notes
├── package.json         # Dependencies
├── PROGRESS.md          # Master progress tracker
├── AI_INSTRUCTIONS.md   # Instructions for AI agents
└── DEPENDENCIES.md      # This file
```

---

## Notes for Future Agents

- **No new dependencies added in Sprint 5**
- All icon libraries already present
- React Bootstrap already configured
- No environment variables required
- No API keys needed (everything runs client-side)
- localStorage used for data persistence (no database setup)

---

## Git Workflow

Standard workflow:
```bash
git pull origin main           # Get latest changes
npm install                    # Update dependencies if package.json changed
npm start                      # Start development
# ... make changes ...
git add .
git commit -m "Description"    # Commit format in AI_INSTRUCTIONS.md
git push origin main
```

---

## Build & Deploy

**Development**:
```bash
npm start
```

**Production build**:
```bash
npm run build
```

Output goes to `build/` directory. Configured for `/WeatherMaster/` base path (see `homepage` in package.json).

**Deploy**:
- Built for GitHub Pages or any static host
- No server-side requirements
- All computation happens in browser

---

**Happy coding!** 🌦️
