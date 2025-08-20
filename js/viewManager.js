// ===================================================================
// VIEW MANAGER
// Dieses Modul kümmert sich um das Laden, Darstellen und Aktualisieren der verschiedenen App-Ansichten.
// ===================================================================

const appContent = document.getElementById('app-content');

// Delegierter Event-Listener für Aktionen, die im Hauptinhaltsbereich stattfinden
appContent.addEventListener('click', (e) => {
    // Behandelt den Klick auf den "Zurück zu den Projekten"-Button in der Detailansicht
    if (e.target.closest('#back-to-projects')) {
        e.preventDefault();
        navigateTo('projects-content');
    }
});


/**
 * Lädt einen neuen View in die Haupt-Content-Sektion der App.
 * @param {string} viewId - Die ID des zu ladenden Views (z.B. 'dashboard').
 * @param {object} [params={}] - Optionale Parameter für den View (z.B. projectId).
 */
async function navigateTo(viewId, params = {}) {
    console.log(`Navigiere zu: ${viewId}`, params);
    if (params.projectId) {
        currentProjectId = params.projectId;
    }

    let viewFileToFetch = viewId;
    if (viewId === 'dashboard') {
        viewFileToFetch = database.getActiveProjects().length > 0 ?
            'dashboard-filled-content' :
            'dashboard-empty-content';
    }

    try {
        const response = await fetch(`views/${viewFileToFetch}.html`);
        if (!response.ok) {
            throw new Error(`Laden von views/${viewFileToFetch}.html fehlgeschlagen`);
        }

        appContent.innerHTML = await response.text();
        currentView = viewFileToFetch;
        window.currentView = currentView;

        updateNavState();

        // Wir geben dem Browser mit setTimeout(..., 0) einen Moment Zeit,
        // das neue HTML zu verarbeiten, bevor wir darauf zugreifen.
        setTimeout(runViewSpecificScripts, 0);

    } catch (error) {
        console.error('Navigation fehlgeschlagen:', error);
        appContent.innerHTML = `<div class="error-state"><h1>Fehler</h1><p>Die Seite konnte nicht geladen werden.</p></div>`;
    }
}

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
        case 'timeline-content':
            renderTimeline();
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
// DYNAMIC CONTENT RENDERERS (Funktionen zum Befüllen der Views)
// ===================================================================

