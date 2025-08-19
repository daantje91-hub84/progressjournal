// PROGRESS JOURNAL - MOCK DATABASE V5.0 (with Custom Trackers)
// ===================================================================

// Helfer, um das heutige und morgige Datum dynamisch zu erzeugen
const todayDate = new Date();
const todayString = todayDate.toISOString().slice(0, 10);
const tomorrowDate = new Date();
tomorrowDate.setDate(todayDate.getDate() + 1);
const tomorrowString = tomorrowDate.toISOString().slice(0, 10);

const mockDB = {
    users: [ { id: 'user_123', name: 'Max Mustermann', email: 'max@email.com' } ],
    user_settings: [
        {
            user_id: 'user_123',
            daily_task_goal: 5,
            daily_pomodoro_goal: 8,
            vacation_mode_active: false,
            vacation_start_date: null,
            vacation_end_date: null,
            // NEU: IDs der Tracker, die im Cockpit angezeigt werden sollen
            tracked_metrics_ids: ['tracker_1', 'tracker_2']
        }
    ],
    // NEUE TABELLE für benutzerdefinierte Metriken
    custom_trackers: [
        { id: 'tracker_1', user_id: 'user_123', name: 'Schach-Elo', value: '1450', unit: 'Punkte' },
        { id: 'tracker_2', user_id: 'user_123', name: 'Laufpace', value: '5:30', unit: 'min/km' }
    ],
    contexts: [
        { id: 'ctx_1', title: 'Sport & Körper', emoji: '🏃‍♂️' },
        { id: 'ctx_2', title: 'Künstlerische Projekte', emoji: '🎭' },
        { id: 'ctx_3', title: 'Organisation & Tools', emoji: '🛠️' }
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
            id: 'task_habit_1', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Täglich meditieren', notes: '10 Minuten am Morgen.', completed: false, created_at: '2025-08-01T08:00:00Z', due_date: null, 
            scheduled_at: todayString,
            recurrence_rule: { frequency: 'daily' },
            rest_days: [0, 6],
            links: null, pomodoro_estimation: 1, pomodoro_completed: 0
        },
        {
            id: 'task_3', user_id: 'user_123', project_id: 'proj_1', milestone_id: 'ms_1', parent_task_id: null, text: 'Ersten Trainingslauf absolvieren', notes: 'Lockerer 5km-Lauf zum Einstieg.', completed: false, created_at: '2025-08-12T09:00:00Z', due_date: null, scheduled_at: todayString, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 2, pomodoro_completed: 0
        },
        {
            id: 'task_1', user_id: 'user_123', project_id: 'proj_1', milestone_id: 'ms_1', parent_task_id: null, text: 'Die richtigen Laufschuhe kaufen', notes: 'Im Fachgeschäft beraten lassen, Laufanalyse machen.', completed: true, created_at: '2025-08-10T10:00:00Z', due_date: null, scheduled_at: todayString, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 2, pomodoro_completed: 2
        },
        {
            id: 'task_4', user_id: 'user_123', project_id: 'proj_1', milestone_id: 'ms_2', parent_task_id: null, text: 'Ersten 10km-Lauf schaffen', notes: '', completed: false, created_at: '2025-08-15T14:00:00Z', due_date: '2025-09-15', scheduled_at: todayString, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 4, pomodoro_completed: 1
        },
        {
            id: 'task_5', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Wochenplanung machen', notes: 'Prioritäten für die nächste Woche festlegen.', completed: false, created_at: '2025-08-19T11:00:00Z', due_date: null, scheduled_at: tomorrowString, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 2, pomodoro_completed: 0
        },
        {
            id: 'task_6', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Einkaufen gehen', notes: 'Milch, Brot, Eier', completed: false, created_at: '2025-08-19T11:05:00Z', due_date: null, scheduled_at: tomorrowString, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 1, pomodoro_completed: 0
        },
        {
            id: 'task_inbox_1', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Neues Buch über Stoizismus recherchieren', notes: 'Vielleicht von Marc Aurel oder Seneca?', completed: false, created_at: '2025-08-18T18:30:00Z', due_date: null, scheduled_at: null, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 3, pomodoro_completed: 0
        },
        {
            id: 'task_inbox_2', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Geschenkidee für Annas Geburtstag', notes: '', completed: false, created_at: '2025-08-19T08:00:00Z', due_date: null, scheduled_at: null, recurrence_rule: null, rest_days: [], links: null, pomodoro_estimation: 1, pomodoro_completed: 0
        },
        {
            id: 'task_inbox_3', user_id: 'user_123', project_id: null, milestone_id: null, parent_task_id: null, text: 'Neues JS-Framework recherchieren', notes: 'State of JS ansehen.', completed: false, created_at: '2025-08-19T10:00:00Z', due_date: null, scheduled_at: null, recurrence_rule: null, links: 'https://stateofjs.com/', pomodoro_estimation: 4, pomodoro_completed: 0
        }
    ],

    streaks: [
        {
            task_id: 'task_habit_1',
            current_streak: 5,
            longest_streak: 12,
            last_completed_date: '2025-08-18'
        }
    ],

    // ERWEITERE DEINE mockDB.js UM DIESE FEHLENDEN DATEN:

