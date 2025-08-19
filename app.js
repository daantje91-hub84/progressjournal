// ===================================================================
// GLOBALER ANWENDUNGSZUSTAND
// ===================================================================
// Der aktuelle View, der in der Haupt-Content-Sektion geladen ist.
let currentView = 'dashboard-empty-content';
// Die ID des aktuell ausgewählten Projekts (für die Detailansicht).
let currentProjectId = null;
// Temporärer Speicher für die Wizard-Daten, bis ein Projekt erstellt wird.
let newProjectData = {
    goal: null,
    deadline: null,
    deadlineType: null,
    startingPoint: null,
    generatedPlan: null,
    wizardType: null,
    context_id: null
};

// Zustand für den Pomodoro Timer
let pomodoroTimer = {
    DEFAULT_TIME: 25 * 60, // 25 Minuten in Sekunden
    timeLeft: 25 * 60,
    isRunning: false,
    interval: null,
    activeTaskId: null
};

// Zustand für den Inbox-Verarbeitungs-Wizard
let processWizardState = {
    isOpen: false,
    currentStep: 1,
    taskId: null,
    taskText: ''
};

// ===================================================================
// KERN-INITIALISIERUNG DER APP
// ===================================================================
// Wartet, bis das gesamte DOM geladen ist, bevor die App gestartet wird.
document.addEventListener('DOMContentLoaded', () => {
    // Navigations-Menü für mobile Geräte einrichten
    const hamburgerBtn = document.getElementById('hamburger');
    if (hamburgerBtn) {
        if (window.innerWidth >= 768) {
            document.body.classList.add('sidenav-expanded');
        }
        hamburgerBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidenav-expanded');
        });
    }

    // Event-Listener für die Hauptnavigation
    document.querySelectorAll('.app-nav .nav-item').forEach(navItem => {
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(navItem.dataset.nav);
        });
    });

    // Event-Listener für den "Zurück"-Button im Projekt-Detail
    document.getElementById('app-content').addEventListener('click', (e) => {
        if (e.target.closest('#back-to-projects')) {
            e.preventDefault();
            navigateTo('projects-content');
        }
    });

    initializeQuickAdd();

    // Startet die App, indem das Dashboard geladen wird.
    navigateTo('dashboard');
});


// ===================================================================
// KERN-NAVIGATION & VIEW-MANAGEMENT
// ===================================================================
const appContent = document.getElementById('app-content');

/**
 * Lädt einen neuen View in die Haupt-Content-Sektion der App.
 * @param {string} viewId - Die ID des zu ladenden Views (z.B. 'dashboard-empty-content').
 * @param {object} [params={}] - Optionale Parameter für den View (z.B. projectId).
 */
async function navigateTo(viewId, params = {}) {
    console.log(`Navigiere zu: ${viewId}`, params);
    if (params.projectId) {
        currentProjectId = params.projectId;
    }

    let viewFileToFetch = viewId;
    if (viewId === 'dashboard') {
        viewFileToFetch = mockDB.getActiveProjects().length > 0 ?
            'dashboard-filled-content' :
            'dashboard-empty-content';
    }

    try {
        const response = await fetch(`${viewFileToFetch}.html`);
        if (!response.ok) {
            throw new Error(`Laden von ${viewFileToFetch}.html fehlgeschlagen`);
        }

        appContent.innerHTML = await response.text();
        currentView = viewFileToFetch;

        updateNavState();
        runViewSpecificScripts();
    } catch (error) {
        console.error('Navigation fehlgeschlagen:', error);
        appContent.innerHTML = `<div class="error-state"><h1>Fehler</h1><p>Die Seite konnte nicht geladen werden.</p></div>`;
    }
}

/**
 * Aktualisiert den aktiven Zustand der Navigationslinks.
 */
function updateNavState() {
    document.querySelectorAll('.app-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        const navTarget = item.dataset.nav;

        // Logik für das aktive Navigations-Item
        if (
            (navTarget === 'dashboard' && currentView.startsWith('dashboard')) ||
            (navTarget === 'projects-content' && currentView === 'project-detail-content') ||
            navTarget === currentView
        ) {
            item.classList.add('active');
        }
    });
}

// ===================================================================
// VIEW-SPEZIFISCHER SCRIPT-LADER
// ===================================================================
/**
 * Führt Skripte aus, die für den aktuell geladenen View spezifisch sind.
 */
function runViewSpecificScripts() {
    switch (currentView) {
        case 'dashboard-empty-content':
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
        case 'settings-content':
            renderSettings();
            break;
    }
}

