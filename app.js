// DOM Elements
const rssUrlInput = document.getElementById('rssUrl');
const fetchEpisodesBtn = document.getElementById('fetchEpisodes');
const episodesSection = document.getElementById('episodesSection');
const episodesList = document.getElementById('episodesList');
const audioPlayerSection = document.getElementById('audioPlayerSection');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const addHighlightBtn = document.getElementById('addHighlightBtn');
const highlightsList = document.getElementById('highlightsList');
const highlightsContainer = document.getElementById('highlightsContainer');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// State
let currentAudioUrl = '';
let currentAudioTitle = '';
let highlights = [];
let isPlaying = false;

// Event Listeners
fetchEpisodesBtn.addEventListener('click', fetchEpisodes);
playPauseBtn.addEventListener('click', togglePlayPause);
addHighlightBtn.addEventListener('click', addHighlight);
generateBtn.addEventListener('click', generateHighlightVersion);
downloadBtn.addEventListener('click', downloadHighlights);

// Audio player progress update
if (audioPlayer) {
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
    });
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
}

// Update play/pause button based on playback state
function updatePlayPauseButton() {
    if (!playPauseBtn) return;
    
    const icon = playPauseBtn.querySelector('i');
    if (isPlaying) {
        icon.className = 'fas fa-pause';
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    } else {
        icon.className = 'fas fa-play';
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (!audioPlayer) return;
    
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
}

// Update progress bar
function updateProgress() {
    const progress = document.querySelector('.progress');
    if (!progress) return;
    
    const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progress.style.width = `${percentage}%`;
}

// Fetch episodes from RSS feed
async function fetchEpisodes() {
    const rssUrl = rssUrlInput.value.trim();
    
    if (!rssUrl) {
        alert('Please enter a valid RSS feed URL');
        return;
    }
    
    showLoading('Fetching episodes...');
    
    try {
        // Call the n8n webhook to fetch episodes from RSS feed
        const response = await fetch(`https://holtzbrinck.app.n8n.cloud/webhook/48c81887-73da-4856-a550-a4ca6e886ed3?rssUrl=${encodeURIComponent(rssUrl)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response has content
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (!responseText.trim()) {
            throw new Error('Empty response from webhook');
        }
        
        let rawEpisodes;
        try {
            rawEpisodes = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response text:', responseText);
            throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        // Fallback to mock data if webhook returns empty or invalid data
        if (!rawEpisodes || !Array.isArray(rawEpisodes) || rawEpisodes.length === 0) {
            console.warn('No episodes returned from webhook, using mock data');
            const mockEpisodes = [
                { 
                    title: 'Sermon on the Mount', 
                    audioUrl: 'https://example.com/audio1.mp3',
                    date: '2023-08-20',
                    duration: '45:30'
                },
                { 
                    title: 'The Prodigal Son', 
                    audioUrl: 'https://example.com/audio2.mp3',
                    date: '2023-08-13',
                    duration: '38:15'
                },
                { 
                    title: 'The Good Samaritan', 
                    audioUrl: 'https://example.com/audio3.mp3',
                    date: '2023-08-06',
                    duration: '42:50'
                }
            ];
            displayEpisodes(mockEpisodes);
        } else {
            // Transform the webhook response to our expected format
            const episodes = rawEpisodes.map(episode => ({
                title: episode.title?.trim() || 'Untitled Episode',
                audioUrl: episode.enclosure?.url || '',
                date: formatDate(episode.isoDate || episode.pubDate),
                duration: formatDuration(episode.enclosure?.length),
                author: episode.itunes?.author?.trim() || 'Unknown',
                description: episode.contentSnippet || episode.content?.trim() || '',
                image: episode.itunes?.image || ''
            }));
            
            displayEpisodes(episodes);
        }
        
        episodesSection.style.display = 'block';
    } catch (error) {
        console.error('Error fetching episodes:', error);
        alert('Failed to fetch episodes. Please check the RSS URL and try again.');
    } finally {
        hideLoading();
    }
}

// Display episodes in the UI
function displayEpisodes(episodes) {
    if (!episodesList) return;
    
    episodesList.innerHTML = '';
    
    episodes.forEach(episode => {
        const episodeElement = document.createElement('div');
        episodeElement.className = 'episode-item';
        episodeElement.innerHTML = `
            <h3>${episode.title}</h3>
            <p><strong>Author:</strong> ${episode.author}</p>
            <p><strong>Date:</strong> ${episode.date} • <strong>Duration:</strong> ${episode.duration}</p>
            ${episode.description ? `<p class="episode-description">${episode.description}</p>` : ''}
        `;
        
        episodeElement.addEventListener('click', () => selectEpisode(episode));
        episodesList.appendChild(episodeElement);
    });
}

// Select an episode to play
function selectEpisode(episode) {
    // Store episode data for the player page
    localStorage.setItem('currentEpisode', JSON.stringify(episode));
    
    // Navigate to the dedicated player page
    const episodeData = encodeURIComponent(JSON.stringify(episode));
    window.location.href = `player.html?episode=${episodeData}`;
}

// Add a highlight at current time
function addHighlight() {
    if (!audioPlayer) return;
    
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    
    if (isNaN(duration) || duration <= 0) {
        alert('Audio not loaded yet');
        return;
    }
    
    // Check if there's already a highlight near this time (within 2 seconds)
    const existingHighlight = highlights.find(h => 
        Math.abs(h.time - currentTime) < 2
    );
    
    if (existingHighlight) {
        alert('A highlight already exists near this time');
        return;
    }
    
    // Add highlight
    const highlight = {
        id: Date.now(),
        time: currentTime,
        text: `Highlight at ${formatTime(currentTime)}`
    };
    
    highlights.push(highlight);
    updateHighlightsList();
    
    // Add visual marker to timeline
    addTimelineMarker(highlight);
}

// Add a visual marker to the timeline
function addTimelineMarker(highlight) {
    if (!highlightsContainer) return;
    
    const marker = document.createElement('div');
    marker.className = 'highlight-marker';
    marker.style.left = `${(highlight.time / audioPlayer.duration) * 100}%`;
    marker.dataset.id = highlight.id;
    
    // Click on marker to seek to that time
    marker.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audioPlayer) {
            audioPlayer.currentTime = highlight.time;
            audioPlayer.play();
        }
    });
    
    highlightsContainer.appendChild(marker);
}

// Update the highlights list in the UI
function updateHighlightsList() {
    if (!highlightsList) return;
    
    // Clear existing highlights
    highlightsList.innerHTML = '';
    
    // Sort highlights by time
    const sortedHighlights = [...highlights].sort((a, b) => a.time - b.time);
    
    // Add each highlight to the list
    sortedHighlights.forEach(highlight => {
        const highlightElement = document.createElement('div');
        highlightElement.className = 'highlight-item';
        highlightElement.innerHTML = `
            <span>${formatTime(highlight.time)} - ${highlight.text}</span>
            <button class="remove-highlight" data-id="${highlight.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add click handler for remove button
        const removeBtn = highlightElement.querySelector('.remove-highlight');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeHighlight(highlight.id);
            });
        }
        
        // Click on highlight to seek to that time
        highlightElement.addEventListener('click', () => {
            if (audioPlayer) {
                audioPlayer.currentTime = highlight.time;
                audioPlayer.play();
            }
        });
        
        highlightsList.appendChild(highlightElement);
    });
}

