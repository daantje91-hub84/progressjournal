// ===================================================================
// GLOBAL APP STATE
// ===================================================================
let currentView = 'dashboard-empty-content';
let currentProjectId = null;
let newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null, context_id: null };

// NEU: Zustand für den Pomodoro Timer
let pomodoroTimer = {
    DEFAULT_TIME: 25 * 60, // 25 Minuten in Sekunden
    timeLeft: 25 * 60,
    isRunning: false,
    interval: null
};

// ===================================================================
// CORE APP INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ... (unverändert)
    const hamburgerBtn = document.getElementById('hamburger');
    if (hamburgerBtn) {
        if (window.innerWidth >= 768) document.body.classList.add('sidenav-expanded');
        hamburgerBtn.addEventListener('click', () => document.body.classList.toggle('sidenav-expanded'));
    }

    document.querySelectorAll('.app-nav .nav-item').forEach(navItem => {
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(navItem.dataset.nav);
        });
    });

    navigateTo('dashboard');
});


// ===================================================================
// CORE APP NAVIGATION & VIEW MANAGEMENT
// ===================================================================
const appContent = document.getElementById('app-content');

async function navigateTo(viewId, params = {}) {
    // ... (unverändert)
    console.log(`Navigating to: ${viewId}`, params);
    if (params.projectId) currentProjectId = params.projectId;

    let viewFileToFetch = viewId;
    if (viewId === 'dashboard') {
        viewFileToFetch = mockDB.getActiveProjects().length > 0
            ? 'dashboard-filled-content'
            : 'dashboard-empty-content';
    }

    try {
        const response = await fetch(`${viewFileToFetch}.html`);
        if (!response.ok) throw new Error(`Failed to load ${viewFileToFetch}.html`);

        appContent.innerHTML = await response.text();
        currentView = viewFileToFetch;

        updateNavState();
        runViewSpecificScripts();
    } catch (error) {
        console.error('Navigation failed:', error);
        appContent.innerHTML = `<div class="error-state"><h1>Fehler</h1><p>Die Seite konnte nicht geladen werden.</p></div>`;
    }
}

function updateNavState() {
    // ... (unverändert)
    document.querySelectorAll('.app-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        const navTarget = item.dataset.nav;
        if ((navTarget === 'dashboard' && currentView.startsWith('dashboard')) ||
            (navTarget === 'projects-content' && currentView === 'project-detail-content') ||
            navTarget === currentView) {
            item.classList.add('active');
        }
    });
}

// ===================================================================
// VIEW-SPECIFIC SCRIPT LOADER
// ===================================================================
function runViewSpecificScripts() {
    // ... (unverändert)
    switch (currentView) {
        case 'dashboard-empty-content':
            setupWizardTriggers();
            break;
        case 'dashboard-filled-content':
            renderDashboard();
            break;
        case 'projects-content':
            renderProjects();
            break;
        case 'inbox-content':
            renderInbox();
            break;
        case 'today-content':
            renderToday();
            break;
        case 'project-detail-content':
            renderProjectDetails();
            break;
    }
}

// ===================================================================
// DYNAMIC CONTENT RENDERERS
// ===================================================================

function renderDashboard() { /* ... (unverändert) ... */ }
function renderProjects() { /* ... (unverändert) ... */ }
function renderInbox() { /* ... (unverändert) ... */ }

// ERSETZE DEINE ALTE renderToday-FUNKTION
function renderToday() {
    const todayList = document.getElementById('today-list');
    if (!todayList) return;

    document.getElementById('current-date').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });

    todayList.innerHTML = '';
    mockDB.todayTasks.forEach(task => {
        todayList.innerHTML += `<div class="today-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}"><div class="task-info"><span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span><span class="task-text">${task.text}</span></div><div class="task-meta"><span class="task-project-link">Projekt: <a href="#">${task.project.name}</a></span><button class="start-task-timer-btn" title="Timer für diese Aufgabe starten"><span class="material-icons">play_circle_outline</span></button></div></div>`;
    });

    // NEU: Timer initialisieren und Event-Listener hinzufügen
    updateTimerDisplay(); // Zeigt die initiale Zeit an
    document.getElementById('start-pause-btn').onclick = startPauseTimer;
    document.getElementById('reset-btn').onclick = resetTimer;
}

function renderProjectDetails() { /* ... (unverändert) ... */ }

// ===================================================================
// HELPER & WIZARD FUNCTIONS
// ... (alle Funktionen von createProjectCardHtml bis generateAiPlan bleiben unverändert)
// ===================================================================
function createProjectCardHtml(project) { /* ... */ }
function createTaskListHtml(milestone, projectId) { /* ... */ }
function addTaskListeners() { /* ... */ }
function addProjectCardListeners() { /* ... */ }
function setupWizardTriggers() { /* ... */ }
function initializeWizard() { /* ... */ }
function updateWizardState() { /* ... */ }
function nextStep() { /* ... */ }
function prevStep() { /* ... */ }
function createNewProject() { /* ... */ }
function selectWizardType(button, type) { /* ... */ }
function handleDeadlineChoice(button) { /* ... */ }
function populateContextOptions() { /* ... */ }
function populateStep3Options() { /* ... */ }
function generateAiPlan() { /* ... */ }


// ===================================================================
// NEUER ABSCHNITT: POMODORO TIMER LOGIC
// ===================================================================

function startPauseTimer() {
    const startPauseBtn = document.getElementById('start-pause-btn');
    pomodoroTimer.isRunning = !pomodoroTimer.isRunning;

    if (pomodoroTimer.isRunning) {
        startPauseBtn.innerHTML = `<span class="material-icons">pause</span> Pause`;
        // Starte das Intervall, das jede Sekunde die 'tick'-Funktion aufruft
        pomodoroTimer.interval = setInterval(tick, 1000);
    } else {
        startPauseBtn.innerHTML = `<span class="material-icons">play_arrow</span> Start`;
        // Stoppe das Intervall
        clearInterval(pomodoroTimer.interval);
    }
}

function resetTimer() {
    // Stoppe den laufenden Timer
    clearInterval(pomodoroTimer.interval);
    pomodoroTimer.isRunning = false;
    
    // Setze die Zeit zurück
    pomodoroTimer.timeLeft = pomodoroTimer.DEFAULT_TIME;
    
    // Aktualisiere die Anzeige
    updateTimerDisplay();
    document.getElementById('start-pause-btn').innerHTML = `<span class="material-icons">play_arrow</span> Start`;
}

function tick() {
    pomodoroTimer.timeLeft--;
    updateTimerDisplay();

    if (pomodoroTimer.timeLeft <= 0) {
        clearInterval(pomodoroTimer.interval);
        pomodoroTimer.isRunning = false;
        alert("Zeit abgelaufen! Zeit für eine Pause.");
        // Hier könnte man automatisch zu einem Pausen-Timer wechseln
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    const minutes = Math.floor(pomodoroTimer.timeLeft / 60);
    const seconds = pomodoroTimer.timeLeft % 60;

    // Führende Null für die Sekunden hinzufügen, wenn nötig (z.B. 25:05 statt 25:5)
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}