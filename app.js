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
    interval: null
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
        case 'wizard_content':
            initializeWizard();
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
function renderInbox() {
    const inboxList = document.getElementById('inbox-list');
    if (!inboxList) return;
    inboxList.innerHTML = '';
    mockDB.inboxItems.forEach(item => {
        inboxList.innerHTML += `<div class="inbox-item" data-id="${item.id}">
                                    <span class="inbox-item-text">${item.text}</span>
                                    <div class="inbox-item-actions">
                                        <button class="action-btn"><span class="material-icons">check_circle</span></button>
                                        <button class="action-btn"><span class="material-icons">delete</span></button>
                                    </div>
                                </div>`;
    });
}

/**
 * Rendert die Heute-Ansicht mit Aufgaben, Scores und dem Timer.
 */
function renderToday() {
    const todayList = document.getElementById('today-list');
    const scoreWidgets = document.getElementById('score-widgets');
    if (!todayList || !scoreWidgets) return;

    // Datum aktualisieren
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    // Gesamtreihen-Score rendern
    const totalStreaks = mockDB.getTotalStreaks();
    const totalStreaksCard = `<div class="score-card">
                                <h3>Gesamtreihen</h3>
                                <div class="score-value">
                                    <span class="material-icons">local_fire_department</span>
                                    <span>${totalStreaks}</span>
                                </div>
                              </div>`;

    // Individuelle Scores rendern
    const chessEloCard = `<div class="score-card">
                            <h3>Schach-Elo</h3>
                            <div class="score-value">
                                <span>${mockDB.todayMetrics.chessElo}</span>
                            </div>
                         </div>`;

    const runningPaceCard = `<div class="score-card">
                                <h3>Laufpace</h3>
                                <div class="score-value">
                                    <span>${mockDB.todayMetrics.runningPace}</span>
                                </div>
                             </div>`;

    scoreWidgets.innerHTML = totalStreaksCard + chessEloCard + runningPaceCard;

    // Pomodoro-Reihe rendern
    const pomodoroStreakEl = document.getElementById('pomodoro-streak');
    if (pomodoroStreakEl) {
        pomodoroStreakEl.textContent = mockDB.todayMetrics.overallStreak;
    }

    todayList.innerHTML = '';
    mockDB.todayTasks.forEach(task => {
        const streakHtml = task.streak ? `<span class="streak-display"><span class="material-icons">local_fire_department</span> ${task.streak}</span>` : '';
        todayList.innerHTML += `<div class="today-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                                    <div class="task-info">
                                        <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                                        <span class="task-text">${task.text}</span>
                                    </div>
                                    <div class="task-meta">
                                        ${task.project ? `<span class="task-project-link">Projekt: <a href="#">${task.project.name}</a></span>` : ''}
                                        ${streakHtml}
                                        <button class="start-task-timer-btn" title="Timer für diese Aufgabe starten">
                                            <span class="material-icons">play_circle_outline</span>
                                        </button>
                                    </div>
                                </div>`;
    });

    // Timer initialisieren und Event-Listener hinzufügen
    updateTimerDisplay();
    document.getElementById('start-pause-btn').onclick = startPauseTimer;
    document.getElementById('reset-btn').onclick = resetTimer;
}

/**
 * Rendert die Projekt-Detailansicht.
 */
function renderProjectDetails() {
    if (!currentProjectId) return;
    const project = mockDB.getProjectById(currentProjectId);
    if (!project) return;

    document.getElementById('project-title').textContent = project.title;

    // Fortschrittsbalken aktualisieren
    const progress = mockDB.calculateProjectProgress(currentProjectId);
    document.getElementById('project-progress-fill').style.width = `${progress}%`;

    // Timeline rendern
    const timelineContainer = document.getElementById('project-timeline');
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';
    project.milestones.forEach(milestone => {
        timelineContainer.innerHTML += `<div class="milestone ${milestone.status === 'current' ? 'current' : ''}">
                                            <div class="milestone__line"></div>
                                            <div class="milestone__icon"><span class="material-icons">${milestone.status === 'current' ? 'flag' : 'tour'}</span></div>
                                            <div class="milestone__content">
                                                <div class="milestone__header">
                                                    <h3>${milestone.title}</h3>
                                                    <span>${milestone.order}. Meilenstein</span>
                                                </div>
                                                ${createTaskListHtml(milestone, project.id)}
                                            </div>
                                        </div>`;
    });

    // Event-Listener für die Checkboxen der Aufgaben hinzufügen
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
    const nextMilestone = project.milestones.find(m => m.status === 'current');
    const projectLinkClass = project.status === 'active' ? 'project-card' : 'project-card-placeholder';
    return `<div class="${projectLinkClass}" data-project-id="${project.id}">
                ${context ? `<div class="card-context">${context.emoji} ${context.title}</div>` : ''}
                <div class="card-header">
                    <h2 class="project-title">${project.title}</h2>
                    <span class="material-icons card-menu">more_vert</span>
                </div>
                <div class="card-body">
                    ${nextMilestone ? `<p class="next-milestone">Nächster Meilenstein</p><h3 class="milestone-title">${nextMilestone.title}</h3>` : ''}
                </div>
                <div class="card-footer">
                    <div class="progress-info">
                        <span class="progress-label">Fortschritt</span>
                        <span class="progress-percent">${progress}%</span>
                    </div>
                    <div class="card-progress-bar">
                        <div class="card-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>`;
}

