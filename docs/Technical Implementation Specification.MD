# 4:33 — Technical Implementation Specification

## Overview

4:33 is an audio-only social platform inspired by John Cage's 4'33". Users record ambient sound in specific durations (movements), tag their recordings with interpretations, and explore others' recordings.

**Tech Stack:** Angular 17+ / Ionic 7+ / Capacitor | C# .NET 8 / Azure | PostgreSQL

---

## 1. DATA MODELS

### PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recordings
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    movement VARCHAR(10) NOT NULL CHECK (movement IN ('I', 'II', 'III', 'FULL')),
    duration_seconds INT NOT NULL,
    audio_blob_url VARCHAR(500) NOT NULL,
    waveform_data JSONB, -- Array of amplitude values for visualization
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tags (normalized)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recording-Tag junction (with attribution)
CREATE TABLE recording_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_original BOOLEAN DEFAULT FALSE, -- TRUE if added by recording owner
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(recording_id, tag_id)
);

-- Likes
CREATE TABLE likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, recording_id)
);

-- User Follows
CREATE TABLE user_follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Tag Follows
CREATE TABLE tag_follows (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, tag_id)
);

-- Indexes
CREATE INDEX idx_recordings_user ON recordings(user_id);
CREATE INDEX idx_recordings_created ON recordings(created_at DESC);
CREATE INDEX idx_recording_tags_recording ON recording_tags(recording_id);
CREATE INDEX idx_recording_tags_tag ON recording_tags(tag_id);
CREATE INDEX idx_likes_recording ON likes(recording_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
```

### TypeScript Interfaces (Frontend)

```typescript
// src/app/models/index.ts

export type MovementId = "I" | "II" | "III" | "FULL";

export interface Movement {
  id: MovementId;
  name: string;
  duration: number; // seconds
  label: string; // display string e.g. "2'23\""
  description: string;
}

export const MOVEMENTS: Record<MovementId, Movement> = {
  I: { id: "I", name: "I", duration: 30, label: '30"', description: "Tacet" },
  II: {
    id: "II",
    name: "II",
    duration: 143,
    label: "2'23\"",
    description: "Tacet",
  },
  III: {
    id: "III",
    name: "III",
    duration: 100,
    label: "1'40\"",
    description: "Tacet",
  },
  FULL: {
    id: "FULL",
    name: "Complete",
    duration: 273,
    label: "4'33\"",
    description: "All movements",
  },
};

export interface User {
  id: string;
  username: string;
  followersCount: number;
  followingCount: number;
  recordingsCount: number;
  isFollowing?: boolean; // For other users
}

export interface Tag {
  id: string;
  name: string;
  recordingCount?: number;
  isFollowing?: boolean;
  isOriginal?: boolean; // Added by recording owner
}

export interface Recording {
  id: string;
  user: User;
  movement: MovementId;
  durationSeconds: number;
  audioUrl: string;
  waveformData: number[]; // Amplitude values 0-100
  tags: Tag[];
  likesCount: number;
  isLiked: boolean;
  likedByUsers?: User[]; // First few users who liked
  createdAt: Date;
  timeAgo: string; // Computed: "2h ago"
}

export interface Activity {
  id: string;
  type: "like" | "follow" | "tag";
  user: User;
  recording?: Recording;
  tag?: string;
  createdAt: Date;
  timeAgo: string;
}

// Recording in progress
export interface RecordingDraft {
  movement: MovementId | null;
  audioBlob: Blob | null;
  waveformData: number[];
  tags: string[];
}
```

### C# DTOs (Backend)

```csharp
// DTOs/RecordingDto.cs
public record RecordingDto(
    Guid Id,
    UserSummaryDto User,
    string Movement,
    int DurationSeconds,
    string AudioUrl,
    int[] WaveformData,
    List<TagDto> Tags,
    int LikesCount,
    bool IsLiked,
    List<UserSummaryDto>? LikedByUsers,
    DateTime CreatedAt
);

public record UserSummaryDto(
    Guid Id,
    string Username,
    int FollowersCount,
    int FollowingCount,
    int RecordingsCount,
    bool? IsFollowing
);

public record TagDto(
    Guid Id,
    string Name,
    int? RecordingCount,
    bool? IsFollowing,
    bool IsOriginal
);

public record CreateRecordingRequest(
    string Movement,
    int DurationSeconds,
    IFormFile AudioFile,
    int[] WaveformData,
    List<string> Tags
);

public record AddTagRequest(string TagName);
```

---

## 2. API ENDPOINTS

### Recordings

```
POST   /api/recordings              - Upload new recording
GET    /api/recordings              - List recordings (paginated, filterable)
GET    /api/recordings/{id}         - Get single recording
DELETE /api/recordings/{id}         - Delete own recording
POST   /api/recordings/{id}/like    - Like recording
DELETE /api/recordings/{id}/like    - Unlike recording
POST   /api/recordings/{id}/tags    - Add tag to recording
```

### Users

```
GET    /api/users/{id}              - Get user profile
GET    /api/users/{id}/recordings   - Get user's recordings
GET    /api/users/{id}/followers    - Get followers list
GET    /api/users/{id}/following    - Get following list
POST   /api/users/{id}/follow       - Follow user
DELETE /api/users/{id}/follow       - Unfollow user
GET    /api/users/me                - Get current user
GET    /api/users/me/activity       - Get activity feed
```

### Tags

```
GET    /api/tags                    - List popular tags
GET    /api/tags/{name}             - Get tag details with recordings
POST   /api/tags/{name}/follow      - Follow tag
DELETE /api/tags/{name}/follow      - Unfollow tag
```

### Query Parameters for GET /api/recordings

```
?tag={tagName}         - Filter by tag
?userId={userId}       - Filter by user
?movement={I|II|III|FULL} - Filter by movement
?following=true        - Only from followed users/tags
?limit=20&offset=0     - Pagination
```

---

## 3. ANGULAR STATE MANAGEMENT

### NgRx Store Structure

```typescript
// src/app/store/state.ts

export interface AppState {
  auth: AuthState;
  recordings: RecordingsState;
  recording: RecordingState; // Current recording in progress
  users: UsersState;
  tags: TagsState;
  ui: UIState;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface RecordingsState {
  items: Recording[];
  selectedRecording: Recording | null;
  loading: boolean;
  error: string | null;
  filter: {
    tag: string | null;
    userId: string | null;
    movement: MovementId | null;
    followingOnly: boolean;
  };
  pagination: {
    hasMore: boolean;
    offset: number;
  };
}

export interface RecordingState {
  phase:
    | "idle"
    | "selecting"
    | "ready"
    | "recording"
    | "recorded"
    | "tagging"
    | "uploading";
  draft: RecordingDraft;
  progress: number; // 0-100
  elapsed: number; // seconds
  error: string | null;
}

export interface UsersState {
  profiles: Record<string, User>;
  selectedUser: User | null;
  followers: User[];
  following: User[];
  activity: Activity[];
  loading: boolean;
}

export interface TagsState {
  items: Tag[];
  selectedTag: Tag | null;
  followedTags: string[];
  loading: boolean;
}

export interface UIState {
  activeTab: "record" | "explore" | "profile";
  previousScreen: string | null;
}
```

### Key Actions

```typescript
// recordings.actions.ts
export const loadRecordings = createAction(
  "[Recordings] Load",
  props<{ filter?: RecordingFilter }>()
);
export const loadRecordingsSuccess = createAction(
  "[Recordings] Load Success",
  props<{ recordings: Recording[] }>()
);
export const selectRecording = createAction(
  "[Recordings] Select",
  props<{ recording: Recording }>()
);
export const toggleLike = createAction(
  "[Recordings] Toggle Like",
  props<{ recordingId: string }>()
);
export const addTagToRecording = createAction(
  "[Recordings] Add Tag",
  props<{ recordingId: string; tag: string }>()
);

// recording.actions.ts (current recording flow)
export const selectMovement = createAction(
  "[Recording] Select Movement",
  props<{ movement: MovementId }>()
);
export const startRecording = createAction("[Recording] Start");
export const updateProgress = createAction(
  "[Recording] Update Progress",
  props<{ progress: number; elapsed: number }>()
);
export const finishRecording = createAction(
  "[Recording] Finish",
  props<{ audioBlob: Blob; waveform: number[] }>()
);
export const setTags = createAction(
  "[Recording] Set Tags",
  props<{ tags: string[] }>()
);
export const uploadRecording = createAction("[Recording] Upload");
export const uploadSuccess = createAction(
  "[Recording] Upload Success",
  props<{ recording: Recording }>()
);
export const resetRecording = createAction("[Recording] Reset");

// users.actions.ts
export const loadUserProfile = createAction(
  "[Users] Load Profile",
  props<{ userId: string }>()
);
export const toggleFollowUser = createAction(
  "[Users] Toggle Follow",
  props<{ userId: string }>()
);
export const loadActivity = createAction("[Users] Load Activity");

// tags.actions.ts
export const loadTagDetail = createAction(
  "[Tags] Load Detail",
  props<{ tagName: string }>()
);
export const toggleFollowTag = createAction(
  "[Tags] Toggle Follow",
  props<{ tagName: string }>()
);
```

---

## 4. IONIC/ANGULAR COMPONENTS

### Page Structure

```
src/app/
├── pages/
│   ├── record/
│   │   ├── record.page.ts          # Movement selection + recording
│   │   ├── record.page.html
│   │   └── record.page.scss
│   ├── playback/
│   │   ├── playback.page.ts        # Preview recorded audio
│   │   └── ...
│   ├── tags-input/
│   │   ├── tags-input.page.ts      # Add 3-5 tags before upload
│   │   └── ...
│   ├── explore/
│   │   ├── explore.page.ts         # Browse recordings
│   │   └── ...
│   ├── recording-detail/
│   │   ├── recording-detail.page.ts
│   │   └── ...
│   ├── tag-detail/
│   │   ├── tag-detail.page.ts      # Single tag view
│   │   └── ...
│   ├── user-profile/
│   │   ├── user-profile.page.ts    # Other users
│   │   └── ...
│   └── profile/
│       ├── profile.page.ts         # Current user profile
│       └── ...
├── components/
│   ├── waveform/
│   ├── waveform-live/
│   ├── progress-ring/
│   ├── movement-selector/
│   ├── movement-badge/
│   ├── tag-chip/
│   ├── recording-card/
│   ├── user-avatar/
│   └── audio-player/
├── services/
│   ├── audio-recorder.service.ts
│   ├── recordings-api.service.ts
│   ├── users-api.service.ts
│   └── tags-api.service.ts
└── store/
    ├── recordings/
    ├── recording/
    ├── users/
    └── tags/
```

### Key Component Specs

#### WaveformComponent

```typescript
@Component({
  selector: "app-waveform",
  template: `
    <div class="waveform" [style.height.px]="height">
      <div
        *ngFor="let bar of bars; let i = index"
        class="bar"
        [style.height.px]="bar"
        [style.width.px]="barWidth"
        [class.active]="(i / bars.length) * 100 < progress"
      ></div>
    </div>
  `,
})
export class WaveformComponent {
  @Input() data: number[] = [];
  @Input() progress: number = 0;
  @Input() height: number = 60;
  @Input() barWidth: number = 3;
  @Input() gap: number = 2;

  get bars(): number[] {
    return this.data.length ? this.data : this.generateDefault();
  }
}
```

#### MovementSelectorComponent

```typescript
@Component({
  selector: "app-movement-selector",
})
export class MovementSelectorComponent {
  @Input() selected: MovementId | null = null;
  @Output() select = new EventEmitter<MovementId>();

  movements = Object.values(MOVEMENTS);
}
```

#### RecordingCardComponent

```typescript
@Component({
  selector: "app-recording-card",
})
export class RecordingCardComponent {
  @Input() recording!: Recording;
  @Input() showUser: boolean = true;
  @Output() cardClick = new EventEmitter<Recording>();
  @Output() userClick = new EventEmitter<User>();
  @Output() tagClick = new EventEmitter<Tag>();
}
```

---

## 5. AUDIO RECORDING SERVICE

```typescript
// src/app/services/audio-recorder.service.ts

@Injectable({ providedIn: "root" })
export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  async requestPermissions(): Promise<boolean> {
    // Use Capacitor for native, fallback to browser
    if (Capacitor.isNativePlatform()) {
      const result = await Permissions.query({ name: "microphone" });
      return result.state === "granted";
    }
    // Browser fallback
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup analyser for waveform
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      this.audioChunks.push(e.data);
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  getAmplitude(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return (data.reduce((a, b) => a + b) / data.length / 255) * 100;
  }

  async stopRecording(): Promise<{ blob: Blob; waveform: number[] }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return;

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: "audio/webm" });
        const waveform = this.generateWaveformFromBlob(blob);
        resolve({ blob, waveform });
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    });
  }

  private generateWaveformFromBlob(blob: Blob): number[] {
    // Generate 50 amplitude values for visualization
    // In production, analyze actual audio data
    return Array.from({ length: 50 }, () => 10 + Math.random() * 40);
  }
}
```

---

## 6. USER FLOWS

### Recording Flow

```
1. User taps Record tab
2. SCREEN: Movement Selection
   - Display 4 movement options (I, II, III, FULL)
   - User taps movement → store.dispatch(selectMovement)

