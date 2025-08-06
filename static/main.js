// Global state
let documentUploaded = false;
let chatHistory = [];
let uploadedDocuments = [];
let isTyping = false;
let currentTheme = 'dark';
let settings = {
    darkMode: true,
    autoScroll: true,
    soundEffects: false,
    showSources: true
};

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadStatus = document.getElementById('uploadStatus');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const documentList = document.getElementById('documentList');
const welcomeMessage = document.getElementById('welcomeMessage');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const documentCount = document.getElementById('documentCount');
const notification = document.getElementById('notification');
const sidebar = document.getElementById('sidebar');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateStatus('Ready');
    loadSettings();
});

function initializeApp() {
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enable/disable send button
    chatInput.addEventListener('input', function() {
        sendBtn.disabled = !this.value.trim() || !documentUploaded;
    });

    // Handle Enter key
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Initialize welcome message
    showWelcomeMessage();
}

function setupEventListeners() {
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Chat form
    chatForm.addEventListener('submit', handleChatSubmit);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

async function processFiles(files) {
    for (const file of files) {
        if (file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
            await uploadFile(file);
        } else {
            showNotification('Unsupported file format. Please upload PDF, DOCX, or TXT files.', 'error');
        }
    }
}

async function uploadFile(file) {
    showNotification(`Uploading ${file.name}...`);
    updateStatus('Processing document...');
    statusDot.classList.remove('offline');

    // Show upload progress
    const progressElement = createProgressIndicator();
    chatMessages.appendChild(progressElement);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const startTime = Date.now();
        const response = await fetch('/upload/', {
            method: 'POST',
            body: formData
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
            const result = await response.json();
            uploadedDocuments.push({
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                uploadTime: new Date(),
                id: Date.now()
            });
            
            updateDocumentList();
            enableChat();
            showNotification(`${file.name} uploaded and indexed successfully!`);
            updateStatus('Ready');
            updateResponseTime(`Last upload: ${responseTime}ms`);
            
            hideWelcomeMessage();
            addSystemMessage(`Document "${file.name}" has been successfully uploaded and indexed. You can now ask questions about its content.`);
            
            // Play success sound
            if (settings.soundEffects) {
                playSound('success');
            }
        } else {
            const error = await response.json();
            showNotification(`Upload failed: ${error.error || 'Unknown error'}`, 'error');
            updateStatus('Upload failed');
            statusDot.classList.add('offline');
            
            if (settings.soundEffects) {
                playSound('error');
            }
        }
    } catch (error) {
        showNotification(`Upload failed: ${error.message}`, 'error');
        updateStatus('Connection error');
        statusDot.classList.add('offline');
        
        if (settings.soundEffects) {
            playSound('error');
        }
    } finally {
        // Remove progress indicator
        progressElement.remove();
    }
}

function createProgressIndicator() {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'message bot';
    progressDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span>Processing document</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    return progressDiv;
}

function updateDocumentList() {
    documentList.innerHTML = '';
    uploadedDocuments.forEach((doc, index) => {
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        if (index === 0) docElement.classList.add('active');
        
        docElement.innerHTML = `
            <i class="fas ${getFileIcon(doc.name)}"></i>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${doc.name}
                </div>
                <div style="font-size: 0.7rem; opacity: 0.7;">
                    ${doc.size} • ${formatTime(doc.uploadTime)}
                </div>
            </div>
            <button class="input-action-btn" onclick="removeDocument(${doc.id})" style="opacity: 0.6;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        docElement.addEventListener('click', () => selectDocument(index));
        documentList.appendChild(docElement);
    });
    
    updateDocumentCount();
}

function getFileIcon(filename) {
    if (filename.endsWith('.pdf')) return 'fa-file-pdf';
    if (filename.endsWith('.docx')) return 'fa-file-word';
    if (filename.endsWith('.txt')) return 'fa-file-alt';
    return 'fa-file';
}

function selectDocument(index) {
    document.querySelectorAll('.document-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function removeDocument(docId) {
    uploadedDocuments = uploadedDocuments.filter(doc => doc.id !== docId);
    updateDocumentList();
    
    if (uploadedDocuments.length === 0) {
        disableChat();
        showWelcomeMessage();
        addSystemMessage('All documents have been removed. Please upload a document to continue chatting.');
    }
    
    showNotification('Document removed');
}

function enableChat() {
    documentUploaded = true;
    chatInput.disabled = false;
    chatInput.placeholder = 'Ask me anything about your documents...';
    updateSendButton();
}

function disableChat() {
    documentUploaded = false;
    chatInput.disabled = true;
    chatInput.placeholder = 'Upload a document first...';
    sendBtn.disabled = true;
}

function updateSendButton() {
    sendBtn.disabled = !chatInput.value.trim() || !documentUploaded;
}

// Chat handlers
async function handleChatSubmit(e) {
    e.preventDefault();
    
    const question = chatInput.value.trim();
    if (!question || !documentUploaded || isTyping) return;
    
    // Add user message
    addMessage(question, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    updateSendButton();
    
    // Show typing indicator
    showTypingIndicator();
    updateStatus('Thinking...');
    
    try {
        const startTime = Date.now();
        const response = await fetch(`/ask/?q=${encodeURIComponent(question)}`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response
        addMessage(data.answer, 'bot');
        
        // Add source if available and enabled
        if (data.source && settings.showSources) {
            addSourceMessage(data.source);
        }
        
        // Update response time
        updateResponseTime(`Response: ${responseTime}ms`);
        updateStatus('Ready');
        
        // Add to chat history
        chatHistory.push({
            question: question,
            answer: data.answer,
            source: data.source,
            timestamp: new Date()
        });
        
        // Play notification sound
        if (settings.soundEffects) {
            playSound('message');
        }
        
    } catch (error) {
        hideTypingIndicator();
        addMessage(`Sorry, I encountered an error: ${error.message}`, 'bot');
        updateStatus('Error');
        statusDot.classList.add('offline');
        
        if (settings.soundEffects) {
            playSound('error');
        }
        
        // Reset status after a delay
        setTimeout(() => {
            updateStatus('Ready');
            statusDot.classList.remove('offline');
        }, 3000);
    }
}

// Message functions
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'user' ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());
    content.appendChild(time);
    
    if (sender === 'user') {
        messageDiv.appendChild(content);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
    }
    
    chatMessages.appendChild(messageDiv);
    
    if (settings.autoScroll) {
        scrollToBottom();
    }
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="message-content" style="background: rgba(33, 150, 243, 0.1); border-left: 3px solid #2196F3;">
            ${text}
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    if (settings.autoScroll) scrollToBottom();
}

function addSourceMessage(sourceText) {
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'source-message';
    sourceDiv.innerHTML = `
        <strong><i class="fas fa-quote-left"></i> Source Context:</strong><br>
        ${sourceText}
    `;
    
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('bot')) {
        lastMessage.querySelector('.message-content').appendChild(sourceDiv);
    }
}

function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="typing-indicator">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    if (settings.autoScroll) scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// UI functions
function showWelcomeMessage() {
    if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
    }
}

function hideWelcomeMessage() {
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateStatus(status) {
    statusText.textContent = status;
}

function updateDocumentCount() {
    const count = uploadedDocuments.length;
    documentCount.textContent = count === 0 ? 'No documents uploaded' : 
        count === 1 ? '1 document uploaded' : 
        `${count} documents uploaded`;
}

function updateResponseTime(time) {
    const responseTimeElement = document.getElementById('responseTime');
    if (responseTimeElement) {
        responseTimeElement.textContent = time;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Utility functions
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Feature functions
function clearChat() {
    chatMessages.innerHTML = '';
    chatHistory = [];
    showWelcomeMessage();
    showNotification('Chat cleared');
    updateStatus('Ready');
}

function exportChat() {
    if (chatHistory.length === 0) {
        showNotification('No chat history to export', 'error');
        return;
    }
    
    const chatData = {
        exportDate: new Date().toISOString(),
        documents: uploadedDocuments.map(doc => ({ name: doc.name, uploadTime: doc.uploadTime })),
        messages: chatHistory
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Chat exported successfully');
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

function toggleSetting(element) {
    element.classList.toggle('active');
    
    // Update settings based on the toggle
    const settingText = element.previousElementSibling.textContent;
    switch (settingText) {
        case 'Dark Mode':
            settings.darkMode = element.classList.contains('active');
            break;
        case 'Auto-scroll':
            settings.autoScroll = element.classList.contains('active');
            break;
        case 'Sound Effects':
            settings.soundEffects = element.classList.contains('active');
            break;
        case 'Show Sources':
            settings.showSources = element.classList.contains('active');
            break;
    }
    
    saveSettings();
    showNotification(`${settingText} ${element.classList.contains('active') ? 'enabled' : 'disabled'}`);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    showNotification(`Switched to ${currentTheme} theme`);
}

function showSettings() {
    showNotification('Settings panel in sidebar');
    if (sidebar.classList.contains('collapsed')) {
        toggleSidebar();
    }
}

function showHelp() {
    const helpMessage = `
        <strong>🚀 Quick Start Guide:</strong><br><br>
        <strong>1.</strong> Upload documents (PDF, DOCX, TXT)<br>
        <strong>2.</strong> Ask questions about your content<br>
        <strong>3.</strong> Get AI-powered answers<br><br>
        <strong>💡 Tips:</strong><br>
        • Use Shift+Enter for new lines<br>
        • Drag & drop files to upload<br>
        • Check settings in sidebar<br>
        • Export chat history anytime
    `;
    
    const helpDiv = document.createElement('div');
    helpDiv.className = 'message bot';
    helpDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-question-circle"></i>
        </div>
        <div class="message-content" style="background: rgba(255, 193, 7, 0.1); border-left: 3px solid #FFC107;">
            ${helpMessage}
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    hideWelcomeMessage();
    chatMessages.appendChild(helpDiv);
    if (settings.autoScroll) scrollToBottom();
}

function showProfile() {
    showNotification('Profile feature coming soon!');
}

// Additional features
function attachFile() {
    fileInput.click();
}

function recordVoice() {
    showNotification('Voice recording feature coming soon!');
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!sendBtn.disabled) {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl/Cmd + L to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearChat();
    }
    
    // Ctrl/Cmd + U to upload file
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInput.click();
    }
    
    // Escape to close notifications
    if (e.key === 'Escape') {
        const notification = document.querySelector('.notification.show');
        if (notification) {
            notification.classList.remove('show');
        }
    }
}

function playSound(type) {
    if (!settings.soundEffects) return;
    
    // Create simple audio feedback using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    switch (type) {
        case 'success':
            oscillator.frequency.value = 800;
            break;
        case 'error':
            oscillator.frequency.value = 300;
            break;
        case 'message':
            oscillator.frequency.value = 600;
            break;
        default:
            oscillator.frequency.value = 500;
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function saveSettings() {
    try {
        localStorage.setItem('ragChatSettings', JSON.stringify(settings));
    } catch (e) {
        console.log('Settings saved to session storage');
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('ragChatSettings');
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
            
            // Apply loaded settings to UI
            document.querySelectorAll('.toggle-switch').forEach((toggle, index) => {
                const settingKeys = ['darkMode', 'autoScroll', 'soundEffects', 'showSources'];
                const key = settingKeys[index];
                if (settings[key] !== undefined) {
                    toggle.classList.toggle('active', settings[key]);
                }
            });
        }
    } catch (e) {
        console.log('Using default settings');
    }
}

// Auto-save chat history periodically
setInterval(() => {
    if (chatHistory.length > 0) {
        try {
            sessionStorage.setItem('ragChatHistory', JSON.stringify(chatHistory));
        } catch (e) {
            console.log('Chat history saved to memory');
        }
    }
}, 30000); // Save every 30 seconds

// Load chat history on page load
window.addEventListener('load', () => {
    try {
        const savedHistory = sessionStorage.getItem('ragChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
        }
    } catch (e) {
        console.log('No saved chat history found');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        updateStatus('Ready');
        statusDot.classList.remove('offline');
    }
});