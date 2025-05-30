import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Declaring global variables and update these values inside renderScatterPlot
let xScale;
let yScale;

let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits; // Will get updated as user changes slider

// Single loadData function with row conversion
async function loadData() {
    try {
        const data = await d3.csv('loc.csv', (row) => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + 'T00:00' + row.timezone),
            datetime: new Date(row.datetime),
        }));
        
        // console.log('Loaded data:', data);
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Process commits function
function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            
            let ret = {
                id: commit,
                url: 'https://github.com/YOUR_REPO/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };
            
            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false,
                configurable: true,
                writable: true
            });
            
            return ret;
        });
}

function renderCommitInfo(data, commits) {
    // Clear the stats div first
    const statsDiv = d3.select('#stats');
    statsDiv.html('');
    
    // Create a container for the summary
    const summaryContainer = statsDiv.append('div')
        .attr('class', 'summary-container');
    
    // Add the title
    summaryContainer.append('h2')
        .text('Summary');
    
    // Create a flex container for the stats
    const statsGrid = summaryContainer.append('div')
        .attr('class', 'stats-grid');
    
    // Helper function to add a stat
    const addStat = (label, value) => {
        const statItem = statsGrid.append('div')
            .attr('class', 'stat-item');
        
        statItem.append('div')
            .attr('class', 'stat-label')
            .text(label);
        
        statItem.append('div')
            .attr('class', 'stat-value')
            .text(value);
    };
    
    // Calculate stats for your specific headings
    
    // Total commits
    addStat('TOTAL COMMITS', commits.length);
    
    // Number of files
    const uniqueFiles = new Set(data.map(d => d.file)).size;
    addStat('NUMBER OF FILES', uniqueFiles);
    
    // Total lines of code
    addStat('TOTAL LINES OF CODE', data.length);
    
    // Average file length
    const avgFileLength = d3.mean(data, (d) => d.length).toFixed(2);
    addStat('AVERAGE FILE LENGTH', avgFileLength);
    
    // Most active time of day
    const hourGroups = d3.groups(data, (d) => {
        const hour = d.datetime.getHours();
        if (hour >= 6 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
    });
    
    const mostActiveTime = hourGroups.sort((a, b) => 
        d3.descending(a[1].length, b[1].length)
    )[0][0];
    
    addStat('MOST WORK DONE AT', mostActiveTime.toUpperCase());
    
    // Most active day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayGroups = d3.groups(data, (d) => d.date.getDay());
    const mostActiveDay = dayGroups.sort((a, b) => 
        d3.descending(a[1].length, b[1].length)
    )[0][0];
    
    addStat('MOST WORK DONE ON', daysOfWeek[mostActiveDay].toUpperCase());
}

// Function to update files display
function updateFilesDisplay() {
    let lines = filteredCommits.flatMap((d) => d.lines);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
      })
      // Sort files by number of lines in descending order
      .sort((a, b) => b.lines.length - a.lines.length); 

    // D3 Create the HTML we want
    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
            // This code only runs when the div is initially rendered
            (enter) =>
                enter.append('div').call((div) => {
                    div.append('dt').append('code');
                    div.append('dd');
                }),
        );

    // This code updates the div info
    filesContainer.select('dt > code').html((d) => `${d.name}<small style="display: block; font-size: 0.8em; opacity: 0.7;">${d.lines.length} lines</small>`);
    // append one div for each line
    filesContainer
        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);
}

// Defining renderScatterPlot function
function renderScatterPlot(data, commits) {
    // Calculate range of edited lines across all commits
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    // Create scale for radius - MOVED UP BEFORE USAGE
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);
    
    // Sort commits by total lines in descending order (ensures large dots are rendered first and smaller dots are drawn on top)
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const width = 1000;
    const height = 600;
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();
      
    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    // Add circles to SVG
    const dots = svg.append('g').attr('class', 'dots');
    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d)  => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    // Adding axes
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3
        .axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
        // d % 24 uses remainder operator to get 0 instead of 24
        // String(d % 24) converts the number to a string
        // string.padStart() formats it as a two digit number
        // append ':00' to make it look like a time

    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);

    // Update brush initialization is inside the render scatterplot function as it is part of the graph
    // Create brush with event handlers
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
}

