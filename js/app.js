// ===================================================================
// PROGRESS JOURNAL - HAUPTDATEI (SCHALTZENTRALE)
// ===================================================================
// Diese Datei initialisiert die App und verwaltet den globalen Zustand.
// Die eigentliche Logik ist in Module ausgelagert (navigation, viewManager, etc.).
// ===================================================================


// ===================================================================
// GLOBALER ANWENDUNGSZUSTAND
// ===================================================================
let currentView = 'dashboard-empty-content';
let currentProjectId = null;
let newProjectData = {
    goal: null, deadline: null, deadlineType: null, startingPoint: null,
    generatedPlan: null, wizardType: null, context_id: null
};
let pomodoroTimer = {
    DEFAULT_TIME: 25 * 60, timeLeft: 25 * 60, isRunning: false,
    interval: null, activeTaskId: null
};
let processWizardState = {
    isOpen: false, currentStep: 1, taskId: null, taskText: ''
};

// Globale Variable für den Zugriff aus anderen Skripten
window.currentView = currentView;


// ===================================================================
// KERN-INITIALISIERUNG DER APP (ENTRY POINT)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Progress Journal App wird initialisiert...");

    // Initialisiert die Funktionalität des Quick-Add-Modals (aus modals.js)
    initializeQuickAdd();

    // Zentraler Event-Listener für Aktionen, die nicht an eine spezifische Ansicht gebunden sind
    document.getElementById('app-content').addEventListener('click', (e) => {
        // "Zurück zu den Projekten"-Button in der Detailansicht
        if (e.target.closest('#back-to-projects')) {
            e.preventDefault();
            navigateTo('projects-content'); // navigateTo() ist in viewManager.js
        }
    });

    // Startet die App, indem das Dashboard geladen wird (aus viewManager.js)
    navigateTo('dashboard');
});
