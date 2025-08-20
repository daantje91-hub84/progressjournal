// ===================================================================
// PROGRESS JOURNAL - HAUPTDATEI (SCHALTZENTRALE)
// ===================================================================
// Diese Datei initialisiert die App und verwaltet den globalen Zustand.
// Die eigentliche Logik ist in Module ausgelagert.
// ===================================================================

// ===================================================================
// GLOBALER ANWENDUNGSZUSTAND
// ===================================================================
let currentView = 'dashboard-empty-content';
let currentProjectId = null;
let newProjectData = {};
let pomodoroTimer = {
    DEFAULT_TIME: 25 * 60, timeLeft: 25 * 60, isRunning: false,
    interval: null, activeTaskId: null
};
let processWizardState = {};

// Globale Variable für den Zugriff aus anderen Skripten
window.currentView = currentView;

// ===================================================================
// KERN-INITIALISIERUNG DER APP (ENTRY POINT)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Progress Journal App wird initialisiert...");
    initializeQuickAdd();
    navigateTo('dashboard');
});
