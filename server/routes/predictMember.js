const express = require('express');
const router = express.Router();
const teamMemberController = require('../controllers/teamMemberController');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Team = require('../models/team');



const { spawn } = require("child_process");
const teamMember = require("../models/teamMember");
const PredictMember = require("../models/PredictMember"); // Import the PredictMember model
const User = require("../models/user");


router.get("/predict-all", async (req, res) => {
    try {
        // Step 1: Fetch all team members with user details
        const members = await teamMember.find({})
            .populate({
                path: 'user_id',
                select: 'firstName lastName image',
                model: 'user' // Explicitly specify the model
            })
            .populate({
                path: 'team_id',
                select: 'name project_id',
                populate: {
                  path: 'project_id',
                  select: 'name' // Assuming your Project model has a 'name' field
                }
              });

        if (!members.length) return res.status(404).send("No members found");

        // Step 2: Predict all members and handle potential undefined user
        const predictionResults = [];
        for (const member of members) {
            const prediction = await predictMember(member);

            // Safely handle user details
            const userDetails = member.user_id ? {
                name: `${member.user_id.firstName || ''} ${member.user_id.lastName || ''}`.trim(),
                image: member.user_id.image
            } : {
                name: 'Unknown User',
                image: ''
            };

            predictionResults.push({
                ...prediction,
                team_id: member.team_id,
                user_id: member.user_id ? member.user_id._id : null,
                user_details: userDetails,
                role: member.role,
                experience_level: member.experience_level,
                total_tasks_completed: member.total_tasks_completed,
            });

        }

        // Step 3: Sort by performance_score (descending)
        const sortedPredictions = predictionResults.sort((a, b) =>
            b.predicted_score - a.predicted_score
        );

        // Step 4: Clear existing predictions
        await PredictMember.deleteMany({});

        // Step 5: Save sorted predictions with rank
        const savePromises = sortedPredictions.map((prediction, index) => {
           return new PredictMember({
    team_id: prediction.team_id,
    user_id: prediction.user_id,
    user_name: prediction.user_details.name,
    user_image: prediction.user_details.image,
    team_name: prediction.team_id?.name,
    project_id: prediction.team_id?.project_id?._id,
    project_name: prediction.team_id?.project_id?.name,

    experience_level: prediction.experience_level,
    total_tasks_completed: prediction.total_tasks_completed,
    role: prediction.role,
    productivity: prediction.predicted_productivity,
    performance_score: prediction.predicted_score,
    rank: index + 1,
    predicted_at: new Date()
}).save();

        });

        await Promise.all(savePromises);

        // Prepare response with top 3 members including user details
        const topThree = sortedPredictions.slice(0, 3).map(prediction => ({
            predicted_score: prediction.predicted_score,
            predicted_productivity: prediction.predicted_productivity,
            experience_level: prediction.experience_level,
            total_tasks_completed: prediction.total_tasks_completed,
            performance_score: prediction.performance_score,
            user: {
                _id: prediction.user_id, // Include the user ID
                name: prediction.user_details.name,
                image: prediction.user_details.image
            },
            team_name: prediction.team_id?.name,
            project_id: prediction.team_id?.project_id?._id,
            project_name: prediction.team_id?.project_id?.name,
            rank: sortedPredictions.indexOf(prediction) + 1
        }));

        res.send({
            message: `Successfully predicted and ranked ${members.length} members`,
            results: topThree
        });

    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).send("Internal server error");
    }
});


router.get("/all", async (_req, res) => {
    const members = await PredictMember.find({});
    return res.status(200).json({
        message: "All users fetched successfully",
        members: members
    });
});


function predictMember(member) {
    return new Promise((resolve, reject) => {
        const python = spawn("python", [
            "ML/predict_score.py",
            JSON.stringify(member)
        ]);

        let output = "";
        python.stdout.on("data", (data) => output += data.toString());
        python.stderr.on("data", (data) => console.error(`stderr: ${data}`));

        python.on("close", (code) => {
            if (code !== 0) return reject("Prediction failed");
            resolve(JSON.parse(output));
        });
    });
}


router.get('/award/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;

      // Validate the userId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const predictMember = await PredictMember.findOne({ user_id: userId })
        .select('-__v') // Exclude version key
        .lean(); // Convert to plain JavaScript object

      if (!predictMember) {
        return res.status(404).json({ error: 'PredictMember data not found' });
      }

      res.json(predictMember);
    } catch (error) {
      console.error('Error fetching predictMember:', error);
      res.status(500).json({ error: 'Server error while fetching predictMember data' });
    }
  });

// New endpoint to award a badge to a user
router.post('/award/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate the userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the predict member to get their rank
    const predictMember = await PredictMember.findOne({ user_id: userId }).lean();
    if (!predictMember) {
      return res.status(404).json({ error: 'PredictMember data not found' });
    }

    // Check if the user already has a performance award
    const existingAward = user.awards && user.awards.find(award =>
      award.type === 'performance' && award.name === 'Top Performer'
    );

    if (existingAward) {
      return res.status(400).json({
        error: 'User already has this award',
        award: existingAward
      });
    }

    // Create the award based on rank
    let awardDetails;
    if (predictMember.rank === 1) {
      awardDetails = {
        type: 'performance',
        name: 'Top Performer',
        description: 'Awarded for being the #1 performer in the team',
        icon: 'ri-trophy-line gold'
      };
    } else if (predictMember.rank === 2) {
      awardDetails = {
        type: 'performance',
        name: 'Silver Performer',
        description: 'Awarded for being the #2 performer in the team',
        icon: 'ri-medal-line silver'
      };
    } else if (predictMember.rank === 3) {
      awardDetails = {
        type: 'performance',
        name: 'Bronze Performer',
        description: 'Awarded for being the #3 performer in the team',
        icon: 'ri-award-line bronze'
      };
    } else {
      awardDetails = {
        type: 'recognition',
        name: 'Team Contributor',
        description: 'Recognized for valuable contributions to the team',
        icon: 'ri-team-line'
      };
    }

    // Add the award to the user
    if (!user.awards) {
      user.awards = [];
    }
    user.awards.push(awardDetails);
    await user.save();

    res.json({
      message: 'Award added successfully',
      award: awardDetails,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        awards: user.awards
      }
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Server error while awarding badge' });
  }
});


router.get("/predict/:id", async (req, res) => {
    try {
        const member = await teamMember.findById(req.params.id);
        if (!member) return res.status(404).send("Member not found");

        const python = spawn("python", [
            "ML/predict_score.py",
            JSON.stringify(member)
        ]);

        let output = "";
        python.stdout.on("data", (data) => {
            output += data.toString();
        });

        python.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });

        python.on("close", async (code) => {
            if (code !== 0) return res.status(500).send("Prediction failed");

            const predictionResult = JSON.parse(output);

            // Save prediction to PredictMember collection
            const newPrediction = new PredictMember({
                team_id: member.team_id, // Assuming team_id exists in the original member
                user_id: member.user_id,    // The ID of the team member
                role: member.role,      // Their role (e.g., 'Developer')
                productivity: predictionResult.predicted_productivity,
                performance_score: predictionResult.predicted_score
            });

            await newPrediction.save();

            // Send the prediction result back to the client
            res.send({
                ...predictionResult,
                savedToDatabase: true // Optional: Confirm it was saved
            });
        });
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).send("Internal server error");
    }
});


module.exports = router;




