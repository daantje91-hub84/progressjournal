// ===================================================================
// VIEW MANAGER
// Kümmert sich um das Laden, Darstellen und Aktualisieren der App-Ansichten.
// ===================================================================

const appContent = document.getElementById('app-content');

appContent.addEventListener('click', (e) => {
    if (e.target.closest('#back-to-projects')) {
        e.preventDefault();
        navigateTo('projects-content');
    }
});

async function navigateTo(viewId, params = {}) {
    console.log(`Navigiere zu: ${viewId}`, params);
    if (params.projectId) currentProjectId = params.projectId;

    let viewFile = viewId;
    if (viewId === 'dashboard') {
        viewFile = database.getActiveProjects().length > 0 ? 'dashboard-filled-content' : 'dashboard-empty-content';
    }

    try {
        const response = await fetch(`views/${viewFile}.html`);
        if (!response.ok) throw new Error(`Laden von views/${viewFile}.html fehlgeschlagen`);

        appContent.innerHTML = await response.text();
        currentView = viewFile;
        window.currentView = currentView;

        updateNavState();
        setTimeout(runViewSpecificScripts, 0);
    } catch (error) {
        console.error('Navigation fehlgeschlagen:', error);
        appContent.innerHTML = `<div class="error-state"><h1>Fehler</h1><p>Die Seite konnte nicht geladen werden.</p></div>`;
    }
}

function runViewSpecificScripts() {
    const viewRenderers = {
        'dashboard-empty-content': renderDashboard,
        'dashboard-filled-content': renderDashboard,
        'projects-content': renderProjects,
        'inbox-content': renderInbox,
        'today-content': renderToday,
        'timeline-content': renderTimeline,
        'project-detail-content': renderProjectDetails,
        'settings-content': renderSettings
    };
    
    const renderFunction = viewRenderers[currentView];
    if (renderFunction) {
        renderFunction();
    }
}

// ===================================================================
// RENDER-FUNKTIONEN
// ===================================================================

function renderDashboard() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = '';
    database.getActiveProjects().forEach(project => {
        grid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderProjects() {
    const grid = document.getElementById('projects-grid-projects');
    if (!grid) return;
    grid.innerHTML = '';
    database.projects.forEach(project => {
        grid.innerHTML += createProjectCardHtml(project);
    });
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderToday() {
    const list = document.getElementById('today-list');
    if (!list) return;

    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', month: 'long', day: 'numeric' });

    let tasks = database.getTodayTasks();
    
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.start_time && !b.start_time) return -1;
        if (!a.start_time && b.start_time) return 1;
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
        return 0;
    });

    // Cockpit aktualisieren
    const settings = database.getUserSettings();
    document.getElementById('tasks-completed-stat').textContent = tasks.filter(t => t.completed).length;
    document.getElementById('tasks-target-stat').textContent = settings.daily_task_goal;
    document.getElementById('pomodoros-completed-stat').textContent = tasks.reduce((sum, task) => sum + (task.pomodoro_completed || 0), 0);
    document.getElementById('pomodoros-target-stat').textContent = settings.daily_pomodoro_goal;
    document.getElementById('active-streaks-stat').innerHTML = `🔥 ${database.getActiveStreaksCount()}`;
    
    const trackersContainer = document.getElementById('cockpit-trackers-container');
    if (trackersContainer) {
        trackersContainer.innerHTML = database.getCustomTrackers().map(tracker => `
            <div class="tracker-stat">
                <div class="stat-value">${tracker.value}</div>
                <div class="stat-label">${tracker.name}</div>
            </div>
        `).join('');
    }

    if (tasks.length > 0) {
        list.innerHTML = tasks.map(createTaskItemHtml).join('');
    } else {
        list.innerHTML = `<div class="empty-state"><p>Für heute sind keine Aufgaben geplant.</p></div>`;
    }
    
    addTodayListeners();
    updateTimerDisplay(); 
    initializePomodoroControls();
}

