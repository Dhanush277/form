import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY is not set.")

def generate_form_questions(topic: str, industry: str = None, audience: str = None, difficulty: str = None):
    if not GEMINI_API_KEY:
        return [{"label": "Dummy Question (API Key missing)", "field_type": "text"}]
        
    prompt = f"""
    You are an expert form creator. Generate a professional list of form questions for the following topic: "{topic}".
    {f"Industry: {industry}" if industry else ""}
    {f"Target Audience: {audience}" if audience else ""}
    {f"Difficulty Level: {difficulty}" if difficulty else ""}
    
    Return the response ONLY as a JSON array of objects. Each object must have:
    - "label": The question text
    - "field_type": One of [text, email, number, textarea, radio, checkbox, dropdown, date, rating]
    - "options": (Optional) A comma-separated string of options if field_type is radio, checkbox, or dropdown.
    - "required": Boolean (true/false)
    
    Do not wrap the JSON in markdown blocks (like ```json). Just return the raw JSON array.
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"GenAI Error: {e}")
        return [{"label": "Error generating questions", "field_type": "text"}]
