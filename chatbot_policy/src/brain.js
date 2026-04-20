// ─────────────────────────────────────────────────────────────
//  PolicyBot Brain  –  100% offline, zero API, pure JS logic
// ─────────────────────────────────────────────────────────────

// ── RISK PATTERNS ────────────────────────────────────────────
const RISK_PATTERNS = [
  { pattern: /share.*data|data.*shar|sell.*data|data.*sell|transfer.*data/i,
    label: "🔴 Data Sharing",
    msg: "Your personal data may be shared or sold to third parties." },
  { pattern: /third.party|third party|partner|affiliate/i,
    label: "🟠 Third-Party Access",
    msg: "Third parties or partner companies can access your information." },
  { pattern: /auto.renew|automatically renew|recurring charge/i,
    label: "🔴 Auto-Renewal",
    msg: "Subscription renews automatically — you must cancel manually to avoid charges." },
  { pattern: /no refund|non.refundable|refund.*not|not.*refund/i,
    label: "🔴 No Refund Policy",
    msg: "Refunds are restricted or completely denied under this policy." },
  { pattern: /modify.*terms|change.*terms|update.*terms|terms.*change|reserve.*right/i,
    label: "🟠 Terms Can Change Anytime",
    msg: "The company can change rules at any time, sometimes without notifying you." },
  { pattern: /without notice|without prior notice|no prior notice/i,
    label: "🔴 No Notice Required",
    msg: "Changes can be made without giving you any advance warning." },
  { pattern: /terminate|suspend.*account|account.*suspend|cancel.*account/i,
    label: "🟠 Account Termination Risk",
    msg: "Your account can be suspended or terminated, possibly without reason." },
  { pattern: /not liable|no liability|disclaim.*liability|limitation of liability/i,
    label: "🟠 Liability Waiver",
    msg: "The company limits or eliminates its responsibility if something goes wrong." },
  { pattern: /arbitration|waive.*jury|jury.*waive|class action/i,
    label: "🔴 Legal Rights Waiver",
    msg: "You may be giving up your right to sue in court or join class-action lawsuits." },
  { pattern: /collect.*data|gather.*data|monitor|track|surveillance/i,
    label: "🟠 Data Collection",
    msg: "Your activity, behavior, or personal data is being collected and monitored." },
  { pattern: /cookies|tracking pixel|fingerprint/i,
    label: "🟡 Tracking Technology",
    msg: "Cookies or tracking tools are used to monitor your online behavior." },
  { pattern: /govern.*law|jurisdiction|applicable law/i,
    label: "🟡 Jurisdiction Clause",
    msg: "Legal disputes must be handled in a specific location or under specific laws." },
  { pattern: /indemnif/i,
    label: "🔴 Indemnification",
    msg: "You may be responsible for paying the company's legal costs in certain situations." },
  { pattern: /intellectual property|copyright|trademark|proprietary/i,
    label: "🟡 IP Ownership",
    msg: "Content you create may become or remain the company's intellectual property." },
  { pattern: /location|geoloc/i,
    label: "🟡 Location Tracking",
    msg: "Your physical location data may be collected and used." },
];

// ── USER RIGHTS PATTERNS ─────────────────────────────────────
const RIGHTS_PATTERNS = [
  { pattern: /opt.out|unsubscribe|withdraw consent/i,
    right: "✅ You can opt out of marketing or data use." },
  { pattern: /delete.*account|account.*delet|right to erasure/i,
    right: "✅ You have the right to delete your account and data." },
  { pattern: /access.*data|data.*access|request.*data/i,
    right: "✅ You can request a copy of your personal data." },
  { pattern: /correct.*data|update.*information|rectif/i,
    right: "✅ You can correct or update your personal information." },
  { pattern: /portab/i,
    right: "✅ You have the right to data portability (take your data elsewhere)." },
  { pattern: /complain|supervisory authority|regulator/i,
    right: "✅ You can file a complaint with a regulatory authority." },
  { pattern: /cancel.*anytime|anytime.*cancel/i,
    right: "✅ You can cancel the service at any time." },
  { pattern: /refund.*within|within.*refund|\d+.day.*refund|refund.*\d+.day/i,
    right: "✅ You may be eligible for a refund within a certain period." },
  { pattern: /free trial/i,
    right: "✅ A free trial period is available." },
  { pattern: /object.*processing|right to object/i,
    right: "✅ You can object to how your data is processed." },
];

