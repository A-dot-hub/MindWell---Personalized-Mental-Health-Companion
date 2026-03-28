from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import threading
import time
import secrets
from datetime import datetime

from passlib.context import CryptContext
from deep_translator import GoogleTranslator
from transformers import pipeline

from db import users_collection, sessions_collection, messages_collection
from utils import send_otp_email

app = FastAPI()

# ================= SECURITY =================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
otp_store = {}

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= AI CONFIG =================
MODEL_NAME = "llama3:8b"
OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions"

# 🔥 SAME SYSTEM PROMPT (UNCHANGED)
SYSTEM_PROMPT = """
You are an empathetic, calm, emotionally supportive mental health companion.

IMPORTANT RESPONSE FORMAT RULES:
- Always respond in VALID MARKDOWN
- Use bullet points or numbered lists
- Use **bold** for headings
- Add blank lines between paragraphs
- Keep responses structured and easy to read

Behavior rules:
- Acknowledge emotions first
- No judgment
- No medical advice
- Ask ONE gentle follow-up question
- Keep replies short (2–8 sentences)
"""

# ================= LANGUAGE =================
LANG_CODE_MAP = {
    "en-US": "en",
    "hi-IN": "hi",
    "mr-IN": "mr",
}

# ================= SENTIMENT =================
print("🔥 Loading Sentiment Model...")
# sentiment_pipeline = pipeline("sentiment-analysis")

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    local_files_only=True   # 🔥 THIS LINE FIXES YOUR ISSUE
)

print("✅ Sentiment Model Loaded!")

# ================= MODEL WARMUP =================
def warm_up_model():
    try:
        requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": "Hello"}
                ],
            },
            timeout=30
        )
        print("✅ LLaMA warmed up")
    except Exception as e:
        print("⚠️ Warmup failed:", e)

threading.Thread(target=warm_up_model, daemon=True).start()

# ================= LOGIN (AUTO SESSION CREATE) =================
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")

    user = users_collection.find_one({"username": username})

    if not user or not pwd_context.verify(password, user["password"]):
        return {"success": False}

    # 🔥 CREATE SESSION AUTOMATICALLY
    session = {
        "user_id": username,
        "created_at": datetime.utcnow()
    }

    result = sessions_collection.insert_one(session)

    return {
        "success": True,
        "user_id": username,
        "session_id": str(result.inserted_id)
    }

# ================= CHAT =================
@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()

    user_text = data.get("text", "").strip()
    language_code = data.get("language", "en-US")
    session_id = data.get("session_id")
    user_id = data.get("user_id")

    source_lang = LANG_CODE_MAP.get(language_code, "en")

    if not user_text:
        return {"reply": "I’m here with you 💙 Take your time."}

    # ================= TRANSLATE =================
    user_text_en = user_text
    if source_lang != "en":
        user_text_en = GoogleTranslator(
            source=source_lang, target="en"
        ).translate(user_text)

    # ================= SENTIMENT =================
    sentiment_result = sentiment_pipeline(user_text_en)[0]
    sentiment_label = sentiment_result["label"]

    # ================= STORE USER =================
    messages_collection.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "sender": "user",
        "text": user_text,
        "sentiment": sentiment_label,
        "timestamp": datetime.utcnow()
    })

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text_en},
        ],
        "temperature": 0.8,
        "top_p": 0.9,
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()

        result = response.json()
        bot_reply_en = result["choices"][0]["message"]["content"]

        # ================= TRANSLATE BACK =================
        final_reply = bot_reply_en
        if source_lang != "en":
            final_reply = GoogleTranslator(
                source="en", target=source_lang
            ).translate(bot_reply_en)

        # ================= STORE BOT =================
        messages_collection.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "sender": "bot",
            "text": final_reply,
            "timestamp": datetime.utcnow()
        })

        return {
            "reply": final_reply,
            "sentiment": sentiment_label
        }

    except Exception as e:
        print("❌ Chat error:", e)
        return {"reply": "I’m having a little trouble right now 💙"}

# ================= REPORT API =================
@app.get("/session-report/{session_id}")
async def generate_report(session_id: str):

    messages = list(messages_collection.find({"session_id": session_id}))

    positive = 0
    negative = 0
    neutral = 0

    for msg in messages:
        sentiment = msg.get("sentiment")

        if sentiment == "POSITIVE":
            positive += 1
        elif sentiment == "NEGATIVE":
            negative += 1
        else:
            neutral += 1

    total = positive + negative + neutral

    if total == 0:
        return {"message": "No data available"}

    overall = "NEUTRAL"
    if negative > positive:
        overall = "NEGATIVE"
    elif positive > negative:
        overall = "POSITIVE"

    return {
        "total_messages": total,
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "overall_mood": overall
    }

# ================= AUTH =================
@app.post("/signup")
async def signup(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")

    if users_collection.find_one({"username": username}):
        return {"success": False}

    users_collection.insert_one({
        "username": username,
        "password": pwd_context.hash(password),
    })

    return {"success": True}

# ================= OTP =================
@app.post("/send-otp")
async def send_otp(request: Request):
    data = await request.json()
    email = data.get("email")

    otp = str(secrets.randbelow(1000000)).zfill(6)
    otp_store[email] = {"otp": otp, "time": time.time()}

    await send_otp_email(email, otp)
    return {"success": True}

@app.post("/verify-otp")
async def verify_otp(request: Request):
    data = await request.json()
    email = data.get("email")
    otp = data.get("otp")
    password = data.get("password")

    record = otp_store.get(email)

    if not record or record["otp"] != otp:
        return {"success": False}

    if time.time() - record["time"] > 300:
        return {"success": False}

    users_collection.insert_one({
        "username": email,
        "password": pwd_context.hash(password),
    })

    del otp_store[email]
    return {"success": True}

@app.post("/send-reset-otp")
async def send_reset_otp(request: Request):
    data = await request.json()
    email = data.get("email")

    user = users_collection.find_one({"username": email})
    if not user:
        return {"success": False, "message": "User not found"}

    otp = str(secrets.randbelow(1000000)).zfill(6)
    otp_store[email] = {"otp": otp, "time": time.time()}

    await send_otp_email(email, otp)
    return {"success": True}

@app.post("/reset-password")
async def reset_password(request: Request):
    data = await request.json()
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")

    record = otp_store.get(email)
    if not record or record["otp"] != otp:
        return {"success": False, "message": "Invalid OTP"}

    if time.time() - record["time"] > 300:
        return {"success": False, "message": "OTP expired"}

    users_collection.update_one(
        {"username": email},
        {"$set": {"password": pwd_context.hash(new_password)}}
    )

    del otp_store[email]
    return {"success": True}