/**
 * Erstellt den HTML-Code für eine Aufgabenliste innerhalb eines Meilensteins.
 * @param {object} milestone - Der Meilenstein, der die Aufgaben enthält.
 * @param {string} projectId - Die ID des übergeordneten Projekts.
 * @returns {string} - Der generierte HTML-String.
 */
function createTaskListHtml(milestone, projectId) {
    if (!milestone.tasks || milestone.tasks.length === 0) return `<p style="font-style: italic; color: var(--muted); margin-top: 12px;">Keine Aufgaben definiert.</p>`;
    let html = '<ul class="task-list">';
    milestone.tasks.forEach(task => {
        html += `<li class="task-item ${task.completed ? 'completed' : ''}" data-project-id="${projectId}" data-milestone-id="${milestone.id}" data-task-id="${task.id}">
                    <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                    <span class="task-text">${task.text}</span>
                </li>`;
    });
    html += '</ul>';
    return html;
}

/**
 * Fügt Event-Listener zu allen Projektkarten hinzu.
 */
function addProjectCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu')) {
                navigateTo('project-detail-content', {
                    projectId: card.dataset.projectId
                });
            }
        });
    });
}

/**
 * Fügt Event-Listener für das Toggle von Aufgaben-Checkboxen hinzu.
 */
function addTaskListeners() {
    document.querySelectorAll('.task-item').forEach(taskItem => {
        taskItem.addEventListener('click', (e) => {
            const projectId = taskItem.dataset.projectId;
            const milestoneId = taskItem.dataset.milestoneId;
            const taskId = taskItem.dataset.taskId;
            if (mockDB.toggleTaskCompleted(projectId, milestoneId, taskId)) {
                taskItem.classList.toggle('completed');
                const project = mockDB.getProjectById(projectId);
                if (project) {
                    const progress = mockDB.calculateProjectProgress(projectId);
                    const progressBar = document.getElementById('project-progress-fill');
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                }
            }
        });
    });
}

/**
 * Richtet die Event-Listener für die Wizard-Buttons ein.
 */
function setupWizardTriggers() {
    const emptyStateBtn = document.getElementById('open-wizard-btn');
    if (emptyStateBtn) {
        emptyStateBtn.onclick = () => navigateTo('wizard_content');
    }
    const projectsAddBtn = document.getElementById('open-wizard-btn-projects');
    if (projectsAddBtn) {
        projectsAddBtn.onclick = () => navigateTo('wizard_content');
    }
    const filledStateBtn = document.getElementById('open-wizard-btn-filled');
    if (filledStateBtn) {
        filledStateBtn.onclick = () => navigateTo('wizard_content');
    }
}

// ===================================================================
// WIZARD-LOGIK
// ===================================================================
// Wizard-Schritte und Zustand
let wizardStep = 0;
const totalSteps = 5;