// ===================================================================
// DYNAMIC CONTENT RENDERERS
// ===================================================================
/**
 * Rendert das Dashboard mit aktiven Projekten.
 */
function renderDashboard() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = ''; // Leert den Grid
    mockDB.getActiveProjects().forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

/**
 * Rendert die Projekt-Übersichtsseite.
 */
function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid-projects');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    mockDB.projects.forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

/**
 * Rendert die Inbox-Ansicht.
 */
// Ersetze den entsprechenden Teil in deiner renderToday() Funktion in app.js:

// PROBLEM: Die renderToday() Funktion wird möglicherweise auch in anderen Views aufgerufen
// LÖSUNG: Bessere Element-Checks und Schutz vor Fehlern

function renderToday() {
    const todayList = document.getElementById('today-list');
    const todayTopContainer = document.querySelector('.today-top-container');

    // WICHTIGER CHECK: Nur ausführen wenn wir wirklich in der Today-View sind
    if (!todayList || !todayTopContainer) {
        console.log('Today-View Elemente nicht gefunden - skip renderToday()');
        return;
    }

    const todayDateEl = document.getElementById('current-date');
    if (todayDateEl) {
        todayDateEl.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const todayTasks = mockDB.getTodayTasks();
    const settings = mockDB.getUserSettings();

    // Tages-Cockpit aktualisieren - MIT ZUSÄTZLICHEN CHECKS
    const completedTasksCount = todayTasks.filter(t => t.completed).length;
    const completedPomodorosCount = todayTasks.reduce((sum, task) => sum + (task.pomodoro_completed || 0), 0);
    const activeStreaksCount = mockDB.getActiveStreaksCount();
    const customTrackers = mockDB.getCustomTrackers();

    // SICHERE Aktualisierung für Aufgaben
    const tasksCurrentEl = document.getElementById('tasks-completed-stat');
    const tasksTargetEl = document.getElementById('tasks-target-stat');
    if (tasksCurrentEl && tasksTargetEl && settings) {
        tasksCurrentEl.textContent = completedTasksCount;
        tasksTargetEl.textContent = settings.daily_task_goal;
    }

    // SICHERE Aktualisierung für Pomodoros
    const pomodorosCurrentEl = document.getElementById('pomodoros-completed-stat');
    const pomodorosTargetEl = document.getElementById('pomodoros-target-stat');
    if (pomodorosCurrentEl && pomodorosTargetEl && settings) {
        pomodorosCurrentEl.textContent = completedPomodorosCount;
        pomodorosTargetEl.textContent = settings.daily_pomodoro_goal;
    }

    const streaksStatEl = document.getElementById('active-streaks-stat');
    if (streaksStatEl) {
        streaksStatEl.innerHTML = `🔥 ${activeStreaksCount}`;
    }

    // SICHERE Tracker-Aktualisierung
    const trackersContainer = document.getElementById('cockpit-trackers-container');
    if (trackersContainer && customTrackers) {
        trackersContainer.innerHTML = customTrackers.map(tracker => `
            <div class="tracker-stat">
                <div class="stat-value">${tracker.value}</div>
                <div class="stat-label">${tracker.name}</div>
            </div>
        `).join('');
    }
    
    // Rest der Funktion...
    if (todayTasks.length > 0) {
        todayList.innerHTML = todayTasks.map(task => {
            const project = task.project_id ? mockDB.getProjectById(task.project_id) : null;
            const streak = task.recurrence_rule ? mockDB.getStreakByTaskId(task.id) : null;

            return `
                <div class="today-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-info">
                        <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                        <span class="task-text">${task.text}</span>
                    </div>
                    <div class="task-meta">
                        ${streak ? `
                            <div class="task-streak" title="Aktueller Streak">
                                🔥 ${streak.current_streak}
                            </div>
                        ` : ''}
                        ${task.pomodoro_estimation ? `
                            <div class="pomodoro-count" title="Erledigte / Geschätzte Pomodoros">
                                <span class="pomodoro-completed">${task.pomodoro_completed}</span> / <span class="pomodoro-estimated">${task.pomodoro_estimation}</span> 🍅
                            </div>
                        ` : ''}
                        ${project ? `<span class="task-project-link">Projekt: <a href="#" data-project-id="${project.id}">${project.title}</a></span>` : ''}
                        <button class="start-task-timer-btn" title="Timer für diese Aufgabe starten">
                            <span class="material-icons">play_circle_outline</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        todayList.innerHTML = `<div class="empty-state" style="margin: auto; padding: 20px;"><p>Für heute sind keine Aufgaben geplant.</p></div>`;
    }
    
    addTodayListeners();
    updateTimerDisplay(); 
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    if(startPauseBtn) startPauseBtn.onclick = startPauseTimer;
    if(resetBtn) resetBtn.onclick = resetTimer;
}

// ZUSÄTZLICHER FIX: Prüfe auch die runViewSpecificScripts Funktion
function runViewSpecificScripts() {
    console.log('Running scripts for view:', currentView); // DEBUG
    
    switch (currentView) {
        case 'dashboard-empty-content':
        case 'dashboard-filled-content':
            renderDashboard();
            break;
        case 'projects-content':
            renderProjects();
            break;
        case 'inbox-content':
            console.log('Loading inbox...'); // DEBUG
            renderInbox();
            break;
        case 'today-content':
            console.log('Loading today...'); // DEBUG
            renderToday();
            break;
        case 'project-detail-content':
            renderProjectDetails();
            break;
        case 'settings-content':
            renderSettings();
            break;
        default:
            console.warn('Unbekannter View:', currentView);
    }
}

function renderSettings() {
    const settings = mockDB.getUserSettings();
    if (!settings) {
        console.error("Benutzereinstellungen nicht gefunden!");
        return;
    }

    const dailyTasksGoalEl = document.getElementById('daily-tasks-goal');
    if (dailyTasksGoalEl) dailyTasksGoalEl.value = settings.daily_task_goal;

    const dailyPomodorosGoalEl = document.getElementById('daily-pomodoros-goal');
    if (dailyPomodorosGoalEl) dailyPomodorosGoalEl.value = settings.daily_pomodoro_goal;
    
    const vacationToggle = document.getElementById('vacation-mode-toggle');
    if (vacationToggle) {
      vacationToggle.checked = settings.vacation_mode_active;
    }
    
    addSettingsListeners();
    toggleVacationDatesContainer(settings.vacation_mode_active);
}

function renderProjectDetails() {
    if (!currentProjectId) return;
    const project = mockDB.getProjectById(currentProjectId);
    if (!project) return;

    document.getElementById('project-title').textContent = project.title;

    const progress = mockDB.calculateProjectProgress(currentProjectId);
    const progressBar = document.getElementById('project-progress-fill');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    const timelineContainer = document.getElementById('project-timeline');
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';
    
    const projectTasks = mockDB.getTasksByProjectId(currentProjectId);
    
    project.milestones.forEach(milestone => {
        timelineContainer.innerHTML += `<div class="milestone">
                                            <div class="milestone__line"></div>
                                            <div class="milestone__icon"><span class="material-icons">flag</span></div>
                                            <div class="milestone__content">
                                                <div class="milestone__header">
                                                    <h3>${milestone.title}</h3>
                                                    <span>${milestone.order}. Meilenstein</span>
                                                </div>
                                                ${createTaskListHtml(milestone, projectTasks)}
                                            </div>
                                        </div>`;
    });
    addTaskListeners();
}

// ===================================================================
// HILFS- & WIZARD-FUNKTIONEN
// ===================================================================

/**
 * Erstellt den HTML-Code für eine Projektkarte.
 * @param {object} project - Das Projekt-Objekt aus der mockDB.
 * @returns {string} - Der generierte HTML-String.
 */
function createProjectCardHtml(project) {
    const progress = mockDB.calculateProjectProgress(project.id);
    const context = mockDB.getContextById(project.context_id);
    const projectTasks = mockDB.getTasksByProjectId(project.id);
    const nextTask = projectTasks.find(t => !t.completed);

    return `
        <div class="project-card" data-project-id="${project.id}">
            ${context ? `<div class="card-context">${context.emoji} ${context.title}</div>` : ''}
            <div class="card-header">
                <h3 class="project-title">${project.title}</h3>
                <span class="material-icons card-menu">more_horiz</span>
            </div>
            <div class="card-body">
                ${nextTask ? `
                    <p class="next-milestone">NÄCHSTER SCHRITT</p>
                    <h4 class="milestone-title">${nextTask.text}</h4>
                ` : '<p>Alle Aufgaben erledigt!</p>'}
            </div>
            <div class="card-footer">
                <div class="progress-info">
                    <span class="progress-label">Fortschritt</span>
                    <span class="progress-percent">${progress}%</span>
                </div>
                <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: ${progress}%;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Erstellt den HTML-Code für eine Aufgabenliste innerhalb eines Meilensteins.
 * @param {object} milestone - Der Meilenstein, der die Aufgaben enthält.
 * @param {array} allProjectTasks - Alle Aufgaben des Projekts.
 * @returns {string} - Der generierte HTML-String.
 */
function createTaskListHtml(milestone, allProjectTasks) {
    const milestoneTasks = allProjectTasks.filter(t => t.milestone_id === milestone.id);
    
    if (!milestoneTasks || milestoneTasks.length === 0) return `<p style="font-style: italic; color: var(--muted); margin-top: 12px;">Keine Aufgaben definiert.</p>`;
    let html = '<ul class="task-list">';
    milestoneTasks.forEach(task => {
        html += `<li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                    <span class="task-text">${task.text}</span>
                </li>`;
    });
    html += '</ul>';
    return html;
}

function addProjectCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.projectId;
            if (projectId) {
                navigateTo('project-detail-content', { projectId });
            }
        });
    });
}
function addTaskListeners() {
    document.querySelectorAll('.task-item').forEach(taskItem => {
        taskItem.addEventListener('click', (e) => {
            const taskId = taskItem.dataset.taskId;
            if (mockDB.toggleTaskCompleted(taskId)) {
                taskItem.classList.toggle('completed');
                const project = mockDB.getProjectById(currentProjectId);
                if (project) {
                    const progress = mockDB.calculateProjectProgress(currentProjectId);
                    const progressBar = document.getElementById('project-progress-fill');
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                }
            }
        });
    });
}

