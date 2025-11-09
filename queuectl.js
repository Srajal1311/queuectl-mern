#!/usr/bin/env node
import axios from "axios";
import { Command } from "commander";
const program = new Command();

program
  .name("queuectl")
  .description("QueueCTL - Background Job Queue CLI")
  .version("1.0.0");

// Enqueue job
program
  .command("enqueue")
  .argument("<json>", "Job JSON string")
  .action(async (jsonStr) => {
    const job = JSON.parse(jsonStr);
    const res = await axios.post("http://localhost:5000/api/jobs/enqueue", job);
    console.log("✅ Job Enqueued:", res.data.job.id);
  });

// List jobs
program
  .command("list")
  .option("--state <state>", "Filter by job state")
  .action(async (options) => {
    const res = await axios.get(
      `http://localhost:5000/api/jobs/list?state=${options.state || ""}`
    );
    console.table(res.data.map((j) => ({
      id: j.id,
      command: j.command,
      state: j.state,
      attempts: j.attempts
    })));
  });

// Retry DLQ job
program
  .command("dlq:retry")
  .argument("<id>", "Job ID")
  .action(async (id) => {
    const res = await axios.post(
      `http://localhost:5000/api/jobs/dlq/retry/${id.trim()}`
    );
    console.log(res.data);
  });

// Retry all DLQ jobs
program
  .command("dlq:retry-all")
  .action(async () => {
    const res = await axios.post(
      "http://localhost:5000/api/jobs/dlq/retry-all"
    );
    console.log(res.data);
  });

// Status
program
  .command("status")
  .action(async () => {
    const res = await axios.get("http://localhost:5000/api/jobs/stats");
    console.table(res.data);
  });

program.parse();
