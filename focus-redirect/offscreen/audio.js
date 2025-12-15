// Playlist Management
const tracks = ['lofi1.mp3', 'lofi2.mp3', 'zikr.mp3', 'lofiquran.mp3'];
let currentIndex = 0;
let audio = document.getElementById('focusMusic');


chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PLAY_MUSIC') {
        playAudio();
    } else if (msg.type === 'STOP_MUSIC') {
        stopAudio();
    } else if (msg.type === 'NEXT_TRACK') {
        nextTrack();
    } else if (msg.type === 'TOGGLE_MUSIC') {
        if (audio.paused) {
            playAudio();
        } else {
            audio.pause();
            chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: false });
        }
    } else if (msg.type === 'SET_TRACK') {
        setTrack(msg.trackIndex);
    }
});

// Check state on load
chrome.storage.local.get(['focusSession', 'currentTrackIndex'], (result) => {
    if (result.currentTrackIndex !== undefined) {
        currentIndex = result.currentTrackIndex;
    }

    if (result.focusSession && result.focusSession.isActive) {
        playAudio();
    }
});

function playAudio() {
    if (!audio) return;
    // Use absolute path to ensure no resolution errors
    const trackUrl = chrome.runtime.getURL(`music/${tracks[currentIndex]}`);

    // Check if source matches (to avoid reloading if already set)
    if (audio.src !== trackUrl) {
        audio.src = trackUrl;
        audio.load();
    }

    audio.volume = 1.0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: true });
        }).catch(error => {
            console.error(`Audio playback failed: ${error.name} - ${error.message}`);
        });
    }
    notifyTrackChange();
}

function stopAudio() {
    if (audio) {
        audio.pause();
        chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: false });
    }
}

function nextTrack() {
    currentIndex = (currentIndex + 1) % tracks.length;
    chrome.storage.local.set({ currentTrackIndex: currentIndex });
    playAudio(); // This will handle loading the new track
}

function setTrack(index) {
    if (typeof index === 'number' && index >= 0 && index < tracks.length) {
        // If same track, just ensure playing
        if (currentIndex === index) {
            playAudio();
            return;
        }

        currentIndex = index;
        chrome.storage.local.set({ currentTrackIndex: currentIndex });

        // Force refresh
        stopAudio();
        const trackUrl = chrome.runtime.getURL(`music/${tracks[currentIndex]}`);
        audio.src = trackUrl;
        audio.load();

        // Short timeout to ensure load starts? Usually not needed for local files but safe.
        // Direct play
        playAudio();
    }
}

function loadTrack(index) {
    // Deprecated in favor of doing it inside playAudio for tighter control
    // But keeping structure if needed, or simply removing it.
    // simpler:
    const trackUrl = chrome.runtime.getURL(`music/${tracks[index]}`);
    audio.src = trackUrl;
    audio.load();
}

function notifyTrackChange() {
    chrome.runtime.sendMessage({
        type: 'TRACK_CHANGED',
        trackName: tracks[currentIndex].replace('.mp3', '')
    }).catch(() => { });
}

// Auto play next when ended?
audio.addEventListener('ended', () => {
    nextTrack();
});