function setupWizardTriggers() {
    document.querySelectorAll('#open-wizard-btn, #open-wizard-btn-filled, #open-wizard-btn-projects').forEach(btn => {
        if(btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                startProjectWizard();
            });
        }
    });
}

/**
 * NEU: Startet den Projekt-Erstellungs-Wizard
 */
async function startProjectWizard() {
    try {
        const response = await fetch('wizard_content.html');
        if (!response.ok) throw new Error('Wizard-Datei nicht gefunden');
        const wizardHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', wizardHtml);
        initializeWizard();
    } catch (error) {
        console.error("Fehler beim Laden des Wizards:", error);
    }
}

/**
 * NEU: Initialisiert den Projekt-Erstellungs-Wizard
 */
function initializeWizard() {
    // Setzt die initialen Wizard-Daten zurück
    newProjectData = {
        goal: null, deadline: null, deadlineType: null,
        startingPoint: null, generatedPlan: null, wizardType: null,
        context_id: null
    };

    let wizardStep = 0;
    const totalSteps = 5;

    // Helper function to update wizard UI based on current step
    function updateWizardUI() {
        const progressLabel = document.getElementById('progress-label');
        const progressFill = document.getElementById('progress-fill');
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        const wizardModal = document.getElementById('wizard-modal');
    
        if (!wizardModal) return;
        
        // Hide all steps first
        document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));
        document.getElementById(`step-${wizardStep}`).classList.remove('hidden');

        progressLabel.textContent = `Schritt ${wizardStep + 1} von ${totalSteps}`;
        progressFill.style.width = `${(wizardStep / totalSteps) * 100}%`;

        // Button states
        prevButton.disabled = wizardStep === 0;
        prevButton.classList.toggle('hidden', wizardStep === 0);
        nextButton.disabled = true; // Default to disabled

        if (wizardStep === 0) {
            nextButton.disabled = newProjectData.wizardType === null;
        } else if (wizardStep === 1) {
            nextButton.disabled = !newProjectData.goal || newProjectData.goal.length < 5;
        } else if (wizardStep === 2) {
            nextButton.disabled = !newProjectData.context_id;
        } else if (wizardStep === 3) {
            nextButton.disabled = !newProjectData.deadlineType || (newProjectData.deadlineType === 'user_date' && !newProjectData.deadline);
        } else if (wizardStep === 4) {
            nextButton.disabled = !newProjectData.startingPoint;
        } else if (wizardStep === 5) {
            nextButton.textContent = 'Fertigstellen';
            nextButton.innerHTML = `<span>Fertigstellen</span><span class="material-icons">check_circle_outline</span>`;
            nextButton.disabled = false;
        }
    }
    
    function nextStep() {
        if (wizardStep < totalSteps) {
            wizardStep++;
            updateWizardUI();
            
            // Dynamische Inhalte laden
            if (wizardStep === 2) populateContextOptions();
            else if (wizardStep === 4) populateAusgangslageOptions();
            else if (wizardStep === 5) {
                if (newProjectData.wizardType === 'ai') generateAiPlan();
                else createManualPlanPlaceholder();
            }
        } else if (wizardStep === totalSteps) {
            createNewProject();
            closeWizard();
            // NEU: Navigiere zum Dashboard, um den Refresh zu erzwingen
            navigateTo('dashboard');
        }
    }
    
    function prevStep() {
        if (wizardStep > 0) {
            wizardStep--;
            updateWizardUI();
        }
    }

    function closeWizard() {
        const wizardModal = document.getElementById('wizard-modal');
        if (wizardModal) {
            wizardModal.remove();
        }
    }
    
    document.getElementById('close-wizard-btn')?.addEventListener('click', closeWizard);
    document.getElementById('prev-button')?.addEventListener('click', prevStep);
    document.getElementById('next-button')?.addEventListener('click', nextStep);

    // Step-specific listeners
    document.getElementById('step-0').addEventListener('click', (e) => {
        const type = e.target.closest('[data-wizard-type]');
        if (type) {
            newProjectData.wizardType = type.dataset.wizardType;
            nextStep();
        }
    });
    
    document.getElementById('goal-input').addEventListener('input', (e) => {
        newProjectData.goal = e.target.value;
        updateWizardUI();
    });
    
    document.getElementById('step-2').addEventListener('click', (e) => {
        const contextBtn = e.target.closest('[data-value]');
        if (contextBtn) {
            document.querySelectorAll('#context-options .option-button').forEach(btn => btn.classList.remove('selected'));
            contextBtn.classList.add('selected');
            newProjectData.context_id = contextBtn.dataset.value;
            updateWizardUI();
        }
    });

    document.getElementById('step-3').addEventListener('click', (e) => {
        const deadlineBtn = e.target.closest('[data-value]');
        if (deadlineBtn) {
            document.querySelectorAll('#deadline-options .option-button').forEach(btn => btn.classList.remove('selected'));
            deadlineBtn.classList.add('selected');
            newProjectData.deadlineType = deadlineBtn.dataset.value;
            const inputContainer = document.getElementById('deadline-input-container');
            inputContainer.classList.toggle('visible', newProjectData.deadlineType === 'user_date');
            updateWizardUI();
        }
    });
    document.getElementById('deadline-input').addEventListener('input', (e) => {
        newProjectData.deadline = e.target.value;
        updateWizardUI();
    });
    
    document.getElementById('step-4').addEventListener('click', (e) => {
        const startingPointBtn = e.target.closest('[data-value]');
        if (startingPointBtn) {
            document.querySelectorAll('#ausgangslage-options .option-button').forEach(btn => btn.classList.remove('selected'));
            startingPointBtn.classList.add('selected');
            newProjectData.startingPoint = startingPointBtn.dataset.value;
            updateWizardUI();
        }
    });
    
    updateWizardUI();
}

