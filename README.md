# Diligencify Profile Agent

[![License: MIT](https://img.shields.io/badge/license-MIT-2185d0?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

> **Automated Identity Research and Due Diligence — Built for Precision**

Diligencify Profile Agent is a highly robust full-stack application that automates the deep research and extraction of biographical and professional data for individuals. Using state-of-the-art multi-agent AI, it browses the web, dedupes identities, and organizes unstructured data into beautifully formatted, centralized intelligence profiles.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Application Flow](#application-flow)
- [Get Started](#get-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## About

**Diligencify Profile Agent** is built to solve complex research and identity disambiguation challenges for due diligence teams, recruiters, and private intelligence. The platform features:

- **AI-Powered Deep Research** utilizing Tavily and large context models (like Gemini 1.5 Flash or Llama 3) to perfectly parse thousands of articles, news reports, and web pages.
- **Identity Disambiguation Engine** with a strict verification layer that prevents identity mix-ups by cross-referencing context anchors (e.g., employers, locations).
- **Beautiful Markdown Streaming UI** ensuring you can watch the agent construct the intelligence profile in real-time on a modern frontend.

Built with **Next.js**, **FastAPI**, **Pydantic**, and styled with **Tailwind CSS** — this codebase represents a production-ready approach to multi-agent RAG pipelines.

---

## Features

- ⚡ **Lightning Fast Full-Stack** — Powered by Next.js and Python FastAPI
- 🧠 **Multi-Agent RAG Pipeline** — Orchestrates a Researcher agent and an Extractor agent working in tandem
- 🔍 **Fuzzy Matching & Deduping** — Automatically deduplicates sources using RapidFuzz to save LLM context
- ⚠️ **Identity Disambiguation** — Flags and excludes sources that likely belong to someone with the same name
- 🛡️ **Prompt Injection Defenses** — Wraps untrusted external web data in strict XML tags to prevent jailbreaks
- ⏳ **Exponential Backoff** — Aggressive retry logic (up to 10 retries) to gracefully handle API rate limits on free tiers
- 🎨 **Modern Interface** — Clean, responsive, enterprise-grade streaming UI built with Tailwind CSS
- 🔐 **Pydantic Validation** — Strict schema enforcement ensuring the AI always returns perfectly structured JSON

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (React) |
| Backend Framework | FastAPI (Python 3.10+) |
| Styling | Tailwind CSS 3 |
| State Management| React Hooks |
| AI Integration | OpenAI Python SDK (Compatible with Google Gemini, OpenRouter, Groq) |
| Search Engine | Tavily API |
| Parsing/Validation| Pydantic v2 |

---

## Application Flow

The application is structured into perfectly synchronized multi-agent views:

| Phase | Focus | Features |
|---|---|---|
| 🌐 **1. Brainstorming** | Search Query Generation | The AI generates hyper-specific search queries based on the target name and known context anchors. |
| 🕵️ **2. Retrieval & Verification** | Web Scraping & Disambiguation | Pulls raw data from Tavily. Passes each source through an LLM verification layer to score identity plausibility. |
| 🧠 **3. Extraction** | Profile Construction | Injects up to 80,000 characters of verified text into a massive context window to synthesize the final profile. |
| 🖥️ **4. Presentation** | Real-time Streaming | Streams the JSON/Markdown profile directly to the Next.js frontend for immediate review. |

---

## Get Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Google Gemini API Key](https://aistudio.google.com/) (or OpenAI/OpenRouter)
- A [Tavily API Key](https://tavily.com/)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/diligencify-profile-agent.git
cd "Profile Agent"

# --- Backend Setup ---
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set up your environment variables
# Copy .env.example to .env and fill in your keys
uvicorn app.main:app --reload --port 8000

# --- Frontend Setup ---
# In a new terminal window:
cd ../frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── agents/           # Core AI logic
│   │   │   ├── researcher.py # Web search and identity disambiguation
│   │   │   └── extractor.py  # Massive context data extraction
│   │   ├── models/           # Pydantic schemas (DiligenceProfile)
│   │   ├── services/         # Orchestrator and Web retrieval layers
│   │   └── main.py           # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js app router pages
│   │   ├── page.tsx          # Home page (Input Form)
│   │   └── profile/          # Dynamic profile viewing and streaming
│   ├── components/           # Reusable UI components
│   └── tailwind.config.ts    # Tailwind settings
└── README.md
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Tavily for Web Search
TAVILY_API_KEY="tvly-your_key"

# Google Gemini Official API (100% Free, 1M Context)
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_API_KEY="your_gemini_key_here"
LLM_MODEL=gemini-1.5-flash
```

---

## Contributing

Contributions are welcome! Whether you're fixing a bug, adding a feature, or improving docs:

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ to simplify automated intelligence gathering.</sub>
</div>
