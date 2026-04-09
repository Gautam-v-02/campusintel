# 🎓 CampusIntel

> **An AI-Driven Placement Intelligence & Agentic Intervention Platform**

CampusIntel is an autonomous AI agent system designed for Training and Placement Cells (TPCs) at educational institutions. It leverages the power of Anthropic's Claude AI and Supabase to analyze student profiles, process past interview debriefs, and autonomously execute intervention strategies (such as sending personalized prep briefs, conducting skill assessments, or scheduling specialized training sessions) to maximize placement success.

---

## 🚀 Key Features

### 🤖 Autonomous Agent (Powered by Claude AI)
- **Intelligent Interventions:** The agent continuously evaluates student readiness vs. upcoming campus drive requirements.
- **Dynamic Strategies:** Based on confidence levels, it decides between various strategies: `BRIEF_ONLY`, `BRIEF_ASSESS`, `BRIEF_ASSESS_SESSION`, or `BRIEF_SESSION`.
- **Live Reasoning Trace:** Full observability into the agent's decision-making process via Realtime agent logs.
- **Auto-Scheduling:** The agent can autonomously schedule and enroll students in specific TPC training sessions (e.g., "System Design for Amazon") based on identified cohort weaknesses.

### 🏛️ For Training & Placement Cells (TPC Admins)
- **Company Intel:** Synthesizes past interview debriefs to extract common question patterns, success profiles, and typical interview timelines.
- **Cohort Tracking:** Monitor student states (from *UNAWARE* to *INTERVIEW_READY*) and observe live agent interventions.
- **Resource Optimization:** Let the AI handle initial screening and basic prep so the human TPC team can focus on high-leverage coaching.

### 👩‍🎓 For Students
- **Personalized Prep:** Receive context-aware preparation briefs for specific companies.
- **Micro-Assessments:** Participate in AI-generated, targeted quizzes to evaluate and improve specific technical skills.
- **Automated Resume Parsing:** Seamlessly extract skills and experiences from uploaded PDF resumes.

---

## 🏗️ Technical Architecture

CampusIntel is built as a robust, scalable multi-tenant architecture with background processing for heavy AI tasks.

### Tech Stack
- **Frontend:** Next.js (App Router), React, TailwindCSS, D3.js (for data visualizations and intel graphs).
- **Backend:** Node.js, Express.js.
- **AI/LLM:** Anthropic Claude API (`@anthropic-ai/sdk`) for reasoning, assessment generation, and intel synthesis.
- **Database & Auth:** Supabase (PostgreSQL with Realtime capabilities to stream agent logs to the frontend).
- **Background Jobs:** BullMQ + Redis for asynchronous queueing of agent tasks, `node-cron` for periodic scanning.
- **File Processing:** `pdf-parse` for analyzing student resumes.

### Database Schema Highlights
- **`colleges` / `companies`**: Multi-tenant setup.
- **`users` (Students & Admins)**: Tracks `inferred_skills`, `confidence_score`, and `current_state`.
- **`interview_debriefs` & `college_company_intel`**: Stores raw debriefs and the AI-synthesized patterns (success/failure factors, question topics).
- **`agent_logs`**: Streams the live flow of agent decisions to the UI.
- **`strategy_weights`**: Self-optimizing weights tracking which agent intervention strategy works best for different student confidence profiles.

---

## ⚙️ Local Setup Guide

### Prerequisites
- Node.js (v18+)
- Redis Server (Running locally or via Docker)
- Supabase Project (Database credentials)
- Anthropic API Key

### 1. Database Setup
1. Open your Supabase project's SQL Editor.
2. Run the schema file located in `database/schema.sql` to generate the required tables.
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
*The backend server will start on `http://localhost:3001`.*

### 3. Frontend Setup
```bash
cd campusintel-frontend
npm install

# Create a .env.local file and configure:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

npm run dev
```
*The frontend web app will start on `http://localhost:3000`.*

---

## 💡 How It Works (The Agent Loop)

1. **Scanner Job:** A `cron` job runs hourly, identifying upcoming campus drives within the next 7-14 days.
2. **Evaluation:** For each registered student, the agent assesses their profile against the company's inferred "Success Profile."
3. **Action:** The agent picks a strategy using `strategy_weights`. It might generate an assessment queue, push a notification via WhatsApp/Email, or schedule a TPC session.
4. **Observation:** TPC Admins watch this unfold in real-time on their Next.js dashboard as `agent_logs` populate.

---

> Built with ❤️ for AI Hackathons.
