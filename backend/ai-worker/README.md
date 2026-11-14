# Written-answer evaluation worker

This process consumes `vettly.assessment` jobs from RabbitMQ. It reads the submitted
answer snapshot from PostgreSQL, asks Gemini to grade written answers, validates every
mark against the host's question maximum, and stores the per-question reasons and
overall summary on the attempt. MCQs remain graded by the API.

Copy `.env.example` to `.env`, fill in the database, broker, and Gemini API key,
then run `npm install` and `npm start` from this directory. Use the same
`DATABASE_URL` as the API and the same `RABBITMQ_AI_QUEUE` on both processes.
The API defaults the queue to `vettly.assessment`. The Gemini key belongs only here.

The worker checks for pending submissions on startup and every minute. A failed
evaluation tries the fallback model when the primary times out or returns a temporary
provider error. RabbitMQ then retries after 30 seconds, 2 minutes, and 5 minutes.
If those attempts fail, the host can
retry it from the candidate review. Results cannot be published while evaluation
is pending or failed.
The default primary model is `gemini-3.5-flash`; set `GEMINI_MODEL` and
`GEMINI_FALLBACK_MODEL` to change the order. Restart the worker after editing its
environment. The PostgreSQL SSL-mode warning does not indicate an evaluation failure.
For written questions with a limit of at least 100 words, the worker caps very brief
answers. Under 10% of the limit can earn at most 40% of the marks, under 25% at most
70%, and under 40% at most 90%. These are upper bounds, so inaccurate answers can
receive less. The host sees the cap in that answer's AI evaluation reason.

## Files

| File | Purpose |
| --- | --- |
| `src/index.js` | Queue consumer, recovery, database updates, and retries |
| `src/evaluate.js` | Gemini request, grading instructions, and response validation |
| `.env.example` | Required settings without credentials |
