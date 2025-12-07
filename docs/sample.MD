import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext, useReducer } from 'react';

// ============ MOVEMENTS ============
const MOVEMENTS = {
I: { id: 'I', name: 'I', duration: 30, label: "30\"", description: 'Tacet' },
II: { id: 'II', name: 'II', duration: 143, label: "2'23\"", description: 'Tacet' },
III: { id: 'III', name: 'III', duration: 100, label: "1'40\"", description: 'Tacet' },
FULL: { id: 'FULL', name: 'Complete', duration: 273, label: "4'33\"", description: 'All movements' },
};

// ============ ICONS ============
const Icons = {
Mic: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>,
Play: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
Pause: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
Heart: ({ size = 20, filled }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
X: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
Plus: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
Back: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>,
Check: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
Waves: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 10v4M22 12h0"/></svg>,
User: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
Hash: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3v18M14 3v18"/></svg>,
};

// ============ INITIAL STATE ============
const initialState = {
screen: 'record',
previousScreen: null,
recordings: [
{ id: 1, tags: ['rain', 'solitude', 'evening'], likes: 23, likedBy: ['ambient_soul'], liked: false, user: 'listener_42', odId: 'listener_42', time: '2h ago', movement: 'I' },
{ id: 2, tags: ['traffic', 'urban', 'rush'], likes: 15, likedBy: [], liked: false, user: 'ambient_soul', odId: 'ambient_soul', time: '5h ago', movement: 'II' },
{ id: 3, tags: ['birds', 'morning', 'peace'], likes: 47, likedBy: ['listener_42'], liked: false, user: 'nature_ear', odId: 'nature_ear', time: '1d ago', movement: 'FULL' },
{ id: 4, tags: ['silence', 'room', 'waiting'], likes: 8, likedBy: [], liked: false, user: 'void_catcher', odId: 'void_catcher', time: '1d ago', movement: 'III' },
{ id: 5, tags: ['cafe', 'murmur', 'warmth'], likes: 31, likedBy: [], liked: false, user: 'city_monk', odId: 'city_monk', time: '2d ago', movement: 'I' },
],
users: [
{ id: 'listener_42', name: 'listener_42', followers: 156, following: 43 },
{ id: 'ambient_soul', name: 'ambient_soul', followers: 89, following: 67 },
{ id: 'nature_ear', name: 'nature_ear', followers: 234, following: 12 },
{ id: 'void_catcher', name: 'void_catcher', followers: 45, following: 78 },
{ id: 'city_monk', name: 'city_monk', followers: 178, following: 34 },
],
followedUsers: ['nature_ear'],
followedTags: ['rain', 'silence'],
myFollowers: ['listener_42', 'ambient_soul'],
currentRecording: { waveform: null, tags: [], movement: null },
selectedRecording: null,
selectedTag: null,
selectedUser: null,
filter: null,
activity: [
{ type: 'like', user: 'nature_ear', recording: 'your morning capture', time: '1h ago' },
{ type: 'follow', user: 'city_monk', time: '3h ago' },
],
};

// ============ REDUCER ============
function reducer(state, action) {
switch (action.type) {
case 'NAVIGATE': return { ...state, previousScreen: state.screen, screen: action.screen };
case 'GO_BACK': return { ...state, screen: state.previousScreen || 'explore', previousScreen: null };
case 'SET_MOVEMENT': return { ...state, currentRecording: { ...state.currentRecording, movement: action.movement } };
case 'SET_WAVEFORM': return { ...state, currentRecording: { ...state.currentRecording, waveform: action.waveform } };
case 'SET_TAGS': return { ...state, currentRecording: { ...state.currentRecording, tags: action.tags } };
case 'SELECT_RECORDING': return { ...state, selectedRecording: action.recording, screen: 'single' };
case 'SELECT_TAG': return { ...state, selectedTag: action.tag, screen: 'tagDetail' };
case 'SELECT_USER': return { ...state, selectedUser: state.users.find(u => u.id === action.odId) || { id: action.odId, name: action.odId, followers: 0, following: 0 }, screen: 'userProfile' };
case 'SET_FILTER': return { ...state, filter: action.filter };
case 'TOGGLE_LIKE': {
const rec = state.recordings.find(r => r.id === action.id);
const newLiked = !rec?.liked;
const recordings = state.recordings.map(r => r.id === action.id ? { ...r, liked: newLiked, likes: newLiked ? r.likes + 1 : r.likes - 1 } : r);
const selectedRecording = state.selectedRecording?.id === action.id ? { ...state.selectedRecording, liked: newLiked, likes: newLiked ? state.selectedRecording.likes + 1 : state.selectedRecording.likes - 1 } : state.selectedRecording;
return { ...state, recordings, selectedRecording };
}
case 'TOGGLE_FOLLOW_USER': {
const isFollowing = state.followedUsers.includes(action.odId);
return { ...state, followedUsers: isFollowing ? state.followedUsers.filter(id => id !== action.odId) : [...state.followedUsers, action.odId] };
}
case 'TOGGLE_FOLLOW_TAG': {
const isFollowing = state.followedTags.includes(action.tag);
return { ...state, followedTags: isFollowing ? state.followedTags.filter(t => t !== action.tag) : [...state.followedTags, action.tag] };
}
case 'ADD_TAG_TO_RECORDING': {
const recordings = state.recordings.map(r => r.id === action.id ? { ...r, tags: [...r.tags, action.tag] } : r);
const selectedRecording = state.selectedRecording?.id === action.id ? { ...state.selectedRecording, tags: [...state.selectedRecording.tags, action.tag] } : state.selectedRecording;
return { ...state, recordings, selectedRecording };
}
case 'UPLOAD_RECORDING': {
const newRecording = { id: Date.now(), tags: state.currentRecording.tags, likes: 0, likedBy: [], liked: false, waveform: state.currentRecording.waveform, user: 'you', odId: 'you', time: 'just now', movement: state.currentRecording.movement };
return { ...state, recordings: [newRecording, ...state.recordings], currentRecording: { waveform: null, tags: [], movement: null }, screen: 'success' };
}
case 'RESET_RECORDING': return { ...state, currentRecording: { waveform: null, tags: [], movement: null }, screen: 'record' };
default: return state;
}
}

const AppContext = createContext();
const useApp = () => useContext(AppContext);
const generateWaveform = (bars = 50) => Array.from({ length: bars }, () => 8 + Math.random() \* 42);
const formatTime = (secs) => { const m = Math.floor(secs / 60); const s = secs % 60; return `${m}:${s.toString().padStart(2, '0')}`; };

// ============ COMPONENTS ============
const Waveform = ({ data, progress = 0, playing = false, height = 60, barWidth = 3, gap = 2 }) => {
const waveform = useMemo(() => data || generateWaveform(), [data]);
return (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap, height }}>
{waveform.map((h, i) => (
<div key={i} style={{ width: barWidth, height: playing ? h * (0.7 + Math.sin(Date.now() / 200 + i) * 0.3) : h, borderRadius: barWidth / 2, background: (i / waveform.length) * 100 < progress ? '#fff' : '#333', transition: 'background 0.1s, height 0.15s ease-out' }} />
))}
</div>
);
};

