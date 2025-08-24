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
const transcriptionPanel = document.getElementById('transcriptionPanel');
const transcriptionContent = document.getElementById('transcriptionContent');
const copyTranscriptionBtn = document.getElementById('copyTranscriptionBtn');
const downloadTranscriptionBtn = document.getElementById('downloadTranscriptionBtn');

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
    copyTranscriptionBtn.addEventListener('click', copyTranscription);
    downloadTranscriptionBtn.addEventListener('click', downloadTranscription);
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
    transcribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting transcription...';
    
    try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
        
        // Send the complete episode JSON data to the n8n webhook
        const response = await fetch('https://holtzbrinck.app.n8n.cloud/webhook/7bbd0342-04d9-447f-b4bc-87793e97126a', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(currentEpisode),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            
            // Extract and display the transcription text
            let transcriptionText = null;
            
            // Handle different response formats
            if (result && result.text) {
                // Direct text response
                transcriptionText = result.text;
            } else if (result && Array.isArray(result) && result[0] && result[0].content && result[0].content.parts && result[0].content.parts[0] && result[0].content.parts[0].text) {
                // Gemini Flash response format
                transcriptionText = result[0].content.parts[0].text;
            } else if (result && result.content && result.content.parts && result.content.parts[0] && result.content.parts[0].text) {
                // Alternative Gemini format
                transcriptionText = result.content.parts[0].text;
            }
            
            if (transcriptionText) {
                displayTranscription(transcriptionText);
                showSuccessMessage('Audio transcription completed successfully!');
            } else if (result && result.jobId) {
                // Start polling for results if job ID is provided
                showSuccessMessage(`Transcription started (Job ID: ${result.jobId}). Checking for completion...`);
                startPollingForTranscription(result.jobId);
            } else if (result && result.message) {
                showSuccessMessage(`Transcription started: ${result.message}`);
                console.log('Transcription result:', result);
            } else {
                showSuccessMessage('Transcription request submitted successfully! The process may take several minutes.');
                console.log('Transcription result:', result);
            }
        } else if (response.status === 524) {
            showTimeoutMessage();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showTimeoutMessage();
        } else {
            console.error('Error transcribing audio:', error);
            showErrorMessage('Failed to start transcription. Please check your connection and try again.');
        }
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
    testTranscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting test...';
    
    try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
        
        // Send the complete episode JSON data to the test n8n webhook
        const response = await fetch('https://holtzbrinck.app.n8n.cloud/webhook-test/7bbd0342-04d9-447f-b4bc-87793e97126a', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(currentEpisode),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            
            // Extract and display the transcription text
            let transcriptionText = null;
            
            // Handle different response formats
            if (result && result.text) {
                // Direct text response
                transcriptionText = result.text;
            } else if (result && Array.isArray(result) && result[0] && result[0].content && result[0].content.parts && result[0].content.parts[0] && result[0].content.parts[0].text) {
                // Gemini Flash response format
                transcriptionText = result[0].content.parts[0].text;
            } else if (result && result.content && result.content.parts && result.content.parts[0] && result.content.parts[0].text) {
                // Alternative Gemini format
                transcriptionText = result.content.parts[0].text;
            }
            
            if (transcriptionText) {
                displayTranscription(transcriptionText);
                showSuccessMessage('Test transcription completed successfully!');
            } else if (result && result.message) {
                showSuccessMessage(`Test transcription started: ${result.message}`);
                console.log('Test transcription result:', result);
            } else {
                showSuccessMessage('Test transcription request submitted successfully! The process may take several minutes.');
                console.log('Test transcription result:', result);
            }
        } else if (response.status === 524) {
            showTimeoutMessage();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showTimeoutMessage();
        } else {
            console.error('Error with test transcription:', error);
            showErrorMessage('Failed to start test transcription. Please check your connection and try again.');
        }
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

