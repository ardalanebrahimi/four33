# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

4'33" is an audio-only social platform inspired by John Cage's 4'33". Users record ambient sound in fixed durations (movements), tag recordings with interpretive words, and explore others' recordings.

**Current state:** Frontend MVP with mock data. No backend implemented yet.

## Commands

```bash
npm start              # Dev server at http://localhost:4200
npm run start:external # Dev server at http://0.0.0.0:8100 (phone testing)
npm run build          # Production build
npm test               # Run Karma tests

# Mobile (Capacitor)
npm run cap:sync       # Sync web assets to native projects
npm run cap:android    # Open Android Studio
npm run cap:ios        # Open Xcode
```

## Architecture

### Tech Stack
- Angular 19 with standalone components
- Ionic 8 for mobile UI
- Capacitor 6 for native deployment
- RecordRTC for audio recording (WAV format)
- Angular Signals for state management (no NgRx)

### State Management

Recording flow state is managed via `RecordingStateService` using Angular Signals:
- `phase` signal tracks flow: `selecting` → `ready` → `recording` → `recorded` → `tagging` → `uploading`
- All state is reset after upload completes

`MockDataService` provides fake data for development. This will be replaced with API calls.

### Recording Flow

1. `/record` - Select movement duration (I: 30s, II: 143s, III: 100s, FULL: 273s)
2. `/record` - Record audio with live waveform
3. `/playback` - Preview recording
4. `/tags-input` - Add 3-5 interpretive tags + optional title
5. Upload → redirect to `/explore`

### Routing Structure

Tab-based navigation with three main tabs:
- `/record` - Recording flow
- `/explore` - Browse recordings
- `/you` - User profile

Detail pages outside tabs: `/recording/:id`, `/tag/:name`, `/user/:id`

### Audio Recording

`AudioRecorderService` uses RecordRTC with high-quality settings:
- 96kHz sample rate (falls back to 48kHz)
- Stereo WAV output
- No echo cancellation/noise suppression (intentional for ambient capture)
- Live amplitude analysis for waveform visualization

### Design System

Dark theme with CSS custom properties defined in `src/styles.scss`:
- `--color-bg: #000000`
- `--color-surface: #0a0a0a`
- `--color-surface-elevated: #1a1a1a`
- `--color-text-primary: #ffffff`
- `--color-text-secondary: #888888`

Components use inline SCSS with these variables.

## Key Domain Concepts

- **Movement**: A recording duration based on John Cage's 4'33" structure
- **Tags**: 3-5 interpretive words per recording (max 20 chars each, lowercase)
- **Original tags**: Tags added by the recording owner (vs community-added)

## Future Backend

Planned: .NET 8 API + Azure + PostgreSQL. See `docs/Technical Implementation Specification.MD` for schema and API design.