function renderInbox() {
    const list = document.getElementById('inbox-list');
    if (!list) return;
    const tasks = database.getInboxTasks();
    if (tasks.length > 0) {
        list.innerHTML = tasks.map(task => `
            <div class="inbox-item" data-task-id="${task.id}">
                <div class="inbox-item-main">
                    <div class="inbox-item-text">${task.text}</div>
                    <div class="inbox-item-meta">Erstellt: ${formatRelativeTime(new Date(task.created_at))}</div>
                </div>
                <div class="inbox-item-actions">
                    <button class="button-icon process-item-btn" title="Verarbeiten"><span class="material-icons">arrow_circle_right</span></button>
                    <button class="button-icon delete-item-btn" title="Löschen"><span class="material-icons">delete_outline</span></button>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = `<div class="empty-state"><p>Deine Inbox ist leer. Gut gemacht!</p></div>`;
    }
    addInboxListeners();
}

function renderTimeline() {
    const container = document.getElementById('timeline-events');
    if (container) container.innerHTML = `<div class="empty-state"><p>Timeline-Funktion wird noch entwickelt.</p></div>`;
}

function renderSettings() {
    const settings = database.getUserSettings();
    if (!settings) return;
    document.getElementById('daily-tasks-goal').value = settings.daily_task_goal;
    document.getElementById('daily-pomodoros-goal').value = settings.daily_pomodoro_goal;
    document.getElementById('work-duration').value = settings.pomodoro_work_duration;
    document.getElementById('short-break').value = settings.pomodoro_short_break;
    document.getElementById('task-blocking-toggle').checked = settings.enable_task_blocking;
    document.getElementById('vacation-mode-toggle').checked = settings.vacation_mode_active;
    document.getElementById('vacation-start').value = settings.vacation_start_date || '';
    document.getElementById('vacation-end').value = settings.vacation_end_date || '';
    
    const restDays = settings.default_rest_days || [];
    document.querySelectorAll('#rest-day-picker .day-toggle').forEach(el => {
        el.classList.toggle('active', restDays.includes(parseInt(el.dataset.day)));
    });

    toggleVacationDatesContainer(settings.vacation_mode_active);
    addSettingsListeners();
}

function renderProjectDetails() {
    const project = database.getProjectById(currentProjectId);
    if (!project) return;
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-progress-fill').style.width = `${database.calculateProjectProgress(currentProjectId)}%`;
    
    const timeline = document.getElementById('project-timeline');
    if (!timeline) return;
    const tasks = database.getTasksByProjectId(currentProjectId);
    timeline.innerHTML = project.milestones.map(milestone => `
        <div class="milestone">
            <div class="milestone__line"></div>
            <div class="milestone__icon"><span class="material-icons">flag</span></div>
            <div class="milestone__content">
                <div class="milestone__header"><h3>${milestone.title}</h3><span>${milestone.order}. Meilenstein</span></div>
                ${createTaskListHtml(milestone, tasks)}
            </div>
        </div>
    `).join('');
    addTaskListeners();
}

// ===================================================================
// HTML-HILFSFUNKTIONEN
// ===================================================================

function createProjectCardHtml(project) {
    const nextTask = database.getTasksByProjectId(project.id).find(t => !t.completed);
    return `
        <div class="project-card" data-project-id="${project.id}">
            <div class="card-context">${database.getContextById(project.context_id)?.emoji || ''} ${database.getContextById(project.context_id)?.title || ''}</div>
            <div class="card-header"><h3 class="project-title">${project.title}</h3><span class="material-icons card-menu">more_horiz</span></div>
            <div class="card-body">
                ${nextTask ? `<p class="next-milestone">NÄCHSTER SCHRITT</p><h4 class="milestone-title">${nextTask.text}</h4>` : '<p>Alle Aufgaben erledigt!</p>'}
            </div>
            <div class="card-footer">
                <div class="progress-info"><span class="progress-label">Fortschritt</span><span class="progress-percent">${database.calculateProjectProgress(project.id)}%</span></div>
                <div class="card-progress-bar"><div class="card-progress-fill" style="width: ${database.calculateProjectProgress(project.id)}%;"></div></div>
            </div>
        </div>`;
}

function createTaskItemHtml(task) {
    const settings = database.getUserSettings();
    const pomodoros = task.pomodoro_estimation || 1;

    if (!settings.enable_task_blocking || pomodoros <= 1) {
        return createSingleTaskItemHtml(task);
    }

    let blockHtml = '';
    for (let i = 0; i < pomodoros; i++) {
        blockHtml += (i === 0) ? createSingleTaskItemHtml(task, true) : createSubBlockItemHtml(task, i + 1);
    }
    
    const draggable = !task.completed && !task.isFixed ? 'true' : 'false';
    return `<div class="task-block-container" data-task-id="${task.id}" draggable="${draggable}">${blockHtml}</div>`;
}

function createSingleTaskItemHtml(task, isBlockHeader = false) {
    const project = task.project_id ? database.getProjectById(task.project_id) : null;
    const streak = task.isHabit ? database.getStreakByTaskId(task.id) : null;
    const containerClass = isBlockHeader ? 'today-task-item is-block-header' : 'today-task-item';
    const fixedClass = task.isFixed ? 'is-fixed' : '';

    return `
        <div class="${containerClass} ${fixedClass} ${task.completed ? 'completed' : ''} ${pomodoroTimer.activeTaskId === task.id ? 'task-in-progress' : ''}" data-task-id="${task.id}">
            <div class="task-info">
                <div class="task-time" title="Uhrzeit festlegen">
                    ${task.start_time ? `<span class="material-icons">schedule</span> ${task.start_time}` : '<span class="material-icons">add_alarm</span>'}
                </div>
                <button class="button-icon task-lock-toggle" title="${task.isFixed ? 'Termin lösen' : 'Termin fixieren'}">
                    <span class="material-icons">${task.isFixed ? 'lock' : 'lock_open'}</span>
                </button>
                <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check_box' : 'check_box_outline_blank'}</span></span>
                <span class="task-text">${task.text}</span>
            </div>
            <div class="task-meta">
                ${streak ? `<div class="task-streak" title="Aktueller Streak">🔥 ${streak.current_streak}</div>` : ''}
                ${task.pomodoro_estimation ? `<div class="pomodoro-count" title="Erledigte / Geschätzte Pomodoros">${task.pomodoro_completed || 0} / ${task.pomodoro_estimation} 🍅</div>` : ''}
                ${project ? `<span class="task-project-link">Projekt: <a href="#" data-project-id="${project.id}">${project.title}</a></span>` : ''}
                <button class="start-task-timer-btn" title="Timer für diese Aufgabe starten"><span class="material-icons">play_circle_outline</span></button>
            </div>
        </div>`;
}

function createSubBlockItemHtml(task, blockNumber) {
    return `
        <div class="today-task-item task-sub-block ${task.completed ? 'completed' : ''}">
            <div class="task-info">
                <div class="task-time sub-block-time">
                    <span class="material-icons">link</span>
                </div>
                <span class="task-checkbox is-disabled"></span>
                <span class="task-text">Pomodoro-Block ${blockNumber}</span>
            </div>
            <div class="task-meta"></div>
        </div>`;
}

function createTaskListHtml(milestone, tasks) {
    const milestoneTasks = tasks.filter(t => t.milestone_id === milestone.id);
    if (milestoneTasks.length === 0) return `<p style="font-style: italic; color: var(--muted); margin-top: 12px;">Keine Aufgaben definiert.</p>`;
    return `<ul class="task-list">${milestoneTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check_box' : 'check_box_outline_blank'}</span></span>
            <span class="task-text">${task.text}</span>
        </li>`).join('')}</ul>`;
}

function formatRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "gerade eben";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `vor ${minutes} Minuten`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Stunden`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tagen`;
}

// ===================================================================
// EVENT-LISTENER-HILFSFUNKTIONEN
// ===================================================================

function addProjectCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => navigateTo('project-detail-content', { projectId: card.dataset.projectId }));
    });
}

