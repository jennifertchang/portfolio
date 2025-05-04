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

// Track selected year value for persistence
let selectedYear = '';

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

// Apply filtering based on current state (selected year and search query)
function applyFilters() {
  let filteredProjects = projects;
  
  // Apply year filter if active
  if (selectedIndex !== -1 && selectedYear) {
    filteredProjects = filteredProjects.filter(project => project.year === selectedYear);
  }
  
  // Apply search filter if there's a query
  if (query) {
    filteredProjects = filteredProjects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }
  
  // Render the filtered projects
  renderFilteredProjects(filteredProjects);
  
  // Update the pie chart with filtered data, but maintain the selection
  renderPieChart(filteredProjects);
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
  
  // Find the index of the previously selected year in the new data
  if (selectedYear && selectedIndex !== -1) {
    const newSelectedIndex = newData.findIndex(d => d.label === selectedYear);
    // Update selectedIndex if the year still exists in the filtered data
    selectedIndex = newSelectedIndex !== -1 ? newSelectedIndex : -1;
    // If the selected year is no longer in the data, clear the selection
    if (newSelectedIndex === -1) {
      selectedYear = '';
    }
  }
  
  // Create the pie chart segments with click events
  newArcs.forEach((arc, index) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(index))
      .attr('class', newData[index].label === selectedYear ? 'selected' : '')
      .on('click', () => {
        // Toggle selection - if already selected, deselect it
        if (selectedYear === newData[index].label) {
          selectedIndex = -1;
          selectedYear = '';
        } else {
          selectedIndex = index;
          selectedYear = newData[index].label;
        }
        
        // Update class on all pie segments
        newSVG
          .selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
        // Update class on all legend items
        legend
          .selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
        // Apply filters based on current state
        applyFilters();
      });
  });
  
  // Use D3 to create all <li> tags with click handlers
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', d.label === selectedYear ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Mirror the same click behavior as the pie segments
        if (selectedYear === d.label) {
          selectedIndex = -1;
          selectedYear = '';
        } else {
          selectedIndex = idx;
          selectedYear = d.label;
        }
        
        // Update class on all pie segments
        newSVG
          .selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');
        
        // Update class on all legend items
        legend
          .selectAll('li')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');
        
        // Apply filters based on current state
        applyFilters();
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
  
  // Apply filters based on current state
  applyFilters();
});