// Display transcription text in the UI
function displayTranscription(text) {
    if (!text) {
        console.warn('No transcription text provided');
        return;
    }
    
    // Clear existing content
    transcriptionContent.innerHTML = '';
    
    // Check if this looks like a Gemini analysis response
    if (typeof text === 'string' && text.includes('3. Synthesized Answer')) {
        console.log('Detected Gemini analysis response, attempting to parse...');
        
        // Try multiple parsing strategies
        try {
            // Strategy 1: Find the start of the JSON object within the text
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                const jsonString = text.substring(jsonStart, jsonEnd);
                const analysisJson = JSON.parse(jsonString);
                
                if (analysisJson['3. Synthesized Answer']) {
                    console.log('Successfully parsed Gemini analysis (Strategy 1)');
                    displaySermonAnalysis(analysisJson);
                    return;
                }
            }
        } catch (parseError) {
            console.log('Strategy 1 failed:', parseError);
        }
        
        try {
            // Strategy 2: Look for array structure
            const arrayStart = text.indexOf('[');
            const arrayEnd = text.lastIndexOf(']') + 1;
            
            if (arrayStart !== -1 && arrayEnd > arrayStart) {
                const arrayString = text.substring(arrayStart, arrayEnd);
                const parsedArray = JSON.parse(arrayString);
                
                if (Array.isArray(parsedArray) && parsedArray[0] && parsedArray[0].json && parsedArray[0].json['3. Synthesized Answer']) {
                    console.log('Successfully parsed Gemini analysis (Strategy 2)');
                    displaySermonAnalysis(parsedArray[0].json);
                    return;
                }
            }
        } catch (parseError) {
            console.log('Strategy 2 failed:', parseError);
        }
    }
    
    try {
        // Try to parse as JSON first (for other formats)
        let analysisData = JSON.parse(text);
        
        // Check if it's the nested Gemini format with the JSON string inside
        if (typeof analysisData === 'object' && analysisData.json) {
            // Direct access to json property
            if (analysisData.json['3. Synthesized Answer']) {
                displaySermonAnalysis(analysisData.json);
                return;
            }
        }
        
        // Handle array format with nested json
        if (Array.isArray(analysisData) && analysisData[0] && analysisData[0].json) {
            if (analysisData[0].json['3. Synthesized Answer']) {
                displaySermonAnalysis(analysisData[0].json);
                return;
            }
        }
        
        // Check if the text itself contains a JSON string that needs parsing
        if (typeof text === 'string' && text.includes('3. Synthesized Answer')) {
            // Try to extract the complete JSON structure
            const jsonStartIndex = text.indexOf('[');
            const jsonEndIndex = text.lastIndexOf(']');
            
            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
                try {
                    const extractedJson = JSON.parse(jsonString);
                    if (Array.isArray(extractedJson) && extractedJson[0] && extractedJson[0].json && extractedJson[0].json['3. Synthesized Answer']) {
                        displaySermonAnalysis(extractedJson[0].json);
                        return;
                    }
                } catch (innerError) {
                    console.log('Inner JSON parsing failed:', innerError);
                }
            }
            
            // Alternative: try to find and parse the inner JSON object directly
            const innerJsonMatch = text.match(/"json":\s*(\{[\s\S]*?\})\s*\}/);
            if (innerJsonMatch) {
                try {
                    const innerJson = JSON.parse(innerJsonMatch[1]);
                    if (innerJson['3. Synthesized Answer']) {
                        displaySermonAnalysis(innerJson);
                        return;
                    }
                } catch (innerError) {
                    console.log('Inner JSON object parsing failed:', innerError);
                }
            }
        }
    } catch (e) {
        console.log('JSON parsing failed:', e);
        // Not JSON, treat as regular text
    }
    
    // Split text into paragraphs for better readability
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    if (paragraphs.length === 0) {
        // If no paragraph breaks, split by sentences for readability
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        sentences.forEach((sentence, index) => {
            const p = document.createElement('p');
            p.textContent = sentence.trim();
            transcriptionContent.appendChild(p);
            
            // Add paragraph break every 3-4 sentences for readability
            if ((index + 1) % 3 === 0 && index < sentences.length - 1) {
                const br = document.createElement('br');
                transcriptionContent.appendChild(br);
            }
        });
    } else {
        // Display as paragraphs
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph.trim();
            transcriptionContent.appendChild(p);
        });
    }
    
    // Show the transcription panel
    transcriptionPanel.style.display = 'block';
    
    // Scroll to transcription panel
    transcriptionContent.scrollIntoView({ behavior: 'smooth' });
}