function initializeWizard() {
    // Initialisiert den Wizard-Zustand, wenn er geladen wird
    wizardStep = 0;
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.toggle('hidden', index !== 0);
    });
    updateWizardState();
    setupWizardNavigation();

    // Event-Listener für die dynamischen Optionen
    document.getElementById('step-0').addEventListener('click', (e) => {
        if (e.target.dataset.wizardType) {
            newProjectData.wizardType = e.target.dataset.wizardType;
            nextStep();
            if (newProjectData.wizardType === 'manual') {
                document.getElementById('goal-input').placeholder = "Gib dein Ziel ein...";
            } else {
                document.getElementById('goal-input').placeholder = "Ich möchte einen Marathon laufen...";
            }
        }
    });

    document.getElementById('step-1').addEventListener('input', (e) => {
        newProjectData.goal = e.target.value;
        updateWizardState();
    });

    document.getElementById('step-2').addEventListener('click', (e) => {
        const contextButton = e.target.closest('.option-button');
        if (contextButton) {
            document.querySelectorAll('#context-options .option-button').forEach(btn => btn.classList.remove('selected'));
            contextButton.classList.add('selected');
            newProjectData.context_id = contextButton.dataset.value;
            updateWizardState();
        }
    });

    document.getElementById('step-3').addEventListener('click', (e) => {
        const deadlineButton = e.target.closest('.option-button');
        if (deadlineButton) {
            document.querySelectorAll('#deadline-options .option-button').forEach(btn => btn.classList.remove('selected'));
            deadlineButton.classList.add('selected');
            newProjectData.deadlineType = deadlineButton.dataset.value;
            const deadlineInputContainer = document.getElementById('deadline-input-container');
            deadlineInputContainer.classList.toggle('visible', newProjectData.deadlineType === 'user_date');
            if (newProjectData.deadlineType === 'user_date') {
                document.getElementById('deadline-input').focus();
            } else {
                newProjectData.deadline = null;
                updateWizardState();
            }
        }
    });
    document.getElementById('deadline-input').addEventListener('input', (e) => {
        newProjectData.deadline = e.target.value;
        updateWizardState();
    });

    document.getElementById('step-4').addEventListener('click', (e) => {
        const ausgangslageButton = e.target.closest('.option-button');
        if (ausgangslageButton) {
            document.querySelectorAll('#ausgangslage-options .option-button').forEach(btn => btn.classList.remove('selected'));
            ausgangslageButton.classList.add('selected');
            newProjectData.startingPoint = ausgangslageButton.dataset.value;
            updateWizardState();
        }
    });
}

function setupWizardNavigation() {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const closeButton = document.getElementById('close-wizard-btn');

    prevButton.onclick = prevStep;
    nextButton.onclick = nextStep;
    closeButton.onclick = () => navigateTo('dashboard');
}

/**
 * Aktualisiert den Fortschrittsbalken und die Navigationsbuttons des Wizards.
 */
function updateWizardState() {
    const progressLabel = document.getElementById('progress-label');
    const progressFill = document.getElementById('progress-fill');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    // Fortschrittsbalken
    progressLabel.textContent = `Schritt ${wizardStep + 1} von ${totalSteps}`;
    progressFill.style.width = `${(wizardStep / totalSteps) * 100}%`;

    // Buttons
    prevButton.disabled = wizardStep === 0;
    prevButton.classList.toggle('hidden', wizardStep === 0);
    nextButton.disabled = true;
    nextButton.textContent = 'Weiter';
    nextButton.innerHTML = `<span>Weiter</span><span class="material-icons">arrow_forward</span>`;

    // Validierungslogik für den "Weiter"-Button
    if (wizardStep === 0) {
        nextButton.disabled = newProjectData.wizardType === null;
    } else if (wizardStep === 1) {
        nextButton.disabled = !newProjectData.goal || newProjectData.goal.length < 5;
    } else if (wizardStep === 2) {
        if (newProjectData.wizardType === 'ai') {
            nextButton.disabled = !newProjectData.context_id;
        } else {
            nextButton.disabled = false; // Manuell kann man diesen Schritt überspringen
        }
    } else if (wizardStep === 3) {
        if (newProjectData.deadlineType === 'user_date') {
            nextButton.disabled = !newProjectData.deadline;
        } else {
            nextButton.disabled = false; // Vorgegebene Deadline kann übersprungen werden
        }
    } else if (wizardStep === 4) {
        nextButton.disabled = !newProjectData.startingPoint;
        if (!nextButton.disabled) {
            if (newProjectData.wizardType === 'ai') {
                nextButton.innerHTML = `<span>Roadmap erstellen</span><span class="material-icons">rocket_launch</span>`;
            } else {
                nextButton.innerHTML = `<span>Projekt erstellen</span><span class="material-icons">topic</span>`;
            }
        }
    } else if (wizardStep === 5) {
        nextButton.textContent = 'Fertigstellen';
        nextButton.innerHTML = `<span>Fertigstellen</span><span class="material-icons">check_circle_outline</span>`;
        nextButton.disabled = false;
    }
}

/**
 * Geht zum nächsten Schritt im Wizard.
 */
