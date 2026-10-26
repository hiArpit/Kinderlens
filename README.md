# KinderLens

KinderLens is a child-focused discovery app for ages 6–8. Children can explore
camera captures or curated Wonder List topics, then revisit grounded learning
through quizzes, stories, and a graph of saved discoveries. Parent accounts
control child profiles and saved history.

## Run the full app with Docker Compose

Docker Compose starts the frontend, Node API, Python AI service, and MongoDB.
Only the frontend is exposed to the host; the API and database stay on the
compose network.

1. Copy `.env.example` to `.env`.
2. Set `GROQ_API_KEY` to a valid Groq API key.
3. Replace `PARENT_SESSION_SECRET` with a unique random string of at least 32
   characters and change the local demo `PARENT_PIN`.
4. From the repository root, run `docker compose up --build`.
5. Open `http://localhost:3000` after the frontend is healthy.

`docker compose down` preserves the MongoDB volume. Use
`docker compose down --volumes` only when you intend to erase local learning
history.

## Run services separately

Start MongoDB first. Then, in separate terminals:

```powershell
Copy-Item ai-service/.env.example ai-service/.env
# Add GROQ_API_KEY to ai-service/.env, then:
cd ai-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server runs at `http://localhost:3000` and proxies API
requests to the backend at `http://localhost:5000`.

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
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The seeded evaluation harness in `evaluation/run_evals.py` sends live requests
to the AI service and uses the configured model API. Run it only when the AI
service is available and you intend to use those API calls.

## Safety and project notes

See [the safety principles](docs/SAFETY_PRINCIPLES.md), [the roadmap](docs/ROADMAP.md),
and [deployment guidance](docs/DEPLOYMENT.md). The Wonder List is curated and
static; it is not presented as a live trending feed.
