SPEECH-TO-TEXT APPLICATION (Python Flask + Browser Speech Recognition)

HOW TO RUN ON WINDOWS
1. Extract this ZIP file to a folder.
2. Open the extracted SpeechToTextProject folder in VS Code.
3. In VS Code, select Terminal > New Terminal.
4. Run: python -m pip install -r requirements.txt
   If 'python' is not recognized, try: py -m pip install -r requirements.txt
5. Run: python app.py
   If needed, try: py app.py
6. Open Google Chrome and visit: http://127.0.0.1:5000
7. Click Start Recording and allow microphone access.
8. Speak clearly. Click Stop Recording when finished.

FEATURES
- Home page
- Start/Stop speech recognition
- Live text display
- Copy text
- Download text as a .txt file
- Clear text

LANGUAGE
The default is Indian English (en-IN). To try Telugu recognition, open static/script.js and change:
recognition.lang = "en-IN";
to:
recognition.lang = "te-IN";
Telugu support depends on browser/service availability.

IMPORTANT
- Internet may be required for browser speech recognition.
- Use Google Chrome for best compatibility.
- This version converts speech to text; it does not save an audio recording file.

