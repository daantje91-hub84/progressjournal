// ===================================================================
// PROGRESS JOURNAL - DATABASE V0.8 (with Fixed Appointments)
// ===================================================================

// Helfer, um das heutige und gestrige Datum dynamisch zu erzeugen
const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const todayString = today.toISOString().slice(0, 10);
const yesterdayString = yesterday.toISOString().slice(0, 10);


const database = {
    // ... (logging functions)
    _logError: function(functionName, error) {
        console.error(`[DATABASE ERROR] in function '${functionName}':`, error.message);
    },
    _logSuccess: function(functionName, message) {
        console.log(`[DATABASE SUCCESS] in function '${functionName}':`, message);
    },

    // --- DATENBESTAND (Mock-Daten) ---
    users: [ { id: 'user_123', name: 'Max Mustermann', email: 'max@email.com' } ],
    user_settings: [
        {
            user_id: 'user_123',
            daily_task_goal: 5,
            daily_pomodoro_goal: 8,
            pomodoro_work_duration: 25,
            pomodoro_short_break: 5,
            default_rest_days: [6, 0], // Sa, So
            enable_task_blocking: true, 
            vacation_mode_active: false,
            vacation_start_date: null,
            vacation_end_date: null,
            tracked_metrics_ids: ['tracker_1', 'tracker_2']
        }
    ],
    custom_trackers: [
        { id: 'tracker_1', user_id: 'user_123', name: 'Schach-Elo', value: '1450', unit: 'Punkte' },
        { id: 'tracker_2', user_id: 'user_123', name: 'Laufpace', value: '5:30', unit: 'min/km' }
    ],
    contexts: [
        { id: 'ctx_1', title: 'Sport & Körper', emoji: '🏃‍♂️' },
        { id: 'ctx_2', title: 'Künstlerische Projekte', emoji: '🎭' },
        { id: 'ctx_3', title: 'Organisation & Tools', emoji: '🛠️' },
        { id: 'ctx_4', title: 'Persönliche Entwicklung', emoji: '🧠'}
    ],
    projects: [
        {
            id: 'proj_1',
            user_id: 'user_123',
            context_id: 'ctx_1',
            title: 'Marathon unter 4 Stunden laufen',
            status: 'active',
            milestones: [
                { id: 'ms_1', title: 'Grundlagen schaffen', order: 1 },
                { id: 'ms_2', title: 'Distanz langsam steigern', order: 2 }
            ]
        }
    ],
    tasks: [
        {
            id: 'task_habit_2', user_id: 'user_123', project_id: null, milestone_id: null, text: 'Taktikaufgaben Schach', completed: false, created_at: '2025-08-01T08:00:00Z', 
            scheduled_at: todayString, recurrence_rule: { frequency: 'daily' }, isHabit: true, start_time: null, end_time: null, isFixed: false
        },
        {
            id: 'task_habit_3', user_id: 'user_123', project_id: null, milestone_id: null, text: 'Eiweiß Shake getrunken', completed: false, created_at: '2025-08-01T08:00:00Z', 
            scheduled_at: todayString, recurrence_rule: { frequency: 'daily' }, isHabit: true, start_time: null, end_time: null, isFixed: false
        },
        {
            id: 'task_habit_4', user_id: 'user_123', project_id: null, milestone_id: null, text: 'Zähne geputzt', completed: true, created_at: '2025-08-01T08:00:00Z', 
            scheduled_at: todayString, recurrence_rule: { frequency: 'daily' }, isHabit: true, start_time: null, end_time: null, isFixed: false
        },
        {
            id: 'task_3', user_id: 'user_123', project_id: 'proj_1', milestone_id: 'ms_1', text: 'Ersten Trainingslauf absolvieren', completed: false, created_at: '2025-08-12T09:00:00Z', 
            scheduled_at: todayString, pomodoro_estimation: 2, pomodoro_completed: 0, start_time: '09:00', end_time: '10:00', isFixed: false
        },
        // NEUER FIXER TERMIN
        {
            id: 'task_fixed_1', user_id: 'user_123', project_id: null, milestone_id: null, text: 'Mittagessen mit Schurl', completed: false, created_at: '2025-08-20T10:00:00Z', 
            scheduled_at: todayString, pomodoro_estimation: 0, start_time: '13:00', end_time: '14:00', isFixed: true
        },
        {
            id: 'task_1', user_id: 'user_123', project_id: 'proj_1', milestone_id: 'ms_1', text: 'Die richtigen Laufschuhe kaufen', completed: false, created_at: '2025-08-10T10:00:00Z', 
            scheduled_at: todayString, pomodoro_estimation: 2, pomodoro_completed: 0, start_time: null, end_time: null, isFixed: false
        },
        {
            id: 'task_inbox_1', user_id: 'user_123', project_id: null, milestone_id: null, text: 'Neues Buch über Stoizismus recherchieren', completed: false, created_at: '2025-08-18T18:30:00Z', 
            scheduled_at: null, pomodoro_estimation: 3, start_time: null, end_time: null, isFixed: false
        }
    ],
    streaks: [
        { task_id: 'task_habit_2', current_streak: 12, longest_streak: 25, last_completed_date: yesterdayString },
        { task_id: 'task_habit_3', current_streak: 7, longest_streak: 7, last_completed_date: yesterdayString },
        { task_id: 'task_habit_4', current_streak: 150, longest_streak: 200, last_completed_date: yesterdayString }
    ],
    timeline_events: [],
    notes: [],
    prompts: [],
    ausgangslage: { /* ... */ },
    planTemplates: { /* ... */ },


    // --- DATENMANIPULATIONS-FUNKTIONEN (mit Logging) ---
    addProject: function(projectData) {
        try {
            if (!projectData || !projectData.title) throw new Error("Project data or title is missing.");
            
            const newProject = {
                id: `proj_${Date.now()}`,
                user_id: 'user_123',
                context_id: projectData.context_id,
                title: projectData.title,
                status: 'active',
                created_at: new Date().toISOString(),
                milestones: (projectData.milestones || []).map((milestone, index) => ({
                    id: `ms_${Date.now()}_${index}`,
                    title: milestone.title,
                    order: index + 1
                }))
            };
            this.projects.push(newProject);
            this._logSuccess('addProject', `Projekt "${newProject.title}" erfolgreich erstellt.`);
            return newProject;
        } catch (error) {
            this._logError('addProject', error);
            return null;
        }
    },

    addTask: function(taskData) {
        try {
            if (!taskData || !taskData.text) throw new Error("Task data or text is missing.");
            
            const newTask = {
                id: `task_${Date.now()}`,
                user_id: 'user_123',
                project_id: taskData.project_id || null,
                milestone_id: taskData.milestone_id || null,
                text: taskData.text,
                notes: taskData.notes || '',
                completed: false,
                created_at: new Date().toISOString(),
                isFixed: taskData.isFixed || false // Standardwert
            };
            this.tasks.push(newTask);
            this._logSuccess('addTask', `Aufgabe "${newTask.text}" erfolgreich hinzugefügt.`);
            return newTask;
        } catch (error) {
            this._logError('addTask', error);
            return null;
        }
    },

    updateTask: function(taskId, updates) {
        try {
            const task = this.getTaskById(taskId);
            if (!task) throw new Error(`Task with ID '${taskId}' not found.`);
            
            Object.assign(task, updates);
            this._logSuccess('updateTask', `Aufgabe mit ID '${taskId}' erfolgreich aktualisiert.`);
            return true;
        } catch (error) {
            this._logError('updateTask', error);
            return false;
        }
    },
    
    updateSettings: function(userId, updates) {
        try {
            const settings = this.getUserSettings(userId);
            if (!settings) throw new Error(`Settings for user ID '${userId}' not found.`);
            
            Object.assign(settings, updates);
            this._logSuccess('updateSettings', `Einstellungen für User '${userId}' erfolgreich geändert.`);
            return true;
        } catch (error) {
            this._logError('updateSettings', error);
            return false;
        }
    },

    deleteTask: function(taskId) {
        try {
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) throw new Error(`Task with ID '${taskId}' not found for deletion.`);
            
            this.tasks.splice(taskIndex, 1);
            this._logSuccess('deleteTask', `Aufgabe mit ID '${taskId}' erfolgreich gelöscht.`);
            return true;
        } catch (error) {
            this._logError('deleteTask', error);
            return false;
        }
    },

    toggleTaskCompleted: function(taskId) {
        const task = this.getTaskById(taskId);
        if(task) {
            const success = this.updateTask(taskId, { completed: !task.completed });
            if(success) {
                 this._logSuccess('toggleTaskCompleted', `Status für Aufgabe ID '${taskId}' auf '${!task.completed}' geändert.`);
            }
            return success;
        }
        return false;
    },

    // --- DATENZUGRIFFS-FUNKTIONEN (Read-only) ---
    getTaskById: function(taskId) {
        return this.tasks.find(t => t.id === taskId);
    },
    getActiveProjects: function() {
        return this.projects.filter(p => p.status === 'active');
    },
    getUserSettings: function(userId = 'user_123') {
        return this.user_settings.find(s => s.user_id === userId);
    },
    getTasksByProjectId: function(projectId) {
        return this.tasks.filter(t => t.project_id === projectId);
    },
    getInboxTasks: function() {
        return this.tasks.filter(t => t.project_id === null && !t.completed && t.scheduled_at === null);
    },
    getTodayTasks: function() {
        const today = new Date().toISOString().slice(0, 10);
        return this.tasks.filter(t => t.scheduled_at === today);
    },
    calculateProjectProgress: function(projectId) {
        const projectTasks = this.getTasksByProjectId(projectId);
        if (!projectTasks || projectTasks.length === 0) return 0;
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.completed).length;
        return Math.round((completedTasks / totalTasks) * 100);
    },
    getProjectById: function(projectId) {
        return this.projects.find(p => p.id === projectId);
    },
    getContextById: function(contextId) {
        if (!contextId) return undefined;
        return this.contexts.find(c => c.id === contextId);
    },
    getActiveStreaksCount: function(userId = 'user_123') {
        return this.streaks.length;
    },
    getCustomTrackers: function(userId = 'user_123') {
        const settings = this.getUserSettings(userId);
        if (!settings || !settings.tracked_metrics_ids) return [];
        return this.custom_trackers.filter(t => settings.tracked_metrics_ids.includes(t.id));
    },
    getStreakByTaskId: function(taskId) {
        return this.streaks.find(s => s.task_id === taskId);
    }
};