function addTaskListeners() {
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', () => {
            if (database.toggleTaskCompleted(item.dataset.taskId)) renderProjectDetails();
        });
    });
}

let draggedItem = null;

function addTodayListeners() {
    const taskList = document.getElementById('today-list');
    if (!taskList) return;

    taskList.querySelectorAll('.task-block-container, .today-task-item:not(.is-block-header):not(.task-sub-block)').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    taskList.querySelectorAll('.today-task-item').forEach(item => {
        const container = item.closest('.task-block-container') || item;
        const taskId = container.dataset.taskId;

        item.querySelector('.task-checkbox:not(.is-disabled)')?.addEventListener('click', (e) => {
            e.stopPropagation();
            database.toggleTaskCompleted(taskId);
            renderToday();
        });
        item.querySelector('.task-project-link a')?.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            navigateTo('project-detail-content', { projectId: e.target.dataset.projectId });
        });
        item.querySelector('.start-task-timer-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            startTimerForTask(taskId);
        });
        item.querySelector('.task-time')?.addEventListener('click', (e) => {
            e.stopPropagation();
            handleTimeClick(container);
        });
        item.querySelector('.task-lock-toggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const task = database.getTaskById(taskId);
            if (task) {
                database.updateTask(taskId, { isFixed: !task.isFixed });
                renderToday();
            }
        });
    });

    taskList.addEventListener('dragover', handleDragOver);
    taskList.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    const task = database.getTaskById(e.target.dataset.taskId);
    if (e.target.classList.contains('completed') || (task && task.isFixed)) {
        e.preventDefault();
        return;
    }
    draggedItem = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd() {
    if (draggedItem) draggedItem.classList.remove('dragging');
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    const container = e.currentTarget;
    const afterElement = getDragAfterElement(container, e.clientY);
    const currentlyDragged = document.querySelector('.dragging');
    if (currentlyDragged) {
        if (afterElement == null) {
            container.appendChild(currentlyDragged);
        } else {
            container.insertBefore(currentlyDragged, afterElement);
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    const taskIdsInNewOrder = Array.from(e.currentTarget.querySelectorAll('[data-task-id]')).map(item => item.dataset.taskId);
    const firstTimedTaskIndex = taskIdsInNewOrder.findIndex(id => database.getTaskById(id).start_time);
    const startingTaskId = firstTimedTaskIndex !== -1 ? taskIdsInNewOrder[firstTimedTaskIndex] : null;

    recalculateAndUpdateTimes(taskIdsInNewOrder, startingTaskId);
    renderToday();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[data-task-id]:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleTimeClick(containerElement) {
    const taskId = containerElement.dataset.taskId;
    const task = database.getTaskById(taskId);
    if (task && task.isFixed) {
        showToast("Fixe Termine können nicht verschoben werden.");
        return;
    }

    const timeDiv = containerElement.querySelector('.task-time');
    if (!timeDiv) return;
    
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.value = task.start_time || '09:00';
    timeInput.classList.add('time-input-active');

    timeInput.addEventListener('blur', () => {
        const newTime = timeInput.value;
        if (isTimeSlotFree(taskId, newTime)) {
            database.updateTask(taskId, { start_time: newTime });
        } else {
            showToast("Konflikt! Dieser Zeitpunkt ist bereits durch einen fixen Termin belegt.");
        }
        renderToday();
    });
    
    timeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.blur();
    });

    timeDiv.innerHTML = '';
    timeDiv.appendChild(timeInput);
    timeInput.focus();
    timeInput.select();
}

function recalculateAndUpdateTimes(orderedTaskIds, startingTaskId) {
    let lastEndTime = "00:00";
    if (startingTaskId) {
        const startTask = database.getTaskById(startingTaskId);
        if (startTask && startTask.start_time) lastEndTime = startTask.start_time;
    }

    const fixedTasks = database.getTodayTasks().filter(t => t.isFixed && t.start_time);

    for (const currentTaskId of orderedTaskIds) {
        const currentTask = database.getTaskById(currentTaskId);
        if (!currentTask || currentTask.completed) continue;

        if (currentTask.isFixed) {
            if (currentTask.start_time) {
                const fixedTaskEndTime = addMinutesToTime(currentTask.start_time, getTaskDuration(currentTask));
                if (fixedTaskEndTime > lastEndTime) lastEndTime = fixedTaskEndTime;
            }
            continue;
        }
        
        if (currentTask.start_time) {
            let proposedStartTime = lastEndTime;
            const currentTaskDuration = getTaskDuration(currentTask);
            let slotFound = false;

            while (!slotFound) {
                const proposedEndTime = addMinutesToTime(proposedStartTime, currentTaskDuration);
                let collision = false;
                for (const fixed of fixedTasks) {
                    const fixedEndTime = addMinutesToTime(fixed.start_time, getTaskDuration(fixed));
                    if (proposedStartTime < fixedEndTime && proposedEndTime > fixed.start_time) {
                        proposedStartTime = fixedEndTime;
                        collision = true;
                        break;
                    }
                }
                if (!collision) slotFound = true;
            }
            database.updateTask(currentTaskId, { start_time: proposedStartTime });
            lastEndTime = addMinutesToTime(proposedStartTime, currentTaskDuration);
        }
    }
}

// ===================================================================
// ZEITBERECHNUNGS-HILFSFUNKTIONEN
// ===================================================================

function getTaskDuration(task) {
    if (!task) return 0;
    const settings = database.getUserSettings();
    const workDuration = settings.pomodoro_work_duration;
    const breakDuration = settings.pomodoro_short_break;
    const pomodoros = task.pomodoro_estimation || 1;

    if (pomodoros === 0 && task.isFixed) {
        if (task.start_time && task.end_time) {
            const [startH, startM] = task.start_time.split(':').map(Number);
            const [endH, endM] = task.end_time.split(':').map(Number);
            return (endH * 60 + endM) - (startH * 60 + startM);
        }
        return 60;
    }
    return pomodoros * (workDuration + breakDuration);
}

function isTimeSlotFree(taskId, newStartTime) {
    const taskToCheck = database.getTaskById(taskId);
    if (!taskToCheck) return false;

    const duration = getTaskDuration(taskToCheck);
    const newEndTime = addMinutesToTime(newStartTime, duration);

    const allOtherFixedTasks = database.getTodayTasks().filter(t => t.id !== taskId && t.isFixed && t.start_time);

    for (const fixedTask of allOtherFixedTasks) {
        const fixedTaskEndTime = addMinutesToTime(fixedTask.start_time, getTaskDuration(fixedTask));
        if (newStartTime < fixedTaskEndTime && newEndTime > fixedTask.start_time) {
            return false;
        }
    }
    return true;
}

function addMinutesToTime(timeStr, minutes) {
    if (!timeStr) return null;
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
}

// ===================================================================
// ÜBRIGE LISTENER UND HILFSFUNKTIONEN
// ===================================================================

function addInboxListeners() {
    document.getElementById('inbox-add-btn')?.addEventListener('click', () => {
        const input = document.getElementById('inbox-input-field');
        if (input.value.trim()) {
            database.addTask({ text: input.value.trim() });
            input.value = '';
            renderInbox();
        }
    });
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.currentTarget.closest('.inbox-item');
            if (confirm(`Möchtest du diesen Eintrag wirklich löschen?`)) {
                database.deleteTask(item.dataset.taskId);
                renderInbox();
            }
        });
    });
    document.querySelectorAll('.process-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.currentTarget.closest('.inbox-item');
            if (item) startProcessWizard(item.dataset.taskId);
        });
    });
}

function addSettingsListeners() {
    document.querySelectorAll('.settings-container input[data-setting]').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.setting;
            let value = e.target.value;
            if (e.target.type === 'number') value = parseInt(value, 10);
            if (e.target.type === 'checkbox') value = e.target.checked;
            
            if (key && database.updateSettings('user_123', { [key]: value })) {
                showToast("Einstellung gespeichert!");
                if (key === 'vacation_mode_active') toggleVacationDatesContainer(value);
            }
        });
    });
    document.getElementById('rest-day-picker')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('day-toggle')) {
            e.target.classList.toggle('active');
            const activeDays = Array.from(document.querySelectorAll('#rest-day-picker .day-toggle.active'))
                                    .map(el => parseInt(el.dataset.day, 10));
            if (database.updateSettings('user_123', { default_rest_days: activeDays })) {
                showToast("Ruhetage aktualisiert!");
            }
        }
    });
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function toggleVacationDatesContainer(show) {
    const container = document.getElementById('vacation-dates-container');
    if (container) container.classList.toggle('hidden', !show);
}
