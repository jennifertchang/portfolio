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
: "/jennifertchang/";  // GitHub Pages repo name - Change this to your actual GitHub username/repo

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
  select.addEventListener('input', function(event) {
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
contactForm?.addEventListener('submit', function(event) {
  // Prevent default form submission
  event.preventDefault();
  
  // Get form data
  const data = new FormData(this);
  
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