// DOM Elements
const audioElement = document.getElementById('audioElement');
const sermonTitle = document.getElementById('sermonTitle');
const sermonAuthor = document.getElementById('sermonAuthor');
const albumImage = document.getElementById('albumImage');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const highlightsOverlay = document.getElementById('highlightsOverlay');
const playPauseBtn = document.getElementById('playPauseBtn');
const highlightBtn = document.getElementById('highlightBtn');
const highlightsList = document.getElementById('highlightsList');
const generateHighlightsBtn = document.getElementById('generateHighlightsBtn');
const playOverlay = document.getElementById('playOverlay');
const transcribeBtn = document.getElementById('transcribeBtn');
const testTranscribeBtn = document.getElementById('testTranscribeBtn');

// State
let isPlaying = false;
let isDragging = false;
let highlights = [];
let currentEpisode = null;

// Initialize player when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEpisodeData();
    setupEventListeners();
    setupSpeedControls();
});

// Load episode data from URL parameters or localStorage
function loadEpisodeData() {
    const urlParams = new URLSearchParams(window.location.search);
    const episodeData = urlParams.get('episode');
    
    if (episodeData) {
        try {
            currentEpisode = JSON.parse(decodeURIComponent(episodeData));
            displayEpisodeInfo(currentEpisode);
            loadAudio(currentEpisode.audioUrl);
        } catch (error) {
            console.error('Error parsing episode data:', error);
            // Fallback to mock data
            loadMockData();
        }
    } else {
        // Try localStorage as fallback
        const storedEpisode = localStorage.getItem('currentEpisode');
        if (storedEpisode) {
            try {
                currentEpisode = JSON.parse(storedEpisode);
                displayEpisodeInfo(currentEpisode);
                loadAudio(currentEpisode.audioUrl);
            } catch (error) {
                console.error('Error parsing stored episode data:', error);
                loadMockData();
            }
        } else {
            loadMockData();
        }
    }
}

// Load mock data for testing
function loadMockData() {
    currentEpisode = {
        title: 'In God We Trust 4: God is our Fortress',
        author: 'Rob Cawley',
        audioUrl: 'https://s3.us-east-1.amazonaws.com/media.2335.churchinsight.com/23b04b54-c4d6-4614-8ead-d264a35d069b.mp3',
        image: 'https://www.enfieldtown.church/Images/Content/2335/1418906.png'
    };
    displayEpisodeInfo(currentEpisode);
    loadAudio(currentEpisode.audioUrl);
}

// Display episode information
function displayEpisodeInfo(episode) {
    sermonTitle.textContent = episode.title;
    sermonAuthor.textContent = episode.author;
    if (episode.image) {
        albumImage.src = episode.image;
    }
}

// Load audio file
function loadAudio(audioUrl) {
    audioElement.src = audioUrl;
    audioElement.load();
}

// Setup all event listeners
function setupEventListeners() {
    // Audio events
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', onAudioEnded);
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
    });
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
    });

    // Control buttons
    playPauseBtn.addEventListener('click', togglePlayPause);
    highlightBtn.addEventListener('click', addHighlight);
    generateHighlightsBtn.addEventListener('click', generateHighlightVersion);
    transcribeBtn.addEventListener('click', transcribeAudio);
    testTranscribeBtn.addEventListener('click', testTranscribeAudio);
    playOverlay.addEventListener('click', togglePlayPause);

    // Progress bar interactions
    progressBar.addEventListener('click', seekToPosition);
    progressHandle.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('mouseup', stopDragging);

    // Touch events for mobile
    progressHandle.addEventListener('touchstart', startDragging);
    document.addEventListener('touchmove', handleDragging);
    document.addEventListener('touchend', stopDragging);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Setup speed control buttons
