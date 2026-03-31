import React, { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiUser,
  FiMic,
  FiMicOff,
  FiGlobe,
  FiCheck,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mediverseLogo from "../mediverseLogo.png";
import "./Chat.css";

// const mediverseLogo = "https://picsum.photos/seed/mindwell-logo/200/200";

function Chat({ userId, sessionId }) {
  const [messages, setMessages] = useState([
    {
      text: "Hello, I am **MindWell AI** 💙\n\nI'm here to listen and support you. How are you feeling right now?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);

  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const langMenuRef = useRef(null);
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);

  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "hi-IN", name: "Hindi" },
    { code: "mr-IN", name: "Marathi" },
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId || !sessionId) return;
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/chat-history/${sessionId}`,
        );
        const data = await res.json();

        const defaultMessage = {
          text: "Hello, I am **MindWell AI** 💙\n\nI'm here to listen and support you. How are you feeling right now?",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        if (data.success && data.history.length > 0) {
          const formattedHistory = data.history.map((msg) => ({
            text: msg.text,
            sender: msg.sender,
            sentiment: msg.sentiment,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setMessages([defaultMessage, ...formattedHistory]);
        } else {
          setMessages([defaultMessage]);
        }
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };
    fetchHistory();
  }, [userId, sessionId]);

  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTo({
        top: messagesAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMicClick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((p) => p + (p ? " " : "") + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakText = (text) => {
    if (!window.speechSynthesis || !isTTSActive) return;

    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`]/g, "");
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = language;

    const voice =
      voicesRef.current.find((v) => v.lang === language) ||
      voicesRef.current.find((v) => v.lang.startsWith(language.split("-")[0]));

    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage.text,
          language,
          user_id: userId,
          session_id: sessionId,
        }),
      });

      const data = await res.json();
      const fullReply =
        data.bot_message?.text ||
        data.reply ||
        data.response ||
        "I am listening 💙";
      const sentiment = data.sentiment;

      const botTimestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Update user message with sentiment
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1].sentiment = sentiment;
        return copy;
      });

      setMessages((prev) => [
        ...prev,
        { text: "", sender: "bot", timestamp: botTimestamp },
      ]);

      setIsLoading(false);

      const words = fullReply.split(" ");
      let i = 0;
      let current = "";

      const interval = setInterval(() => {
        current += (i === 0 ? "" : " ") + words[i];

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1].text = current;
          return copy;
        });

        i++;
        if (i >= words.length) {
          clearInterval(interval);
          speakText(fullReply);
        }
      }, 40);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          text: "I'm here 💙 but something went wrong.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleTTS = () => {
    setIsTTSActive((p) => !p);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="chat-container">
      <div className="chat-header-display">
        <div className="bot-status-indicator">
          <div className="status-dot"></div>
          <span>MindWell AI • Online</span>
        </div>

        <div className="header-right" ref={langMenuRef}>
          <button className="icon-btn" onClick={toggleTTS}>
            {isTTSActive ? <FiVolume2 /> : <FiVolumeX />}
          </button>

          <button
            className="lang-toggle-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            <FiGlobe />
            {language.split("-")[0].toUpperCase()}
          </button>

          {showLangMenu && (
            <div className="lang-dropdown">
              {languages.map((l) => (
                <button
                  key={l.code}
                  className={`lang-option ${
                    language === l.code ? "active" : ""
                  }`}
                  onClick={() => {
                    setLanguage(l.code);
                    setShowLangMenu(false);
                  }}
                >
                  {l.name}
                  {language === l.code && <FiCheck />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="messages-area" ref={messagesAreaRef}>
        {messages.map((m, i) => (
          <div key={i} className={`message-wrapper ${m.sender}`}>
            <div className={`avatar-frame ${m.sender}`}>
              {m.sender === "bot" ? (
                <img src={mediverseLogo} alt="AI" />
              ) : (
                <FiUser />
              )}
            </div>

            <div className="message-bubble">
              {m.sender === "bot" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.text}
                </ReactMarkdown>
              ) : (
                <div>
                  <p>{m.text}</p>
                </div>
              )}
              <span className="timestamp">{m.timestamp}</span>
            </div>
          </div>
        ))}

        {/* ✅ ADD THIS TYPING INDICATOR */}
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="avatar-frame bot">
              <img src={mediverseLogo} alt="AI" />
            </div>

            <div className="message-bubble typing-bubble">
              <span className="typing-text">Thinking</span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div
          className={`input-container ${isListening ? "listening-active" : ""}`}
        >
          <button
            className={`mic-btn ${isListening ? "is-listening" : ""}`}
            onClick={handleMicClick}
          >
            {isListening ? <FiMicOff /> : <FiMic />}
          </button>

          <textarea
            ref={inputRef}
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your feelings here...!!"
          />

          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
