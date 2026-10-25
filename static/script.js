const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const output = document.getElementById("output");
const statusBox = document.getElementById("status");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isRecording = false;
let finalText = "";

if (!SpeechRecognition) {
    statusBox.textContent =
        "Speech recognition is not supported here. Please open this app in Google Chrome.";
    startBtn.disabled = true;
} else {
    recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Change to "te-IN" to try Telugu recognition.
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusBox.textContent = "🎤 Listening... Speak now.";
    };

    recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalText += transcript.trim() + " ";
            } else {
                interimText += transcript;
            }
        }
        output.value = (finalText + interimText).trim();
    };

    recognition.onerror = (event) => {
        const messages = {
            "not-allowed": "Microphone permission denied. Allow microphone access in Chrome.",
            "no-speech": "No speech detected. Please speak clearly and try again.",
            "audio-capture": "No microphone was found. Check your microphone connection.",
            "network": "Speech recognition network error. Check your internet connection."
        };
        statusBox.textContent = messages[event.error] || ("Speech recognition error: " + event.error);
    };

    recognition.onend = () => {
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        if (statusBox.textContent.startsWith("🎤 Listening")) {
            statusBox.textContent = "Recording stopped. You can start again.";
        }
    };
}

startBtn.addEventListener("click", () => {
    if (!recognition || isRecording) return;
    finalText = output.value.trim();
    if (finalText) finalText += " ";
    try {
        recognition.start();
    } catch (error) {
        statusBox.textContent = "Please wait a moment, then click Start Recording again.";
    }
});

stopBtn.addEventListener("click", () => {
    if (recognition && isRecording) {
        recognition.stop();
        statusBox.textContent = "Stopping recording...";
    }
});

copyBtn.addEventListener("click", async () => {
    if (!output.value.trim()) {
        statusBox.textContent = "There is no text to copy yet.";
        return;
    }
    try {
        await navigator.clipboard.writeText(output.value);
        statusBox.textContent = "Text copied successfully!";
    } catch (error) {
        output.focus();
        output.select();
        statusBox.textContent = "Text selected. Press Ctrl+C to copy.";
    }
});

downloadBtn.addEventListener("click", () => {
    if (!output.value.trim()) {
        statusBox.textContent = "There is no text to download yet.";
        return;
    }
    const blob = new Blob([output.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "speech_text.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    statusBox.textContent = "Text downloaded as speech_text.txt.";
});

clearBtn.addEventListener("click", () => {
    if (recognition && isRecording) recognition.stop();
    output.value = "";
    finalText = "";
    statusBox.textContent = "Text cleared. Ready to start.";
});
```javascript
// Topic-to-Video Explainer

let slides = [];
let currentSlide = 0;

function generateExplanation() {
    const topic = document.getElementById("topicInput").value.trim();

    if (!topic) {
        alert("Please enter a topic first!");
        return;
    }

    slides = [
        {
            title: topic,
            text: "Welcome! Today, we are going to learn about " +
                  topic + "."
        },
        {
            title: "Introduction to " + topic,
            text: topic + " is an important topic. Understanding its " +
                  "basic concepts helps us learn how it works and why " +
                  "it is useful."
        },
        {
            title: "How Does It Work?",
            text: "To understand " + topic +
                  ", start by learning its main concepts, how they " +
                  "are used, and how they solve problems."
        },
        {
            title: "Applications of " + topic,
            text: topic + " can be explored through real-world " +
                  "examples, practical applications, and projects."
        },
        {
            title: "Summary",
            text: "We have introduced " + topic +
                  ". Next, explore reliable learning resources and " +
                  "practical examples to understand it in more detail."
        }
    ];

    currentSlide = 0;
    document.getElementById("presentation").style.display = "block";

    showSlide();
}

function showSlide() {
    if (slides.length === 0) return;

    document.getElementById("slideTitle").textContent =
        slides[currentSlide].title;

    document.getElementById("slideText").textContent =
        slides[currentSlide].text;

    document.getElementById("slideNumber").textContent =
        "Slide " + (currentSlide + 1) + " of " + slides.length;
}

function nextSlide() {
    if (slides.length === 0) return;

    if (currentSlide < slides.length - 1) {
        currentSlide++;
        showSlide();
    } else {
        alert("You have reached the last slide!");
    }
}

function previousSlide() {
    if (slides.length === 0) return;

    if (currentSlide > 0) {
        currentSlide--;
        showSlide();
    }
}

function speakExplanation() {
    if (slides.length === 0) {
        alert("Please generate an explanation first!");
        return;
    }

    if (!("speechSynthesis" in window)) {
        alert("Voice narration is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const narration = new SpeechSynthesisUtterance(
        slides[currentSlide].title + ". " +
        slides[currentSlide].text
    );

    narration.lang = "en-US";
    narration.rate = 0.9;

    window.speechSynthesis.speak(narration);
}

function stopExplanation() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}
```
