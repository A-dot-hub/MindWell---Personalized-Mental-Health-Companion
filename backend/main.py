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

from db import users_collection, sessions_collection, messages_collection, journals_collection, moods_collection, tasks_collection, meditation_collection, sleep_collection, community_collection, goals_collection
from bson import ObjectId
from utils import send_otp_email
from analytic import router as analytic_router

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

app.include_router(analytic_router)

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
@app.get("/chat-history/{session_id}")
async def get_chat_history(session_id: str):
    messages = list(messages_collection.find({"session_id": session_id}).sort("timestamp", 1))
    for m in messages:
        m["_id"] = str(m["_id"])
    return {"success": True, "history": messages}

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
    user_msg_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "sender": "user",
        "text": user_text,
        "sentiment": sentiment_label,
        "timestamp": datetime.utcnow()
    }
    messages_collection.insert_one(user_msg_doc)

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
        bot_msg_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "sender": "bot",
            "text": final_reply,
            "timestamp": datetime.utcnow()
        }
        messages_collection.insert_one(bot_msg_doc)

        return {
            "reply": final_reply,
            "sentiment": sentiment_label,
            "user_message": {
                "text": user_text,
                "sender": "user",
                "sentiment": sentiment_label,
                "session_id": session_id,
                "user_id": user_id
            },
            "bot_message": {
                "text": final_reply,
                "sender": "bot",
                "session_id": session_id,
                "user_id": user_id
            }
        }

    except Exception as e:
        print("❌ Chat error:", e)
        error_reply = "I am having trouble right now 💙"
        
        # ================= STORE BOT ERROR =================
        bot_error_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "sender": "bot",
            "text": error_reply,
            "timestamp": datetime.utcnow()
        }
        messages_collection.insert_one(bot_error_doc)
        
        return {
            "reply": error_reply,
            "sentiment": sentiment_label,
            "user_message": {
                "text": user_text,
                "sender": "user",
                "sentiment": sentiment_label,
                "session_id": session_id,
                "user_id": user_id
            },
            "bot_message": {
                "text": error_reply,
                "sender": "bot",
                "session_id": session_id,
                "user_id": user_id
            }
        }

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

    # Generate a simple insight message based on overall mood
    insight_message = "You've had a balanced session today. Keep up the good work!"
    if overall == "POSITIVE":
        insight_message = "Your session reflects a lot of positivity! It's great to see you feeling well."
    elif overall == "NEGATIVE":
        insight_message = "It seems you've been dealing with some difficult emotions. Remember to be kind to yourself and take things one step at a time."

    return {
        "total_messages": total,
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "overall_mood": overall,
        "sentiment_summary": {
            "Positive": positive,
            "Negative": negative,
            "Neutral": neutral
        },
        "insight_message": insight_message
    }

# ================= JOURNAL =================
@app.post("/journal")
async def create_journal(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    mood = data.get("mood")
    content = data.get("content")

    if not user_id or not content:
        return {"success": False, "message": "Missing fields"}

    journal = {
        "user_id": user_id,
        "mood": mood,
        "content": content,
        "created_at": datetime.utcnow()
    }
    result = journals_collection.insert_one(journal)
    return {"success": True, "journal_id": str(result.inserted_id)}

@app.get("/journals/{user_id}")
async def get_journals(user_id: str):
    journals = list(journals_collection.find({"user_id": user_id}).sort("created_at", -1))
    for j in journals:
        j["_id"] = str(j["_id"])
    return {"success": True, "journals": journals}

# ================= MOOD TRACKER =================
@app.post("/mood")
async def create_mood(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    mood = data.get("mood")
    intensity = data.get("intensity")
    energy = data.get("energy")
    tags = data.get("tags", [])

    if not user_id or not mood:
        return {"success": False, "message": "Missing fields"}

    mood_entry = {
        "user_id": user_id,
        "mood": mood,
        "intensity": intensity,
        "energy": energy,
        "tags": tags,
        "created_at": datetime.utcnow()
    }
    result = moods_collection.insert_one(mood_entry)
    return {"success": True, "mood_id": str(result.inserted_id)}

@app.get("/moods/{user_id}")
async def get_moods(user_id: str):
    moods = list(moods_collection.find({"user_id": user_id}).sort("created_at", -1))
    for m in moods:
        m["_id"] = str(m["_id"])
    return {"success": True, "moods": moods}

# ================= ROUTINE / TASKS =================
@app.post("/tasks")
async def create_task(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    title = data.get("title")
    category = data.get("category")

    if not user_id or not title:
        return {"success": False, "message": "Missing fields"}

    task = {
        "user_id": user_id,
        "title": title,
        "category": category,
        "completed": False,
        "created_at": datetime.utcnow()
    }
    result = tasks_collection.insert_one(task)
    return {"success": True, "task_id": str(result.inserted_id)}

@app.get("/tasks/{user_id}")
async def get_tasks(user_id: str):
    tasks = list(tasks_collection.find({"user_id": user_id}).sort("created_at", -1))
    for t in tasks:
        t["_id"] = str(t["_id"])
    return {"success": True, "tasks": tasks}

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, request: Request):
    data = await request.json()
    completed = data.get("completed")

    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": completed}}
    )
    return {"success": True}

@app.put("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    result = tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": True}}
    )

    if result.modified_count == 1:
        return {"success": True}
    return {"success": False}

