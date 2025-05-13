const { GoogleGenAI } = require('@google/genai'); 

const ai = new GoogleGenAI({ apiKey: "AIzaSyBhOHuAkp504kk4bfCmCXheEZQD2u8f_v8" });

async function predictProjectFields(name, description) {
  try {
    // Preparing the input for the AI model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            { text: `You are an intelligent assistant that helps project managers estimate key project parameters.

Given the name and description of a project, return a JSON object with the following fields:

            - budget: number (estimated in USD)
            - duration: number (estimated months)
            - task_count: estimated number of tasks
            - team_member_count: number of people required
            - priority: one of ["Low", "Medium", "High"]
            - risk_level: one of ["Low", "Medium", "High"]
            - Ai-description : string (AI-generated description of the project)
            - Risks : string ( 3 AI-generated risks associated with the project)
            - Tags : string (AI-generated tags related to the project)
            
            Here is the project info:

            Project Name: ${name} 
            Description: ${description}

            Return only the JSON object with your prediction.` }
          ]
        }
      ]
    });

    // Process and log the AI response
    console.log("AI Response:", response.text);
    return response.text;
  } catch (error) {
    console.error("Error during AI request:", error);
  }
}

module.exports = { predictProjectFields }; // Use module.exports for exporting
