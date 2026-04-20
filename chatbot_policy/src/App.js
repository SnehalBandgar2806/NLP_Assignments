import { useState, useRef, useEffect } from "react";
import { generateResponse } from "./brain";
import "./App.css";

const QUICK = [
  { icon: "🧠", label: "Summarize",     text: "Summarize this policy" },
  { icon: "⚠️", label: "Detect Risks",  text: "Detect all risks in this policy" },
  { icon: "✅", label: "My Rights",     text: "What are my rights?" },
  { icon: "🔒", label: "Privacy",       text: "How is my data used and shared?" },
  { icon: "💰", label: "Refund",        text: "What is the refund policy?" },
  { icon: "🚫", label: "Cancel",        text: "How do I cancel my subscription?" },
  { icon: "👶", label: "Simplify",      text: "Explain this in simple words" },
  { icon: "👨‍💻", label: "Legal Detail",  text: "Give me a detailed legal analysis" },
  { icon: "🍪", label: "Cookies",       text: "What cookies and tracking are used?" },
  { icon: "💳", label: "Billing",       text: "Explain the billing and payment terms" },
];

const SAMPLE = `Terms of Service — Last Updated January 2024

By creating an account or using our services, you agree to these Terms. Please read them carefully.

1. DATA COLLECTION & PRIVACY
We collect personal information including your name, email address, location data, and browsing behavior. We use this information to provide and improve our services. We may share your personal data with affiliated partners and third-party advertisers for targeted marketing purposes. We may transfer your data internationally.

2. AUTO-RENEWAL & BILLING
Your subscription will automatically renew at the end of each billing cycle unless you cancel at least 7 days before the renewal date. We reserve the right to change pricing with 30 days notice. Payments are non-refundable except where required by law.

3. ACCOUNT TERMINATION
We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason including violation of these terms. Upon termination, your data may be deleted.

4. LIMITATION OF LIABILITY
We are not liable for any indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the last 3 months. We are not responsible for data breaches caused by third parties.

5. DISPUTE RESOLUTION
Any disputes shall be resolved through binding arbitration, waiving your right to a jury trial or class-action lawsuit. Disputes must be filed within 1 year.

6. CHANGES TO TERMS
We may modify these terms at any time without prior notice. Continued use of the service constitutes acceptance of the modified terms.

7. COOKIES & TRACKING
We use cookies, pixel tracking, and analytics tools to monitor your activity on our platform and across third-party websites for advertising purposes.`;

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHTML(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?)(?=<h|<p|$)/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hpuol])(.+)$/gm, (m) => (m.trim() ? `<p>${m}</p>` : ""));
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`row ${isUser ? "urow" : "brow"}`}>
      <div className={`av ${isUser ? "uav" : "bav"}`}>{isUser ? "👤" : "⚖️"}</div>
      <div className={`bbl ${isUser ? "ubbl" : "bbbl"}`}>
        {isUser
          ? <p>{msg.content}</p>
          : <div dangerouslySetInnerHTML={{ __html: formatHTML(msg.content) }} />}
        <span className="ts">{msg.time}</span>
      </div>
    </div>
  );
}

function Dots() {
  return <div className="dots"><span /><span /><span /></div>;
}

