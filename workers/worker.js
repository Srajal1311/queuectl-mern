import Job from "../models/Job.js";
import { spawn } from "child_process";

export const startWorker = async (workerName = "worker-1") => {
  console.log(`[${workerName}] started`);

  while (true) {
    const job = await Job.findOneAndUpdate(
      { state: "pending", next_run_at: { $lte: new Date() } },
      { state: "processing", updated_at: new Date() },
      { new: true }
    );

    if (!job) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    console.log(`[${workerName}] picked job ${job.id} (${job.command})`);
    await executeJob(job, workerName);
  }
};

const executeJob = async (job, workerName) => {
  return new Promise((resolve) => {
    const process = spawn(job.command, { shell: true });

    let output = "";
    process.stdout.on("data", (d) => (output += d.toString()));
    process.stderr.on("data", (d) => (output += d.toString()));

    process.on("close", async (code) => {
      if (code === 0) {
        job.state = "completed";
        job.output = output;
        job.updated_at = new Date();
        await job.save();
        console.log(`[${workerName}] job ${job.id} completed `);
      } else {
        job.attempts += 1;
        const delay = Math.pow(2, job.attempts) * 1000;

        if (job.attempts >= job.max_retries) {
          job.state = "dead";
          console.log(`[${workerName}] job ${job.id} moved to DLQ ❌`);
        } else {
          job.state = "pending";
          job.next_run_at = new Date(Date.now() + delay);
          console.log(
            `[${workerName}] job ${job.id} failed. Retrying in ${delay / 1000}s`
          );
        }

        job.output = output;
        job.updated_at = new Date();
        await job.save();
      }
      resolve();
    });

    process.on("error", async (err) => {
      job.state = "dead";
      job.output = err.message;
      job.updated_at = new Date();
      await job.save();
      console.log(`[${workerName}] job ${job.id} crashed ❌ Error: ${err.message}`);
      resolve();
    });
  });
};