// Display beautiful sermon analysis with clickable highlights
function displaySermonAnalysis(analysisJson) {
    // Clear existing content
    transcriptionContent.innerHTML = '';
    
    // Create main container
    const analysisContainer = document.createElement('div');
    analysisContainer.className = 'sermon-analysis';
    
    // Add title
    const title = document.createElement('h2');
    title.className = 'analysis-title';
    title.innerHTML = '<i class="fas fa-lightbulb"></i> Sermon Analysis & Key Highlights';
    analysisContainer.appendChild(title);
    
    // Add core theme if available
    if (analysisJson['Analysis for Query']) {
        const querySection = document.createElement('div');
        querySection.className = 'analysis-section';
        querySection.innerHTML = `
            <h3><i class="fas fa-bullseye"></i> Analysis Focus</h3>
            <p class="analysis-description">${analysisJson['Analysis for Query']}</p>
        `;
        analysisContainer.appendChild(querySection);
    }
    
    // Display key highlights
    const highlights = analysisJson['3. Synthesized Answer'];
    if (highlights && Array.isArray(highlights)) {
        const highlightsSection = document.createElement('div');
        highlightsSection.className = 'highlights-section';
        highlightsSection.innerHTML = '<h3><i class="fas fa-star"></i> Key Sermon Highlights</h3>';
        
        highlights.forEach((highlight, index) => {
            const highlightCard = document.createElement('div');
            highlightCard.className = 'highlight-card';
            
            // Parse time to seconds for audio seeking
            const startSeconds = parseTimeToSeconds(highlight.start_time);
            const endSeconds = parseTimeToSeconds(highlight.end_time);
            
            highlightCard.innerHTML = `
                <div class="highlight-header">
                    <h4 class="highlight-title">${highlight.headline}</h4>
                    <div class="highlight-time">
                        <button class="time-link" onclick="seekToTime(${startSeconds})" title="Jump to ${highlight.start_time}">
                            <i class="fas fa-play"></i> ${highlight.start_time}
                        </button>
                        ${endSeconds ? `<span class="time-separator">-</span>
                        <button class="time-link" onclick="seekToTime(${endSeconds})" title="Jump to ${highlight.end_time}">
                            <i class="fas fa-stop"></i> ${highlight.end_time}
                        </button>` : ''}
                    </div>
                </div>
                <p class="highlight-description">${highlight.description}</p>
                <div class="highlight-actions">
                    <button class="highlight-action-btn" onclick="addHighlightFromAnalysis(${startSeconds}, '${highlight.headline.replace(/'/g, "\\'")}')">
                        <i class="fas fa-bookmark"></i> Save Highlight
                    </button>
                    <button class="highlight-action-btn" onclick="playSegment(${startSeconds}, ${endSeconds || startSeconds + 60})">
                        <i class="fas fa-headphones"></i> Play Segment
                    </button>
                </div>
            `;
            
            highlightsSection.appendChild(highlightCard);
        });
        
        analysisContainer.appendChild(highlightsSection);
    }
    
    // Add reasoning section if available
    if (analysisJson['2. Step-by-Step Reasoning']) {
        const reasoningSection = document.createElement('div');
        reasoningSection.className = 'reasoning-section';
        reasoningSection.innerHTML = '<h3><i class="fas fa-brain"></i> Analysis Process</h3>';
        
        const reasoning = analysisJson['2. Step-by-Step Reasoning'];
        if (Array.isArray(reasoning)) {
            reasoning.forEach((step, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'reasoning-step';
                stepDiv.innerHTML = `
                    <h4>${step.step}</h4>
                    <p>${step.content}</p>
                `;
                reasoningSection.appendChild(stepDiv);
            });
        }
        
        analysisContainer.appendChild(reasoningSection);
    }
    
    transcriptionContent.appendChild(analysisContainer);
    
    // Show the transcription panel
    transcriptionPanel.style.display = 'block';
    
    // Scroll to transcription panel
    transcriptionContent.scrollIntoView({ behavior: 'smooth' });
}

// Parse time string (e.g., "5m28s190ms") to seconds
function parseTimeToSeconds(timeString) {
    if (!timeString) return 0;
    
    let seconds = 0;
    const timeRegex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?/;
    const match = timeString.match(timeRegex);
    
    if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const secs = parseInt(match[3]) || 0;
        const milliseconds = parseInt(match[4]) || 0;
        
        seconds = hours * 3600 + minutes * 60 + secs + milliseconds / 1000;
    }
    
    return seconds;
}

// Seek to specific time in audio
function seekToTime(seconds) {
    if (audioPlayer && !isNaN(seconds)) {
        audioPlayer.currentTime = seconds;
        if (audioPlayer.paused) {
            audioPlayer.play();
        }
        showNotification(`Jumped to ${formatTime(seconds)}`, 'info');
    }
}

// Add highlight from analysis
function addHighlightFromAnalysis(time, text) {
    const highlight = {
        time: time,
        text: text
    };
    
    highlights.push(highlight);
    updateHighlightsDisplay();
    updateProgressBarHighlights();
    showNotification('Highlight saved!', 'success');
}

// Play audio segment
function playSegment(startTime, endTime) {
    if (audioPlayer && !isNaN(startTime)) {
        audioPlayer.currentTime = startTime;
        audioPlayer.play();
        
        if (!isNaN(endTime) && endTime > startTime) {
            // Stop at end time
            const stopHandler = () => {
                if (audioPlayer.currentTime >= endTime) {
                    audioPlayer.pause();
                    audioPlayer.removeEventListener('timeupdate', stopHandler);
                }
            };
            audioPlayer.addEventListener('timeupdate', stopHandler);
        }
        
        showNotification(`Playing segment from ${formatTime(startTime)}`, 'info');
    }
}

