# 🧠 Mental Health Chatbot  
### *Your Personalised AI Mental Wellness Companion*

---

## 📌 Abstract
Mental health challenges are increasingly prevalent in today’s fast-paced world, yet access to professional care remains limited for many.  

The **Mental Health Chatbot** is an AI-powered conversational system designed to provide **accessible, non-judgmental, and real-time emotional support**. Using Natural Language Processing (NLP), it understands user sentiment and delivers **empathetic responses, coping strategies, and wellness insights**.

---

## 💡 Overview
This project is a **full-stack AI application** that integrates:
- A responsive **React frontend**
- A robust **Python backend (Flask/FastAPI)**
- Advanced **NLP models (Transformers + Ollama)**

It creates a safe environment where users can:
- Express emotions  
- Track mood patterns  
- Receive intelligent mental health insights  

---

## 🎯 Objectives
- Provide an **empathetic AI-driven chat interface**
- Detect **user sentiment in real-time**
- Offer **coping mechanisms & recommendations**
- Enable **self-reflection through analytics**
- Ensure **privacy and secure data handling**

---

## 🚀 Key Features

### 🤖 Conversational AI
- Real-time intelligent chat using **Ollama**
- Context-aware and empathetic responses  

### 😊 Sentiment Analysis
- Emotion detection using Hugging Face model:  
  `distilbert-base-uncased-finetuned-sst-2-english`

### 📊 Insights & Analytics
- Mood trends visualization  
- Stress streak detection  
- Productivity correlation  

### 📚 Resource Hub
- Articles, guides, and mental wellness exercises  

### 🔐 Authentication & Security
- Secure login system  
- Protected user sessions and data  

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend     | React, CSS, JavaScript |
| Backend      | Python (Flask / FastAPI) |
| Database     | MongoDB |
| AI/NLP       | Transformers (Hugging Face), Ollama |
| ML Framework | PyTorch |

---

## 📂 Project Structure

```text
mental-health-chatbot/
│
├── backend/
│   ├── main.py              # Backend entry point
│   ├── analytic.py         # Mood analytics engine
│   ├── db.py             # Database schemas
│   └── utils/             # API endpoints
│
├── src/
│   ├── components/         # UI components
│   ├── App.js              # Main React app
│   └── index.css           # Styles
│
├── package.json            # Frontend dependencies
├── requirements.txt        # Backend dependencies
└── README.md


## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/mental-health-chatbot.git
cd mental-health-chatbot
2️⃣ Setup Frontend
npm install
3️⃣ Setup Backend
cd backend
python -m venv venv
Activate Virtual Environment

Windows:

venv\Scripts\activate

Linux/Mac:

source venv/bin/activate
pip install -r requirements.txt
4️⃣ Setup Services
Start MongoDB
Install & run Ollama
Add .env file:
MONGO_URI=your_mongodb_connection

▶️ Run Application
Start Backend
cd backend
uvicorn main:app --reload

Start Frontend
npm start
Access App
http://localhost:3000



🔄 System Architecture
🧩 Components
Frontend (React SPA) → UI & user interaction
Backend (Python API) → logic & processing
AI Engine → sentiment + response generation
Database (MongoDB) → data storage

🔁 Workflow
User sends a message
Backend receives request
Sentiment analysis is performed
Context passed to Ollama
AI generates response
Data stored in MongoDB
Response returned to frontend

🔀 Data Flow
User → React → API → Backend → NLP Models → Database → Response → UI