3. SCREEN: Ready State
   - Show selected movement duration on mic button
   - User taps mic → store.dispatch(startRecording)
   - audioRecorderService.startRecording()

4. STATE: Recording
   - Start interval timer (50ms)
   - Update progress/elapsed in store
   - Display countdown, progress ring, live waveform
   - For FULL: show movement progress indicators (I→II→III)
   - Auto-stop when elapsed >= movement.duration

5. Recording Complete
   - audioRecorderService.stopRecording() → {blob, waveform}
   - store.dispatch(finishRecording)
   - Navigate to /playback

6. SCREEN: Playback
   - Audio player with waveform
   - "Start Over" → store.dispatch(resetRecording)
   - "Add Tags" → Navigate to /tags-input

7. SCREEN: Tags Input
   - Text input + tag chips
   - Validate: 3-5 tags, max 20 chars each
   - "Upload" → store.dispatch(uploadRecording)
   - API: POST /api/recordings (multipart form)

8. Upload Success
   - Show success animation
   - "Explore" → Navigate to /explore
```

### Explore & Social Flow

```
1. SCREEN: Explore
   - Load recordings: GET /api/recordings
   - Filter chips: all | followed tags
   - Tap tag chip → filter or navigate to tag detail
   - Tap recording card → navigate to recording detail