export default function App() {
  const [msgs, setMsgs]         = useState([{
    role: "assistant",
    time: now(),
    content:
      "👋 **Welcome to PolicyBot!**\n\n" +
      "I help you understand any policy, legal document, or terms & conditions — **completely offline, no API needed!**\n\n" +
      "**What I can do:**\n" +
      "- 🧠 Summarize any policy\n" +
      "- ⚠️ Detect hidden risks & tricky clauses\n" +
      "- ✅ List your rights\n" +
      "- 🔒 Explain data & privacy terms\n" +
      "- 💰 Explain refunds, billing & cancellation\n" +
      "- 💬 Answer ANY question you have\n\n" +
      "**Get started:**\n" +
      "1️⃣ Click **📄 Policy Input** tab → paste any document\n" +
      "2️⃣ Or click **✨ Load Sample** to try with an example\n" +
      "3️⃣ Ask me anything using the buttons or text box!"
  }]);
  const [input, setInput]       = useState("");
  const [policy, setPolicy]     = useState("");
  const [tab, setTab]           = useState("chat");
  const [typing, setTyping]     = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    const userMsg = { role: "user", content: q, time: now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate thinking delay (300-700ms) for realism
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      const answer = generateResponse(q, policy);
      setMsgs(prev => [...prev, { role: "assistant", content: answer, time: now() }]);
      setTyping(false);
      inputRef.current?.focus();
    }, delay);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function loadSample() {
    setPolicy(SAMPLE);
    setTab("chat");
    setTimeout(() => send("Summarize this policy"), 100);
  }

  function clearChat() {
    setMsgs([{
      role: "assistant", time: now(),
      content: "🔄 Chat cleared! Ask me anything or paste a new policy."
    }]);
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="hdr">
        <div className="logo">⚖️</div>
        <div className="hinfo">
          <h1>PolicyBot</h1>
          <p>AI Policy Explainer · 100% Offline · No API Required</p>
        </div>
        <div className="online"><span className="dot" />Ready</div>
      </header>

      {/* TABS */}
      <nav className="tabs">
        {[["chat","💬 Chat"],["policy","📄 Policy Input"],["about","ℹ️ About"]].map(([id,label]) => (
          <button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </nav>

      {/* POLICY INPUT */}
      {tab === "policy" && (
        <div className="panel">
          <label className="lbl">📋 Paste Your Policy / Legal Document</label>
          <textarea
            className="ptxt"
            rows={9}
            placeholder="Paste any Terms & Conditions, Privacy Policy, Employment Contract, College Rules, Rental Agreement, Company Policy…"
            value={policy}
            onChange={e => setPolicy(e.target.value)}
          />
          <div className="prow">
            <button className="pbtn accent" onClick={loadSample}>✨ Load Sample Policy</button>
            {policy && <>
              <span className="pcount">📄 {policy.trim().split(/\s+/).length} words loaded</span>
              <button className="pbtn danger" onClick={() => setPolicy("")}>🗑️ Clear</button>
              <button className="pbtn green" onClick={() => { setTab("chat"); setTimeout(() => send("Summarize this policy"), 100); }}>
                🚀 Analyze Now
              </button>
            </>}
          </div>
          {policy && (
            <div className="pinfo">
              ✅ Policy loaded! Switch to <strong>💬 Chat</strong> tab and ask anything about it.
            </div>
          )}
        </div>
      )}

      {/* ABOUT */}
      {tab === "about" && (
        <div className="panel about">
          <h2>⚖️ About PolicyBot</h2>
          <p>PolicyBot is a <strong>100% offline</strong> AI-powered chatbot that helps you understand complex legal and policy documents — no internet, no API key, no cost.</p>

          <h3>🔧 How It Works</h3>
          <p>It uses intelligent keyword detection, pattern matching, and a built-in knowledge base to analyze policy text and answer questions about legal terms, privacy, refunds, risks, and more.</p>

          <h3>✨ Features</h3>
          <ul>
            <li>📄 Policy Simplifier — converts legal jargon to plain English</li>
            <li>⚠️ Risk Detector — finds 15+ types of risky clauses</li>
            <li>🧠 Smart Summary — TL;DR + Key Points + Risks + Rights</li>
            <li>✅ Rights Finder — identifies your user rights</li>
            <li>🌍 Multi-Level — Simple / Normal / Legal explanations</li>
            <li>💬 General Q&A — answers questions even without a policy</li>
          </ul>

          <h3>🛠️ Tech Stack</h3>
          <ul>
            <li>⚛️ React 18 (frontend)</li>
            <li>🧠 Custom NLP engine (brain.js)</li>
            <li>🎨 Pure CSS (no UI libraries)</li>
            <li>🚫 Zero external API calls</li>
          </ul>

          <h3>🚀 Run Locally</h3>
          <code>npm install && npm start</code>

          <h3>📦 Build for Production</h3>
          <code>npm run build</code>
        </div>
      )}

      {/* CHAT */}
      {tab === "chat" && (
        <>
          {/* Quick chips */}
          <div className="qbar">
            {QUICK.map((q, i) => (
              <button key={i} className="qchip" onClick={() => send(q.text)}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>

          {/* Policy status */}
          {policy && (
            <div className="pstatus">
              📄 Policy loaded ({policy.trim().split(/\s+/).length} words) — Ask me anything about it!
              <button className="clrbtn" onClick={() => setPolicy("")}>✕ clear</button>
            </div>
          )}

          {/* Messages */}
          <div className="msgs">
            {msgs.map((m, i) => <Bubble key={i} msg={m} />)}
            {typing && (
              <div className="row brow">
                <div className="av bav">⚖️</div>
                <div className="bbl bbbl"><Dots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="ibar">
            <div className="iwrap">
              <textarea
                ref={inputRef}
                rows={1}
                className="cinput"
                placeholder={policy ? "Ask anything about the loaded policy…" : "Ask any question — policy, legal terms, your rights…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
            </div>
            <button className="sbtn" onClick={() => send()} disabled={typing || !input.trim()}>➤</button>
            <button className="clr2" onClick={clearChat} title="Clear chat">🗑️</button>
          </div>
          <p className="hint">Enter to send · Shift+Enter for new line · Works 100% offline</p>
        </>
      )}
    </div>
  );
}
