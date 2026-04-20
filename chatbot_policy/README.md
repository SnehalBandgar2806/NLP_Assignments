# ⚖️ PolicyBot — AI Policy Explainer (No API Required)

A fully offline AI chatbot that explains ANY policy, legal document, or terms & conditions.
**Zero API keys. Zero internet. Zero cost.**

---

## 🚀 Run in 3 Steps

### 1. Install Node.js
Download from: https://nodejs.org  (choose the LTS version)

### 2. Open Terminal in this folder
```
Windows: Right-click folder → "Open in Terminal"
Mac:     Right-click folder → "New Terminal at Folder"
```

### 3. Run these commands
```bash
npm install
npm start
```

✅ App opens automatically at **http://localhost:3000**

---

## 💡 Features

| Feature | Description |
|---|---|
| 🧠 Smart Summary | Full policy analysis: TL;DR, key points, risks, rights |
| ⚠️ Risk Detector | Detects 15+ types of risky clauses automatically |
| ✅ Rights Finder | Identifies all user rights in the document |
| 🔒 Privacy Analyzer | Explains data collection, sharing, storage |
| 💰 Refund Explainer | Clarifies refund, billing & cancellation terms |
| 👶 Simple Mode | Explains policies like you're 10 years old |
| 👨‍💻 Legal Mode | Detailed technical/legal breakdown |
| 💬 General Q&A | Answers any question, even without a policy |
| 🚫 No API needed | Works 100% offline — no keys, no cost |

---

## 📁 Project Structure

```
policybot/
├── public/
│   └── index.html
├── src/
│   ├── App.js       ← Main UI and chat logic
│   ├── App.css      ← All styling
│   ├── brain.js     ← AI engine (NLP + response logic)
│   └── index.js     ← React entry point
├── package.json
└── README.md
```

---

## 🏗️ Build for Production

```bash
npm run build
```
Creates a `/build` folder you can deploy to Netlify, Vercel, or any host.

---

## ❓ Troubleshooting

**`npm` not found?**
→ Install Node.js from https://nodejs.org

**Port 3000 in use?**
→ `PORT=3001 npm start`

**App not loading?**
→ Try: `npm install --legacy-peer-deps` then `npm start`
