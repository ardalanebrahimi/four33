# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

4'33" is an audio-only social platform inspired by John Cage's 4'33". Users record ambient sound in fixed durations (movements), tag recordings with interpretive words, and explore others' recordings.

**Current state:** Frontend MVP with mock data. Backend API implemented but not yet integrated.

## Commands

### Frontend (root directory)
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

### Backend (backend/Four33.Api)
```bash
cd backend/Four33.Api
dotnet restore         # Restore NuGet packages
dotnet build           # Build the API
dotnet run             # Run at http://localhost:5000, Swagger at /swagger
dotnet watch           # Run with hot reload

# Database migrations (when using PostgreSQL)
dotnet ef migrations add <MigrationName>
dotnet ef database update
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

## Backend Architecture (backend/)

### Tech Stack
- .NET 8 Web API
- Entity Framework Core with PostgreSQL (InMemory for dev)
- JWT + Social auth (Google/Apple)
- Azure Blob Storage for audio files (local storage for dev)
- Swagger/OpenAPI documentation

### Structure
```
backend/Four33.Api/
├── Controllers/     # API endpoints (Auth, Recordings, Users, Tags)
├── Data/
│   ├── Entities/    # EF Core entities
│   └── AppDbContext.cs
├── DTOs/            # Request/response models
├── Auth/            # JWT and social auth services
├── Services/        # Business logic, blob storage
└── Program.cs       # DI and middleware config
```

### API Endpoints
- `POST /api/auth/register|login|google|apple|refresh` - Authentication
- `GET|POST /api/recordings` - List/create recordings
- `POST|DELETE /api/recordings/{id}/like` - Like/unlike
- `GET /api/users/{id}` - User profiles
- `POST|DELETE /api/users/{id}/follow` - Follow/unfollow
- `GET /api/tags` - Popular tags
- `POST|DELETE /api/tags/{name}/follow` - Follow/unfollow tags

### Configuration
Settings in `appsettings.json`:
- `ConnectionStrings:DefaultConnection` - PostgreSQL (empty = InMemory)
- `Jwt:Secret` - JWT signing key (min 32 chars)
- `Auth:Google:ClientId` - Google OAuth client ID
- `Azure:BlobStorage:ConnectionString` - Azure storage (empty = local files)