const LiveWaveform = ({ active }) => {
const [bars, setBars] = useState(Array(30).fill(5));
useEffect(() => { if (!active) return; const i = setInterval(() => setBars(p => p.map(() => 5 + Math.random() \* 35)), 100); return () => clearInterval(i); }, [active]);
return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 50 }}>{bars.map((h, i) => <div key={i} style={{ width: 3, height: active ? h : 5, borderRadius: 2, background: active ? 'rgba(255,255,255,0.6)' : '#333', transition: 'height 0.1s ease-out' }} />)}</div>;
};

const TagChip = ({ tag, onRemove, variant = 'default', onClick, showFollow, isFollowed, onToggleFollow }) => {
const { dispatch } = useApp();
const handleClick = onClick || (() => dispatch({ type: 'SELECT_TAG', tag }));
return (
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: variant === 'filter' ? '6px 14px' : '8px 14px', background: variant === 'active' ? '#fff' : variant === 'new' ? '#333' : '#1a1a1a', color: variant === 'active' ? '#000' : variant === 'new' ? '#fff' : '#888', borderRadius: 20, fontSize: variant === 'filter' ? 12 : 13, border: variant === 'filter' ? '1px solid #333' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
<span onClick={handleClick}>{tag}</span>
{showFollow && <button onClick={(e) => { e.stopPropagation(); onToggleFollow?.(); }} style={{ background: isFollowed ? '#fff' : 'transparent', border: isFollowed ? 'none' : '1px solid #555', color: isFollowed ? '#000' : '#888', borderRadius: 10, padding: '2px 8px', fontSize: 10, cursor: 'pointer', marginLeft: 4 }}>{isFollowed ? '✓' : '+'}</button>}
{onRemove && <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#666', display: 'flex' }}><Icons.X size={14} /></button>}
</span>
);
};

const Button = ({ children, variant = 'primary', disabled, onClick, style = {}, size = 'md' }) => {
const styles = { primary: { background: disabled ? '#222' : '#fff', color: disabled ? '#444' : '#000' }, secondary: { background: 'transparent', color: '#999', border: '1px solid #333' }, ghost: { background: 'none', color: '#666', border: 'none' }, follow: { background: '#fff', color: '#000', padding: '8px 20px' }, following: { background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 20px' } };
return <button onClick={disabled ? undefined : onClick} style={{ padding: size === 'sm' ? '8px 16px' : '14px 28px', fontSize: size === 'sm' ? 11 : 12, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase', borderRadius: 0, cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s', border: 'none', ...styles[variant], ...style }}>{children}</button>;
};

const ProgressRing = ({ progress, size = 180, strokeWidth = 2, children }) => {
const radius = (size - strokeWidth) / 2;
const circumference = 2 _ Math.PI _ radius;
const offset = circumference - (progress / 100) \* circumference;
return (
<div style={{ position: 'relative', width: size, height: size }}>
<svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
<circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#222" strokeWidth={strokeWidth} />
<circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#fff" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
</svg>
<div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
</div>
);
};

const UserAvatar = ({ name, size = 40, onClick }) => <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: '#666', cursor: onClick ? 'pointer' : 'default', border: '1px solid #333' }}>{name?.charAt(0).toUpperCase()}</div>;
const BackHeader = ({ title, onBack }) => { const { dispatch } = useApp(); return <button onClick={onBack || (() => dispatch({ type: 'GO_BACK' }))} style={{ background: 'none', border: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: 20, cursor: 'pointer', fontSize: 14 }}><Icons.Back size={20} /> {title || 'Back'}</button>; };

const MovementBadge = ({ movement, size = 'md' }) => {
const m = MOVEMENTS[movement];
if (!m) return null;
const isSmall = size === 'sm';
return (
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: isSmall ? '3px 8px' : '4px 10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: isSmall ? 10 : 11, color: '#888' }}>
{movement === 'FULL' ? '◉' : '○'} {m.label}
</span>
);
};

const RecordingCard = ({ rec, index = 0, showUser = true }) => {
const { dispatch } = useApp();
return (
<div onClick={() => dispatch({ type: 'SELECT_RECORDING', recording: rec })} style={{ padding: 16, marginBottom: 12, background: '#0a0a0a', border: '1px solid #1a1a1a', cursor: 'pointer', transition: 'border-color 0.2s', animation: `fadeSlide 0.3s ease-out ${index * 0.05}s both` }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
<div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Play size={18} /></div>
{showUser && <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_USER', odId: rec.odId }); }}><p style={{ margin: 0, fontSize: 14, color: '#ccc', cursor: 'pointer' }}>{rec.user}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>{rec.time}</p></div>}
{!showUser && <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 11, color: '#555' }}>{rec.time}</p></div>}
<MovementBadge movement={rec.movement} size="sm" />
<span style={{ color: '#444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.Heart size={16} filled={rec.liked} /> {rec.likes}</span>
</div>
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{rec.tags.map(tag => <TagChip key={tag} tag={tag} />)}</div>
</div>
);
};

// ============ MOVEMENT SELECTOR ============
const MovementSelector = ({ selected, onSelect }) => (

  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {Object.values(MOVEMENTS).map(m => (
      <button key={m.id} onClick={() => onSelect(m.id)} style={{
        display: 'flex', alignItems: 'center', padding: '16px 20px',
        background: selected === m.id ? '#1a1a1a' : 'transparent',
        border: selected === m.id ? '1px solid #444' : '1px solid #222',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: selected === m.id ? '#fff' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, transition: 'all 0.2s' }}>
          <span style={{ color: selected === m.id ? '#000' : '#666', fontSize: 14, fontWeight: 500 }}>{m.id === 'FULL' ? '◉' : m.name}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ margin: 0, color: '#fff', fontSize: 15 }}>{m.id === 'FULL' ? 'Complete Work' : `Movement ${m.name}`}</p>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 12 }}>{m.description}</p>
        </div>
        <span style={{ color: selected === m.id ? '#fff' : '#555', fontSize: 18, fontWeight: 200, letterSpacing: 2 }}>{m.label}</span>
      </button>
    ))}
  </div>
);

