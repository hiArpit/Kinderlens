# KinderLens

KinderLens is a child-focused discovery app for ages 6–8. Children can explore
camera captures, curated Wonder List topics, and a World Explorer map of live
wildlife records and sourced natural and geological discoveries. They can revisit
what they learn through quizzes, stories, and a graph of saved discoveries.
Parent accounts manage child profiles and saved history.

## Fork and clone

To work on your own copy, click **Fork** on the [KinderLens GitHub repository](https://github.com/hiArpit/Kinderlens), then clone your fork:

```bash
git clone https://github.com/<your-github-username>/Kinderlens.git
cd Kinderlens
```

You can also clone the original repository if you only need a local copy:

```bash
git clone https://github.com/hiArpit/Kinderlens.git
cd Kinderlens
```

## Run locally

Install Git, Node.js with npm, Python, and MongoDB. Start MongoDB and keep it
running while you use the app. You will need a Groq API key for AI-powered
discovery, quizzes, and stories.

### 1. Configure the AI service

In a terminal from the repository root, create its environment file and add your
Groq API key:

```powershell
Copy-Item ai-service/.env.example ai-service/.env
```

Edit `ai-service/.env` and set `GROQ_API_KEY`. Then install its packages and
start the service:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 2. Configure and start the backend

Open a second terminal at the repository root:

```powershell
Copy-Item backend/.env.example backend/.env
```

Edit `backend/.env` if your MongoDB URL differs from the local default. Replace
`PARENT_SESSION_SECRET` with a long random value and change the demo-only
`PARENT_PIN`. Then install packages and start the API:

```powershell
cd backend
npm install
npm run dev
```

### 3. Start the frontend

Open a third terminal at the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. The Vite development server proxies `/api` requests
to the backend at `http://localhost:5000`.

## Checks

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run build
npm run test:e2e
```

```powershell
cd ai-service
.\.venv\Scripts\python.exe -m pip install pytest
.\.venv\Scripts\python.exe -m pytest
```

The seeded evaluation harness in `evaluation/run_evals.py` sends live requests
to the AI service and uses the configured model API. Run it only when the AI
service is available and you intend to use those API calls.

## Project notes

See [the safety principles](docs/SAFETY_PRINCIPLES.md), [the roadmap](docs/ROADMAP.md),
and [deployment guidance](docs/DEPLOYMENT.md). The Wonder List is curated and
static; it is not presented as a live trending feed.