// Füge diese Daten in deine mockDB.js ein:

// Ausgangslage-Templates für den Wizard
ausgangslage: {
    standard: [
        { id: 'beginner', text: 'Ich bin kompletter Anfänger' },
        { id: 'some_experience', text: 'Ich habe schon etwas Erfahrung' },
        { id: 'advanced', text: 'Ich bin schon weit fortgeschritten' }
    ],
    sport: [
        { id: 'no_training', text: 'Ich mache aktuell keinen Sport' },
        { id: 'light_training', text: 'Ich trainiere 1-2x pro Woche' },
        { id: 'regular_training', text: 'Ich trainiere regelmäßig 3-4x pro Woche' },
        { id: 'intensive_training', text: 'Ich bin bereits sehr aktiv' }
    ],
    künstlerische: [
        { id: 'no_art', text: 'Ich habe noch nie künstlerisch gearbeitet' },
        { id: 'hobby_art', text: 'Ich male/zeichne als Hobby' },
        { id: 'some_art', text: 'Ich habe schon einige Werke erstellt' }
    ],
    organisation: [
        { id: 'chaotic', text: 'Mein Leben ist ziemlich chaotisch' },
        { id: 'some_structure', text: 'Ich habe schon etwas Struktur' },
        { id: 'well_organized', text: 'Ich bin bereits gut organisiert' }
    ]
},

// Plan-Templates für die KI-Generierung
planTemplates: {
    standard: [
        { title: 'Grundlagen schaffen', duration: 'Woche 1-2' },
        { title: 'Erste Schritte umsetzen', duration: 'Woche 3-4' },
        { title: 'Fortschritte vertiefen', duration: 'Woche 5-6' },
        { title: 'Ziel erreichen', duration: 'Woche 7-8' }
    ],
    sport: {
        no_training: [
            { title: 'Medizinischen Check machen', duration: 'Woche 1' },
            { title: 'Grundausstattung besorgen', duration: 'Woche 1-2' },
            { title: 'Mit leichtem Training beginnen', duration: 'Woche 2-4' },
            { title: 'Trainingsintensität steigern', duration: 'Woche 5-8' },
            { title: 'Erstes Ziel erreichen', duration: 'Woche 9-12' }
        ],
        light_training: [
            { title: 'Trainingszustand bewerten', duration: 'Woche 1' },
            { title: 'Trainingsplan erstellen', duration: 'Woche 1-2' },
            { title: 'Intensität systematisch steigern', duration: 'Woche 3-6' },
            { title: 'Ziel erreichen', duration: 'Woche 7-10' }
        ]
    },
    künstlerische: {
        no_art: [
            { title: 'Inspiration sammeln', duration: 'Woche 1' },
            { title: 'Grundmaterialien besorgen', duration: 'Woche 1-2' },
            { title: 'Grundtechniken erlernen', duration: 'Woche 2-4' },
            { title: 'Erste eigene Werke schaffen', duration: 'Woche 5-8' }
        ]
    }
},