2. SCREEN: Recording Detail
   - Audio player
   - User info + follow button
   - Movement badge
   - Like button + like count
   - Tags (tap to explore)
   - "Add interpretation" input

3. SCREEN: Tag Detail (tap any tag)
   - Tag name + recording count
   - Follow/unfollow tag button
   - List of recordings with this tag

4. SCREEN: User Profile (tap any username)
   - Avatar, username, stats
   - Follow/unfollow button
   - User's recordings list
```

---

## 7. UI/UX SPECIFICATIONS

### Design Tokens

```scss
// src/theme/variables.scss

:root {
  // Colors
  --color-bg: #000000;
  --color-surface: #0a0a0a;
  --color-surface-elevated: #1a1a1a;
  --color-border: #222222;
  --color-border-light: #333333;
  --color-text-primary: #ffffff;
  --color-text-secondary: #888888;
  --color-text-tertiary: #555555;
  --color-text-disabled: #333333;
  --color-accent: #ffffff;

  // Typography
  --font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 24px;
  --font-size-xl: 28px;
  --font-size-hero: 48px;

  // Spacing
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;

  // Animation
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --easing-default: ease-out;
}
```

### Animation Specs

```typescript
// Key animations to implement

// 1. Record button pulse (during recording)
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
  50% { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
}

