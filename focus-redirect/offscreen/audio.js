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
            chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: false }).catch(() => { });
        }
    } else if (msg.type === 'SET_TRACK') {
        setTrack(msg.trackIndex);
    } else if (msg.type === 'INIT_STATE') {
        // Initialize state from background
        if (msg.trackIndex !== undefined) {
            currentIndex = msg.trackIndex;
        }
    }
});

// Ask background for initial state
chrome.runtime.sendMessage({ type: 'REQUEST_INIT_STATE' }).catch(() => { });


function playAudio() {
    if (!audio) return;
    const trackUrl = chrome.runtime.getURL(`music/${tracks[currentIndex]}`);

    // If source is already set and we're just playing/resuming
    if (audio.src === trackUrl) {
        if (audio.paused) {
            const playPromise = audio.play();
            handlePlayPromise(playPromise);
        }
        return;
    }

    console.log("Loading track:", trackUrl);
    audio.src = trackUrl;
    // Removed redundant audio.load() and immediate currentTime/volume set
    // which can sometimes cause issues before metadata is loaded
    audio.volume = 1.0;

    const playPromise = audio.play();
    handlePlayPromise(playPromise);
    notifyTrackChange();
}

function handlePlayPromise(promise) {
    if (promise !== undefined) {
        promise.then(() => {
            chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: true }).catch(() => { });
        }).catch(error => {
            if (error.name === 'AbortError') {
                console.log("Playback interrupted (AbortError)");
                return;
            }
            const errMsg = `Playback failed: ${error.name} - ${error.message}`;
            console.error(errMsg);
            chrome.runtime.sendMessage({ type: 'AUDIO_ERROR', error: errMsg }).catch(() => { });
        });
    }
}


function stopAudio() {
    if (audio) {
        audio.pause();
        chrome.runtime.sendMessage({ type: 'PLAYBACK_STATE', isPlaying: false }).catch(() => { });
    }
}

function nextTrack() {
    currentIndex = (currentIndex + 1) % tracks.length;
    // Notify background to save state
    chrome.runtime.sendMessage({ type: 'UPDATE_TRACK_INDEX', index: currentIndex }).catch(() => { });
    playAudio();
}

function setTrack(index) {
    if (typeof index === 'number' && index >= 0 && index < tracks.length) {
        if (currentIndex === index) {
            playAudio();
            return;
        }

        currentIndex = index;
        chrome.runtime.sendMessage({ type: 'UPDATE_TRACK_INDEX', index: currentIndex }).catch(() => { });

        stopAudio();
        const trackUrl = chrome.runtime.getURL(`music/${tracks[currentIndex]}`);
        audio.src = trackUrl;
        audio.load();
        playAudio();
    }
}

function notifyTrackChange() {
    chrome.runtime.sendMessage({
        type: 'TRACK_CHANGED',
        trackName: tracks[currentIndex].replace('.mp3', '')
    }).catch(() => { });
}

audio.addEventListener('ended', () => {
    nextTrack();
});