function setupSpeedControls() {
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            audioElement.playbackRate = speed;
            
            // Update active state
            speedButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Update duration display when metadata loads
function updateDuration() {
    if (audioElement.duration) {
        totalTime.textContent = formatTime(audioElement.duration);
    }
}

// Update progress and time display
function updateProgress() {
    if (!isDragging && audioElement.duration) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
        currentTime.textContent = formatTime(audioElement.currentTime);
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (audioElement.paused) {
        audioElement.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    } else {
        audioElement.pause();
    }
}

// Update play button appearance
function updatePlayButton() {
    const icon = playPauseBtn.querySelector('i');
    const overlayIcon = playOverlay.querySelector('i');
    
    if (isPlaying) {
        icon.className = 'fas fa-pause';
        overlayIcon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
        overlayIcon.className = 'fas fa-play';
    }
}

// Seek to specific position
function seekToPosition(event) {
    if (!audioElement.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioElement.duration;
    
    audioElement.currentTime = Math.max(0, Math.min(newTime, audioElement.duration));
}

// Start dragging progress handle
function startDragging(event) {
    isDragging = true;
    event.preventDefault();
}

// Handle dragging progress handle
function handleDragging(event) {
    if (!isDragging || !audioElement.duration) return;
    
    event.preventDefault();
    const rect = progressBar.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const dragX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(dragX / rect.width, 1));
    
    progressFill.style.width = `${percentage * 100}%`;
    progressHandle.style.left = `${percentage * 100}%`;
    
    const newTime = percentage * audioElement.duration;
    currentTime.textContent = formatTime(newTime);
}

// Stop dragging progress handle
function stopDragging(event) {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (audioElement.duration) {
        const rect = progressBar.getBoundingClientRect();
        const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);
        const dragX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(dragX / rect.width, 1));
        const newTime = percentage * audioElement.duration;
        
        audioElement.currentTime = newTime;
    }
}

// Add highlight at current time
function addHighlight() {
    if (!audioElement.duration) {
        alert('Audio not loaded yet');
        return;
    }
    
    const currentTimeValue = audioElement.currentTime;
    
    // Check if highlight already exists near this time
    const existingHighlight = highlights.find(h => 
        Math.abs(h.time - currentTimeValue) < 2
    );
    
    if (existingHighlight) {
        alert('A highlight already exists near this time');
        return;
    }
    
    // Create highlight
    const highlight = {
        id: Date.now(),
        time: currentTimeValue,
        text: `Key moment at ${formatTime(currentTimeValue)}`,
        description: ''
    };
    
    highlights.push(highlight);
    updateHighlightsList();
    addHighlightMarker(highlight);
    
    // Visual feedback
    highlightBtn.classList.add('active');
    setTimeout(() => {
        highlightBtn.classList.remove('active');
    }, 1000);
}

// Add visual highlight marker to progress bar
function addHighlightMarker(highlight) {
    const marker = document.createElement('div');
    marker.className = 'highlight-marker';
    marker.dataset.id = highlight.id;
    marker.style.left = `${(highlight.time / audioElement.duration) * 100}%`;
    
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        audioElement.currentTime = highlight.time;
    });
    
    highlightsOverlay.appendChild(marker);
}

