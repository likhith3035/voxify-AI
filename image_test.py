
import os
import base64
import struct


image_path = input("Enter image path: ").strip().strip('"')

if not os.path.exists(image_path):
    print("Image file not found!")
else:
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    extension = os.path.splitext(image_path)[1].lower()
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(extension)

    if not mime:
        print("Use JPG, PNG, or WEBP image.")
    elif not os.getenv("OPENAI_API_KEY"):
        file_size = os.path.getsize(image_path)
        print("\nOffline Image Information:\n")
        print(f"File: {os.path.basename(image_path)}")
        print(f"Format: {mime}")
        print(f"Size: {file_size} bytes")

        if mime == "image/png":
            with open(image_path, "rb") as f:
                header = f.read(24)
            if len(header) >= 24 and header[:8] == b"\x89PNG\r\n\x1a\n":
                width, height = struct.unpack(">II", header[16:24])
                print(f"Dimensions: {width} x {height}")

        print("Image explanation unavailable offline; set OPENAI_API_KEY for AI analysis.")
    else:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.responses.create(
                model="gpt-5.5",
                input=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Explain this image in simple English."
                        },
                        {
                            "type": "input_image",
                            "image_url": (
                                f"data:{mime};base64,{image_data}"
                            )
                        }
                    ]
                }]
            )
            print("\nImage Explanation:\n")
            print(response.output_text)

        except Exception as e:
            print("Error:", e)
            