/**
 * NEU: Erstellt ein neues Projekt und fügt es zur mockDB hinzu.
 */
function createNewProject() {
    const projectTitle = newProjectData.goal;
    let milestones = newProjectData.generatedPlan;
    if (!milestones) {
        // Fallback für manuelle Erstellung
        milestones = [{ title: 'Erster Meilenstein', duration: 'Woche 1' }]; 
    }
    const newProject = mockDB.addProject({
        title: projectTitle,
        context_id: newProjectData.context_id,
        milestones: milestones
    });
    newProjectData.projectId = newProject.id;
    console.log("Neues Projekt erstellt:", newProject);
}

/**
 * NEU: Füllt den Kontext-Auswahlschritt des Wizards.
 */
function populateContextOptions() {
    const optionsContainer = document.getElementById('context-options');
    optionsContainer.innerHTML = '';
    mockDB.contexts.forEach(context => {
        optionsContainer.innerHTML += `<button type="button" class="option-button" data-value="${context.id}">${context.emoji} ${context.title}</button>`;
    });
}

/**
 * NEU: Füllt den Ausgangslage-Schritt des Wizards.
 */
function populateAusgangslageOptions() {
    const optionsContainer = document.getElementById('ausgangslage-options');
    optionsContainer.innerHTML = '';
    const contextId = newProjectData.context_id;
    const context = mockDB.contexts.find(c => c.id === contextId);
    
    let relevantTemplates = mockDB.ausgangslage.standard;
    if (context && mockDB.ausgangslage[context.title.toLowerCase().split(' ')[0]]) {
        relevantTemplates = mockDB.ausgangslage[context.title.toLowerCase().split(' ')[0]];
    }

    relevantTemplates.forEach(template => {
        optionsContainer.innerHTML += `<button type="button" class="option-button" data-value="${template.id}">${template.text}</button>`;
    });
}