// ============ RECORD SCREEN ============
const RecordScreen = () => {
const { state: appState, dispatch } = useApp();
const [phase, setPhase] = useState('select'); // select, ready, recording, finishing
const [selectedMovement, setSelectedMovement] = useState(null);
const [progress, setProgress] = useState(0);
const [elapsed, setElapsed] = useState(0);
const [currentMovementIdx, setCurrentMovementIdx] = useState(0);
const intervalRef = useRef(null);

const movement = MOVEMENTS[selectedMovement];
const duration = movement?.duration || 0;

// For full recording, track which movement we're in
const movementBreakpoints = useMemo(() => {
if (selectedMovement !== 'FULL') return null;
return [
{ end: 30, name: 'I' },
{ end: 30 + 143, name: 'II' },
{ end: 30 + 143 + 100, name: 'III' },
];
}, [selectedMovement]);

const getCurrentMovementName = useCallback((secs) => {
if (!movementBreakpoints) return selectedMovement;
for (let i = 0; i < movementBreakpoints.length; i++) {
if (secs < movementBreakpoints[i].end) return movementBreakpoints[i].name;
}
return 'III';
}, [movementBreakpoints, selectedMovement]);

const selectMovement = (m) => {
setSelectedMovement(m);
setPhase('ready');
};

const startRecording = useCallback(() => {
setPhase('recording');
setProgress(0);
setElapsed(0);
dispatch({ type: 'SET_MOVEMENT', movement: selectedMovement });

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const secs = (Date.now() - startTime) / 1000;
      setElapsed(Math.min(secs, duration));
      setProgress((secs / duration) * 100);

      if (movementBreakpoints) {
        const idx = movementBreakpoints.findIndex(bp => secs < bp.end);
        setCurrentMovementIdx(idx >= 0 ? idx : 2);
      }

      if (secs >= duration) {
        clearInterval(intervalRef.current);
        setPhase('finishing');
        dispatch({ type: 'SET_WAVEFORM', waveform: generateWaveform(50) });
        setTimeout(() => dispatch({ type: 'NAVIGATE', screen: 'playback' }), 600);
      }
    }, 50);

}, [dispatch, duration, selectedMovement, movementBreakpoints]);