// ── KEYWORD → TOPIC MAPPING ───────────────────────────────────
const TOPICS = {
  refund:       /refund|money back|return|reimburse/i,
  privacy:      /privacy|personal data|my data|information collect|data collect/i,
  cancel:       /cancel|termination|end.*service|stop.*service|unsubscribe/i,
  datashare:    /share.*data|data.*share|sell.*data|third.party/i,
  payment:      /pay|billing|charge|invoice|subscri|fee|price|cost/i,
  account:      /account|login|password|profile|sign.*up|register/i,
  legal:        /sue|court|lawsuit|legal|arbitration|dispute|jurisdiction/i,
  intellectual: /copyright|trademark|intellectual property|content.*own|own.*content/i,
  security:     /security|breach|hack|encrypt|protect.*data/i,
  cookies:      /cookie|track|pixel|analytics/i,
  age:          /age|minor|child|13|18|adult/i,
  contact:      /contact|support|help|email.*us|reach.*us/i,
  update:       /update.*terms|change.*terms|modify.*policy|new.*terms/i,
  liability:    /liable|liability|responsible|responsibility|damage/i,
  rights:       /my rights|user rights|what.*right|rights.*have/i,
  summary:      /summar|overview|tl;dr|tldr|brief|short|explain.*policy|what.*policy|what.*this/i,
  risk:         /risk|danger|warn|concern|careful|watch out|alert/i,
  simple:       /simple|easy|plain|layman|child|kid|basic|beginner/i,
  legal_detail: /legal|detail|technical|lawyer|law|formal|professional/i,
};

// ── EXTRACT KEY SENTENCES ────────────────────────────────────
function extractSentences(text) {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
}

function findRelevantSentences(sentences, patterns, max = 3) {
  const hits = [];
  for (const s of sentences) {
    if (patterns.some(p => p.test(s))) hits.push(s);
    if (hits.length >= max) break;
  }
  return hits;
}

