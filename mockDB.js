// ===================================================================
// PROGRESS JOURNAL - MOCK DATABASE V2.2 (Final Korrigiert)
// ===================================================================

const mockDB = {
    // ---------------------------------------------------------------
    // TABELLEN
    // ---------------------------------------------------------------
    contexts: [
        { id: 'ctx_1', title: 'Sport & Körper', emoji: '🏃‍♂️' },
        { id: 'ctx_2', title: 'Künstlerische Projekte', emoji: '🎭' },
        { id: 'ctx_3', title: 'Organisation & Tools', emoji: '🛠️' },
        { id: 'ctx_4', title: 'Beziehungen', emoji: '❤️' }
    ],

    projects: [
        {
            id: 'proj_1660844400000',
            context_id: 'ctx_1',
            title: 'Marathon unter 4 Stunden laufen',
            status: 'active',
            milestones: [
                {
                    id: 'ms_1',
                    title: 'Grundlagen schaffen',
                    status: 'current',
                    order: 1,
                    tasks: [
                        { id: 'task_1_1', text: 'Die richtigen Laufschuhe kaufen', completed: true },
                        { id: 'task_1_2', text: 'Einen 16-Wochen-Trainingsplan recherchieren', completed: true },
                        { id: 'task_1_3', text: 'Ersten Trainingslauf absolvieren', completed: false }
                    ]
                },
                {
                    id: 'ms_2',
                    title: 'Distanz langsam steigern',
                    status: 'upcoming',
                    order: 2,
                    tasks: [
                        { id: 'task_2_1', text: 'Ersten 10km-Lauf schaffen', completed: false },
                        { id: 'task_2_2', text: 'Wöchentlichen Langen Lauf (LSD) etablieren', completed: false }
                    ]
                }
            ]
        }
    ],

    inboxItems: [
        { id: 'inbox_1', text: 'Neues Buch über Stoizismus recherchieren' },
        { id: 'inbox_2', text: 'Geschenkidee für Annas Geburtstag' },
    ],

    todayTasks: [
         { id: 'task_today_1', text: 'Ersten Trainingslauf absolvieren', completed: false, project: { id: 'proj_1660844400000', name: 'Marathon laufen' } }
    ],
    
    ausgangslage: {
        standard: [{id: 'beginner', text: 'Anfänger'}, {id: 'advanced', text: 'Fortgeschritten'}],
        laufen: [{id: 'running_beginner', text: 'Ich laufe selten'}, {id: 'running_advanced', text: 'Ich laufe regelmäßig 5km'}],
        lernen: [{id: 'learning_beginner', text: 'Ich habe keine Vorkenntnisse'}, {id: 'learning_advanced', text: 'Ich habe bereits Grundlagenwissen'}],
    },

    planTemplates: {
        standard: [
            { title: 'Recherche & Planung', duration: 'Woche 1' },
            { title: 'Erste Schritte umsetzen', duration: 'Woche 2-3' },
            { title: 'Fortschritt überprüfen & anpassen', duration: 'Woche 4' },
        ],
        laufen: {
            running_beginner: [
                { title: 'Grundlagen schaffen (2-3 Läufe/Woche)', duration: 'Woche 1-4' },
                { title: 'Distanz langsam steigern auf 10km', duration: 'Woche 5-8' },
                { title: 'Intensität erhöhen & Tempotraining', duration: 'Woche 9-12' },
                { title: 'Wettkampfvorbereitung & Tapering', duration: 'Woche 13-16' },
            ],
            running_advanced: [
                 { title: 'Umfang erhöhen', duration: 'Woche 1-3' },
                 { title: 'Spezifisches Tempotraining', duration: 'Woche 4-8' },
                 { title: 'Lange Läufe intensivieren', duration: 'Woche 9-12' },
                 { title: 'Tapering & finale Vorbereitung', duration: 'Woche 13-16' },
            ]
        },
    },

    // ---------------------------------------------------------------
    // DATENZUGRIFFS-FUNKTIONEN
    // ---------------------------------------------------------------
    calculateProjectProgress: function(projectId) {
        const project = this.getProjectById(projectId);
        if (!project || !project.milestones) return 0;
        let totalTasks = 0;
        let completedTasks = 0;
        project.milestones.forEach(milestone => {
            if (milestone.tasks) {
                totalTasks += milestone.tasks.length;
                completedTasks += milestone.tasks.filter(task => task.completed).length;
            }
        });
        if (totalTasks === 0) return 0;
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

    addProject: function(projectData) {
        const newProject = {
            id: `proj_${Date.now()}`,
            context_id: projectData.context_id || null,
            status: 'active',
            title: projectData.title,
            milestones: (projectData.milestones || []).map((m, index) => ({
                id: `ms_${Date.now()}_${index}`,
                title: m.title,
                status: index === 0 ? 'current' : 'upcoming',
                order: index + 1,
                tasks: []
            }))
        };
        this.projects.push(newProject);
        return newProject;
    },

    toggleTaskCompleted: function(projectId, milestoneId, taskId) {
        const project = this.getProjectById(projectId);
        if (project) {
            const milestone = project.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                const task = milestone.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = !task.completed;
                    return true;
                }
            }
        }
        return false;
    }
}; // <-- DIESE SCHLIESSENDE KLAMMER HAT GEFEHLT.