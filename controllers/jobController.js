import Job from "../models/Job.js";
import { v4 as uuidv4 } from "uuid";

//  Enqueue a new job
export const enqueueJob = async (req, res) => {
  try {
    const { command, max_retries } = req.body;

    if (!command) {
      return res.status(400).json({ error: "Command field is required" });
    }

    const newJob = await Job.create({
      id: uuidv4(),
      command,
      max_retries: max_retries || 3,
    });

    res.status(201).json({ success: true, job: newJob });
  } catch (err) {
    console.error("❌ Error enqueueing job:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// List jobs (optionally by state)
export const listJobs = async (req, res) => {
  try {
    let { state } = req.query;

    console.log(" Received state filter:", state);

    // 🧹 Clean up any spaces, newlines, or capitalization
    if (state) {
      state = state.trim().toLowerCase();
    }

    const filter = state ? { state } : {};

    console.log(" Final Mongo Query:", filter);

    const jobs = await Job.find(filter).sort({ created_at: -1 });

    console.log(` Found jobs: ${jobs.length}`);

    res.status(200).json(jobs);
  } catch (err) {
    console.error("❌ Error listing jobs:", err.message);
    res.status(500).json({ error: err.message });
  }
};
//  Retry a DLQ job (with ID sanitization)
export const retryDlqJob = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim(); //  removes any hidden spaces or newlines
    console.log(`🔁 Retrying DLQ job with ID: "${id}"`);

    const job = await Job.findOne({ id, state: "dead" });

    if (!job) {
      console.warn(` Job not found in DLQ for ID: "${id}"`);
      return res
        .status(404)
        .json({ error: "Job not found in Dead Letter Queue" });
    }

    job.state = "pending";
    job.attempts = 0;
    job.next_run_at = new Date();
    await job.save();

    console.log(` Retried DLQ job successfully: ${id}`);

    res.json({ message: `Retried job ${id}` });
  } catch (err) {
    console.error("❌ Error retrying DLQ job:", err.message);
    res.status(500).json({ error: err.message });
  }
};


//  Get job state summary
export const getStats = async (req, res) => {
  try {
    const states = ["pending", "processing", "completed", "failed", "dead"];
    const counts = {};

    for (const s of states) {
      counts[s] = await Job.countDocuments({ state: s });
    }

    res.status(200).json(counts);
  } catch (err) {
    console.error("❌ Error fetching stats:", err.message);
    res.status(500).json({ error: err.message });
  }
};
//  Get all jobs from the Dead Letter Queue
export const listDlqJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ state: "dead" }).sort({ created_at: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    console.error("❌ Error fetching DLQ jobs:", err.message);
    res.status(500).json({ error: err.message });
  }
};
//  Retry all jobs in the Dead Letter Queue
export const retryAllDlqJobs = async (req, res) => {
  try {
    const deadJobs = await Job.find({ state: "dead" });

    if (!deadJobs.length) {
      return res.status(200).json({ message: "No dead jobs to retry" });
    }

    for (const job of deadJobs) {
      job.state = "pending";
      job.attempts = 0;
      job.next_run_at = new Date();
      await job.save();
    }

    res.status(200).json({
      message: `Retried ${deadJobs.length} DLQ job(s) successfully`,
    });
  } catch (err) {
    console.error("❌ Error retrying DLQ jobs:", err.message);
    res.status(500).json({ error: err.message });
  }
};