// ── MAIN RESPONSE ENGINE ─────────────────────────────────────
export function generateResponse(userInput, policyText) {
  const q = userInput.toLowerCase().trim();
  const hasPol = policyText && policyText.trim().length > 30;
  const sentences = hasPol ? extractSentences(policyText) : [];

  // ── GREETINGS ──
  if (/^(hi|hello|hey|yo|sup|hola|namaste|howdy)[\s!]*$/.test(q)) {
    return `👋 **Hello! I'm PolicyBot!**

I can help you understand any policy, legal document, or terms & conditions.

${hasPol
  ? "📄 I can see you've loaded a policy. Try asking me:\n- *Summarize this*\n- *What are my rights?*\n- *Detect risks*\n- *Explain refund policy*"
  : "📋 **To get started:**\n- Paste your policy in the **Policy Input** tab\n- Or ask me any general question about legal terms!\n\nYou can also click any quick-action button above! 👆"}`;
  }

  // ── HOW ARE YOU ──
  if (/how are you|how r u|you ok|you good/.test(q)) {
    return "😊 I'm doing great, ready to decode any confusing policy for you!\n\nWhat can I help you with today?";
  }

  // ── WHAT CAN YOU DO ──
  if (/what can you do|your features|help me|what do you do|capabilities/.test(q)) {
    return `🤖 **Here's what I can do:**

📄 **Policy Simplifier** — Convert legal jargon into plain English
⚠️ **Risk Detector** — Find hidden dangers & tricky clauses
🧠 **Smart Summary** — TL;DR of any policy
✅ **Rights Finder** — Tell you exactly what your rights are
💰 **Billing Explainer** — Refunds, cancellations, auto-renewals
🔒 **Privacy Analyzer** — How your data is used & shared
🌍 **Multi-Level** — Explain at Simple / Normal / Legal detail
💬 **Q&A** — Answer any question about the policy

**Paste a policy** in the Policy Input tab and ask me anything!`;
  }

  // ── THANKS ──
  if (/thank|thanks|ty|thx|appreciate/.test(q)) {
    return "😊 You're welcome! Feel free to ask anything else about the policy or any legal terms!";
  }

  // ── NO POLICY WARNING (for policy-specific queries) ──
  const needsPolicy =
    /summar|risk|refund|my rights|cancel|data|privacy|billing|clause|term|condition/.test(q);
  if (!hasPol && needsPolicy) {
    return `📋 **No policy loaded yet!**

Please go to the **📄 Policy Input** tab and paste your policy text first.

Once you paste it, I can:
- 🧠 Summarize the whole policy
- ⚠️ Detect hidden risks
- ✅ List your rights
- 💬 Answer specific questions

Or ask me a **general question** about legal terms right now!`;
  }

  // ── SUMMARY ──
  if (TOPICS.summary.test(q)) {
    if (!hasPol) return noPolicy();
    return buildSummary(policyText, sentences);
  }

  // ── RISKS ──
  if (TOPICS.risk.test(q)) {
    if (!hasPol) return noPolicy();
    return buildRiskReport(policyText, sentences);
  }

  // ── RIGHTS ──
  if (TOPICS.rights.test(q)) {
    if (!hasPol) return buildGeneralRights();
    return buildRightsReport(policyText, sentences);
  }

  // ── REFUND ──
  if (TOPICS.refund.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/refund|money back|return|reimburse/i]);
      if (hits.length) {
        return `💰 **Refund Policy (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** ${explainRefund(hits.join(" "))}`;
      }
    }
    return `💰 **Refund Policies — General Guide:**

**Common refund rules:**
• ✅ Many services offer a **14–30 day refund window**
• ⚠️ Digital products are often **non-refundable** once downloaded
• ⚠️ Subscription services may refund unused months only
• ❌ "All sales are final" means **no refund at all**
• ✅ Under consumer laws (like EU rules), you often have a **14-day cooling off** period

**What to do if you want a refund:**
1. Check the policy for the refund window
2. Contact support within that window
3. Keep proof of purchase
4. If refused unfairly, contact your bank (chargeback)`;
  }

  // ── PRIVACY / DATA ──
  if (TOPICS.privacy.test(q) || TOPICS.datashare.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/data|privacy|personal|collect|share|store/i]);
      if (hits.length) {
        return `🔒 **Privacy & Data (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**What this means:**\n${explainPrivacy(hits.join(" "))}`;
      }
    }
    return buildGeneralPrivacy();
  }

  // ── CANCEL / TERMINATION ──
  if (TOPICS.cancel.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/cancel|terminat|end.*service|unsubscrib/i]);
      if (hits.length) {
        return `🚫 **Cancellation Terms (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** ${explainCancel(hits.join(" "))}`;
      }
    }
    return `🚫 **Cancellation — General Info:**

**Typical cancellation rules:**
• Most subscriptions require cancellation **before the next billing date**
• Many require **7–30 days notice** in advance
• Some have a **minimum contract period** (e.g. 12 months)
• After cancellation, service usually runs until **end of current period**

**How to cancel safely:**
1. Log in → Account Settings → Cancel Subscription
2. Get a **cancellation confirmation email**
3. Check your bank statement to confirm charges stop
4. If charged after cancelling, request a chargeback`;
  }

  // ── PAYMENT / BILLING ──
  if (TOPICS.payment.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/pay|bill|charg|fee|subscri|invoice|price/i]);
      if (hits.length) {
        return `💳 **Billing & Payment (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** ${explainBilling(hits.join(" "))}`;
      }
    }
    return `💳 **Billing & Payments — General Info:**

**What to watch for in billing policies:**
• ⚠️ **Auto-renewal** — charge continues unless you cancel
• ⚠️ **Price changes** — company may increase prices with notice
• ✅ **Grace period** — some offer days before charging late fee
• ⚠️ **Failed payments** — account may be suspended automatically
• ✅ **Receipts** — always check for email confirmation

**Tips:**
- Screenshot your plan details before subscribing
- Set a reminder before trial ends
- Use virtual cards for subscriptions you're unsure about`;
  }

  // ── COOKIES / TRACKING ──
  if (TOPICS.cookies.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/cookie|track|analytics|pixel/i]);
      if (hits.length) {
        return `🍪 **Cookies & Tracking (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** Cookies are small files placed on your device. They track your browsing behavior, personalize ads, and help the site remember your preferences. You usually have the right to reject non-essential cookies.`;
      }
    }
    return `🍪 **Cookies & Tracking — General Info:**

**Types of cookies:**
• ✅ **Essential** — needed for site to work (login, cart)
• 🟡 **Analytics** — tracks how you use the site (Google Analytics)
• 🟠 **Marketing** — tracks you across websites for ads
• 🟠 **Third-party** — placed by other companies, not just this site

**Your rights:**
• EU/UK users: must give consent under GDPR
• You can reject non-essential cookies
• Clear cookies anytime via browser settings
• Use browser extensions to block trackers`;
  }

  // ── LEGAL / DISPUTE ──
  if (TOPICS.legal.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/arbitrat|court|jurisdict|dispute|govern.*law/i]);
      if (hits.length) {
        return `⚖️ **Legal & Dispute Terms (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** ${explainLegal(hits.join(" "))}`;
      }
    }
    return `⚖️ **Legal Terms — General Guide:**

**Common legal clauses explained:**
• **Arbitration** — Instead of court, disputes are resolved by a private arbitrator. You usually give up right to jury trial.
• **Class Action Waiver** — You can't join a group lawsuit against the company.
• **Governing Law** — Which country/state's laws apply to disputes.
• **Jurisdiction** — Where legal proceedings must take place.
• **Indemnification** — You may have to pay company's legal costs.
• **Limitation of Liability** — Company's financial responsibility is capped.

⚠️ These clauses heavily favor the company. If in doubt, consult a real lawyer.`;
  }

  // ── SECURITY ──
  if (TOPICS.security.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/secur|encrypt|breach|protect/i]);
      if (hits.length) {
        return `🔐 **Security Terms (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** This section covers how the company protects your data. Watch for whether they accept liability for breaches — many companies disclaim responsibility for third-party hacks.`;
      }
    }
    return `🔐 **Data Security — What to Look For:**

**In any policy, security should cover:**
• ✅ Encryption of data in transit (HTTPS/TLS)
• ✅ Encryption at rest (stored data)
• ✅ Regular security audits
• ✅ Breach notification within 72 hours (GDPR requirement)
• ⚠️ "We are not responsible for third-party breaches" — risky clause

**If breached, you have rights:**
- Right to be notified promptly
- Right to know what data was exposed
- Right to delete your account`;
  }

  // ── AGE / MINORS ──
  if (TOPICS.age.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/age|minor|child|13|18/i]);
      if (hits.length) {
        return `👶 **Age Restrictions (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** This service may have a minimum age requirement. Using it below the required age may result in account termination.`;
      }
    }
    return `👶 **Age Restrictions — General Info:**

Most online services require:
• **13+** — basic services (US COPPA law)
• **16+** — some EU services under GDPR
• **18+** — financial, adult, or contract-based services

If a minor uses the service:
- Account may be terminated if discovered
- Parental consent may be required
- Data collected from minors has stricter rules`;
  }

  // ── ACCOUNT ──
  if (TOPICS.account.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/account|login|registr|profile/i]);
      if (hits.length) {
        return `👤 **Account Terms (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** These are rules about creating and managing your account. Keep your password secure — most policies say you're responsible for activity under your account.`;
      }
    }
    return `👤 **Account Policies — What They Usually Say:**

• You are responsible for all activity on your account
• Sharing accounts may violate terms
• Company can suspend or delete accounts for violations
• You must provide accurate registration information
• Dormant accounts may be deleted after inactivity period

**Best practices:**
- Use strong unique passwords
- Enable two-factor authentication
- Don't share login details`;
  }

  // ── INTELLECTUAL PROPERTY ──
  if (TOPICS.intellectual.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/copyright|trademark|intellectual|content.*own/i]);
      if (hits.length) {
        return `📝 **Intellectual Property (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** This covers who owns content. If you create content on the platform, check whether you keep ownership or if the company gets a license to use it.`;
      }
    }
    return `📝 **Intellectual Property — Common Clauses:**

• **Your content** — You usually retain ownership but grant the company a license
• **Platform content** — The company owns all their branding, code, design
• **License grant** — You may allow them to display, distribute, or modify your content
• **Takedown rights** — Company can remove your content at any time

⚠️ **Watch for:** "worldwide, royalty-free, irrevocable license" — this is very broad!`;
  }

  // ── UPDATE / TERMS CHANGE ──
  if (TOPICS.update.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/modify|update|change.*term|new.*policy|notice/i]);
      if (hits.length) {
        return `🔄 **Policy Update Terms (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** ${explainUpdate(hits.join(" "))}`;
      }
    }
    return `🔄 **Policy Updates — What Usually Happens:**

• Company can change terms at any time
• They should notify you (email or in-app notice)
• "Continued use = acceptance" is very common ⚠️
• Some give 30-day notice before changes take effect
• Under GDPR, significant changes require active consent

**Your options when terms change:**
- Review the changes carefully
- Contact support with questions
- Delete account if you disagree with new terms`;
  }

  // ── SIMPLE EXPLANATION REQUEST ──
  if (TOPICS.simple.test(q)) {
    if (!hasPol) return noPolicy();
    return buildSimpleSummary(policyText);
  }

  // ── LEGAL DETAIL REQUEST ──
  if (TOPICS.legal_detail.test(q)) {
    if (!hasPol) return noPolicy();
    return buildDetailedSummary(policyText, sentences);
  }

  // ── LIABILITY ──
  if (TOPICS.liability.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/liable|liability|responsible|damage/i]);
      if (hits.length) {
        return `⚖️ **Liability Clauses (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}\n\n**Plain English:** The company is limiting how much they can be blamed or made to pay if something goes wrong. This often means: if you suffer losses due to their service, you may have limited options to claim compensation.`;
      }
    }
    return `⚖️ **Liability — What It Means:**

**Common liability limitations:**
• "We are not liable for any indirect/consequential damages"
• "Our liability is limited to the amount you paid us"
• "We are not responsible for third-party services"
• "Service is provided 'as is' without warranty"

**What this means for you:**
- If something goes wrong, you may get little or no compensation
- You usually can't sue for loss of profits or data
- Small refunds are the maximum you can often claim
- Read this section very carefully before signing up for critical services`;
  }

  // ── CONTACT ──
  if (TOPICS.contact.test(q)) {
    if (hasPol) {
      const hits = findRelevantSentences(sentences, [/contact|support|email|address|phone/i]);
      if (hits.length) {
        return `📞 **Contact Information (from your document):**\n\n${hits.map(s => `• ${s}`).join("\n\n")}`;
      }
    }
    return `📞 **How to Contact a Company:**

Usually you can find contact info:
• At the bottom of their website (footer)
• In the "Contact Us" page
• In the policy document itself
• Via in-app help/support section

**When contacting about policy issues:**
- Be specific about which clause you're asking about
- Keep a record of all communications
- Ask for a written response via email`;
  }

  // ── GENERIC POLICY QUESTION (with policy loaded) ──
  if (hasPol) {
    // Try to find relevant sentences from the policy
    const words = q.split(/\s+/).filter(w => w.length > 3);
    const wordPatterns = words.map(w => new RegExp(w, "i"));
    const hits = findRelevantSentences(sentences, wordPatterns, 4);

    if (hits.length) {
      return `🔍 **Relevant section from your policy:**\n\n${hits.map(s => `📌 ${s}`).join("\n\n")}\n\n**Plain English explanation:**\nThese sections are most relevant to your question. They indicate that the policy addresses this topic — check these clauses carefully and look for any conditions, exceptions, or time limits mentioned.`;
    }

    return `🤔 I couldn't find a specific section in your policy about **"${userInput}"**.

**Suggestions:**
• Try asking with different keywords (e.g., "data" instead of "information")
• Ask for a full **summary** to get an overview of everything
• Try **"detect risks"** to see all concerning clauses
• The policy may not cover this topic — which may mean no specific restrictions apply

**Quick Actions:** Use the buttons above for Summary, Risks, Rights, Privacy, or Billing!`;
  }

  // ── FALLBACK: general question, no policy ──
  return buildGeneralAnswer(userInput, q);
}

