const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatWindow = document.getElementById('chatWindow');

let documentUploaded = false;

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        uploadBtn.disabled = false;
        uploadStatus.textContent = "";
    } else {
        uploadBtn.disabled = true;
    }
});

uploadBtn.addEventListener('click', async () => {
    if (!fileInput.files.length) return;
    uploadBtn.disabled = true;
    uploadStatus.textContent = "Uploading and processing document...";
    userInput.disabled = true;
    chatForm.querySelector('button').disabled = true;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch('/upload/', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            uploadStatus.textContent = "Document uploaded and indexed successfully.";
            documentUploaded = true;
            userInput.disabled = false;
            chatForm.querySelector('button').disabled = false;
            userInput.focus();
        } else {
            const errorData = await res.json();
            uploadStatus.textContent = "Error: " + (errorData.error || "Unknown error");
        }
    } catch (error) {
        uploadStatus.textContent = "Upload failed: " + error.message;
    } finally {
        uploadBtn.disabled = false;
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question || !documentUploaded) return;

    appendMessage(question, 'user');
    userInput.value = "";
    userInput.disabled = true;
    chatForm.querySelector('button').disabled = true;

    try {
        const response = await fetch(`/ask/?q=${encodeURIComponent(question)}`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        appendMessage(data.answer, 'bot');
        if (data.source) {
            appendSource(data.source);
        }
    } catch (err) {
        appendMessage("Error: " + err.message, 'bot');
    } finally {
        userInput.disabled = false;
        chatForm.querySelector('button').disabled = false;
        userInput.focus();
        scrollToBottom();
    }
});

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
    scrollToBottom();
}

function appendSource(sourceText) {
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'message source';
    sourceDiv.textContent = `Source:\n${sourceText}`;
    chatWindow.appendChild(sourceDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
