# Claude Code: Build 4:33 App

## Context

I have an Angular/Ionic app with basic audio recording already working (RecordRTC + Capacitor). I need to build out the full 4:33 app — an audio-only social platform inspired by John Cage's 4'33".

## Tech Stack

- **Frontend**: Angular 17+, Ionic 7+, Capacitor
- **Backend**: C# .NET 8, Azure, PostgreSQL
- **Audio**: RecordRTC (already implemented for basic recording)

## Core Concept

Users record ambient sound in specific durations based on John Cage's three movements, add interpretive tags, and share. Others can listen, like, and add their own interpretation tags.

## Movement Durations (CRITICAL)

```typescript
const MOVEMENTS = {
  I: { duration: 30, label: '30"' }, // Movement I: 30 seconds
  II: { duration: 143, label: "2'23\"" }, // Movement II: 2 min 23 sec
  III: { duration: 100, label: "1'40\"" }, // Movement III: 1 min 40 sec
  FULL: { duration: 273, label: "4'33\"" }, // Complete work: 4 min 33 sec
};
```

## Features to Build

### 1. Recording Flow

- Movement selector screen (choose I, II, III, or FULL)
- Animated progress ring with countdown timer
- Live waveform visualization during recording
- Auto-stop when duration completes (NO manual stop)
- For FULL recording: show progress through movements (I→II→III)
- Playback preview screen with waveform
- Tag input screen (require 3-5 tags, max 20 chars each)
- Upload to backend

### 2. Explore Screen

- Feed of recordings with: play button, username, movement badge, tags, like count
- Filter by tags (tap tag chip to filter or view tag detail)
- Tap recording → detail view
- Tap username → user profile

### 3. Recording Detail

- Audio playback with waveform progress
- User info with follow button
- Movement badge (shows which movement)
- Like button
- Tags list (tap to explore tag)
- "Add your interpretation" input (anyone can add tags)

### 4. Tag Detail Screen

- Tag name and recording count
- Follow/unfollow tag button
- List of all recordings with this tag

### 5. User Profile Screen

- Avatar, username, stats (sounds, followers, following)
- Follow/unfollow button
- List of user's recordings

### 6. Your Profile (Profile Tab)

- Your stats
- Tabs: Sounds | Following | Followers | Activity
- Sounds: your recordings
- Following: tags + users you follow
- Followers: users following you
- Activity: likes, follows, tags on your content

## Database Tables Needed

- users
- recordings (with movement, duration_seconds, audio_blob_url, waveform_data)
- tags
- recording_tags (junction with added_by_user_id, is_original)
- likes
- user_follows
- tag_follows

## API Endpoints Needed

```
POST   /api/recordings              - Upload recording
GET    /api/recordings              - List (filter by tag, user, movement)
GET    /api/recordings/{id}         - Single recording
POST   /api/recordings/{id}/like    - Like
DELETE /api/recordings/{id}/like    - Unlike
POST   /api/recordings/{id}/tags    - Add tag

GET    /api/users/{id}              - Profile
GET    /api/users/{id}/recordings   - User's recordings
POST   /api/users/{id}/follow       - Follow
DELETE /api/users/{id}/follow       - Unfollow

GET    /api/tags/{name}             - Tag detail with recordings
POST   /api/tags/{name}/follow      - Follow tag
DELETE /api/tags/{name}/follow      - Unfollow tag

GET    /api/users/me/activity       - Activity feed
```

## UI Requirements

- **Colors**: Pure black (#000) background, white text, grays for secondary
- **Style**: Minimal, zen, no images, generous whitespace
- **Typography**: System fonts, light weights (200-400)
- **Animations**:
  - Pulse glow on record button during recording
  - Progress ring with smooth stroke animation
  - Waveform bars that animate with audio amplitude
  - Staggered fade-in for list items

## Key Components to Create

1. `MovementSelectorComponent` - Choose which movement to record
2. `ProgressRingComponent` - SVG circular progress
3. `WaveformComponent` - Static waveform visualization
4. `LiveWaveformComponent` - Animated bars during recording
5. `MovementBadgeComponent` - Shows "○ 30\"" or "◉ 4'33\""
6. `RecordingCardComponent` - Card in feed
7. `TagChipComponent` - Tag with optional follow button
8. `AudioPlayerComponent` - Play/pause with progress

## State Management

Use NgRx or BehaviorSubject services for:

- Current recording state (phase, movement, progress, draft)
- Recordings feed (items, filters, pagination)
- User profiles cache
- Followed users/tags

## Start With

1. First, set up the database schema
2. Then build the recording flow (movement select → record → playback → tags → upload)
3. Then build explore + recording detail
4. Then add social features (likes, follows)
5. Finally, build profile screens

## Reference

See the attached technical specification for complete details on:

- Full database schema with SQL
- TypeScript interfaces
- NgRx state structure
- Component specifications
- Animation keyframes
- Design tokens