# ================= MEDITATION =================
@app.post("/meditation")
async def record_meditation(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    
    if not user_id:
        return {"success": False, "message": "Missing user_id"}

    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Check if already recorded today
    existing = meditation_collection.find_one({"user_id": user_id, "date": today})
    if not existing:
        meditation_collection.insert_one({
            "user_id": user_id,
            "date": today,
            "completed": True,
            "created_at": datetime.utcnow()
        })
    return {"success": True}

@app.get("/meditation/{user_id}")
async def get_meditation(user_id: str):
    sessions = list(meditation_collection.find({"user_id": user_id}).sort("date", 1))
    
    total_sessions = len(sessions)
    current_streak = 0
    longest_streak = 0
    
    if total_sessions > 0:
        # Calculate streaks
        dates = sorted(list(set([s["date"] for s in sessions])))
        streak = 1
        longest = 1
        for i in range(1, len(dates)):
            d1 = datetime.strptime(dates[i-1], "%Y-%m-%d")
            d2 = datetime.strptime(dates[i], "%Y-%m-%d")
            if (d2 - d1).days == 1:
                streak += 1
                longest = max(longest, streak)
            else:
                streak = 1
        
        # Check if current streak is active (today or yesterday)
        last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
        today = datetime.utcnow()
        if (today - last_date).days <= 1:
            current_streak = streak
        else:
            current_streak = 0
        longest_streak = longest

    # Determine suggested session based on recent mood
    suggested_session = "focus meditation" # Default
    recent_mood = moods_collection.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    
    if recent_mood:
        mood_val = recent_mood.get("mood", "").lower()
        if mood_val in ["sad", "anxious", "stressed", "angry", "overwhelmed", "negative"]:
            suggested_session = "breathing / calming"
        elif mood_val in ["happy", "excited", "grateful", "positive"]:
            suggested_session = "gratitude meditation"
        else:
            suggested_session = "focus meditation"

    return {
        "success": True,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_sessions": total_sessions,
        "suggested_session": suggested_session
    }

# ================= SLEEP HEALTH =================
@app.post("/sleep")
async def record_sleep(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    bed_time = data.get("bed_time")
    wake_time = data.get("wake_time")
    quality = data.get("quality")

    if not user_id or not bed_time or not wake_time:
        return {"success": False, "message": "Missing fields"}

    sleep_record = {
        "user_id": user_id,
        "bed_time": bed_time,
        "wake_time": wake_time,
        "quality": quality,
        "created_at": datetime.utcnow()
    }
    result = sleep_collection.insert_one(sleep_record)
    return {"success": True, "sleep_id": str(result.inserted_id)}

@app.get("/sleep/{user_id}")
async def get_sleep(user_id: str):
    records = list(sleep_collection.find({"user_id": user_id}).sort("created_at", -1))
    for r in records:
        r["_id"] = str(r["_id"])
    return {"success": True, "sleep_records": records}

# ================= COMMUNITY =================
@app.post("/community/posts")
async def create_post(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    content = data.get("content")

    if not user_id or not content:
        return {"success": False, "message": "Missing fields"}

    post = {
        "user_id": user_id,
        "content": content,
        "likes": [],
        "created_at": datetime.utcnow()
    }
    result = community_collection.insert_one(post)
    return {"success": True, "post_id": str(result.inserted_id)}

@app.get("/community/posts")
async def get_posts():
    posts = list(community_collection.find().sort("created_at", -1).limit(50))
    for p in posts:
        p["_id"] = str(p["_id"])
    return {"success": True, "posts": posts}

@app.post("/community/posts/{post_id}/like")
async def like_post(post_id: str, request: Request):
    data = await request.json()
    user_id = data.get("user_id")

    if not user_id:
        return {"success": False, "message": "Missing user_id"}

    post = community_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        return {"success": False, "message": "Post not found"}

    if user_id in post.get("likes", []):
        # Unlike
        community_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"likes": user_id}}
        )
    else:
        # Like
        community_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$addToSet": {"likes": user_id}}
        )

    return {"success": True}

# ================= GOALS =================
@app.post("/goals")
async def create_goal(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    title = data.get("title")
    category = data.get("category")

    if not user_id or not title:
        return {"success": False, "message": "Missing fields"}

    goal = {
        "user_id": user_id,
        "title": title,
        "category": category,
        "completed": False,
        "created_at": datetime.utcnow()
    }
    result = goals_collection.insert_one(goal)
    return {"success": True, "goal_id": str(result.inserted_id)}

@app.get("/goals/{user_id}")
async def get_goals(user_id: str):
    goals = list(goals_collection.find({"user_id": user_id}).sort("created_at", -1))
    for g in goals:
        g["_id"] = str(g["_id"])
    return {"success": True, "goals": goals}

@app.put("/goals/{goal_id}")
async def update_goal(goal_id: str, request: Request):
    data = await request.json()
    completed = data.get("completed")

    goals_collection.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": {"completed": completed}}
    )
    return {"success": True}

@app.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    goals_collection.delete_one({"_id": ObjectId(goal_id)})
    return {"success": True}

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