/**
 * NEU: Simuliert die KI-Plan-Generierung.
 */
function generateAiPlan() {
    const planDisplay = document.getElementById('plan-display-container');
    const context = mockDB.contexts.find(c => c.id === newProjectData.context_id);
    const contextKey = context ? context.title.toLowerCase().split(' ')[0] : 'standard';

    let templateData = mockDB.planTemplates[contextKey] ?
        mockDB.planTemplates[contextKey][newProjectData.startingPoint] :
        mockDB.planTemplates.standard;

    if (!templateData) {
        templateData = mockDB.planTemplates.standard;
    }
    
    planDisplay.innerHTML = '';
    let html = '';
    templateData.forEach((milestone) => {
        html += `<div class="milestone-item">
                    <span class="material-icons milestone-icon">tour</span>
                    <div class="milestone-details">
                        <h3>${milestone.title}</h3>
                        <p>${milestone.duration}</p>
                    </div>
                </div>`;
    });
    planDisplay.innerHTML = html;
    newProjectData.generatedPlan = templateData;
}

/**
 * NEU: Zeigt einen Platzhalter für die manuelle Planerstellung an.
 */
function createManualPlanPlaceholder() {
    const planDisplay = document.getElementById('plan-display-container');
    planDisplay.innerHTML = `
        <div class="empty-state">
            <p>Du kannst die Meilensteine für dein Projekt nun manuell in der Detailansicht hinzufügen.</p>
        </div>
    `;
    newProjectData.generatedPlan = [{ title: 'Dein erster Meilenstein', duration: 'Woche 1' }];
}


