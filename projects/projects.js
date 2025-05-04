// importing functions
import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Define arcGenerator
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// fetching project data FIRST
let projects = await fetchJSON('../lib/projects.json');

// selecting the projects container
const projectsContainer = document.querySelector('.projects');

// add count to title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
  const count = Array.isArray(projects) ? projects.length : 1;
  projectsTitle.textContent = `${count} Projects`;
}

// Track selected index for filtering
let selectedIndex = -1;

// Function to render projects (handles both array and single object)
function renderFilteredProjects(projectsToRender) {
  if (Array.isArray(projectsToRender)) {
    // Clear the container first
    projectsContainer.innerHTML = '';
    
    // Create and render each project
    projectsToRender.forEach(project => {
      // Create a container for this specific project
      const projectElement = document.createElement('article');
      projectsContainer.appendChild(projectElement);
      
      // Render the individual project
      renderProjects(project, projectElement, 'h2');
    });
  } else {
    // If it's a single project object, render it directly
    renderProjects(projectsToRender, projectsContainer, 'h2');
  }
}

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  
  // clear up paths and legends
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();
  
  // Use the same color scale
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  // Create the pie chart segments with click events
  newArcs.forEach((arc, index) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(index))
      .on('click', () => {
        // Toggle selection - if already selected, deselect it
        selectedIndex = selectedIndex === index ? -1 : index;
        
        // Update class on all pie segments
        newSVG
          .selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
        // Update class on all legend items
        legend
          .selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
        // Filter projects based on selection
        if (selectedIndex === -1) {
          // No filter active, show all projects (filtered by search query if any)
          let filteredProjects = projects;
          if (query) {
            filteredProjects = projects.filter((project) => {
              let values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            });
          }
          renderFilteredProjects(filteredProjects);
        } else {
          // Filter by selected year
          const selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter(project => project.year === selectedYear);
          
          // Also apply search query if exists
          if (query) {
            filteredProjects = filteredProjects.filter((project) => {
              let values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            });
          }
          
          renderFilteredProjects(filteredProjects);
        }
      });
  });
  
  // Use D3 to create all <li> tags with click handlers
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Mirror the same click behavior as the pie segments
        selectedIndex = selectedIndex === idx ? -1 : idx;
        
        // Update class on all pie segments
        newSVG
          .selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');
        
        // Update class on all legend items
        legend
          .selectAll('li')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');
        
        // Filter projects based on selection (same logic as above)
        if (selectedIndex === -1) {
          // No filter active, show all projects (filtered by search query if any)
          let filteredProjects = projects;
          if (query) {
            filteredProjects = projects.filter((project) => {
              let values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            });
          }
          renderFilteredProjects(filteredProjects);
        } else {
          // Filter by selected year
          const selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter(project => project.year === selectedYear);
          
          // Also apply search query if exists
          if (query) {
            filteredProjects = filteredProjects.filter((project) => {
              let values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            });
          }
          
          renderFilteredProjects(filteredProjects);
        }
      });
  });
}

// Initial render
renderFilteredProjects(projects);

// Call this function on page load
renderPieChart(projects);

// Step 4.1: Adding a search field - declare variable to hold search query
let query = '';

// Step 4.2: Basic search functionality
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  
  // Filter projects based on current state
  let filteredProjects;
  
  if (selectedIndex === -1) {
    // No year filter, just search
    filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  } else {
    // Filter by both year and search query
    // First, get the current selected year from the legend
    const legend = d3.select('.legend');
    const legendItems = legend.selectAll('li');
    const selectedYear = legendItems.nodes()[selectedIndex].textContent.split(' ')[0];
    
    // Then filter by both year and search query
    filteredProjects = projects.filter((project) => {
      const matchesYear = project.year === selectedYear;
      const values = Object.values(project).join('\n').toLowerCase();
      const matchesQuery = values.includes(query.toLowerCase());
      return matchesYear && matchesQuery;
    });
  }
  
  // render filtered projects
  renderFilteredProjects(filteredProjects);
  // re-render legends and pie chart when event triggers
  renderPieChart(filteredProjects);
});