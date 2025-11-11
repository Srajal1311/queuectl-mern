QueueCTL — Background Job Queue System (Node.js + MongoDB)

QueueCTL is a simple, production-style background job queue system built using Node.js, Express, and MongoDB.
It supports job scheduling, retries with exponential backoff, Dead Letter Queue (DLQ) management, and a CLI interface for managing jobs.

* Features

Enqueue and execute background jobs

Multiple worker processing (parallel job execution)

Retry mechanism with exponential backoff

Dead Letter Queue for permanently failed jobs

CLI interface for easy control

Persistent job storage in MongoDB (survives restarts)

Cross-platform shell support (Windows + Linux)

* Tech Stack

Node.js — Core runtime

Express.js — REST API

MongoDB Atlas — Persistent job storage

Child Process Module — Command execution

Commander.js + Axios — CLI utility

* Installation & Setup

Clone this repository:

git clone https://github.com/<your-username>/queuectl-mern.git
cd queuectl-mern/backend


Install dependencies:

npm install


Create a .env file:

MONGO_URI=<your-mongodb-atlas-connection-string>
PORT=5000


Start the backend server (which includes the worker):

npm run dev


You should see:

 Server running on port 5000
 MongoDB Atlas connected successfully
[worker-1] started

* Architecture Overview
          +---------------------------+
          |        queuectl.js        |
          | (CLI: enqueue, list, etc) |
          +-------------+-------------+
                        |
                        v
          +-------------+-------------+
          |        Express Server     |
          |     (API routes /jobs)    |
          +-------------+-------------+
                        |
                        v
          +-------------+-------------+
          |       MongoDB Atlas       |
          | (persistent job storage)  |
          +-------------+-------------+
                        |
                        v
          +-------------+-------------+
          |     Worker Process        |
          |  Executes & retries jobs  |
          +---------------------------+

* CLI Commands

All CLI commands are run from the /backend folder:

1. Enqueue a Job

Add a new job to the queue.

node queuectl.js enqueue "{\"command\": \"echo Hello MERN\"}"


Output:

 Job Enqueued: 17f422b8-7585-4bc5-a007-2b58ca5a3d35

2. List Jobs by State

View all jobs in a particular state:

node queuectl.js list --state completed


Output:

┌─────────┬────────────────────────────────────────┬───────────────────┬─────────────┬──────────┐
│ (index) │ id                                     │ command           │ state       │ attempts │
├─────────┼────────────────────────────────────────┼───────────────────┼─────────────┼──────────┤
│ 0       │ '17f422b8-7585-4bc5-a007-2b58ca5a3d35' │ 'echo Hello MERN' │ 'completed' │ 0        │
└─────────┴────────────────────────────────────────┴───────────────────┴─────────────┴──────────┘

3. Retry a Single DLQ Job
node queuectl.js dlq:retry e6b6dc80-8aec-4728-9c76-f2546dca18ed


Output:

{ message: 'Retried job e6b6dc80-8aec-4728-9c76-f2546dca18ed' }

4. Retry All DLQ Jobs
node queuectl.js dlq:retry-all


Output:

{ message: 'Retried 13 DLQ job(s) successfully' }

5. View Queue Stats
node queuectl.js status


Output:

┌────────────┬────────┐
│ pending    │ 0      │
│ processing │ 4      │
│ completed  │ 3      │
│ failed     │ 0      │
│ dead       │ 13     │
└────────────┴────────┘

* Job Lifecycle
State	Description
pending	Waiting to be picked up by a worker
processing	Currently being executed
completed	Successfully finished
failed	Failed but still retryable
dead	Permanently failed (moved to DLQ)
 Retry Logic (Exponential Backoff)

Each failed job is retried using:

delay = base ^ attempts (in seconds)


Example with base = 2:

Attempt	Delay	Description
1	2s	First retry
2	4s	Second retry
3	8s	Third retry (moves to DLQ if exceeds max_retries)
* Persistence

All jobs are stored in MongoDB Atlas.
If the server restarts, your jobs and DLQ remain intact.
This ensures that the queue can safely recover without data loss.

* Testing Scenarios
Test Case	Expected Result
Enqueue simple command (echo Hello)	Moves to completed instantly
Enqueue invalid command (cmd /c exit 1)	Retries twice → moves to DLQ
Retry DLQ job	Moves back to pending and re-executes
Restart server	Jobs remain persisted in MongoDB
Run multiple workers	Processes jobs concurrently
* Project Structure
backend/
 ├── controllers/
 │   └── jobController.js
 ├── models/
 │   └── Job.js
 ├── routes/
 │   └── jobRoutes.js
 ├── worker/
 │   └── worker.js
 ├── queuectl.js         # CLI entry point
 ├── server.js           # Express server
 ├── package.json
 ├── .env
 └── README.md

* How to Verify

Start server:

npm run dev


Open another terminal and enqueue:

node queuectl.js enqueue "{\"command\": \"echo Hello MERN\"}"


Check queue status:

node queuectl.js status


Intentionally enqueue a failing command:

node queuectl.js enqueue "{\"command\": \"cmd /c exit 1\", \"max_retries\": 2}"


Retry it from DLQ after failure:

node queuectl.js dlq:retry-all

* Design Choices & Notes

Used MongoDB for persistence instead of JSON file for reliability and scalability

Worker continuously polls for pending jobs and updates states

CLI commands internally call REST APIs for flexibility

Retry and DLQ mechanisms strictly follow exponential backoff logic

System is fully cross-platform (tested on Windows CMD and Linux Bash)



DLQ listing and retry

Link to Google Drive: https://drive.google.com/drive/folders/1xiTZoD6WvXXYlpisKAduUgn7i1fZuw5s?usp=sharing

🏁 Conclusion

QueueCTL implements a minimal yet complete background job queue system with workers, retries, persistence, and DLQ handling — all controllable from a clean CLI.
It fulfills every requirement outlined in the internship problem statement and runs reliably across environments.