// Main execution
try {
    const data = await loadData();
    
    if (data && data.length > 0) {
        const commits = processCommits(data);
        // Store in window for access in event handlers
        window.data = data;
        window.commits = commits;

        filteredCommits = commits; // Initialize filteredCommits with all commits
        
        renderCommitInfo(data, commits);
        renderScatterPlot(data, commits);
        
        // Initialize time scale and slider after data is loaded
        timeScale = d3
            .scaleTime()
            .domain([
                d3.min(commits, (d) => d.datetime),
                d3.max(commits, (d) => d.datetime),
            ])
            .range([0, 100]);

        commitMaxTime = timeScale.invert(commitProgress);

        // Add event listener to slider
        document.getElementById('time-slider').addEventListener('input', onTimeSliderChange);

        // Initialize the display
        onTimeSliderChange();
        
        console.log('Commits:', commits);
    } else {
        console.error('No data loaded');
        document.getElementById('stats').textContent = 'Error loading data';
    }
} catch (error) {
    console.error('Error in main execution:', error);
    document.getElementById('stats').textContent = 'Error: ' + error.message;
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('tooltip-time'); // Changed from 'commit-time'
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

// Positioning the tooltip near the mouse cursor
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

// BRUSHING
  
// Setting up the brush
function createBrushSelector(svg) {
    svg.call(d3.brush());
}

// Making brush to actually select dots
function brushed(event) {
    // console.log(event);
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    // Return true if commit is within brushSelection
    // and false if not
    if (!selection) { 
        return false; } 
    const [x0, x1] = selection.map((d) => d[0]); 
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac); 
    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
}

function renderSelectionCount(selection) {
    const data = window.data; // Access global data
    const commits = window.commits; // Access global commits
    
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
    
    // Render language breakdown
    
    // function renderLanguageBreakdown(selection, selectedCommits) {
    const languageStats = document.getElementById('language-breakdown');
    
    if (!selection || selectedCommits.length === 0) {
        languageStats.innerHTML = '';
        return;
    }
    
    // Get all the lines from selected commits
    const selectedLines = selectedCommits.flatMap(commit => commit.lines || []);
    
    // Group by file extension
    const languageGroups = d3.group(selectedLines, d => {
        if (!d || !d.file) return 'UNKNOWN';
        const ext = d.file.split('.').pop().toLowerCase();
        switch(ext) {
            case 'js': return 'JS';
            case 'css': return 'CSS';
            case 'html': return 'HTML';
            default: return ext.toUpperCase();
        }
    });
    
    // Calculate totals
    const totalLines = selectedLines.length;
    
    if (totalLines === 0) {
        languageStats.innerHTML = '';
        return;
    }
    
    // Create columns layout
    let htmlContent = '<div class="language-columns">';
    
    for (const [language, lines] of languageGroups) {
        const lineCount = lines.length;
        const percentage = ((lineCount / totalLines) * 100).toFixed(1);
        
        htmlContent += `
            <div class="language-column">
                <div class="language-title">${language}</div>
                <div class="language-lines">${lineCount} lines</div>
                <div class="language-percent">(${percentage}%)</div>
            </div>
        `;
    }
    
    htmlContent += '</div>';
    languageStats.innerHTML = htmlContent;
}

// IMPLEMENTING SLIDER

// Event Listener for Slider
function onTimeSliderChange() {
    // Update commitProgress to Slider Value
    commitProgress = parseFloat(document.getElementById('time-slider').value);
    
    // Update commitMaxTime using timeScale.invert
    commitMaxTime = timeScale.invert(commitProgress);
    
    // Update <Time> Element to display commit time
    document.getElementById('commit-time').textContent = commitMaxTime.toLocaleString('en', {
        dateStyle: 'long',
        timeStyle: 'short',
    });

    // Filter commits based on commitMaxTime - USE WINDOW VARIABLES
    filteredCommits = window.commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(window.data, filteredCommits);
    
    // Update files display if #files element exists
    if (document.getElementById('files')) {
        updateFilesDisplay();
    }
}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // remove the old x-axis code, then replace with:
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}