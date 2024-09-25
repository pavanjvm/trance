const shortlistedSchema = require("./models/shortlisted");

const postShortlisted = async (req, res) => {
  try {
    const { userID, jobId } = req.body;
    console.log(userID);

    // Check if all required fields are present
    const requiredFields = ['userID', 'jobId'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Create a new shortlisted instance
    const newShortlisted = new shortlistedSchema({
      userID,
      jobId,
      dateShortlisted: new Date() // Set dateShortlisted to current date
    });

    // Save the shortlisted entry to the database
    await newShortlisted.save();
    // allapplic

    res.status(201).json({
      message: "Job shortlisted successfully",
      shortlisted: newShortlisted
    });
  } catch (error) {
    console.error("Error in postShortlisted:", error);

    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors });
    }

    // Generic error handler
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { postShortlisted };