// import required functions
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// fetch and filter projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// select the projects container
const projectsContainer = document.querySelector('.projects');

// render latest projects
renderProjects(latestProjects, projectsContainer, 'h3');

// parsing response from github api
const githubData = await fetchGitHubData('jennifertchang');

// select container element where github profile stats will be displayed
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }