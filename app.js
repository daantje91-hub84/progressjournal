// ===================================================================
// GLOBAL APP STATE
// ===================================================================
let currentView = 'dashboard-empty-content';
let currentProjectId = null;
let newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null, context_id: null };

let pomodoroTimer = {
    DEFAULT_TIME: 25 * 60,
    timeLeft: 25 * 60,
    isRunning: false,
    interval: null,
    activeTaskId: null
};

let processWizardState = {
    isOpen: false,
    currentStep: 1,
    taskId: null,
    taskText: ''
};

// ===================================================================
// CORE APP INITIALIZATION & NAVIGATION
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
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
    initializeQuickAdd();
    navigateTo('dashboard');
});

const appContent = document.getElementById('app-content');

async function navigateTo(viewId, params = {}) {
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
        case 'settings-content':
            renderSettings();
            break;
    }
}

// ===================================================================
// DYNAMIC CONTENT RENDERERS
// ===================================================================
function renderProjectGrid(containerId) {
    const projectsGrid = document.getElementById(containerId);
    if (!projectsGrid) return false;
    const activeProjects = mockDB.getActiveProjects();
    if (activeProjects.length > 0) {
        projectsGrid.innerHTML = activeProjects.map(createProjectCardHtml).join('');
        addProjectCardListeners();
        return true;
    } else {
        projectsGrid.innerHTML = '';
        return false;
    }
}

function renderDashboard() {
    renderProjectGrid('projects-grid');
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        projectsGrid.innerHTML += `<div class="project-card-placeholder" id="open-wizard-btn-filled"><span class="material-icons">add</span>Neues Projekt</div>`;
    }
    setupWizardTriggers();
}

function renderProjects() {
    const wasRendered = renderProjectGrid('projects-grid-projects');
    if (!wasRendered) {
        const projectsGrid = document.getElementById('projects-grid-projects');
        if (projectsGrid) {
            projectsGrid.innerHTML = `<div class="empty-state" style="margin: auto;"><p>Du hast noch keine Projekte erstellt.</p></div>`;
        }
    }
    document.getElementById('open-wizard-btn-projects')?.addEventListener('click', (e) => {
        e.preventDefault();
        initializeWizard();
    });
}

function renderInbox() {
    const inboxListContainer = document.getElementById('inbox-list');
    if (!inboxListContainer) return;
    const inboxTasks = mockDB.getInboxTasks();
    if (inboxTasks.length > 0) {
        inboxListContainer.innerHTML = inboxTasks.map(task => `
            <div class="inbox-item" data-task-id="${task.id}">
                <div class="inbox-item-main">
                    <div class="inbox-item-text">${task.text}</div>
                    ${task.notes ? `<div class="inbox-item-notes">${task.notes}</div>` : ''}
                    <div class="inbox-item-meta">Erstellt: ${formatRelativeTime(new Date(task.created_at))}</div>
                </div>
                <div class="inbox-item-actions">
                    <button class="button-icon process-item-btn" title="Verarbeiten">
                        <span class="material-icons">arrow_circle_right</span>
                    </button>
                    <button class="button-icon delete-item-btn" title="Löschen">
                        <span class="material-icons">delete_outline</span>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        inboxListContainer.innerHTML = `<div class="empty-state" style="margin: auto; padding: 20px;"><p>Deine Inbox ist leer. Gut gemacht!</p></div>`;
    }
    addInboxListeners();
}

function renderToday() {
    const todayList = document.getElementById('today-list');
    if (!todayList) return;

    document.getElementById('current-date').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });

    const todayTasks = mockDB.getTodayTasks();
    const settings = mockDB.getUserSettings();

    const completedTasksCount = todayTasks.filter(t => t.completed).length;
    const completedPomodorosCount = todayTasks.reduce((sum, task) => sum + task.pomodoro_completed, 0);
    
    const tasksStatEl = document.getElementById('tasks-completed-stat');
    const pomodorosStatEl = document.getElementById('pomodoros-completed-stat');

    if (tasksStatEl && settings) {
        tasksStatEl.textContent = `${completedTasksCount}/${settings.daily_task_goal}`;
    }
    if (pomodorosStatEl && settings) {
        pomodorosStatEl.textContent = `${completedPomodorosCount}/${settings.daily_pomodoro_goal}`;
    }

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
    document.getElementById('start-pause-btn').onclick = startPauseTimer;
    document.getElementById('reset-btn').onclick = resetTimer;
}

function renderSettings() {
    const settings = mockDB.getUserSettings();
    if (!settings) {
        console.error("Benutzereinstellungen nicht gefunden!");
        return;
    }

    document.getElementById('daily-tasks-goal').value = settings.daily_task_goal;
    document.getElementById('daily-pomodoros-goal').value = settings.daily_pomodoro_goal;
    
    const vacationToggle = document.getElementById('vacation-mode-toggle');
    vacationToggle.checked = settings.vacation_mode_active;
    
    addSettingsListeners();
    toggleVacationDatesContainer(settings.vacation_mode_active);
}

function renderProjectDetails() { /* Platzhalter */ }

// ===================================================================
// EVENT LISTENERS
// ===================================================================
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

// ===================================================================
// TIMER LOGIC
// ===================================================================
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

// ===================================================================
// WIZARD & HELPER FUNCTIONS
// ===================================================================
function initializeQuickAdd() {
    const quickAddBtn = document.getElementById('quick-add-btn');
    const closeBtn = document.getElementById('close-quick-add-btn');
    const saveBtn = document.getElementById('save-quick-add-btn');
    const modal = document.getElementById('quick-add-modal');

    if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);
    if (closeBtn) closeBtn.addEventListener('click', closeQuickAddModal);
    if (saveBtn) saveBtn.addEventListener('click', saveQuickAddItem);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeQuickAddModal();
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

function setupWizardTriggers() {
    document.querySelectorAll('#open-wizard-btn, #open-wizard-btn-filled, #open-wizard-btn-projects').forEach(btn => {
        if(btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                initializeWizard();
            });
        }
    });
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

function initializeWizard() { alert("Der Projekt-Erstellungs-Wizard muss noch angepasst werden."); }