const cancel = useCallback(() => {
clearInterval(intervalRef.current);
setPhase('select');
setSelectedMovement(null);
setProgress(0);
setElapsed(0);
}, []);

const goBack = useCallback(() => {
setPhase('select');
setSelectedMovement(null);
}, []);

useEffect(() => () => clearInterval(intervalRef.current), []);

const remaining = Math.max(0, Math.ceil(duration - elapsed));
const currentMvmt = getCurrentMovementName(elapsed);

// SELECT PHASE
if (phase === 'select') {
return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<div style={{ textAlign: 'center', marginTop: 30, marginBottom: 30 }}>
<h1 style={{ fontSize: 48, fontWeight: 200, letterSpacing: 10, margin: 0 }}>4'33"</h1>
<p style={{ color: '#666', fontSize: 12, letterSpacing: 2, marginTop: 8 }}>Select a movement to record</p>
</div>
<div style={{ flex: 1, overflowY: 'auto' }}>
<MovementSelector selected={selectedMovement} onSelect={selectMovement} />
</div>
<p style={{ color: '#444', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
Each movement is a window into silence.<br/>Choose your duration, then listen.
</p>
</div>
);
}

// READY / RECORDING PHASE
return (
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
<div style={{ textAlign: 'center', marginBottom: 40 }}>
<h1 style={{ fontSize: 48, fontWeight: 200, letterSpacing: 8, margin: 0, opacity: phase === 'recording' ? 0.4 : 1, transition: 'opacity 0.3s' }}>4'33"</h1>
<p style={{ color: '#666', fontSize: 11, letterSpacing: 2, marginTop: 8, textTransform: 'uppercase' }}>
{phase === 'ready' && `Movement ${movement?.id === 'FULL' ? '— Complete' : movement?.name}`}
{phase === 'recording' && (selectedMovement === 'FULL' ? `Movement ${currentMvmt}` : 'Listening...')}
{phase === 'finishing' && 'Captured'}
</p>
</div>

      {/* Movement indicators for FULL */}
      {selectedMovement === 'FULL' && phase === 'recording' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['I', 'II', 'III'].map((m, i) => (
            <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: currentMovementIdx >= i ? 1 : 0.3, transition: 'opacity 0.3s' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMovementIdx === i ? '#fff' : '#444', marginBottom: 4 }} />
              <span style={{ fontSize: 10, color: currentMovementIdx === i ? '#fff' : '#555' }}>{m}</span>
            </div>
          ))}
        </div>
      )}

      <ProgressRing progress={progress} size={200}>
        <button onClick={phase === 'ready' ? startRecording : undefined} style={{
          width: 120, height: 120, borderRadius: '50%',
          background: phase === 'recording' ? '#fff' : '#1a1a1a',
          border: phase === 'ready' ? '2px solid #333' : 'none',
          cursor: phase === 'ready' ? 'pointer' : 'default',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: phase === 'recording' ? '#000' : '#fff',
          boxShadow: phase === 'recording' ? '0 0 60px rgba(255,255,255,0.3)' : 'none',
          animation: phase === 'recording' ? 'pulse 2s ease-in-out infinite' : 'none',
          transition: 'all 0.3s',
        }}>
          {phase === 'recording' ? (
            <>
              <span style={{ fontSize: 24, fontWeight: 200 }}>{formatTime(remaining)}</span>
              <span style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>remaining</span>
            </>
          ) : (
            <>
              <Icons.Mic size={28} />
              <span style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{movement?.label}</span>
            </>
          )}
        </button>
      </ProgressRing>

      <div style={{ marginTop: 20 }}>
        <LiveWaveform active={phase === 'recording'} />
      </div>

      <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
        {phase === 'ready' && <Button variant="secondary" onClick={goBack}>← Change</Button>}
        {phase === 'recording' && <Button variant="secondary" onClick={cancel}>Cancel</Button>}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.3); } 50% { box-shadow: 0 0 0 20px rgba(255,255,255,0), 0 0 60px rgba(255,255,255,0.3); } }`}</style>
    </div>

);
};

// ============ PLAYBACK SCREEN ============
const PlaybackScreen = () => {
const { state: appState, dispatch } = useApp();
const [playing, setPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const intervalRef = useRef(null);
const movement = MOVEMENTS[appState.currentRecording.movement];

const togglePlay = useCallback(() => {
if (playing) { clearInterval(intervalRef.current); setPlaying(false); }
else {
setPlaying(true);
const duration = movement?.duration || 30;
const startProgress = progress, startTime = Date.now();
intervalRef.current = setInterval(() => {
const newProgress = startProgress + (Date.now() - startTime) / (duration \* 10);
if (newProgress >= 100) { clearInterval(intervalRef.current); setProgress(0); setPlaying(false); }
else setProgress(newProgress);
}, 50);
}
}, [playing, progress, movement]);

useEffect(() => () => clearInterval(intervalRef.current), []);

return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<div style={{ textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
<p style={{ color: '#666', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>Recorded</p>
<h2 style={{ fontSize: 36, fontWeight: 200, margin: '8px 0' }}>{movement?.label}</h2>
<MovementBadge movement={appState.currentRecording.movement} />
</div>
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
<Waveform data={appState.currentRecording.waveform} progress={progress} playing={playing} height={80} barWidth={4} gap={3} />
<div style={{ width: '80%', height: 2, background: '#222', marginTop: 20, borderRadius: 1 }}><div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: 1 }} /></div>
<button onClick={togglePlay} style={{ width: 70, height: 70, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', marginTop: 30 }}>{playing ? <Icons.Pause size={28} /> : <Icons.Play size={28} />}</button>
<div style={{ marginTop: 30, opacity: 0.2 }}><Icons.Mic size={32} /></div>
</div>
<div style={{ display: 'flex', gap: 12 }}>
<Button variant="secondary" onClick={() => dispatch({ type: 'RESET_RECORDING' })} style={{ flex: 1 }}>Start Over</Button>
<Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'tags' })} style={{ flex: 1 }}>Add Tags →</Button>
</div>
</div>
);
};

// ============ TAGS SCREEN ============
const TagsScreen = () => {
const { state: appState, dispatch } = useApp();
const [input, setInput] = useState('');
const [uploading, setUploading] = useState(false);
const tags = appState.currentRecording.tags;
const movement = MOVEMENTS[appState.currentRecording.movement];

const addTag = useCallback(() => {
const tag = input.trim().toLowerCase();
if (tag && tags.length < 5 && !tags.includes(tag) && tag.length <= 20) { dispatch({ type: 'SET_TAGS', tags: [...tags, tag] }); setInput(''); }
}, [input, tags, dispatch]);

const upload = useCallback(() => { if (tags.length >= 3) { setUploading(true); setTimeout(() => dispatch({ type: 'UPLOAD_RECORDING' }), 1500); } }, [tags, dispatch]);

return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<BackHeader title="Back" onBack={() => dispatch({ type: 'NAVIGATE', screen: 'playback' })} />
<div style={{ marginBottom: 24 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
<h2 style={{ fontSize: 28, fontWeight: 200, margin: 0 }}>Interpret</h2>
<MovementBadge movement={appState.currentRecording.movement} size="sm" />
</div>
<p style={{ color: '#666', fontSize: 14, margin: 0 }}>Add 3–5 words. What did you hear?</p>
</div>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, minHeight: 80, marginBottom: 20 }}>
{tags.map((tag, i) => <TagChip key={tag} tag={tag} onRemove={() => dispatch({ type: 'SET*TAGS', tags: tags.filter((*, idx) => idx !== i) })} variant="new" onClick={(e) => e.stopPropagation()} />)}
{tags.length === 0 && <p style={{ color: '#333', fontSize: 14, fontStyle: 'italic' }}>rain, solitude, waiting...</p>}
</div>
{tags.length < 5 && (
<div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
<input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTag()} placeholder="Add a tag..." maxLength={20} style={{ flex: 1, padding: '14px 16px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', fontSize: 15, outline: 'none' }} />
<button onClick={addTag} disabled={!input.trim()} style={{ padding: '0 20px', background: input.trim() ? '#333' : '#1a1a1a', border: 'none', color: input.trim() ? '#fff' : '#333', cursor: input.trim() ? 'pointer' : 'default' }}><Icons.Plus size={20} /></button>
</div>
)}
<p style={{ color: '#444', fontSize: 12, marginBottom: 'auto' }}>{tags.length}/5 tags · {tags.length < 3 ? `${3 - tags.length} more required` : 'Ready'}</p>
<div style={{ marginBottom: 20, opacity: 0.4 }}><Waveform data={appState.currentRecording.waveform} progress={0} height={40} barWidth={2} gap={2} /></div>
<Button disabled={tags.length < 3 || uploading} onClick={upload} style={{ width: '100%' }}>{uploading ? '● ● ●' : 'Upload'}</Button>
</div>
);
};

// ============ OTHER SCREENS (condensed) ============
const SuccessScreen = () => { const { dispatch } = useApp(); const [show, setShow] = useState(false); useEffect(() => { setTimeout(() => setShow(true), 100); }, []); return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center', opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.4s' }}><div style={{ width: 90, height: 90, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30, color: '#000' }}><Icons.Check size={40} /></div><h2 style={{ fontSize: 28, fontWeight: 200, margin: 0 }}>Shared</h2><p style={{ color: '#666', fontSize: 14, marginTop: 8, marginBottom: 50 }}>Your moment is now part of the collective.</p><Button onClick={() => dispatch({ type: 'NAVIGATE', screen: 'explore' })}>Explore</Button></div>; };

const ExploreScreen = () => {
const { state: appState, dispatch } = useApp();
const { recordings, filter, followedTags } = appState;
const allTags = useMemo(() => [...new Set(recordings.flatMap(r => r.tags))].slice(0, 8), [recordings]);
const filtered = useMemo(() => filter ? recordings.filter(r => r.tags.includes(filter)) : recordings, [recordings, filter]);
return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<h1 style={{ fontSize: 28, fontWeight: 200, margin: '10px 0 20px' }}>Explore</h1>
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
<TagChip tag="all" variant={filter === null ? 'active' : 'filter'} onClick={() => dispatch({ type: 'SET_FILTER', filter: null })} />
{allTags.map(tag => <TagChip key={tag} tag={tag} variant={filter === tag ? 'active' : 'filter'} showFollow isFollowed={followedTags.includes(tag)} onToggleFollow={() => dispatch({ type: 'TOGGLE_FOLLOW_TAG', tag })} />)}
</div>
<div style={{ flex: 1, overflowY: 'auto', marginRight: -20, paddingRight: 20 }}>{filtered.map((rec, i) => <RecordingCard key={rec.id} rec={rec} index={i} />)}</div>
<style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
</div>
);
};

const SingleRecordingScreen = () => {
const { state: appState, dispatch } = useApp();
const { selectedRecording, followedUsers } = appState;
const [playing, setPlaying] = useState(false);
const [progress, setProgress] = useState(0);
const [newTag, setNewTag] = useState('');
const intervalRef = useRef(null);
const movement = MOVEMENTS[selectedRecording?.movement];

const togglePlay = useCallback(() => {
if (playing) { clearInterval(intervalRef.current); setPlaying(false); }
else {
setPlaying(true);
const dur = movement?.duration || 30;
const sp = progress, st = Date.now();
intervalRef.current = setInterval(() => { const np = sp + (Date.now() - st) / (dur \* 10); if (np >= 100) { clearInterval(intervalRef.current); setProgress(0); setPlaying(false); } else setProgress(np); }, 50);
}
}, [playing, progress, movement]);

const addTag = useCallback(() => { const tag = newTag.trim().toLowerCase(); if (tag && !selectedRecording.tags.includes(tag)) { dispatch({ type: 'ADD_TAG_TO_RECORDING', id: selectedRecording.id, tag }); setNewTag(''); } }, [newTag, selectedRecording, dispatch]);
useEffect(() => () => clearInterval(intervalRef.current), []);
if (!selectedRecording) return null;
const isFollowing = followedUsers.includes(selectedRecording.odId);
const isOwn = selectedRecording.odId === 'you';

return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<BackHeader title="Explore" />
<div style={{ textAlign: 'center', marginBottom: 10 }}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
<UserAvatar name={selectedRecording.user} size={36} onClick={() => dispatch({ type: 'SELECT_USER', odId: selectedRecording.odId })} />
<div><p onClick={() => dispatch({ type: 'SELECT_USER', odId: selectedRecording.odId })} style={{ color: '#888', fontSize: 14, margin: 0, cursor: 'pointer' }}>{selectedRecording.user}</p><p style={{ color: '#444', fontSize: 12, margin: '2px 0 0' }}>{selectedRecording.time}</p></div>
{!isOwn && <Button variant={isFollowing ? 'following' : 'follow'} size="sm" onClick={() => dispatch({ type: 'TOGGLE_FOLLOW_USER', odId: selectedRecording.odId })}>{isFollowing ? 'Following' : 'Follow'}</Button>}
</div>
<MovementBadge movement={selectedRecording.movement} />
</div>
<div style={{ marginTop: 20, marginBottom: 10 }}><Waveform data={selectedRecording.waveform} progress={progress} playing={playing} height={70} barWidth={3} gap={2} /></div>
<div style={{ width: '100%', height: 2, background: '#1a1a1a', marginBottom: 24, borderRadius: 1 }}><div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: 1 }} /></div>
<div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
<button onClick={togglePlay} style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>{playing ? <Icons.Pause size={26} /> : <Icons.Play size={26} />}</button>
<button onClick={() => dispatch({ type: 'TOGGLE_LIKE', id: selectedRecording.id })} style={{ width: 48, height: 48, borderRadius: '50%', background: 'transparent', border: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', color: selectedRecording.liked ? '#fff' : '#555' }}><Icons.Heart size={20} filled={selectedRecording.liked} /></button>
</div>
<div style={{ marginBottom: 16 }}>
<p style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>Interpretations</p>
<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{selectedRecording.tags.map((tag, i) => <TagChip key={tag} tag={tag} variant={i >= 3 ? 'new' : 'default'} showFollow isFollowed={appState.followedTags.includes(tag)} onToggleFollow={() => dispatch({ type: 'TOGGLE_FOLLOW_TAG', tag })} />)}</div>
</div>
<div style={{ marginTop: 'auto' }}>
<p style={{ color: '#555', fontSize: 12, marginBottom: 10 }}>Add your interpretation</p>
<div style={{ display: 'flex', gap: 10 }}><input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTag()} placeholder="What did you hear?" style={{ flex: 1, padding: '14px 16px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', fontSize: 15, outline: 'none' }} /><button onClick={addTag} disabled={!newTag.trim()} style={{ padding: '0 20px', background: newTag.trim() ? '#333' : '#1a1a1a', border: 'none', color: newTag.trim() ? '#fff' : '#333', cursor: newTag.trim() ? 'pointer' : 'default' }}><Icons.Plus size={20} /></button></div>
</div>
</div>
);
};

const TagDetailScreen = () => { const { state: appState, dispatch } = useApp(); const { selectedTag, recordings, followedTags } = appState; const isFollowing = followedTags.includes(selectedTag); const tagRecordings = useMemo(() => recordings.filter(r => r.tags.includes(selectedTag)), [recordings, selectedTag]); return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}><BackHeader title="Explore" /><div style={{ textAlign: 'center', marginBottom: 30 }}><div style={{ width: 70, height: 70, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icons.Hash size={28} /></div><h2 style={{ fontSize: 28, fontWeight: 200, margin: '0 0 8px' }}>{selectedTag}</h2><p style={{ color: '#666', fontSize: 13, margin: '0 0 16px' }}>{tagRecordings.length} recordings</p><Button variant={isFollowing ? 'following' : 'follow'} size="sm" onClick={() => dispatch({ type: 'TOGGLE_FOLLOW_TAG', tag: selectedTag })}>{isFollowing ? '✓ Following' : '+ Follow Tag'}</Button></div><p style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Recordings</p><div style={{ flex: 1, overflowY: 'auto' }}>{tagRecordings.map((rec, i) => <RecordingCard key={rec.id} rec={rec} index={i} />)}</div></div>; };

const UserProfileScreen = () => { const { state: appState, dispatch } = useApp(); const { selectedUser, recordings, followedUsers } = appState; const isFollowing = followedUsers.includes(selectedUser?.id); const isOwn = selectedUser?.id === 'you'; const userRecordings = useMemo(() => recordings.filter(r => r.odId === selectedUser?.id), [recordings, selectedUser]); if (!selectedUser) return null; return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}><BackHeader title="Back" /><div style={{ textAlign: 'center', marginBottom: 30 }}><UserAvatar name={selectedUser.name} size={80} /><h2 style={{ fontSize: 24, fontWeight: 200, margin: '16px 0 8px' }}>{selectedUser.name}</h2><div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}><div><span style={{ color: '#fff', fontSize: 16 }}>{userRecordings.length}</span><p style={{ color: '#555', fontSize: 11, margin: '4px 0 0' }}>sounds</p></div><div><span style={{ color: '#fff', fontSize: 16 }}>{selectedUser.followers}</span><p style={{ color: '#555', fontSize: 11, margin: '4px 0 0' }}>followers</p></div><div><span style={{ color: '#fff', fontSize: 16 }}>{selectedUser.following}</span><p style={{ color: '#555', fontSize: 11, margin: '4px 0 0' }}>following</p></div></div>{!isOwn && <Button variant={isFollowing ? 'following' : 'follow'} size="sm" onClick={() => dispatch({ type: 'TOGGLE_FOLLOW_USER', odId: selectedUser.id })}>{isFollowing ? '✓ Following' : '+ Follow'}</Button>}</div><p style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Sounds</p><div style={{ flex: 1, overflowY: 'auto' }}>{userRecordings.length > 0 ? userRecordings.map((rec, i) => <RecordingCard key={rec.id} rec={rec} index={i} showUser={false} />) : <p style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No recordings yet</p>}</div></div>; };

const ProfileScreen = () => {
const { state: appState, dispatch } = useApp();
const { recordings, followedTags, followedUsers, myFollowers, activity } = appState;
const [tab, setTab] = useState('sounds');
const myRecordings = useMemo(() => recordings.filter(r => r.odId === 'you'), [recordings]);
return (
<div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20 }}>
<div style={{ textAlign: 'center', marginBottom: 20 }}><UserAvatar name="you" size={70} /><h2 style={{ fontSize: 22, fontWeight: 200, margin: '12px 0 8px' }}>you</h2><div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 }}><div><span style={{ color: '#fff', fontSize: 15 }}>{myRecordings.length}</span><p style={{ color: '#555', fontSize: 10, margin: '2px 0 0' }}>sounds</p></div><div><span style={{ color: '#fff', fontSize: 15 }}>{myFollowers.length}</span><p style={{ color: '#555', fontSize: 10, margin: '2px 0 0' }}>followers</p></div><div><span style={{ color: '#fff', fontSize: 15 }}>{followedUsers.length}</span><p style={{ color: '#555', fontSize: 10, margin: '2px 0 0' }}>following</p></div></div></div>
<div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #222' }}>{['sounds', 'following', 'followers', 'activity'].map(t => <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', color: tab === t ? '#fff' : '#555', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent', marginBottom: -1 }}>{t}</button>)}</div>
<div style={{ flex: 1, overflowY: 'auto' }}>
{tab === 'sounds' && (myRecordings.length > 0 ? myRecordings.map((rec, i) => <RecordingCard key={rec.id} rec={rec} index={i} showUser={false} />) : <p style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Record your first sound</p>)}
{tab === 'following' && (<>{followedTags.length > 0 && <div style={{ marginBottom: 24 }}><p style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Tags</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{followedTags.map(tag => <TagChip key={tag} tag={tag} showFollow isFollowed onToggleFollow={() => dispatch({ type: 'TOGGLE_FOLLOW_TAG', tag })} />)}</div></div>}{followedUsers.length > 0 && <div><p style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>People</p>{followedUsers.map(uid => <div key={uid} onClick={() => dispatch({ type: 'SELECT_USER', odId: uid })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}><UserAvatar name={uid} size={40} /><span style={{ flex: 1, color: '#ccc' }}>{uid}</span><Button variant="following" size="sm" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_FOLLOW_USER', odId: uid }); }}>Following</Button></div>)}</div>}{followedTags.length === 0 && followedUsers.length === 0 && <p style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Not following anyone yet</p>}</>)}
{tab === 'followers' && (myFollowers.length > 0 ? myFollowers.map(uid => <div key={uid} onClick={() => dispatch({ type: 'SELECT_USER', odId: uid })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}><UserAvatar name={uid} size={40} /><span style={{ flex: 1, color: '#ccc' }}>{uid}</span>{!followedUsers.includes(uid) && <Button variant="follow" size="sm" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_FOLLOW_USER', odId: uid }); }}>Follow</Button>}</div>) : <p style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No followers yet</p>)}
{tab === 'activity' && (activity.length > 0 ? activity.map((a, i) => <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'flex-start', gap: 12 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.type === 'like' && <Icons.Heart size={14} filled />}{a.type === 'follow' && <Icons.User size={14} />}{a.type === 'tag' && <Icons.Hash size={14} />}</div><div style={{ flex: 1 }}><p style={{ color: '#ccc', fontSize: 14, margin: 0 }}><span onClick={() => dispatch({ type: 'SELECT_USER', odId: a.user })} style={{ color: '#fff', cursor: 'pointer' }}>{a.user}</span>{a.type === 'like' && <> liked <span style={{ color: '#888' }}>{a.recording}</span></>}{a.type === 'follow' && <> started following you</>}{a.type === 'tag' && <> added "{a.tag}" to <span style={{ color: '#888' }}>{a.recording}</span></>}</p><p style={{ color: '#555', fontSize: 11, margin: '4px 0 0' }}>{a.time}</p></div></div>) : <p style={{ color: '#444', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No activity yet</p>)}
</div>
</div>
);
};

// ============ NAV ============
const NavBar = ({ screen, onNavigate }) => <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, padding: '16px 0', background: '#000', borderTop: '1px solid #151515' }}>{[{ id: 'record', label: 'Record', icon: <Icons.Mic size={18} />, screens: ['record', 'playback', 'tags', 'success'] }, { id: 'explore', label: 'Explore', icon: <Icons.Waves size={18} />, screens: ['explore', 'single', 'tagDetail', 'userProfile'] }, { id: 'profile', label: 'You', icon: <Icons.User size={18} />, screens: ['profile'] }].map(tab => <button key={tab.id} onClick={() => onNavigate(tab.id)} style={{ background: 'none', border: 'none', color: tab.screens.includes(screen) ? '#fff' : '#444', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>{tab.icon}{tab.label}</button>)}</div>;

// ============ APP ============
export default function App() {
const [state, dispatch] = useReducer(reducer, initialState);
const screens = { record: RecordScreen, playback: PlaybackScreen, tags: TagsScreen, success: SuccessScreen, explore: ExploreScreen, single: SingleRecordingScreen, tagDetail: TagDetailScreen, userProfile: UserProfileScreen, profile: ProfileScreen };
const Screen = screens[state.screen];
return (
<AppContext.Provider value={{ state, dispatch }}>
<div style={{ background: '#000', color: '#fff', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', maxWidth: 420, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
<div style={{ height: 'calc(100% - 65px)', overflowY: 'auto' }}><Screen /></div>
<NavBar screen={state.screen} onNavigate={(s) => dispatch({ type: 'NAVIGATE', screen: s })} />
</div>
<style>{`@keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
</AppContext.Provider>
);
}