// ERWEITERE AUCH DIE PROJEKT-ERSTELLUNGS-FUNKTION:
addProject: function(projectData) {
    const newProject = {
        id: `proj_${Date.now()}`,
        user_id: 'user_123',
        context_id: projectData.context_id,
        title: projectData.title,
        status: 'active',
        created_at: new Date().toISOString(),
        milestones: projectData.milestones.map((milestone, index) => ({
            id: `ms_${Date.now()}_${index}`,
            title: milestone.title,
            order: index + 1,
            duration: milestone.duration
        }))
    };
    
    this.projects.push(newProject);
    
    // Automatisch erste Aufgaben für jeden Meilenstein erstellen
    if (projectData.milestones && projectData.milestones.length > 0) {
        projectData.milestones.forEach((milestone, index) => {
            this.addTask({
                text: `${milestone.title} - Erste Aufgabe`,
                project_id: newProject.id,
                milestone_id: `ms_${Date.now()}_${index}`,
                notes: `Automatisch erstellt für: ${milestone.title}`
            });
        });
    }
    
    console.log('Neues Projekt erstellt:', newProject);
    return newProject;
},

    // --- DATENZUGRIFFS-FUNKTIONEN ---
    // NEUE Funktionen
    getActiveStreaksCount: function(userId = 'user_123') {
        // Zukünftig: Hier Logik einbauen, die prüft, ob Streaks aktiv sind
        return this.streaks.length;
    },
    getCustomTrackers: function(userId = 'user_123') {
        const settings = this.getUserSettings(userId);
        if (!settings || !settings.tracked_metrics_ids) return [];
        return this.custom_trackers.filter(t => settings.tracked_metrics_ids.includes(t.id));
    },
    // ... Rest der Funktionen bleibt unverändert ...
    getStreakByTaskId: function(taskId) {
        return this.streaks.find(s => s.task_id === taskId);
    },
    getUserSettings: function(userId = 'user_123') {
        return this.user_settings.find(s => s.user_id === userId);
    },
    getTaskById: function(taskId) {
        return this.tasks.find(t => t.id === taskId);
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
    getActiveProjects: function() {
        return this.projects.filter(p => p.status === 'active');
    },
    getProjectById: function(projectId) {
        return this.projects.find(p => p.id === projectId);
    },
    getContextById: function(contextId) {
        if (!contextId) return undefined;
        return this.contexts.find(c => c.id === contextId);
    },
    addTask: function(taskData) {
        const newTask = {
            id: `task_${Date.now()}`,
            user_id: 'user_123',
            project_id: taskData.project_id || null,
            milestone_id: taskData.milestone_id || null,
            parent_task_id: taskData.parent_task_id || null,
            text: taskData.text,
            notes: taskData.notes || '',
            completed: false,
            created_at: new Date().toISOString(),
            due_date: taskData.due_date || null,
            scheduled_at: taskData.scheduled_at || null,
            recurrence_rule: taskData.recurrence_rule || null,
            rest_days: taskData.rest_days || [],
            links: taskData.links || null,
            pomodoro_estimation: taskData.pomodoro_estimation || null,
            pomodoro_completed: 0
        };
        this.tasks.push(newTask);
        return newTask;
    },
    updateTask: function(taskId, updates) {
        const task = this.getTaskById(taskId);
        if (task) {
            Object.assign(task, updates);
            return true;
        }
        return false;
    },
    deleteTask: function(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            this.tasks.splice(taskIndex, 1);
            return true;
        }
        return false;
    },
    toggleTaskCompleted: function(taskId) {
        const task = this.getTaskById(taskId);
        if(task) {
            return this.updateTask(taskId, { completed: !task.completed });
        }
        return false;
    }
};