// ─── BUILDER FUNCTIONS ────────────────────────────────────────

function noPolicy() {
  return `📋 **Please load a policy first!**

Go to the **📄 Policy Input** tab, paste your document, then come back here.

Or ask me a **general question** — I know a lot about legal terms, privacy laws, consumer rights, and more!`;
}

function buildSummary(text, sentences) {
  const risks = detectRisks(text);
  const rights = detectRights(text);
  const wordCount = text.trim().split(/\s+/).length;

  const keyPoints = [];
  if (/data|personal information/i.test(text)) keyPoints.push("📊 Collects and processes personal data");
  if (/third.party|partner/i.test(text)) keyPoints.push("🤝 May share data with third parties");
  if (/auto.renew/i.test(text)) keyPoints.push("🔄 Auto-renewal is active");
  if (/refund/i.test(text)) keyPoints.push("💰 Has specific refund terms");
  if (/terminat|suspend/i.test(text)) keyPoints.push("🚫 Account can be terminated");
  if (/arbitrat/i.test(text)) keyPoints.push("⚖️ Disputes go to arbitration");
  if (/cookie/i.test(text)) keyPoints.push("🍪 Uses cookies and tracking");
  if (/copyright|intellectual/i.test(text)) keyPoints.push("📝 Has intellectual property clauses");
  if (keyPoints.length === 0) keyPoints.push("📄 General terms governing use of the service");

  return `🧠 **POLICY SUMMARY**
📏 *${wordCount} words analyzed*

---

**📌 TL;DR (One Line)**
${getTLDR(text)}

---

**🔑 Key Points**
${keyPoints.map(k => `• ${k}`).join("\n")}

---

**⚠️ Risks Found (${risks.length})**
${risks.length > 0 ? risks.map(r => `• ${r.label} — ${r.msg}`).join("\n") : "✅ No major risks detected"}

---

**✅ Your Rights (${rights.length})**
${rights.length > 0 ? rights.map(r => `• ${r}`).join("\n") : "⚠️ No explicit user rights mentioned — that itself is a concern"}

---

**💡 Verdict**
${getVerdict(risks.length, rights.length)}`;
}

function buildSimpleSummary(text) {
  const risks = detectRisks(text);
  return `👶 **SIMPLE EXPLANATION (Easy Words)**

Imagine this policy like a set of rules for a game. Here's what it says:

${/data|personal/i.test(text) ? "📱 **Your Information:** They collect info about you (like your name, email, what you click on).\n" : ""}${/share|third.party/i.test(text) ? "🤝 **Sharing:** They might show your info to other companies.\n" : ""}${/auto.renew/i.test(text) ? "💳 **Money:** They will keep charging you every month unless YOU stop it.\n" : ""}${/terminat/i.test(text) ? "🚫 **Rules:** If you break the rules, they can kick you out.\n" : ""}${/cookie/i.test(text) ? "🍪 **Tracking:** They watch what you do on their website using little files called cookies.\n" : ""}${/change.*terms|modify/i.test(text) ? "🔄 **Changes:** They can change the rules whenever they want.\n" : ""}

**In Simple Words:** By using this service, you agree to let them use your data, possibly share it, and follow their rules. They can change the rules and cancel your account.

${risks.length > 0 ? `⚠️ **Watch out for:** ${risks.slice(0, 3).map(r => r.label).join(", ")}` : "✅ No major red flags spotted"}`;
}

function buildDetailedSummary(text, sentences) {
  const risks = detectRisks(text);
  const rights = detectRights(text);
  return `👨‍💻 **DETAILED LEGAL ANALYSIS**

---

**📋 Document Overview**
This agreement governs the relationship between the service provider and the end-user. The following analysis covers key legal provisions, risk vectors, and user entitlements.

**⚖️ Legal Provisions Identified**
${/arbitrat/i.test(text) ? "• **Dispute Resolution:** Binding arbitration clause — waives right to jury trial\n" : ""}${/govern.*law|jurisdiction/i.test(text) ? "• **Governing Law:** Jurisdictional clause present — specific law applies\n" : ""}${/indemnif/i.test(text) ? "• **Indemnification:** User may bear legal costs in specified scenarios\n" : ""}${/limitation.*liability|not.*liable/i.test(text) ? "• **Liability Cap:** Limitation of liability clause restricts compensation\n" : ""}• **Contract Formation:** Acceptance via continued use or explicit agreement

**🔴 Risk Assessment (${risks.length} issues)**
${risks.map(r => `• ${r.label}\n  ↳ ${r.msg}`).join("\n")}

**✅ User Entitlements (${rights.length} rights)**
${rights.length > 0 ? rights.map(r => `• ${r}`).join("\n") : "• No explicit user rights articulated in this document"}

**📊 Compliance Indicators**
${/gdpr|general data protection/i.test(text) ? "✅ GDPR referenced\n" : "⚠️ No GDPR reference\n"}${/ccpa|california/i.test(text) ? "✅ CCPA referenced\n" : ""}${/notify|notification|inform/i.test(text) ? "✅ Notification provisions present\n" : "⚠️ No breach notification clause\n"}

**⚖️ Legal Recommendation**
This document contains ${risks.length > 5 ? "numerous high-risk clauses that significantly favor the service provider" : risks.length > 2 ? "moderate risk clauses typical of consumer-facing agreements" : "standard terms with relatively few concerning provisions"}. ${risks.length > 3 ? "Consider seeking legal counsel before proceeding." : "Review the highlighted clauses before agreeing."}`;
}

