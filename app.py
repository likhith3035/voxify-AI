from flask import Flask, render_template, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import quote, urlparse, parse_qs
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import os
import json
import base64

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


def get_json(url):
    req = Request(
        url,
        headers={"User-Agent": "VoxifyStudentProject/1.0"}
    )

    with urlopen(req, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def get_ai_answer(prompt):
    if client is None:
        raise ValueError(
            "API key missing. Check your .env file."
        )

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    return response.output_text


def get_youtube_video_id(url):
    parsed = urlparse(url)

    if parsed.hostname in ("youtu.be", "www.youtu.be"):
        return parsed.path.strip("/")

    if parsed.hostname in (
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com"
    ):
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]

        if parsed.path.startswith(("/embed/", "/shorts/")):
            return parsed.path.split("/")[2]

    return None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/explore")
def explore():
    return render_template("explore.html")


@app.route("/api/explore")
def explore_api():
    topic = request.args.get("topic", "").strip()

    if not topic:
        return jsonify({"error": "Please enter a topic."}), 400

    if len(topic) > 150:
        return jsonify({
            "error": "Topic must be less than 150 characters."
        }), 400

    explanation = "No explanation found."
    images = []

    # Wikipedia explanation
    try:
        wiki_url = (
            "https://en.wikipedia.org/api/rest_v1/page/summary/"
            + quote(topic.replace(" ", "_"))
        )

        wiki_data = get_json(wiki_url)
        explanation = wiki_data.get(
            "extract",
            "No explanation found. Try another topic."
        )

    except Exception:
        explanation = (
            "Wikipedia explanation could not be loaded. "
            "You can try the AI explanation feature."
        )

    # Related images
    try:
        image_url = (
            "https://commons.wikimedia.org/w/api.php"
            "?action=query"
            "&generator=search"
            "&gsrsearch=" + quote(topic)
            + "&gsrnamespace=6"
            "&gsrlimit=6"
            "&prop=imageinfo"
            "&iiprop=url"
            "&iiurlwidth=500"
            "&format=json"
        )

        image_data = get_json(image_url)
        pages = image_data.get("query", {}).get("pages", {})

        for page in pages.values():
            info_list = page.get("imageinfo", [])

            if not info_list:
                continue

            info = info_list[0]
            image_link = info.get("thumburl") or info.get("url")

            if image_link:
                images.append({
                    "title": page.get("title", "Related image"),
                    "thumbnail": image_link,
                    "page": info.get("descriptionurl", "")
                })

    except Exception:
        images = []

    videos = [
        {
            "title": "Educational explanation",
            "url": (
                "https://www.youtube.com/results?search_query="
                + quote(topic + " educational explanation")
            )
        },
        {
            "title": "Beginner tutorial",
            "url": (
                "https://www.youtube.com/results?search_query="
                + quote(topic + " for beginners")
            )
        },
        {
            "title": "Visual explanation",
            "url": (
                "https://www.youtube.com/results?search_query="
                + quote(topic + " explained animation")
            )
        }
    ]

    return jsonify({
        "topic": topic,
        "explanation": explanation,
        "images": images,
        "videos": videos
    })


# AI text explanation
@app.route("/api/ai-explain", methods=["POST"])
def ai_explain():
    data = request.get_json(silent=True) or {}
    topic = data.get("topic", "").strip()

    if not topic:
        return jsonify({"error": "Please enter a topic."}), 400

    if len(topic) > 300:
        return jsonify({"error": "Topic is too long."}), 400

    try:
        prompt = f"""
Explain the following topic to a student in simple English.

Topic: {topic}

Include:
1. Simple introduction
2. Detailed explanation with headings
3. Important points
4. A real-world example
5. A short conclusion

Make the explanation educational and easy to understand.
"""

        answer = get_ai_answer(prompt)

        return jsonify({
            "topic": topic,
            "explanation": answer
        })

    except Exception as error:
        app.logger.exception("AI text explanation failed")
        return jsonify({
            "error": (
                "AI explanation failed. Check your API key, "
                "API billing, internet connection, and model access."
            )
        }), 500


# AI image explanation
@app.route("/api/image-explain", methods=["POST"])
def image_explain():
    uploaded_file = request.files.get("image")

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"error": "Please choose an image."}), 400

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    }

    if uploaded_file.mimetype not in allowed_types:
        return jsonify({
            "error": "Upload a JPG, PNG, WEBP, or GIF image."
        }), 400

    try:
        image_bytes = uploaded_file.read()

        if not image_bytes:
            return jsonify({"error": "The image is empty."}), 400

        encoded_image = base64.b64encode(
            image_bytes
        ).decode("utf-8")

        mime_type = uploaded_file.mimetype
        image_data_url = (
            f"data:{mime_type};base64,{encoded_image}"
        )

        if client is None:
            return jsonify({
                "error": "API key missing. Check your .env file."
            }), 500

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Explain this image to a student in "
                                "simple English. Describe what is visible, "
                                "the main idea, important details, and "
                                "what the image teaches. If something "
                                "is unclear, say so rather than guessing."
                            )
                        },
                        {
                            "type": "input_image",
                            "image_url": image_data_url
                        }
                    ]
                }
            ]
        )

        return jsonify({
            "explanation": response.output_text
        })

    except Exception:
        app.logger.exception("Image explanation failed")
        return jsonify({
            "error": (
                "Could not explain this image. Check your API key, "
                "API billing, internet connection, and image format."
            )
        }), 500


# YouTube video transcript explanation
@app.route("/api/video-explain", methods=["POST"])
def video_explain():
    data = request.get_json(silent=True) or {}
    video_url = data.get("url", "").strip()

    if not video_url:
        return jsonify({"error": "Please enter a YouTube link."}), 400

    video_id = get_youtube_video_id(video_url)

    if not video_id or len(video_id) != 11:
        return jsonify({
            "error": "Please enter a valid YouTube video link."
        }), 400

    try:
        transcript_api = YouTubeTranscriptApi()

        transcript = transcript_api.fetch(
            video_id,
            languages=["en", "te", "hi"]
        )

        transcript_text = " ".join(
            snippet.text for snippet in transcript
        )

        if not transcript_text.strip():
            return jsonify({
                "error": "No transcript text was found."
            }), 400

        # Keep the transcript within a reasonable size.
        transcript_text = transcript_text[:20000]

        prompt = f"""
Explain this YouTube video to a student using the transcript below.

Provide:
1. Main topic
2. Detailed summary
3. Important concepts
4. Step-by-step explanation where appropriate
5. Key takeaways

Be clear and educational. Explain only what the transcript supports.

TRANSCRIPT:
{transcript_text}
"""

        answer = get_ai_answer(prompt)

        return jsonify({
            "video_id": video_id,
            "explanation": answer
        })

    except Exception:
        app.logger.exception("Video explanation failed")
        return jsonify({
            "error": (
                "Could not get a transcript for this video. "
                "The video may not have captions available, or "
                "the transcript service may be unavailable."
            )
        }), 400


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "Image is too large. Maximum upload size is 8 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)

