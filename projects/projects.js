// importing functions
import { fetchJSON, renderProjects } from '../global.js';

// fetching project data
const projects = await fetchJSON('../lib/projects.json');

// selecting the projects container
const projectsContainer = document.querySelector('.projects');

// add count to title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
  const count = Array.isArray(projects) ? projects.length : 1;
  projectsTitle.textContent = `${count} Projects`;
}

// rendering the projects
// renderProjects(projects, projectsContainer, 'h2');

// Check if projects is an array
if (Array.isArray(projects)) {
    // Clear the container first (once for all projects)
    projectsContainer.innerHTML = '';
    
    // Create and render each project
    projects.forEach(project => {
      // Create a container for this specific project
      const projectElement = document.createElement('article');
      projectsContainer.appendChild(projectElement);
      
      // Render the individual project
      renderProjects(project, projectElement, 'h2');
    });
  } else {
    // If it's a single project object, render it directly
    renderProjects(projects, projectsContainer, 'h2');
  }