function buildRiskReport(text, sentences) {
  const risks = detectRisks(text);
  if (risks.length === 0) {
    return `✅ **Risk Analysis Complete**

No major risks detected in this policy! However, always:
• Read the full document yourself
• Look for any sections marked "important" or in bold
• Check for any clauses not shown here`;
  }
  return `⚠️ **RISK DETECTOR REPORT**
*${risks.length} risk(s) found*

---

${risks.map((r, i) => `**${i + 1}. ${r.label}**\n${r.msg}`).join("\n\n")}

---

**📊 Risk Score: ${risks.length <= 2 ? "🟢 Low" : risks.length <= 5 ? "🟠 Medium" : "🔴 High"}**

${risks.length > 5 ? "⚠️ **This policy has many concerning clauses. Read carefully before agreeing!**" : risks.length > 2 ? "🟠 **Some clauses to watch — understand them before agreeing.**" : "🟢 **Relatively safe — still read before agreeing!**"}`;
}

function buildRightsReport(text, sentences) {
  const rights = detectRights(text);
  const extra = [];
  if (/gdpr/i.test(text)) extra.push("✅ GDPR rights apply (EU users): access, erasure, portability, objection");
  if (/ccpa/i.test(text)) extra.push("✅ CCPA rights apply (California users): know, delete, opt-out of sale");

  if (rights.length === 0 && extra.length === 0) {
    return `⚠️ **No explicit rights found in this policy.**

This is actually a concern! A good policy should clearly state:
• Your right to access your data
• Your right to delete your account
• Your right to opt out of marketing
• Your right to be notified of changes

Consider contacting the company to ask about these rights, or look for their privacy policy separately.`;
  }

  return `✅ **YOUR RIGHTS (from this policy)**

${rights.map(r => r).join("\n")}
${extra.length > 0 ? "\n**📜 Regulatory Rights:**\n" + extra.join("\n") : ""}

---

**💡 General Rights You Always Have:**
• Right to request a copy of data the company holds about you
• Right to correct inaccurate information
• Right to withdraw consent at any time
• Right to complain to a regulator if your rights are violated`;
}