function renderDashboard() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    database.getActiveProjects().forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid-projects');
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    database.projects.forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderToday() {
    const todayList = document.getElementById('today-list');
    const todayTopContainer = document.querySelector('.today-top-container');

    if (!todayList || !todayTopContainer) {
        console.warn('Elemente der Heute-Ansicht nicht gefunden. renderToday() wird übersprungen.');
        return;
    }

    const todayDateEl = document.getElementById('current-date');
    if (todayDateEl) {
        todayDateEl.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    let todayTasks = database.getTodayTasks();
    const settings = database.getUserSettings();

    // --- NEUE SORTIER-LOGIK ---
    todayTasks.sort((a, b) => {
        if (a.start_time && !b.start_time) return -1; // a (mit Zeit) kommt vor b (ohne Zeit)
        if (!a.start_time && b.start_time) return 1;  // b (mit Zeit) kommt vor a (ohne Zeit)
        if (a.start_time && b.start_time) {
            return a.start_time.localeCompare(b.start_time); // Sortiere nach Uhrzeit
        }
        return 0; // Behalte die Reihenfolge für Aufgaben ohne Zeit bei
    });

    // Cockpit-Logik
    const completedTasksCount = todayTasks.filter(t => t.completed).length;
    const completedPomodorosCount = todayTasks.reduce((sum, task) => sum + (task.pomodoro_completed || 0), 0);
    const activeStreaksCount = database.getActiveStreaksCount();
    const customTrackers = database.getCustomTrackers();
    const tasksCurrentEl = document.getElementById('tasks-completed-stat');
    if(tasksCurrentEl) tasksCurrentEl.textContent = completedTasksCount;
    const tasksTargetEl = document.getElementById('tasks-target-stat');
    if(tasksTargetEl && settings) tasksTargetEl.textContent = settings.daily_task_goal;
    const pomodorosCurrentEl = document.getElementById('pomodoros-completed-stat');
    if(pomodorosCurrentEl) pomodorosCurrentEl.textContent = completedPomodorosCount;
    const pomodorosTargetEl = document.getElementById('pomodoros-target-stat');
    if(pomodorosTargetEl && settings) pomodorosTargetEl.textContent = settings.daily_pomodoro_goal;
    const streaksStatEl = document.getElementById('active-streaks-stat');
    if (streaksStatEl) streaksStatEl.innerHTML = `🔥 ${activeStreaksCount}`;
    const trackersContainer = document.getElementById('cockpit-trackers-container');
    if (trackersContainer && customTrackers) {
        trackersContainer.innerHTML = customTrackers.map(tracker => `
            <div class="tracker-stat">
                <div class="stat-value">${tracker.value}</div>
                <div class="stat-label">${tracker.name}</div>
            </div>
        `).join('');
    }
    
    // --- ANGEPASSTES RENDERING ---
    if (todayTasks.length > 0) {
        todayList.innerHTML = todayTasks.map(task => {
            const project = task.project_id ? database.getProjectById(task.project_id) : null;
            const streak = task.isHabit ? database.getStreakByTaskId(task.id) : null;
            return `
                <div class="today-task-item ${task.completed ? 'completed' : ''} ${pomodoroTimer.activeTaskId === task.id ? 'task-in-progress' : ''}" data-task-id="${task.id}">
                    <div class="task-info">
                        ${task.start_time ? `
                            <div class="task-time">
                                <span class="material-icons">schedule</span>
                                ${task.start_time}
                            </div>
                        ` : '<div class="task-time" style="width: 110px;"></div>' /* Platzhalter für Ausrichtung */ }
                        <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check_box' : 'check_box_outline_blank'}</span></span>
                        <span class="task-text">${task.text}</span>
                    </div>
                    <div class="task-meta">
                        ${streak ? `<div class="task-streak" title="Aktueller Streak">🔥 ${streak.current_streak}</div>` : ''}
                        ${task.pomodoro_estimation ? `<div class="pomodoro-count" title="Erledigte / Geschätzte Pomodoros"><span class="pomodoro-completed">${task.pomodoro_completed || 0}</span> / <span class="pomodoro-estimated">${task.pomodoro_estimation}</span> 🍅</div>` : ''}
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
    initializePomodoroControls();
}

function renderInbox() {
    const inboxListContainer = document.getElementById('inbox-list');
    if (!inboxListContainer) return;
    const inboxTasks = database.getInboxTasks();
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

function renderTimeline() {
    const timelineEvents = document.getElementById('timeline-events');
    if (timelineEvents) {
        timelineEvents.innerHTML = `<div class="empty-state" style="margin: auto; padding: 20px;"><p>Timeline-Funktion wird noch entwickelt.</p></div>`;
    }
}

function renderSettings() {
    const settings = database.getUserSettings();
    if (!settings) {
        console.error("Benutzereinstellungen nicht gefunden!");
        return;
    }

    document.getElementById('daily-tasks-goal').value = settings.daily_task_goal;
    document.getElementById('daily-pomodoros-goal').value = settings.daily_pomodoro_goal;
    
    document.getElementById('work-duration').value = settings.pomodoro_work_duration;
    document.getElementById('short-break').value = settings.pomodoro_short_break;

    document.getElementById('vacation-mode-toggle').checked = settings.vacation_mode_active;
    document.getElementById('vacation-start').value = settings.vacation_start_date || '';
    document.getElementById('vacation-end').value = settings.vacation_end_date || '';
    
    const restDays = settings.default_rest_days || [];
    document.querySelectorAll('#rest-day-picker .day-toggle').forEach(dayEl => {
        const day = parseInt(dayEl.dataset.day, 10);
        dayEl.classList.toggle('active', restDays.includes(day));
    });

    toggleVacationDatesContainer(settings.vacation_mode_active);
    addSettingsListeners();
}

function renderProjectDetails() {
    if (!currentProjectId) return;
    const project = database.getProjectById(currentProjectId);
    if (!project) return;
    document.getElementById('project-title').textContent = project.title;
    const progress = database.calculateProjectProgress(currentProjectId);
    const progressBar = document.getElementById('project-progress-fill');
    if (progressBar) progressBar.style.width = `${progress}%`;
    const timelineContainer = document.getElementById('project-timeline');
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';
    const projectTasks = database.getTasksByProjectId(currentProjectId);
    project.milestones.forEach(milestone => {
        timelineContainer.innerHTML += `
            <div class="milestone">
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
// HILFSFUNKTIONEN (HTML-Generierung, Event-Listener, etc.)
// ===================================================================

function createProjectCardHtml(project) {
    const progress = database.calculateProjectProgress(project.id);
    const context = database.getContextById(project.context_id);
    const projectTasks = database.getTasksByProjectId(project.id);
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

function createTaskListHtml(milestone, allProjectTasks) {
    const milestoneTasks = allProjectTasks.filter(t => t.milestone_id === milestone.id);
    if (!milestoneTasks || milestoneTasks.length === 0) return `<p style="font-style: italic; color: var(--muted); margin-top: 12px;">Keine Aufgaben definiert.</p>`;
    return `
        <ul class="task-list">
            ${milestoneTasks.map(task => `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check_box' : 'check_box_outline_blank'}</span></span>
                    <span class="task-text">${task.text}</span>
                </li>
            `).join('')}
        </ul>
    `;
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

function addProjectCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            navigateTo('project-detail-content', { projectId: card.dataset.projectId });
        });
    });
}

function addTaskListeners() {
    document.querySelectorAll('.task-item').forEach(taskItem => {
        taskItem.addEventListener('click', () => {
            const taskId = taskItem.dataset.taskId;
            if (database.toggleTaskCompleted(taskId)) {
                renderProjectDetails();
            }
        });
    });
}

function addTodayListeners() {
    document.querySelectorAll('.today-task-item').forEach(item => {
        const checkbox = item.querySelector('.task-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                database.toggleTaskCompleted(item.dataset.taskId);
                renderToday();
            });
        }
        const projectLink = item.querySelector('.task-project-link a');
        if (projectLink) {
            projectLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateTo('project-detail-content', { projectId: projectLink.dataset.projectId });
            });
        }
        const timerBtn = item.querySelector('.start-task-timer-btn');
        if (timerBtn) {
            timerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                startTimerForTask(item.dataset.taskId);
            });
        }
    });
}

