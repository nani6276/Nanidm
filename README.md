# WriteDIM — AI English Writing Practice

A real full-stack Azerbaijani student preparation app for the DIM 2027 English writing task.

## Source of truth
The writing requirements in this project are based on the attached official DIM 2027 document. The document's sample task requires ONE paragraph of at least 100 words and lists the topic sentence/controlling idea, at least two reasons/facts/examples, conclusion, both sides, clear/logical ideas, appropriate linking words, topic focus, and one paragraph rather than separate sentences/bullets. The document also describes brainstorming, structure, drafting, and final review stages.

The app-defined 100-point rubric is an educational practice rubric, not an official DIM scoring formula.

## Requirements
- Node.js 18+
- An OpenAI API key (or an OpenAI-compatible endpoint)

## Install
```bash
npm install
```

## Configure AI
Copy `.env.example` to `.env` and set:
```env
AI_API_KEY=your_secret_key
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
AI_BASE_URL=
PORT=3000
```
`AI_API_KEY` is read only by the Node.js backend. It is never placed in browser JavaScript.

## Run
```bash
npm start
```
Open `http://localhost:3000`.

Development:
```bash
npm run dev
```

## How AI analysis works
1. The browser validates that a paragraph exists and POSTs `{ topic, text }` to `/api/analyze-writing`.
2. Express validates length/content and rate-limits the endpoint.
3. The server sends the real student paragraph plus the DIM requirement rubric to the configured AI provider.
4. The model must return a strict JSON schema.
5. The server overwrites word/paragraph counts with deterministic counts from the actual text and recalculates the score total from the six rubric components.
6. The browser displays the returned report and highlights exact phrases where the AI identified genuine errors.

## API
### POST `/api/analyze-writing`
Request:
```json
{"topic":"Should school uniforms be required for all students?","text":"Student paragraph..."}
```
Response: structured analysis JSON used by the UI.

### GET `/api/health`
Returns whether the server is running and whether `AI_API_KEY` is configured. It never returns the key.

## Topics
Edit the `topics` array in `client/app.js`. Topics are practice topics only and are not represented as official DIM questions unless they come from the official source.

## Practice scoring rubric
The educational rubric is defined in `server/prompts/writingPrompt.js` and has:
- Task Completion — 20
- Structure — 20
- Coherence & Cohesion — 20
- Grammar — 20
- Vocabulary — 10
- Mechanics — 10

Total: 100. The UI explicitly calls it `AI Practice Assessment` and not an official DIM score.

## Security
- API key only in server environment.
- Input length limit.
- JSON body size limit.
- Per-IP rate limit on analysis endpoint.
- AI request timeout.
- Strict structured AI output.
- No accounts or unnecessary personal information.

## Basic Check
`Basic Check` is deliberately not AI. It only checks word count, paragraph count, and a few linking-word/format indicators. It is clearly labeled `Basic automatic check`.
