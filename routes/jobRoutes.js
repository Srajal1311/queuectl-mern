import express from "express";
import {
  enqueueJob,
  listJobs,
  retryDlqJob,
  getStats,
  listDlqJobs,
  retryAllDlqJobs, 
} from "../controllers/jobController.js";
import Job from "../models/Job.js";

const router = express.Router();

//  Enqueue a new job
router.post("/enqueue", enqueueJob);

// List jobs with optional state filter
// Example: GET /api/jobs/list?state=dead
router.get("/list", async (req, res) => {
  try {
    let { state } = req.query;
    console.log("🧩 Received state filter:", state);

    if (state) {
      state = state.trim().toLowerCase();
    }

    const query = state ? { state } : {};
    const jobs = await Job.find(query).sort({ created_at: -1 });

    res.status(200).json(jobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

//  Dedicated DLQ endpoint — lists all dead jobs
router.get("/dlq", listDlqJobs);
router.post("/dlq/retry-all", retryAllDlqJobs);  
//  Retry a job from DLQ
router.post("/dlq/retry/:id", retryDlqJob);

//  Stats for dashboard
router.get("/stats", getStats);

export default router;