function addTodayListeners() {
    document.querySelectorAll('.today-task-item').forEach(item => {
        item.querySelector('.task-checkbox').addEventListener('click', () => {
            const taskId = item.dataset.taskId;
            mockDB.toggleTaskCompleted(taskId);
            renderToday();
        });

        const projectLink = item.querySelector('.task-project-link a');
        if (projectLink) {
            projectLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateTo('project-detail-content', { projectId: projectLink.dataset.projectId });
            });
        }
        
        item.querySelector('.start-task-timer-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = item.dataset.taskId;
            startTimerForTask(taskId);
        });
    });
}

function startTimerForTask(taskId) {
    if (pomodoroTimer.isRunning && pomodoroTimer.activeTaskId === taskId) {
        startPauseTimer();
        return;
    }
    resetTimer();
    pomodoroTimer.activeTaskId = taskId;
    document.querySelector(`.today-task-item[data-task-id="${taskId}"]`)?.classList.add('task-in-progress');
    startPauseTimer();
}

function startPauseTimer() {
    const startPauseBtn = document.getElementById('start-pause-btn');
    pomodoroTimer.isRunning = !pomodoroTimer.isRunning;

    if (pomodoroTimer.isRunning) {
        startPauseBtn.innerHTML = `<span class="material-icons">pause</span> Pause`;
        pomodoroTimer.interval = setInterval(tick, 1000);
    } else {
        startPauseBtn.innerHTML = `<span class="material-icons">play_arrow</span> Start`;
        clearInterval(pomodoroTimer.interval);
    }
    if (pomodoroTimer.activeTaskId) {
        const activeTaskEl = document.querySelector(`.today-task-item[data-task-id="${pomodoroTimer.activeTaskId}"]`);
        activeTaskEl?.classList.toggle('task-in-progress', pomodoroTimer.isRunning);
    }
}
function resetTimer() {
    clearInterval(pomodoroTimer.interval);
    pomodoroTimer.isRunning = false;
    pomodoroTimer.timeLeft = pomodoroTimer.DEFAULT_TIME;
    pomodoroTimer.activeTaskId = null;
    document.querySelectorAll('.task-in-progress').forEach(el => el.classList.remove('task-in-progress'));
    updateTimerDisplay();
    document.getElementById('start-pause-btn').innerHTML = `<span class="material-icons">play_arrow</span> Start`;
}
function tick() {
    pomodoroTimer.timeLeft--;
    updateTimerDisplay();
    if (pomodoroTimer.timeLeft <= 0) {
        clearInterval(pomodoroTimer.interval);
        pomodoroTimer.isRunning = false;
        if (pomodoroTimer.activeTaskId) {
            const task = mockDB.getTaskById(pomodoroTimer.activeTaskId);
            if (task) {
                mockDB.updateTask(pomodoroTimer.activeTaskId, { pomodoro_completed: task.pomodoro_completed + 1 });
            }
        }
        alert("Pomodoro-Einheit abgeschlossen! Zeit für eine Pause.");
        resetTimer(); 
        renderToday();
    }
}
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    const minutes = Math.floor(pomodoroTimer.timeLeft / 60);
    const seconds = pomodoroTimer.timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