// Update highlights list display
function updateHighlightsList() {
    highlightsList.innerHTML = '';
    
    const sortedHighlights = [...highlights].sort((a, b) => a.time - b.time);
    
    sortedHighlights.forEach(highlight => {
        const highlightElement = document.createElement('div');
        highlightElement.className = 'highlight-item';
        highlightElement.innerHTML = `
            <div class="highlight-info">
                <div class="highlight-time">${formatTime(highlight.time)}</div>
                <div class="highlight-text">${highlight.text}</div>
            </div>
            <div class="highlight-actions">
                <button onclick="seekToHighlight(${highlight.time})" title="Go to time">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="removeHighlight(${highlight.id})" title="Remove highlight">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        highlightsList.appendChild(highlightElement);
    });
    
    // Update generate button state
    generateHighlightsBtn.disabled = highlights.length === 0;
}

// Seek to specific highlight
function seekToHighlight(time) {
    audioElement.currentTime = time;
    if (audioElement.paused) {
        audioElement.play();
    }
}

// Remove highlight
function removeHighlight(id) {
    highlights = highlights.filter(h => h.id !== id);
    updateHighlightsList();
    
    // Remove visual marker
    const marker = document.querySelector(`.highlight-marker[data-id="${id}"]`);
    if (marker) {
        marker.remove();
    }
}

// Transcribe audio
async function transcribeAudio() {
    if (!currentEpisode) {
        alert('No episode data available');
        return;
    }
    
    transcribeBtn.disabled = true;
    transcribeBtn.classList.add('processing');
    transcribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transcribing...';
    
    try {
        // Send the complete episode JSON data to the n8n webhook
        const response = await fetch('https://holtzbrinck.app.n8n.cloud/webhook/7bbd0342-04d9-447f-b4bc-87793e97126a', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentEpisode)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Audio transcription started successfully!');
            console.log('Transcription result:', result);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error transcribing audio:', error);
        alert('Failed to start transcription. Please try again.');
    } finally {
        transcribeBtn.disabled = false;
        transcribeBtn.classList.remove('processing');
        transcribeBtn.innerHTML = '<i class="fas fa-microphone"></i> Transcribe Audio';
    }
}

// Test transcribe audio
async function testTranscribeAudio() {
    if (!currentEpisode) {
        alert('No episode data available');
        return;
    }
    
    testTranscribeBtn.disabled = true;
    testTranscribeBtn.classList.add('processing');
    testTranscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        // Send the complete episode JSON data to the test n8n webhook
        const response = await fetch('https://holtzbrinck.app.n8n.cloud/webhook-test/7bbd0342-04d9-447f-b4bc-87793e97126a', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentEpisode)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Test transcription started successfully!');
            console.log('Test transcription result:', result);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error with test transcription:', error);
        alert('Failed to start test transcription. Please try again.');
    } finally {
        testTranscribeBtn.disabled = false;
        testTranscribeBtn.classList.remove('processing');
        testTranscribeBtn.innerHTML = '<i class="fas fa-flask"></i> Test Transcribe';
    }
}

// Generate highlight version
async function generateHighlightVersion() {
    if (highlights.length === 0) {
        alert('Please add at least one highlight');
        return;
    }
    
    generateHighlightsBtn.disabled = true;
    generateHighlightsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    try {
        // Call n8n webhook for highlight processing
        const response = await fetch('https://holtzbrinck.app.n8n.cloud/webhook/highlight-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioUrl: currentEpisode.audioUrl,
                title: currentEpisode.title,
                highlights: highlights.map(h => ({
                    time: h.time,
                    text: h.text
                }))
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Highlight version generated successfully!');
            // Handle the result (e.g., provide download link)
        } else {
            throw new Error('Failed to generate highlights');
        }
    } catch (error) {
        console.error('Error generating highlights:', error);
        alert('Failed to generate highlight version. Please try again.');
    } finally {
        generateHighlightsBtn.disabled = false;
        generateHighlightsBtn.innerHTML = '<i class="fas fa-magic"></i> Generate 10-Minute Version';
    }
}

// Handle keyboard shortcuts
function handleKeyboard(event) {
    switch (event.code) {
        case 'Space':
            event.preventDefault();
            togglePlayPause();
            break;
        case 'KeyH':
            event.preventDefault();
            addHighlight();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
            break;
        case 'ArrowRight':
            event.preventDefault();
            audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
            break;
    }
}

// Handle audio ended
function onAudioEnded() {
    isPlaying = false;
    updatePlayButton();
}

// Format time as MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Go back to episodes list
function goBack() {
    window.history.back();
}

// Make functions global for onclick handlers
window.seekToHighlight = seekToHighlight;
window.removeHighlight = removeHighlight;
window.goBack = goBack;