function buildGeneralRights() {
  return `✅ **Your General Consumer & Digital Rights**

**📱 Data Rights (GDPR / Privacy Laws):**
• Right to **access** — see what data is held about you
• Right to **erasure** — ask for data to be deleted
• Right to **portability** — get your data in usable format
• Right to **correction** — fix wrong information
• Right to **object** — say no to certain data processing

**💰 Consumer Rights:**
• Right to a **refund** within cooling-off period (14 days in EU)
• Right to know **what you're paying for**
• Right to not be **misled** by advertising
• Right to **cancel** subscriptions

**🔒 Account Rights:**
• Right to **close your account** at any time
• Right to **export your data**
• Right to be **notified** of breaches

Paste a policy to see YOUR specific rights in that document!`;
}

function buildGeneralPrivacy() {
  return `🔒 **Privacy & Data — General Guide**

**What companies typically collect:**
• 📧 Name, email, phone number
• 📍 Location data (if permitted)
• 🖱️ Browsing behavior, clicks, time spent
• 💳 Payment information (usually encrypted)
• 📱 Device info, IP address, browser type

**How data is typically used:**
• Provide the service you signed up for
• Send marketing emails (if you opted in)
• Improve the product via analytics
• Share with partners for advertising

**Your rights (under GDPR / global standards):**
• ✅ Ask for a copy of your data
• ✅ Request deletion ("right to be forgotten")
• ✅ Opt out of marketing
• ✅ Withdraw consent at any time
• ✅ File a complaint with data protection authority

**🔴 Red flags in privacy policies:**
• "We may share data with third parties"
• "We are not responsible for partner data practices"
• "Data may be transferred internationally"
• No mention of how long data is kept`;
}

function buildGeneralAnswer(original, q) {
  // Last resort - provide genuinely helpful general legal/policy knowledge
  const responses = [
    {
      test: /what is terms|what are terms/,
      ans: `📄 **What Are Terms & Conditions?**\n\nTerms & Conditions (T&C) are a legal contract between a company and its users. They set out:\n• What you're allowed to do on the platform\n• What happens if you break the rules\n• How your data is handled\n• What the company can and can't do\n• How disputes are resolved\n\n**Always read them!** Most people don't — but they're legally binding once you click "I Agree".`
    },
    {
      test: /what is privacy policy/,
      ans: `🔒 **What Is a Privacy Policy?**\n\nA Privacy Policy explains:\n• What personal data a company collects about you\n• Why they collect it\n• How they store and protect it\n• Who they share it with\n• Your rights regarding your data\n\nUnder GDPR (EU), CCPA (California), and many other laws, companies **must** have a privacy policy if they collect any personal data.`
    },
    {
      test: /what is gdpr/,
      ans: `🇪🇺 **What Is GDPR?**\n\nGDPR = General Data Protection Regulation (EU law, 2018)\n\n**It gives you these rights:**\n• ✅ Know what data is collected\n• ✅ Access your data\n• ✅ Correct wrong data\n• ✅ Delete your data ("right to be forgotten")\n• ✅ Data portability\n• ✅ Object to processing\n• ✅ Not be subject to automated decision-making\n\n**For companies:** Must get clear consent, report breaches within 72 hours, and can be fined up to 4% of global revenue for violations.`
    },
    {
      test: /what is cookie/,
      ans: `🍪 **What Are Cookies?**\n\nCookies are small text files stored on your device when you visit a website.\n\n**Types:**\n• **Essential** — Login sessions, shopping cart (cannot be disabled)\n• **Analytics** — Track usage for statistics (Google Analytics)\n• **Marketing** — Track you across websites for ads\n• **Preference** — Remember your settings\n\n**Your rights:** Under GDPR, you must be asked for consent before non-essential cookies are placed. You can reject them!`
    },
    {
      test: /what is arbitration/,
      ans: `⚖️ **What Is Arbitration?**\n\nArbitration is an alternative to court. Instead of a judge and jury, a private "arbitrator" decides the outcome.\n\n**Why companies prefer it:**\n• Cheaper for them\n• Usually faster\n• Decisions are binding — hard to appeal\n• Keeps disputes private\n\n**Why it's risky for you:**\n• You give up right to jury trial\n• Can't join class-action lawsuits\n• Arbitrators may favor companies they work with repeatedly\n\n⚠️ "Binding arbitration clause" is one of the most important terms to look for in any agreement.`
    },
  ];

  for (const r of responses) {
    if (r.test.test(q)) return r.ans;
  }

  return `💬 **PolicyBot Response**

I understand you're asking about: **"${original}"**

Here's what I can tell you:

${q.includes("policy") || q.includes("term") || q.includes("agree")
  ? "📄 Policies and agreements are legal contracts. They define your rights, obligations, and how disputes are handled. Key things to always check: data usage, cancellation terms, refund policy, and dispute resolution."
  : q.includes("data") || q.includes("information")
  ? "🔒 When it comes to data in policies, always look for: what data is collected, who it's shared with, how long it's kept, and how to request deletion."
  : q.includes("pay") || q.includes("money") || q.includes("charge")
  ? "💳 For billing issues: always check for auto-renewal clauses, notice periods for cancellation, and refund windows. Keep receipts and cancel before billing dates."
  : "🤔 That's an interesting question! For the best answer, paste your specific policy document in the **Policy Input** tab and ask me again — I can then find the exact relevant clauses for you."}

**💡 Try these quick actions:**
• Paste a policy → click **🧠 Summary** for full analysis
• Click **⚠️ Detect Risks** to find problem clauses
• Click **✅ My Rights** to see what protections you have`;
}

