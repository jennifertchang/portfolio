console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define your site pages
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/jennifertchang', title: 'GitHub' }
];

// Set base path based on whether we're running locally or on GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";  // GitHub Pages repo name 

// Create navigation element
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add links to navigation
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Check if URL is relative (doesn't start with http) and adjust accordingly
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }


  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Add target="_blank" to external links
  if (url.startsWith('http') && !url.includes(location.host)) {
    a.target = "_blank";
  }

  // Check if this is the current page and add the 'current' class if it is
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }

  // Add the link to the navigation
  nav.append(a);
}

// Add theme switcher
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
);

// Function to set the color scheme
function setColorScheme(colorScheme) {
  // Apply the color scheme to the root element
  document.documentElement.style.setProperty('color-scheme', colorScheme);

  // Save the preference to localStorage
  localStorage.colorScheme = colorScheme;
}

// Get the select element
const select = document.querySelector('.color-scheme select');

// Check if there's a saved preference in localStorage
if ("colorScheme" in localStorage) {
  // Apply the saved preference
  setColorScheme(localStorage.colorScheme);

  // Update the select element to match
  select.value = localStorage.colorScheme;
}

// Add event listener to handle changes
select.addEventListener('input', function (event) {
  setColorScheme(event.target.value);
});

// Optional: Show current system theme in the Auto option
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const autoOption = select.querySelector('option[value="light dark"]');
autoOption.textContent = `Automatic (${prefersDark ? 'Dark' : 'Light'})`;

// Code below handles the Contact Form Page
// Get reference to the contact form (if it exists on the current page)
const contactForm = document.querySelector('form[action^="mailto:"]');

// Add event listener if the form exists
contactForm?.addEventListener('submit', function (event) {
  // Prevent default form submission
  event.preventDefault();

  // Get form data
  const data = new FormData(this);
  console.log(data);

  // Start building the mailto URL with the action (email address)
  let url = this.action;

  // Add a question mark to start the parameters
  url += '?';

  // Add each form field as a parameter
  let params = [];
  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  // Join all parameters with &
  url += params.join('&');

  // Open the email client with the properly formatted URL
  location.href = url;
});


// importing project data into projects page
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    // handling errors (ensures fetch request was successful)
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response);

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Creating a renderProjects Function
  
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Check if containerElement exists
  if (!containerElement) {
    console.error('Container element is null or undefined');
    return;
  }
  
  // ensures container is empty to avoid duplication
  containerElement.innerHTML = '';

  // Handle both arrays and single projects
  if (Array.isArray(projects)) {
    // Create and render each project
    projects.forEach(project => {
      if (project && project.title) {  // Check if project is valid
        // Create a new article for this project
        const article = document.createElement('article');
        
        // Define the content dynamically with fallbacks for missing data
        article.innerHTML = `
          <${headingLevel}>${project.title}</${headingLevel}>
          <img src="${project.image || '#'}" alt="${project.title}">
          <p>${project.description || 'No description available.'}</p>
        `;
        
        // Append to container
        containerElement.appendChild(article);
      }
    });
  } else if (projects && projects.title) {
    // Handle single project
    const article = document.createElement('article');
    
    // Define the content dynamically
    article.innerHTML = `
      <${headingLevel}>${projects.title}</${headingLevel}>
      <img src="${projects.image || '#'}" alt="${projects.title}">
      <p>${projects.description || 'No description available.'}</p>
    `;

    // Append the <article> element to the provided containerElement
    containerElement.appendChild(article);
  } else {
    console.error('Invalid project data provided');
    containerElement.innerHTML = '<p>No project data available</p>';
  }
}

// fetch data from github api
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
