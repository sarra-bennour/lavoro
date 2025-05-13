const axios = require('axios');

async function createGitHubIssue(task, project) {
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    const url = `https://api.github.com/repos/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/issues`;

    const body = `
### Project: ${project.name}

**Task:** ${task.title}

**Description:**  
${task.description || '_No description provided._'}

**Priority:** ${task.priority}  
**Status:** ${task.status}  
**Deadline:** ${task.deadline ? new Date(task.deadline).toDateString() : 'N/A'}  

Created from internal task ID: \`${task._id}\`
`;

    const payload = {
      title: `[${project.name}] ${task.title}`,
      body: body,
      labels: task.tags || []
    };

    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    const response = await axios.post(url, payload, { headers });
    return response.data;
    
  } catch (error) {
    // Enhanced error logging
    console.error('GitHub API Error Details:', {
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    
    throw new Error(`Failed to create GitHub issue: ${error.message}`);
  }
}

module.exports = { createGitHubIssue };