// 2. Recording card entrance (staggered)
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
// Apply: animation: fadeSlideUp 0.3s ease-out ${index * 50}ms both;

// 3. Success checkmark
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

// 4. Progress ring
// Use SVG stroke-dashoffset with transition: stroke-dashoffset 0.1s linear

// 5. Live waveform bars
// Update height every 100ms based on audio amplitude
```

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Core Recording

- [ ] Movement selector component
- [ ] Progress ring component
- [ ] Live waveform component
- [ ] Audio recorder service (extend existing)
- [ ] Recording state management
- [ ] Record → Playback → Tags flow
- [ ] Upload API integration

### Phase 2: Explore & Playback

- [ ] Recordings list API
- [ ] Recording card component
- [ ] Waveform playback component
- [ ] Audio player service
- [ ] Tag filter chips
- [ ] Recording detail page

### Phase 3: Social Features

- [ ] User profile page
- [ ] Follow/unfollow users API
- [ ] Tag detail page
- [ ] Follow/unfollow tags API
- [ ] Like/unlike recordings
- [ ] Add tags to others' recordings

### Phase 4: Your Profile

- [ ] Profile page with tabs
- [ ] Your recordings list
- [ ] Following list (users + tags)
- [ ] Followers list
- [ ] Activity feed

### Phase 5: Polish

- [ ] All animations
- [ ] Error handling
- [ ] Loading states
- [ ] Offline support
- [ ] Push notifications (follows, likes)

---

## 9. NOTES FOR CLAUDE CODE

1. **Existing Code**: User has basic recording working with RecordRTC + Capacitor. Extend, don't replace.

2. **Audio Format**: Use WebM for recording, consider converting to MP3/AAC for storage.

3. **Waveform Generation**: Can generate client-side during recording or server-side post-upload.

4. **Azure Blob Storage**: Store audio files in Azure Blob, return CDN URLs.

5. **Real-time Updates**: Consider SignalR for live like counts, new recordings in feed.

6. **Movement Duration**: I=30s, II=143s, III=100s, FULL=273s (actual 4'33")

7. **Tag Validation**: 3-5 tags required, max 20 chars each, lowercase, alphanumeric + spaces.

8. **Pagination**: Use cursor-based pagination for recordings feed.
