// ===================================================================
// PROGRESS JOURNAL - MAIN APP CONTROLLER
// ===================================================================

// Global state
let currentView = 'dashboard-empty';
let currentProjectId = null;
let newProjectData = { 
    goal: null, 
    deadline: null, 
    deadlineType: null, 
    startingPoint: null, 
    generatedPlan: null, 
    wizardType: null 
};

// Timer state
let pomodoroTimer = {
    timeLeft: 25 * 60,
    isRunning: false,
    interval: null
};

// DOM Elements
const appContent = document.getElementById('app-content');

// ===================================================================
// CORE NAVIGATION & VIEW MANAGEMENT
// ===================================================================

async function navigateTo(viewId, params = {}) {
    console.log(`Navigating to: ${viewId}`, params);
    
    // Store params for views that need them
    if (params.projectId) {
        currentProjectId = params.projectId;
    }
    
    try {
        const response = await fetch(`${viewId}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${viewId}.html`);
        }
        const html = await response.text();
        appContent.innerHTML = html;
        currentView = viewId;
        updateNavState();
        await runViewSpecificScripts();
    } catch (error) {
        console.error('Navigation failed:', error);
        appContent.innerHTML = `<div class="error-state"><h1>Fehler</h1><p>Die Seite konnte nicht geladen werden.</p></div>`;
    }
}

function updateNavState() {
    document.querySelectorAll('.app-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.nav === currentView || 
            (currentView.includes('dashboard') && item.dataset.nav === 'dashboard-empty') ||
            (currentView.includes('project-detail') && item.dataset.nav === 'projects-content')) {
            item.classList.add('active');
        }
    });
}

// ===================================================================
// VIEW-SPECIFIC RENDERING & LOGIC
// ===================================================================

async function runViewSpecificScripts() {
    // Common scripts for all views
    setupHamburgerMenu();
    setupWizardTriggers();
    
    // View-specific logic
    switch (currentView) {
        case 'dashboard-empty':
            renderEmptyDashboard();
            break;
        case 'dashboard-filled-content':
            renderDashboard();
            break;
        case 'projects-content':
            renderAllProjects();
            break;
        case 'project-detail-content':
            renderProjectDetail();
            break;
        case 'today-content':
            renderTodayView();
            break;
        case 'inbox-content':
            renderInboxView();
            break;
        case 'timeline-content':
            renderTimelineView();
            break;
        case 'settings-content':
            renderSettingsView();
            break;
    }
}

// ===================================================================
// DASHBOARD RENDERING
// ===================================================================

function renderEmptyDashboard() {
    // Empty dashboard is static, just needs wizard trigger
    console.log('Empty dashboard rendered');
}

function renderDashboard() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    const activeProjects = mockDB.getActiveProjects().slice(0, 3); // Show max 3 on dashboard
    
    let html = '';
    activeProjects.forEach(project => {
        html += createProjectCardHTML(project);
    });
    
    // Add placeholder card
    html += `
        <div class="project-card-placeholder" id="add-project-placeholder">
            <span class="material-icons">add_circle_outline</span>
            <span>Neues Projekt hinzufügen</span>
        </div>
    `;
    
    projectsGrid.innerHTML = html;
    
    // Add click handlers
    setupProjectCardHandlers();
}

function renderAllProjects() {
    const projectsGrid = document.getElementById('all-projects-grid');
    if (!projectsGrid) return;
    
    const activeProjects = mockDB.getActiveProjects();
    
    let html = '';
    activeProjects.forEach(project => {
        html += createProjectCardHTML(project);
    });
    
    // Add placeholder card
    html += `
        <div class="project-card-placeholder" id="add-project-placeholder">
            <span class="material-icons">add_circle_outline</span>
            <span>Neues Projekt hinzufügen</span>
        </div>
    `;
    
    projectsGrid.innerHTML = html;
    setupProjectCardHandlers();
}

function createProjectCardHTML(project) {
    return `
        <div class="project-card" data-project-id="${project.id}">
            <div class="card-header">
                <h2 class="project-title">${project.title}</h2>
                <span class="material-icons card-menu">more_vert</span>
            </div>
            <div class="card-body">
                <p class="next-milestone">NÄCHSTER MEILENSTEIN:</p>
                <p class="milestone-title">${project.nextMilestone?.title || 'Keine Meilensteine'}</p>
            </div>
            <div class="card-footer">
                <div class="progress-info">
                    <span class="progress-label">Fortschritt</span>
                    <span class="progress-percent">${project.progress}%</span>
                </div>
                <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: ${project.progress}%;"></div>
                </div>
            </div>
        </div>
    `;
}

// ===================================================================
// PROJECT DETAIL RENDERING
// ===================================================================

function renderProjectDetail() {
    if (!currentProjectId) return;
    
    const project = mockDB.getProjectById(currentProjectId);
    if (!project) return;
    
    // Update project header
    const projectTitle = document.getElementById('project-title');
    const progressFill = document.getElementById('project-progress-fill');
    
    if (projectTitle) projectTitle.textContent = project.title;
    if (progressFill) progressFill.style.width = `${project.progress}%`;
    
    // Render timeline
    const timeline = document.getElementById('project-timeline');
    if (!timeline) return;
    
    let html = '';
    project.milestones.forEach((milestone, index) => {
        const isLast = index === project.milestones.length - 1;
        html += `
            <div class="milestone ${milestone.status === 'current' ? 'current' : ''}">
                <div class="milestone__line" ${isLast ? 'style="display: none;"' : ''}></div>
                <div class="milestone__icon"><span class="material-icons">flag</span></div>
                <div class="milestone__content">
                    <div class="milestone__header">
                        <h3>${milestone.title}</h3>
                        <span>${milestone.duration}</span>
                    </div>
                    ${milestone.tasks?.length ? createTaskListHTML(milestone.tasks, project.id) : ''}
                </div>
            </div>
        `;
    });
    
    timeline.innerHTML = html;
    setupTaskHandlers();
}

function createTaskListHTML(tasks, projectId) {
    let html = '<ul class="task-list">';
    tasks.forEach(task => {
        html += `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" data-project-id="${projectId}">
                <span class="task-checkbox">
                    ${task.completed ? '<span class="material-icons">check</span>' : ''}
                </span>