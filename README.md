# Social Exercise App

A social fitness app that rewards **showing up** — not metrics. Instead of tracking calories or PRs, the app tracks consistency and uses AI to validate effort, keeping the experience lighthearted and low-pressure.

---

## Features

- **Camera** — Snap a square photo of your workout session
- **AI Validation** — Computer vision labels what's in your photo (yoga mat, dumbbells, chalk, etc.)
- **Session Logging** — Tag your workout type, location, date/time, and friends
- **Squad Feed** — See your friends' workout posts with AI-generated labels
- **Squads / Leaderboard** — Create competitive or cooperative groups
  - Competitive: set a punishment for the last-place member
  - Cooperative: set a shared goal with a progress bar
- **Member Profiles** — Tap any member to see their usual activities and monthly stats

---

## Tech Stack

### Frontend
- [Expo](https://expo.dev) (SDK 55) + [React Native](https://reactnative.dev) 0.83
- [Expo Router](https://expo.github.io/router) — file-based navigation
- TypeScript
- `@expo/vector-icons` (Ionicons)
- `react-native-safe-area-context`

### Backend *(scaffolded)*
- FastAPI + Python
- Supabase (database + auth + storage)
- Object detection API (to be connected)

---

## Project Structure

```
app/
  _layout.tsx              # Root stack navigator
  (tabs)/
    _layout.tsx            # Bottom tab bar (Feed · Snap · Squads)
    index.tsx              # Feed page
    camera.tsx             # Camera viewfinder
    leaderboard.tsx        # Squads leaderboard
  ai-labels.tsx            # AI label validation
  session-form.tsx         # Session details form
  session-overview.tsx     # Review & upload
  add-group.tsx            # Create new squad

components/
  FeedCard.tsx             # Workout post card
  PersonPopup.tsx          # Member stats bottom sheet

lib/
  mockData.ts              # Mock data + TypeScript interfaces

constants/
  Colors.ts                # App color palette

webapp-version/            # Original React/Vite mockup (reference only)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator, Android Emulator, or the [Expo Go](https://expo.dev/go) app

### Install & Run

```bash
npm install
```

**Expo Go (physical device)**
```bash
# Frontend
npx expo start

# Backend
uvicorn api:app --host 0.0.0.0 --port 8000
```
> `--host 0.0.0.0` is required so the phone can reach the server over your local network.

**Browser**
```bash
# Frontend
npx expo start

# Backend
uvicorn api:app --reload
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary | `#8fbc8f` | Buttons, active states, labels |
| Coral | `#e8a598` | Competitive accents, friend tags |
| Background | `#faf8f5` | App background |
| Text | `#1e293b` | Primary text |

---

## Roadmap

- [ ] Integrate `expo-camera` for real camera capture
- [ ] Connect Supabase for auth, user profiles, and storage
- [ ] Connect object detection API for real AI labels
- [ ] Push notifications for squad activity
- [ ] Reactions and comments on feed posts