function nextStep() {
    if (wizardStep < totalSteps) {
        // Logik für den Übergang
        document.getElementById(`step-${wizardStep}`).classList.add('hidden');
        wizardStep++;
        document.getElementById(`step-${wizardStep}`).classList.remove('hidden');

        // Dynamische Inhalte laden
        if (wizardStep === 2) {
            populateContextOptions();
        } else if (wizardStep === 4) {
            populateAusgangslageOptions();
        } else if (wizardStep === 5) {
            if (newProjectData.wizardType === 'ai') {
                generateAiPlan();
            } else {
                createNewProject();
                navigateTo('project-detail-content', {
                    projectId: newProjectData.projectId
                });
            }
        }
    } else if (wizardStep === totalSteps) {
        createNewProject();
        navigateTo('project-detail-content', {
            projectId: newProjectData.projectId
        });
    }
    updateWizardState();
}

/**
 * Geht zum vorherigen Schritt im Wizard.
 */
function prevStep() {
    if (wizardStep > 0) {
        document.getElementById(`step-${wizardStep}`).classList.add('hidden');
        wizardStep--;
        document.getElementById(`step-${wizardStep}`).classList.remove('hidden');
    }
    updateWizardState();
}

/**
 * Erstellt ein neues Projekt basierend auf den Wizard-Daten.
 */
function createNewProject() {
    const projectTitle = newProjectData.goal;
    let milestones = newProjectData.generatedPlan;
    if (!milestones) {
        // Manuelle Erstellung: Standard-Template nutzen
        milestones = mockDB.planTemplates.standard;
    }
    const newProject = mockDB.addProject({
        title: projectTitle,
        context_id: newProjectData.context_id,
        milestones: milestones
    });
    newProjectData.projectId = newProject.id;
}

/**
 * Füllt die Kontext-Optionen in Schritt 2 dynamisch.
 */
function populateContextOptions() {
    const optionsContainer = document.getElementById('context-options');
    optionsContainer.innerHTML = '';
    mockDB.contexts.forEach(context => {
        optionsContainer.innerHTML += `<button type="button" class="option-button" data-value="${context.id}">${context.emoji} ${context.title}</button>`;
    });
}

/**
 * Füllt die Ausgangslage-Optionen in Schritt 4 dynamisch.
 */
function populateAusgangslageOptions() {
    const optionsContainer = document.getElementById('ausgangslage-options');
    optionsContainer.innerHTML = '';
    const relevantTemplates = mockDB.planTemplates[newProjectData.context_id] ?
        mockDB.ausgangslage[mockDB.contexts.find(c => c.id === newProjectData.context_id).title.toLowerCase().split(' ')[0]] : // Annahme: Schlüssel ist der erste Teil des Titels, z.B. 'laufen'
        mockDB.ausgangslage.standard;

    relevantTemplates.forEach(template => {
        optionsContainer.innerHTML += `<button type="button" class="option-button" data-value="${template.id}">${template.text}</button>`;
    });
}

/**
 * Simuliert die KI-Plan-Generierung und zeigt das Ergebnis an.
 */
function generateAiPlan() {
    const planDisplay = document.getElementById('plan-display-container');
    const templateData = mockDB.planTemplates[newProjectData.context_id] ?
        mockDB.planTemplates[newProjectData.context_id][newProjectData.startingPoint] :
        mockDB.planTemplates.standard;
    planDisplay.innerHTML = '';
    let html = '';
    templateData.forEach((milestone, index) => {
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

// ===================================================================
// POMODORO TIMER LOGIK
// ===================================================================
/**
 * Startet oder pausiert den Pomodoro-Timer.
 */
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
}

/**
 * Setzt den Pomodoro-Timer zurück.
 */
function resetTimer() {
    clearInterval(pomodoroTimer.interval);
    pomodoroTimer.isRunning = false;
    pomodoroTimer.timeLeft = pomodoroTimer.DEFAULT_TIME;
    updateTimerDisplay();
    document.getElementById('start-pause-btn').innerHTML = `<span class="material-icons">play_arrow</span> Start`;
}

/**
 * Verringert die verbleibende Zeit im Timer jede Sekunde.
 */
function tick() {
    pomodoroTimer.timeLeft--;
    updateTimerDisplay();

    if (pomodoroTimer.timeLeft <= 0) {
        clearInterval(pomodoroTimer.interval);
        pomodoroTimer.isRunning = false;
        // Ersetze alert() durch eine schönere UI-Benachrichtigung
        alert("Zeit abgelaufen! Zeit für eine Pause.");
    }
}

/**
 * Aktualisiert die Anzeige des Timers.
 */
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;
    const minutes = Math.floor(pomodoroTimer.timeLeft / 60);
    const seconds = pomodoroTimer.timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