function initializeQuickAdd() {
    const quickAddBtn = document.getElementById('quick-add-btn');
    const closeBtn = document.getElementById('close-quick-add-btn');
    const saveBtn = document.getElementById('save-quick-add-btn');
    const modal = document.getElementById('quick-add-modal');
    const input = document.getElementById('quick-add-input');

    if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);
    if (closeBtn) closeBtn.addEventListener('click', closeQuickAddModal);
    if (saveBtn) saveBtn.addEventListener('click', saveQuickAddItem);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeQuickAddModal();
            }
        });
    }
}
function openQuickAddModal() {
    const modal = document.getElementById('quick-add-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('quick-add-input').focus();
    }
}
function closeQuickAddModal() {
    const modal = document.getElementById('quick-add-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('quick-add-input').value = '';
    }
}
function saveQuickAddItem() {
    const input = document.getElementById('quick-add-input');
    const text = input.value.trim();
    if (text) {
        mockDB.addTask({ text: text });
        closeQuickAddModal();
        if (currentView === 'inbox-content') renderInbox();
    }
}
function addInboxListeners() {
    const addBtn = document.getElementById('inbox-add-btn');
    const inputField = document.getElementById('inbox-input-field');
    if (addBtn && inputField) {
        addBtn.addEventListener('click', () => {
            const text = inputField.value.trim();
            if (text) {
                mockDB.addTask({ text: text });
                inputField.value = '';
                renderInbox();
            }
        });
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });
    }

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemElement = e.currentTarget.closest('.inbox-item');
            const taskId = itemElement.dataset.taskId;
            if (confirm(`Möchtest du diesen Eintrag wirklich löschen?`)) {
                mockDB.deleteTask(taskId);
                renderInbox();
            }
        });
    });

    document.querySelectorAll('.process-item-btn, #process-inbox-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemElement = e.currentTarget.closest('.inbox-item');
            const taskId = itemElement ? itemElement.dataset.taskId : mockDB.getInboxTasks()[0]?.id;
            if (taskId) {
                startProcessWizard(taskId);
            } else {
                alert("Deine Inbox ist bereits leer!");
            }
        });
    });
}
function addSettingsListeners() {
    const vacationToggle = document.getElementById('vacation-mode-toggle');
    if (vacationToggle) {
        vacationToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            toggleVacationDatesContainer(isChecked);
            console.log("Urlaubsmodus geändert auf:", isChecked);
        });
    }
}
function toggleVacationDatesContainer(show) {
    const container = document.getElementById('vacation-dates-container');
    if (container) {
        container.classList.toggle('hidden', !show);
    }
}
async function startProcessWizard(taskId) {
    if (processWizardState.isOpen) return;

    try {
        const response = await fetch('inbox_wizard_content.html');
        if (!response.ok) throw new Error('Wizard-Datei nicht gefunden');
        const wizardHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', wizardHtml);
    } catch (error) {
        console.error("Fehler beim Laden des Wizards:", error);
        return;
    }
    
    const task = mockDB.getTaskById(taskId);
    if (!task) {
        console.error("Aufgabe für Wizard nicht gefunden");
        return;
    }

    processWizardState = { isOpen: true, currentStep: 1, taskId: taskId, taskText: task.text };

    document.getElementById('process-wizard-task-text').textContent = task.text;
    document.getElementById('close-process-wizard-btn').addEventListener('click', closeProcessWizard);
    
    setupProcessWizardStep(1);
}
function closeProcessWizard() {
    const wizard = document.getElementById('process-wizard-modal');
    if (wizard) wizard.remove();
    processWizardState = { isOpen: false, currentStep: 1, taskId: null, taskText: '' };
    if(currentView === 'inbox-content') renderInbox();
}
function goToProcessStep(step) {
    document.querySelectorAll('#process-wizard-modal .wizard-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`process-step-${step}`).classList.remove('hidden');
    
    const prevButton = document.getElementById('process-prev-button');
    prevButton.classList.toggle('hidden', step === 1);

    processWizardState.currentStep = step;
    setupProcessWizardStep(step);
}
function setupProcessWizardStep(step) {
    const wizard = document.getElementById('process-wizard-modal');
    if (!wizard) return;

    document.getElementById('process-prev-button').onclick = () => {
        if (processWizardState.currentStep > 1) goToProcessStep(processWizardState.currentStep - 1);
    };

    switch(step) {
        case 1:
            wizard.querySelector('[data-action="is_task"]').onclick = () => goToProcessStep(2);
            wizard.querySelector('[data-action="is_note"]').onclick = () => {
                alert("Diese Funktion (als Notiz speichern) wird in einer zukünftigen Version hinzugefügt.");
                closeProcessWizard();
            };
            wizard.querySelector('[data-action="trash"]').onclick = () => {
                mockDB.deleteTask(processWizardState.taskId);
                closeProcessWizard();
            };
            break;
        case 2:
            wizard.querySelector('[data-action="new_project"]').onclick = () => {
                document.getElementById('new-project-input-container').classList.remove('hidden');
                document.getElementById('new-project-name').value = processWizardState.taskText;
            };
            wizard.querySelector('[data-action="single_task"]').onclick = () => goToProcessStep(3);
            break;
        case 3:
            const projects = mockDB.getActiveProjects();
            const container = document.getElementById('project-list-container');
            container.innerHTML = projects.map(p => `
                <button type="button" class="option-button" data-project-id="${p.id}">
                     ${mockDB.getContextById(p.context_id)?.emoji || '📁'} ${p.title}
                </button>
            `).join('');
            
            container.querySelectorAll('.option-button').forEach(btn => {
                btn.onclick = () => {
                    mockDB.updateTask(processWizardState.taskId, { project_id: btn.dataset.projectId });
                    closeProcessWizard();
                };
            });

            wizard.querySelector('[data-action="standalone_task"]').onclick = () => {
                alert("Aufgabe bleibt in der allgemeinen Liste.");
                closeProcessWizard();
            };
            break;
    }
}

/**
 * ÜBERARBEITETE HILFSFUNKTION
 * @param {object} project 
 * @returns {string} 
 */
function createProjectCardHtml(project) {
    const progress = mockDB.calculateProjectProgress(project.id);
    const context = mockDB.getContextById(project.context_id);
    const projectTasks = mockDB.getTasksByProjectId(project.id);
    const nextTask = projectTasks.find(t => !t.completed);

    return `
        <div class="project-card" data-project-id="${project.id}">
            ${context ? `<div class="card-context">${context.emoji} ${context.title}</div>` : ''}
            <div class="card-header">
                <h3 class="project-title">${project.title}</h3>
                <span class="material-icons card-menu">more_horiz</span>
            </div>
            <div class="card-body">
                ${nextTask ? `
                    <p class="next-milestone">NÄCHSTER SCHRITT</p>
                    <h4 class="milestone-title">${nextTask.text}</h4>
                ` : '<p>Alle Aufgaben erledigt!</p>'}
            </div>
            <div class="card-footer">
                <div class="progress-info">
                    <span class="progress-label">Fortschritt</span>
                    <span class="progress-percent">${progress}%</span>
                </div>
                <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: ${progress}%;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * ÜBERARBEITETE HILFSFUNKTION
 * @param {object} milestone 
 * @param {array} allProjectTasks 
 * @returns {string} 
 */
function createTaskListHtml(milestone, allProjectTasks) {
    const milestoneTasks = allProjectTasks.filter(t => t.milestone_id === milestone.id);
    
    if (!milestoneTasks || milestoneTasks.length === 0) return `<p style="font-style: italic; color: var(--muted); margin-top: 12px;">Keine Aufgaben definiert.</p>`;
    let html = '<ul class="task-list">';
    milestoneTasks.forEach(task => {
        html += `<li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                    <span class="task-text">${task.text}</span>
                </li>`;
    });
    html += '</ul>';
    return html;
}

function formatRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `vor ${Math.floor(interval)} Jahren`;
    interval = seconds / 2592000;
    if (interval > 1) return `vor ${Math.floor(interval)} Monaten`;
    interval = seconds / 86400;
    if (interval > 1) return `vor ${Math.floor(interval)} Tagen`;
    interval = seconds / 3600;
    if (interval > 1) return `vor ${Math.floor(interval)} Stunden`;
    interval = seconds / 60;
    if (interval > 1) return `vor ${Math.floor(interval)} Minuten`;
    return "gerade eben";
}