# 🎓 CampusIntel

> **From Reactive Chatbots to Proactive AI Agents.** 
> The ultimate Autonomous Intelligence Platform for University Placement & Training Cells.

## 🎯 The Core Problem
Current campus placement preparation relies on stale internet lists or manual chatbot prompts. The fundamental flaw: **If a student doesn't know they have a critical gap in a specific subject (like System Design), they won't even know to ask an AI for help.** Placement Cells only find out a student wasn't prepared *after* the company rejects them.

## 🚀 The CampusIntel Solution
We built an **Autonomous AI Agent** that sits on top of a live "Campus Pulse" network, instantly synthesizing interview debriefs from college peers. It automatically parses student resumes to build live proficiency profiles, detects critical skill gaps relative to upcoming company drives, and pre-emptively intervenes—running mock assessments and alerting the TPC *before* the student fails. 

---

## 🔥 Key Features

### 1. Frictionless Onboarding (Zero Data Entry)
Instead of forcing students through 20-minute profile creation forms, CampusIntel uses a zero-friction flow. Students simply drag and drop their PDF resume. Gemini AI processes the raw text to extract a normalized JSON array of technical skills, instantly giving the Agent a cold-start profile to work with.

### 2. The Agentic Reasoning Engine
CampusIntel does not wait for prompts. An asynchronous chron job evaluates the student's readiness using a 9-step reasoning loop:
*   **Query Local DB:** The agent evaluates if the university's local dataset crosses the required confidence threshold.
*   **Assess Readiness:** A mathematical delta is calculated between the company's expected "Success Profile" and the student's inferred skills, flagging specific topics as a `CRITICAL_GAP`.
*   **Epsilon-Greedy Reinforcement Learning:** The agent queries strategy weights to select the most historically successful intervention for this demographic.
*   **Execution:** It prompts Claude/Gemini to construct a personalized 7-day preparation brief, or alerts human administrators. 

### 3. Magnetic Campus Pulse (D3.js Network)
The Campus Pulse `/pulse` visualizes how intelligence physically moves across the university. Every submitted debrief feeds the central intelligence hub.
*   **Live Physics:** Powered by a natively-coded D3.js force-directed graph running in the browser. 
*   **Magnetic Interaction:** The central "LPU Hub" node is tied directly into the D3 `forceCenter` payload via mouse tracking. As you move your mouse, the central Hub acts as a magnet, gently following your cursor while connected nodes organically trail behind. 

### 4. TPC Admin Pipeline
University administrators drop into `/tpc/dashboard` to manage the pipeline predictively rather than reactively. They receive live Agent alerts (e.g., "Critical gap in System Design detected across 40% of applicants") and can click once to authorize targeted mass-assessments.

---

## 🏗️ Technical Architecture

CampusIntel is built as a robust, scalable multi-tenant architecture with background processing for heavy AI tasks, complete with `CLAUDE_MOCK` fallbacks to ensure API rate limits never break a live demo.

### Tech Stack
*   **Frontend:** Next.js (App Router), React, TailwindCSS, D3.js.
*   **Backend:** Node.js, Express.js.
*   **AI/LLM Engine:** Anthropic Claude API (`@anthropic-ai/sdk`) & Google Gemini. 
*   **Database & Core Engine:** Supabase (PostgreSQL with Realtime capabilities to stream agent logs to the frontend UI).
*   **Background Jobs:** BullMQ + Redis for asynchronous queueing. `node-cron` for periodic scanning.
*   **File Processing:** `pdf-parse` for analyzing student resumes.

---

## ⚙️ Local Setup Guide

### Prerequisites
- Node.js (v18+)
- Redis Server
- Supabase Project
- Anthropic API Key & Gemini API Key

### 1. Database Setup
1. Open your Supabase project's SQL Editor.
2. Run `database/schema.sql` to generate the required tables.
3. Run `database/seed.sql` and `database/demo_seed.sql` to populate sample data.

### 2. Backend Setup
```bash
cd campusintel-backend
npm install

# Create a .env file and configure:
# PORT=3001
# SUPABASE_URL=your_url
# SUPABASE_SERVICE_ROLE_KEY=your_key
# ANTHROPIC_API_KEY=your_key
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379

npm run dev
```

### 3. Frontend Setup
```bash
cd campusintel-frontend
npm install

# Create a .env.local file and configure:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

npm run dev
```

---

> Built with ❤️ for AI Hackathons.