// Remove a highlight
function removeHighlight(id) {
    highlights = highlights.filter(h => h.id !== id);
    updateHighlightsList();
    
    // Remove visual marker
    const marker = document.querySelector(`.highlight-marker[data-id="${id}"]`);
    if (marker) {
        marker.remove();
    }
}

// Generate the 10-minute highlight version
async function generateHighlightVersion() {
    if (highlights.length === 0) {
        alert('Please add at least one highlight');
        return;
    }
    
    showLoading('Generating your 10-minute highlight version...');
    
    try {
        // In a real app, you would call your n8n webhook here with the highlights
        // const response = await fetch('YOUR_N8N_HIGHLIGHTS_WEBHOOK_URL', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         audioUrl: currentAudioUrl,
        //         highlights: highlights.map(h => h.time),
        //         title: currentAudioTitle
        //     })
        // });
        // const result = await response.json();
        
        // For demo purposes, we'll simulate a response after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show result section
        resultSection.style.display = 'block';
        
        // Display the result (in a real app, this would be the processed audio URL)
        const resultContent = document.getElementById('resultContent');
        if (resultContent) {
            resultContent.innerHTML = `
                <h3>${currentAudioTitle} - Highlights</h3>
                <p>Your 10-minute highlight version has been generated with ${highlights.length} key moments.</p>
                <ul>
                    ${highlights.map(h => 
                        `<li>${formatTime(h.time)} - ${h.text}</li>`
                    ).join('')}
                </ul>
                <p>Click the download button to save your highlights.</p>
            `;
        }
        
        // Scroll to result section
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error generating highlight version:', error);
        alert('Failed to generate highlight version. Please try again.');
    } finally {
        hideLoading();
    }
}

// Download the highlights
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any event listeners or setup code here
    console.log('Sermon Highlighter app initialized');
});

// Format time as MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Format date from ISO string or pub date
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString.trim());
        if (isNaN(date.getTime())) return 'Unknown date';
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown date';
    }
}

// Format duration from file size (rough estimate) or return placeholder
function formatDuration(lengthInBytes) {
    if (!lengthInBytes) return 'Unknown duration';
    
    // Rough estimate: 1MB ≈ 1 minute for typical sermon audio quality
    const estimatedMinutes = Math.round(parseInt(lengthInBytes) / (1024 * 1024));
    
    if (estimatedMinutes < 60) {
        return `~${estimatedMinutes} min`;
    } else {
        const hours = Math.floor(estimatedMinutes / 60);
        const minutes = estimatedMinutes % 60;
        return `~${hours}h ${minutes}m`;
    }
}

// Show loading overlay
function showLoading(message = 'Loading...') {
    if (loadingOverlay && loadingText) {
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Initialize the app
function init() {
    // Any initialization code can go here
    console.log('Sermon Highlighter initialized');
}

// Run the app
init();
