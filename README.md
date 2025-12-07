# 4'33" — Audio Social Platform

An audio-only social platform inspired by John Cage's 4'33". Users record ambient sound in specific durations (movements), tag their recordings with interpretations, and explore others' recordings.

## Tech Stack

- **Frontend:** Angular 19 / Ionic 8 / Capacitor 6
- **Audio:** RecordRTC (WebM recording)
- **State:** Angular Signals

## Features

- **Record:** Select movement duration (30", 2'23", 1'40", or full 4'33"), record ambient audio with live waveform visualization
- **Interpret:** Add 3-5 tags describing what you heard
- **Explore:** Browse recordings, filter by tags, like and follow
- **Profile:** View your sounds, following, followers, and activity

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
# Open http://localhost:4200

# Start with network access (for phone testing)
npm run start:external
# Open http://<your-ip>:8100 on your phone
```

## Building

```bash
# Production build
npm run build
```

## Mobile Deployment

### Android

```bash
# Build and sync to Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then in Android Studio:
1. Connect your phone via USB
2. Enable Developer Options → USB Debugging on your phone
3. Click Run (or Shift+F10)

### iOS (requires macOS)

```bash
# Add iOS platform (first time only)
npx cap add ios

# Build and sync
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## Project Structure

```
src/app/
├── models/           # TypeScript interfaces & constants
├── services/         # State management & audio recording
├── components/       # Reusable UI components
│   ├── waveform/
│   ├── progress-ring/
│   ├── movement-badge/
│   ├── tag-chip/
│   ├── recording-card/
│   └── user-avatar/
├── tabs/             # Tab navigation
└── pages/
    ├── record/       # Movement selection + recording
    ├── playback/     # Preview recorded audio
    ├── tags-input/   # Add interpretation tags
    ├── explore/      # Browse recordings
    ├── recording-detail/
    ├── tag-detail/
    ├── user-profile/
    └── profile/      # Current user profile
```

## Movement Durations

| Movement | Duration | Based on original 4'33" |
|----------|----------|------------------------|
| I        | 30"      | Tacet                  |
| II       | 2'23"    | Tacet                  |
| III      | 1'40"    | Tacet                  |
| FULL     | 4'33"    | Complete work          |

## License

MIT
