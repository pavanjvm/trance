const JobApply = require("./models/apply");
const Job = require("./models/job"); // Import Job model

const applyJob = async (req, res) => {
  let newJobApplication;

  try {
    const { userID, jobID } = req.body;

    // Check if all required fields are present
    if (!userID || !jobID) {
      return res.status(400).json({ error: "Both userID and jobID are required" });
    }

    // Validate that userID and jobID are numbers
    if (typeof userID !== 'number' || typeof jobID !== 'number') {
      return res.status(400).json({ error: "userID and jobID must be numbers" });
    }

    // Check if the user has already applied for any jobs
    const existingApplication = await JobApply.findOne({ userID });

    if (existingApplication) {
      // Check if the user has already applied for the specific job
      const jobExists = existingApplication.jobIDs.find(job => job.jobId === jobID);

      if (jobExists) {
        return res.status(400).json({ error: "You have already applied for this job" });
      }

      // Append the new jobID object to the existing array of jobIDs
      existingApplication.jobIDs.push({ jobId: jobID, isApplied: true });
      await existingApplication.save();
    } else {
      // Create a new job application instance with an array of jobIDs
      newJobApplication = new JobApply({
        userID,
        jobIDs: [{ jobId: jobID, isApplied: true }],
      });

      // Save the new job application to the database
      await newJobApplication.save();
    }

    // Find the job in the job database
    const job = await Job.findOne({ jobId: jobID });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if the userID already exists in the userIDs array
    if (!job.userIDs.includes(userID)) {
      // Append the userID to the userIDs array
      job.userIDs.push(userID);
      await job.save();
    }

    res.status(201).json({
      message: "Job application submitted successfully",
      application: existingApplication || newJobApplication,
    });
  } catch (error) {
    console.error("Error in applyForJob:", error);

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors });
    }

    // Check for duplicate application (if you still want to handle this)
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Generic error handler
    res.status(500).json({ error: "Internal server error" });
  }
};

const checkApplied = async (req, res) => {
  try {
    const { userID, jobID } = req.body;

    // Check if all required fields are present
    if (!userID || !jobID) {
      return res.status(400).json({ error: "Both userID and jobID are required" });
    }

    // Validate that userID and jobID are numbers
    if (typeof userID !== 'number' || typeof jobID !== 'number') {
      return res.status(400).json({ error: "userID and jobID must be numbers" });
    }

    // Check if the user has any applications
    const existingApplication = await JobApply.findOne({ userID });

    // Check if the application exists and if the specific jobId is in jobIDs
    const isApplied = existingApplication
      ? existingApplication.jobIDs.some(job => job.jobId === jobID && job.isApplied)
      : false;

    // Construct the response object
    const responseData = {
      isApplied // Set isApplied to true if an application exists for that jobId
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in checkApplied:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const appliedJobs = async (req, res) => {
  try {
    const { userID } = req.query; // Retrieve userID from query parameters

    // Validate that userID is provided
    if (!userID) {
      return res.status(400).json({ error: "userID is required" });
    }



    // Fetch the job application for the given userID
    const application = await JobApply.findOne({ userID });

    // Check if the application exists
    if (!application || !application.jobIDs || application.jobIDs.length === 0) {
      return res.status(404).json({ message: "No applications found for this user" });
    }

    // Extract jobIDs from the application
    const jobIDs = application.jobIDs.map(job => job.jobId);

    // Fetch all jobs concurrently using Promise.all
    const foundJobs = await Promise.all(
      jobIDs.map(async (jobId) => await Job.findOne({ jobId }))
    );

    // Filter out any null results (jobs not found)
    const validJobs = foundJobs.filter(job => job !== null);

    // Check if any valid jobs were found
    if (validJobs.length === 0) {
      return res.status(404).json({ message: "No jobs found for the applied job IDs" });
    }

    // Return the valid jobs as a JSON response
    res.status(200).json({
      message: "Applied jobs retrieved successfully",
      jobs: validJobs,
    });
  } catch (error) {
    console.error("Error in appliedJobs:", error);

    // Generic error handler
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAppliedJobs = async (req, res) => {
  try {


    // Find the job applications for the user
    const applications = await JobApply.find({});

    if (!applications) {
      return res.status(404).json({ error: 'No job found' });
    }

    // Return all the data as JSON
    res.status(200).json(applications);

  } catch (error) {
    console.error("Error in getAppliedJobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { applyJob, checkApplied, appliedJobs, getAppliedJobs };
