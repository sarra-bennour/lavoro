const { GoogleGenAI } = require('@google/genai'); 
const genAI = new GoogleGenAI({ apiKey: "AIzaSyBhOHuAkp504kk4bfCmCXheEZQD2u8f_v8" });
const Task = require('../models/Task');
const mongoose = require('mongoose');

async function generateAITasks(projectId, projectName, projectDescription) {
    try {
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid project ID");
      }
  
      const existingTasks = await Task.find({ project_id: projectId }).select('title -_id');
      const existingTaskTitles = existingTasks.map(t => t.title);
      
        // Preparing the input for the AI model
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              parts: [
                { text: `You are a project manager. Generate **5-8 new, unique IT-related tasks** for this project.
                    
**Avoid repeating** these existing tasks: ${existingTaskTitles.join(", ") || "None yet"}
      
**Project Name:** ${projectName}
**Description:** ${projectDescription}
deadlines and start_date should be in the future and between project start and end dates


For each task, return a JSON array with:
- title: string (e.g., "Implement user login")
- description: string 
- priority: "Low", "Medium", or "High" (based on impact)
- status: "Not Started" (default)
- deadline: YYYY-MM-DD (within 3 months, logical order)
- start_date: YYYY-MM-DD (before deadline)
- estimated_duration: number (days)
- tags: string[] (e.g., ["backend", "auth"])
- requiredSkills: string[] (e.g., ["JavaScript", "React", "Node.js"])

Return ONLY the JSON array. Example:
[
  {
    "title": "Design database schema",
    "description": "Create collections for user and project data.",
    "priority": "High",
    "status": "Not Started",
    "deadline": "2025-09-15",
    "start_date": "2025-09-10",
    "estimated_duration": 3,
    "tags": ["backend", "database"]
    "requiredSkills": ["MongoDB", "Database Design"]
  }
]` }
              ]
            }
          ]
        });
    
        // Process and log the AI response
        console.log("AI Response:", response.text);
        return response.text;
      } catch (error) {
    console.error("AI task generation failed:", error);
    throw new Error(`AI Error: ${error.message}`);
  }
}

// Example usage:
 //generateAITasks("123", "EcoTracker", "A carbon footprint app")
//  .then(tasks => console.log(tasks));
/*
(async () => {
    const projectId = "67f92d3eb11be2926f42a473"; // Your test ID
    const tasks = await generateAITasks(
      projectId,
      "EcoTracker",
      "A carbon footprint tracking app"
    );
    
    console.log("Generated Tasks:", tasks);
  })();*/

module.exports = { generateAITasks };