// ─── HELPER ANALYZERS ─────────────────────────────────────────

function detectRisks(text) {
  return RISK_PATTERNS.filter(r => r.pattern.test(text));
}

function detectRights(text) {
  return RIGHTS_PATTERNS.filter(r => r.pattern.test(text)).map(r => r.right);
}

function getTLDR(text) {
  const parts = [];
  if (/data|personal/i.test(text)) parts.push("collects your data");
  if (/share|third.party/i.test(text)) parts.push("may share it with others");
  if (/auto.renew/i.test(text)) parts.push("auto-renews billing");
  if (/no refund|non.refund/i.test(text)) parts.push("refunds may be limited");
  if (/terminat/i.test(text)) parts.push("can terminate your account");
  if (/arbitrat/i.test(text)) parts.push("requires arbitration for disputes");
  if (parts.length === 0) return "This policy governs the use of the service under stated terms.";
  return `This policy ${parts.join(", ")}.`;
}

function getVerdict(riskCount, rightsCount) {
  if (riskCount > 6) return "🔴 **High Risk** — Many concerning clauses. Read very carefully before agreeing. Consider alternatives.";
  if (riskCount > 3) return "🟠 **Medium Risk** — Some clauses favor the company. Know what you're agreeing to.";
  if (riskCount > 1) return "🟡 **Low-Medium Risk** — A couple of clauses to be aware of, but generally standard.";
  return "🟢 **Low Risk** — Relatively straightforward terms. Still worth a skim!";
}

function explainRefund(text) {
  if (/no refund|non.refundable/.test(text)) return "❌ Refunds are NOT available under this policy.";
  if (/\d+.day/.test(text)) return "✅ You have a limited window to request a refund — act quickly!";
  return "Refunds are available under certain conditions. Contact support within the stated timeframe.";
}

function explainPrivacy(text) {
  const parts = [];
  if (/collect/.test(text)) parts.push("they collect your personal information");
  if (/share|third.party/.test(text)) parts.push("they can share it with other companies");
  if (/store|retain/.test(text)) parts.push("your data is stored on their servers");
  if (parts.length === 0) return "This section covers how your data is managed.";
  return `In simple terms: ${parts.join(", ")}.`;
}

function explainCancel(text) {
  if (/\d+.day/.test(text)) return "You need to cancel a certain number of days before your next billing date.";
  if (/immediate/.test(text)) return "Cancellation takes effect immediately.";
  return "You can cancel, but check the notice period and whether you get a refund for unused time.";
}

function explainBilling(text) {
  const parts = [];
  if (/auto.renew/.test(text)) parts.push("charges automatically renew");
  if (/prior notice/.test(text)) parts.push("they may or may not give you notice before charging");
  if (/fail.*payment|payment.*fail/.test(text)) parts.push("failed payments may suspend your account");
  if (parts.length === 0) return "Review the specific payment terms carefully.";
  return parts.join("; ") + ".";
}

function explainLegal(text) {
  const parts = [];
  if (/arbitrat/.test(text)) parts.push("disputes must go to arbitration instead of court");
  if (/jurisdiction/.test(text)) parts.push("legal matters are handled in a specific location");
  if (/govern.*law/.test(text)) parts.push("a specific country or state's laws apply");
  if (parts.length === 0) return "This section covers how legal disputes are handled.";
  return `In plain terms: ${parts.join("; ")}.`;
}

function explainUpdate(text) {
  if (/without notice/.test(text)) return "⚠️ They can change the rules WITHOUT telling you. Check back regularly!";
  if (/notice|notify|email/.test(text)) return "They will notify you when terms change. Watch for those emails!";
  return "Terms can change — continuing to use the service means you accept any new terms.";
}