function addInboxListeners() {
    const addBtn = document.getElementById('inbox-add-btn');
    const inputField = document.getElementById('inbox-input-field');
    if (addBtn && inputField) {
        addBtn.addEventListener('click', () => {
            const text = inputField.value.trim();
            if (text) {
                database.addTask({ text: text });
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
            if (confirm(`Möchtest du diesen Eintrag wirklich löschen?`)) {
                database.deleteTask(itemElement.dataset.taskId);
                renderInbox();
            }
        });
    });
    document.querySelectorAll('.process-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemElement = e.currentTarget.closest('.inbox-item');
            if (itemElement) {
                startProcessWizard(itemElement.dataset.taskId);
            }
        });
    });
}

function addSettingsListeners() {
    const settingsContainer = document.querySelector('.settings-container');
    if (!settingsContainer) return;

    settingsContainer.querySelectorAll('input[type="number"], input[type="date"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.setting;
            const value = e.target.type === 'number' ? parseInt(e.target.value, 10) : e.target.value;
            if (key && database.updateSettings('user_123', { [key]: value })) {
                showToast("Einstellung gespeichert!");
            }
        });
    });

    const vacationToggle = document.getElementById('vacation-mode-toggle');
    if (vacationToggle) {
        vacationToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const key = e.target.dataset.setting;
            if (key && database.updateSettings('user_123', { [key]: isChecked })) {
                showToast(`Urlaubsmodus ${isChecked ? 'aktiviert' : 'deaktiviert'}`);
            }
            toggleVacationDatesContainer(isChecked);
        });
    }

    const restDayPicker = document.getElementById('rest-day-picker');
    if (restDayPicker) {
        restDayPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('day-toggle')) {
                e.target.classList.toggle('active');
                const activeDays = Array.from(restDayPicker.querySelectorAll('.day-toggle.active'))
                                        .map(el => parseInt(el.dataset.day, 10));
                if (database.updateSettings('user_123', { default_rest_days: activeDays })) {
                    showToast("Ruhetage aktualisiert!");
                }
            }
        });
    }
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function toggleVacationDatesContainer(show) {
    const container = document.getElementById('vacation-dates-container');
    if (container) {
        container.classList.toggle('hidden', !show);
    }
}