// Copy transcription to clipboard
async function copyTranscription() {
    const text = transcriptionContent.textContent;
    
    if (!text) {
        alert('No transcription text to copy');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = copyTranscriptionBtn.innerHTML;
        copyTranscriptionBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyTranscriptionBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        
        setTimeout(() => {
            copyTranscriptionBtn.innerHTML = originalText;
            copyTranscriptionBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy text:', error);
        alert('Failed to copy transcription. Please try selecting and copying manually.');
    }
}

// Download transcription as text file
function downloadTranscription() {
    const text = transcriptionContent.textContent;
    
    if (!text) {
        alert('No transcription text to download');
        return;
    }
    
    // Create filename with episode title and timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const episodeTitle = currentEpisode?.title || 'Sermon';
    const filename = `${episodeTitle.replace(/[^a-z0-9]/gi, '_')}_transcription_${timestamp}.txt`;
    
    // Create downloadable content
    const content = `Transcription: ${episodeTitle}\n` +
                   `Date: ${new Date().toLocaleDateString()}\n` +
                   `Author: ${currentEpisode?.author || 'Unknown'}\n\n` +
                   `${text}`;
    
    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Visual feedback
    const originalText = downloadTranscriptionBtn.innerHTML;
    downloadTranscriptionBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
    downloadTranscriptionBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    
    setTimeout(() => {
        downloadTranscriptionBtn.innerHTML = originalText;
        downloadTranscriptionBtn.style.background = '';
    }, 2000);
}

// Show success message
function showSuccessMessage(message) {
    // Create or update notification
    showNotification(message, 'success');
}

// Show error message
function showErrorMessage(message) {
    showNotification(message, 'error');
}

// Function to show timeout-specific message
function showTimeoutMessage() {
    showNotification(
        'Transcription process may still be running in the background. Due to server timeout limits, long audio files may take several minutes to process. You can try the request again later or check if the transcription completes.',
        'warning'
    );
}

// Function to poll for transcription results
async function startPollingForTranscription(jobId) {
    const maxAttempts = 20; // Poll for up to 10 minutes (30s intervals)
    let attempts = 0;

    const pollInterval = setInterval(async () => {
        attempts++;

        try {
            const response = await fetch(`https://holtzbrinck.app.n8n.cloud/webhook/transcription-status/${jobId}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();

                if (result.status === 'completed' && result.text) {
                    clearInterval(pollInterval);
                    displayTranscription(result.text);
                    showSuccessMessage('Audio transcription completed successfully!');
                    resetTranscribeButton();
                } else if (result.status === 'failed') {
                    clearInterval(pollInterval);
                    showErrorMessage(`Transcription failed: ${result.error || 'Unknown error'}`);
                    resetTranscribeButton();
                } else if (result.status === 'processing') {
                    showNotification(`Transcription in progress... (${attempts}/${maxAttempts})`, 'info');
                }
            }
        } catch (error) {
            console.log('Polling error:', error);
        }

        if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            showNotification('Transcription is taking longer than expected. Please check back later.', 'warning');
            resetTranscribeButton();
        }
    }, 30000); // Poll every 30 seconds
}

// Function to reset transcribe button state
function resetTranscribeButton() {
    const transcribeBtn = document.getElementById('transcribeBtn');
    transcribeBtn.disabled = false;
    transcribeBtn.classList.remove('processing');
    transcribeBtn.innerHTML = '<i class="fas fa-microphone"></i> Transcribe Audio';
}

// Generic notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        z-index: 10000;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Type-specific styling
    const styles = {
        success: 'background: rgba(40, 167, 69, 0.95); color: white;',
        error: 'background: rgba(220, 53, 69, 0.95); color: white;',
        warning: 'background: rgba(255, 193, 7, 0.95); color: #333;',
        info: 'background: rgba(74, 111, 165, 0.95); color: white;'
    };
    
    notification.style.cssText += styles[type] || styles.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after delay (except for warnings which need manual dismissal)
    if (type !== 'warning') {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, type === 'error' ? 8000 : 5000);
    }
}

// Add CSS animations if not already present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-content {
            padding: 15px 20px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        .notification-message {
            flex: 1;
            white-space: pre-line;
            line-height: 1.4;
        }
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        .notification-close:hover {
            opacity: 1;
            background: rgba(255,255,255,0.2);
        }
    `;
    document.head.appendChild(style);
}

// Go back to episodes list
function goBack() {
    window.history.back();
}

// Make functions global for onclick handlers
window.seekToHighlight = seekToHighlight;
window.removeHighlight = removeHighlight;
window.goBack = goBack;
