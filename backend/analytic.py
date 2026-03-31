from fastapi import APIRouter
from datetime import datetime, timedelta
import requests
from db import (
    messages_collection,
    sleep_collection,
    meditation_collection,
    tasks_collection,
    goals_collection,
    journals_collection
)

router = APIRouter()

OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions"

@router.get("/insights/{user_id}")
async def get_insights(user_id: str):
    # 1. Sentiment-Based Analytics
    messages = list(messages_collection.find({"user_id": user_id}).sort("timestamp", 1))
    
    positive_count = 0
    negative_count = 0
    neutral_count = 0
    
    # For stress streak
    current_streak = 0
    max_streak = 0
    
    # For mood trend (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_moods = {}
    
    for msg in messages:
        sentiment = msg.get("sentiment", "NEUTRAL")
        if sentiment == "POSITIVE":
            positive_count += 1
            current_streak = 0
        elif sentiment == "NEGATIVE":
            negative_count += 1
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            neutral_count += 1
            current_streak = 0
            
        timestamp = msg.get("timestamp")
        if timestamp and timestamp >= seven_days_ago:
            date_str = timestamp.strftime("%Y-%m-%d")
            if date_str not in daily_moods:
                daily_moods[date_str] = {"sum": 0, "count": 0}
            
            score = 1 if sentiment == "POSITIVE" else (-1 if sentiment == "NEGATIVE" else 0)
            daily_moods[date_str]["sum"] += score
            daily_moods[date_str]["count"] += 1

    total_messages = positive_count + negative_count + neutral_count
    mood_score = 50
    if total_messages > 0:
        mood_score = int(((positive_count - negative_count) / total_messages + 1) * 50)
        
    pos_pct = int((positive_count / total_messages) * 100) if total_messages > 0 else 0
    neg_pct = int((negative_count / total_messages) * 100) if total_messages > 0 else 0
    neu_pct = int((neutral_count / total_messages) * 100) if total_messages > 0 else 0

    mood_trend = []
    for i in range(7):
        d = (datetime.utcnow() - timedelta(days=6-i)).strftime("%Y-%m-%d")
        if d in daily_moods:
            avg = daily_moods[d]["sum"] / daily_moods[d]["count"]
            daily_score = int((avg + 1) * 50)
        else:
            daily_score = 50 # Default neutral
        mood_trend.append({"date": d, "score": daily_score})

    # 2. Sleep Analytics
    sleep_records = list(sleep_collection.find({"user_id": user_id}))
    total_sleep_hours = 0
    low_sleep_days = 0
    
    for record in sleep_records:
        bed = record.get("bed_time")
        wake = record.get("wake_time")
        if bed and wake:
            try:
                b_h, b_m = map(int, bed.split(":"))
                w_h, w_m = map(int, wake.split(":"))
                
                b_mins = b_h * 60 + b_m
                w_mins = w_h * 60 + w_m
                
                if w_mins < b_mins:
                    w_mins += 24 * 60
                
                duration_hrs = (w_mins - b_mins) / 60.0
                total_sleep_hours += duration_hrs
                if duration_hrs < 6:
                    low_sleep_days += 1
            except Exception:
                pass
                
    sleep_avg = round(total_sleep_hours / len(sleep_records), 1) if sleep_records else 0

    # 3. Meditation Analytics
    meditation_sessions = list(meditation_collection.find({"user_id": user_id}).sort("date", 1))
    total_med_sessions = len(meditation_sessions)
    med_streak = 0
    if total_med_sessions > 0:
        dates = sorted(list(set([s["date"] for s in meditation_sessions])))
        streak = 1
        for i in range(1, len(dates)):
            d1 = datetime.strptime(dates[i-1], "%Y-%m-%d")
            d2 = datetime.strptime(dates[i], "%Y-%m-%d")
            if (d2 - d1).days == 1:
                streak += 1
            else:
                streak = 1
        
        last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
        today = datetime.utcnow()
        if (today - last_date).days <= 1:
            med_streak = streak

    # 4. Productivity Analytics
    tasks = list(tasks_collection.find({"user_id": user_id}))
    goals = list(goals_collection.find({"user_id": user_id}))
    
    total_tasks = len(tasks)
    # completed_tasks = sum(1 for t in tasks if t.get("completed"))
    completed_tasks = sum(1 for t in tasks if t.get("completed") is True)
    task_rate = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    
    total_goals = len(goals)
    completed_goals = sum(1 for g in goals if g.get("completed"))
    goal_rate = int((completed_goals / total_goals) * 100) if total_goals > 0 else 0

    total_items = total_tasks + total_goals
    completed_items = completed_tasks + completed_goals

    overall_productivity = int((completed_items / total_items) * 100) if total_items > 0 else 0

    # 5. Journal Insights
    journals = list(journals_collection.find({"user_id": user_id}))
    total_journals = len(journals)

    # 6. AI Insights (Hybrid System)
    insights = []
    suggestions = []
    
    prompt = f"""You are a mental wellness analytics assistant.

User Data:
* Mood Score: {mood_score}
* Positive: {pos_pct}%
* Negative: {neg_pct}%
* Stress Streak: {max_streak}
* Sleep Avg: {sleep_avg}
* Meditation Sessions: {total_med_sessions}
* Task Completion: {task_rate}

Generate:
1. 3 insights
2. 3 suggestions

Keep it short, supportive, and structured. Return exactly 3 insights starting with '-' and 3 suggestions starting with '-' under headings 'Insights:' and 'Suggestions:'."""

    try:
        payload = {
            "model": "llama3:8b",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        res = requests.post(OLLAMA_URL, json=payload, timeout=5)
        res.raise_for_status()
        reply = res.json()["choices"][0]["message"]["content"]
        
        current_section = None
        for line in reply.split("\n"):
            line = line.strip()
            if "Insights:" in line or "insights:" in line.lower():
                current_section = "insights"
                continue
            elif "Suggestions:" in line or "suggestions:" in line.lower():
                current_section = "suggestions"
                continue
                
            if line.startswith("-") or line.startswith("*") or (len(line) > 2 and line[0].isdigit() and line[1] in ".)"):
                clean_line = line.lstrip("-*0123456789.) ").strip()
                if clean_line:
                    if current_section == "insights":
                        insights.append(clean_line)
                    elif current_section == "suggestions":
                        suggestions.append(clean_line)
                        
    except Exception as e:
        print("Ollama failed for insights, using rule-based fallback:", e)
        if neg_pct > pos_pct:
            insights.append("You seem more stressed recently.")
            suggestions.append("Try taking short breaks to breathe and reset.")
        else:
            insights.append("Your mood has been generally positive.")
            suggestions.append("Keep up the good habits that are working for you.")
            
        if sleep_avg > 0 and sleep_avg < 6:
            insights.append("Low sleep may be affecting your mood.")
            suggestions.append("Aim for at least 7 hours of sleep tonight.")
            
        if total_med_sessions > 3:
            insights.append("Meditation is helping your consistency.")
            suggestions.append("Try to maintain your meditation streak.")
            
        if max_streak >= 3:
            insights.append("You had multiple stress moments recently.")
            suggestions.append("Consider journaling to process your thoughts.")
            
        if not insights:
            insights.append("You are building a baseline of data.")
        if not suggestions:
            suggestions.append("Keep logging your daily activities to get more insights.")

    if not insights:
        insights = ["You are building a baseline of data."]
    if not suggestions:
        suggestions = ["Keep logging your daily activities to get more insights."]

    return {
        "mood_score": mood_score,
        "sentiment": {
            "positive": pos_pct,
            "negative": neg_pct,
            "neutral": neu_pct
        },
        "stress_streak": max_streak,
        "sleep": {
            "average": sleep_avg,
            "low_sleep_days": low_sleep_days
        },
        "meditation": {
            "total_sessions": total_med_sessions,
            "streak": med_streak
        },
        "productivity": {
            "task_completion_rate": task_rate,
            "goal_completion_rate": goal_rate,
            "overall_productivity": overall_productivity,
            "total_tasks": total_tasks,
            "total_goals": total_goals,
            "completed_tasks": completed_tasks,
            "completed_goals": completed_goals
        },
        "journals": {
            "total_entries": total_journals
        },
        "mood_trend": mood_trend,
        "insights": insights[:3],
        "suggestions": suggestions[:3]
    }
