// ===================================================================
// GLOBAL APP STATE & MOCK DATABASE
// ===================================================================

// Die Mock-Datenbank. Normalerweise wäre dies eine eigene Datei,
// aber wir fügen sie hier für die Einfachheit hinzu.
const mockDB = {
    projects: [], // Startet leer, wird durch den Wizard gefüllt
    inboxItems: [
        { id: 'inbox_1', text: 'Neues Buch über Stoizismus recherchieren' },
        { id: 'inbox_2', text: 'Geschenkidee für Annas Geburtstag' },
        { id: 'inbox_3', text: 'Ölwechsel beim Auto machen lassen' },
    ],
    todayTasks: [
        { id: 'task_1', text: 'Wochenziele für Marathon-Plan definieren', completed: false, project: { id: 'proj_1', name: 'Marathon laufen' } },
        { id: 'task_2', text: 'Taktik-Drills: Läuferspringergabel', completed: true, project: { id: 'proj_2', name: 'Schach Elo verbessern' } },
        { id: 'task_3', text: 'Analyse der letzten Partie', completed: false, project: { id: 'proj_2', name: 'Schach Elo verbessern' } },
    ]
};

// Globaler Zustand der App
let currentView = 'dashboard-empty-content';
let currentProjectId = null; // Wichtig für die Detailansicht
let newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null };

// ===================================================================
// CORE APP NAVIGATION & VIEW MANAGEMENT
// ===================================================================
const appContent = document.getElementById('app-content');

async function navigateTo(viewId, params = {}) {
    console.log(`Navigating to: ${viewId}`, params);
    
    // Speichere die Projekt-ID, wenn eine übergeben wird
    if (params.projectId) {
        currentProjectId = params.projectId;
    }

    try {
        // Wir laden nur den reinen "content" und nicht ganze HTML-Seiten
        const response = await fetch(`${viewId}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${viewId}.html: ${response.statusText}`);
        }
        const html = await response.text();
        appContent.innerHTML = html;
        currentView = viewId;
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
        // Spezielle Logik, damit "Dashboard" aktiv bleibt, egal ob leer oder gefüllt
        if (navTarget === currentView || (currentView.startsWith('dashboard') && navTarget === 'dashboard-empty-content')) {
            item.classList.add('active');
        }
    });
}

document.querySelectorAll('.app-nav .nav-item').forEach(navItem => {
    navItem.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = navItem.dataset.nav;
        navigateTo(viewId);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Startet die App mit dem leeren Dashboard
    navigateTo('dashboard-empty-content');
});

function runViewSpecificScripts() {
    const hamburgerBtn = document.getElementById('hamburger');
    const bodyEl = document.body;
    if (hamburgerBtn) {
        if (window.innerWidth >= 768) { bodyEl.classList.add('sidenav-expanded'); }
        hamburgerBtn.addEventListener('click', () => { bodyEl.classList.toggle('sidenav-expanded'); });
    }

    // Führe Skripte für die jeweilige Ansicht aus
    switch (currentView) {
        case 'dashboard-empty-content':
            setupWizardTriggers();
            break;
        case 'dashboard-filled-content':
            renderDashboardFilled();
            setupWizardTriggers();
            break;
        case 'projects-content':
            renderProjects();
            setupWizardTriggers();
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
        default:
            break;
    }
}

// ===================================================================
// DYNAMIC CONTENT RENDERERS
// ===================================================================

function renderDashboardFilled() {
    // FEHLERBEHEBUNG: Die ID war falsch. Es ist "projects-grid", nicht "projects-grid-dashboard"
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) {
        console.error("Konnte #projects-grid im Dashboard nicht finden.");
        return;
    }

    projectsGrid.innerHTML = ''; // Leere den Inhalt, bevor er neu gezeichnet wird

    mockDB.projects.forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });

    projectsGrid.innerHTML += `
        <div class="project-card-placeholder" id="add-project-placeholder">
            <span class="material-icons">add_circle_outline</span>
            <span>Neues Projekt hinzufügen</span>
        </div>
    `;

    // Event Listeners für die Karten und den Platzhalter hinzufügen
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid-projects');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = '';
    mockDB.projects.forEach(project => {
        projectsGrid.innerHTML += createProjectCardHtml(project);
    });

    projectsGrid.innerHTML += `
        <div class="project-card-placeholder" id="add-project-placeholder">
            <span class="material-icons">add_circle_outline</span>
            <span>Neues Projekt hinzufügen</span>
        </div>
    `;
    addProjectCardListeners();
    setupWizardTriggers();
}

function renderInbox() {
    const inboxList = document.getElementById('inbox-list');
    if (!inboxList) return;
    inboxList.innerHTML = '';
    mockDB.inboxItems.forEach(item => {
        inboxList.innerHTML += `
            <div class="inbox-item" data-id="${item.id}">
                <span class="inbox-item-text">${item.text}</span>
                <div class="inbox-item-actions">
                    <button class="action-btn" title="Einem Projekt zuordnen"><span class="material-icons">topic</span></button>
                    <button class="action-btn" title="Löschen"><span class="material-icons">delete_outline</span></button>
                </div>
            </div>
        `;
    });
}

function renderToday() {
    const todayList = document.getElementById('today-list');
    if (!todayList) return;

    // Datum setzen
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    todayList.innerHTML = '';
    mockDB.todayTasks.forEach(task => {
        todayList.innerHTML += `
            <div class="today-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-info">
                    <span class="task-checkbox"><span class="material-icons">${task.completed ? 'check' : ''}</span></span>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-meta">
                    <span class="task-project-link">
                        Projekt: <a href="#">${task.project.name}</a>
                    </span>
                    <button class="start-task-timer-btn" title="Timer für diese Aufgabe starten">
                        <span class="material-icons">play_circle_outline</span>
                    </button>
                </div>
            </div>
        `;
    });
    // TODO: Timer-Logik hinzufügen
}

function renderProjectDetails() {
    if (!currentProjectId) {
        appContent.innerHTML = "<h1>Kein Projekt ausgewählt</h1>";
        return;
    }
    const project = mockDB.projects.find(p => p.id === currentProjectId);
    if (!project) {
        appContent.innerHTML = "<h1>Projekt nicht gefunden</h1>";
        return;
    }

    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-progress-fill').style.width = `${project.progress}%`;

    const timeline = document.getElementById('project-timeline');
    if (timeline) {
        timeline.innerHTML = '';
        if (project.milestones.length > 0) {
            project.milestones.forEach(milestone => {
                timeline.innerHTML += `
                    <div class="milestone current">
                        <div class="milestone__line"></div>
                        <div class="milestone__icon"><span class="material-icons">flag</span></div>
                        <div class="milestone__content">
                            <div class="milestone__header">
                                <h3>${milestone.title}</h3>
                                <span>${milestone.duration}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            timeline.innerHTML = "<p>Für dieses Projekt wurden noch keine Meilensteine erstellt.</p>";
        }
    }
}


function createProjectCardHtml(project) {
    return `
        <a href="#" class="project-card" data-project-id="${project.id}">
            <div class="card-header">
                <h2 class="project-title">${project.title}</h2>
                <span class="material-icons card-menu">more_vert</span>
            </div>
            <div class="card-body">
                <p class="next-milestone">NÄCHSTER MEILENSTEIN:</p>
                <p class="milestone-title">${project.nextMilestone}</p>
            </div>
            <div class="card-footer">
                <div class="progress-info">
                    <span class="progress-label">Fortschritt</span>
                    <span class="progress-percent">${project.progress}%</span>
                </div>
                <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: ${project.progress}%;"></div>
                </div>
            </div>
        </a>
    `;
}

function addProjectCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = card.dataset.projectId;
            if (projectId) {
                navigateTo('project-detail-content', { projectId: projectId });
            }
        });
    });
}

// ===================================================================
// WIZARD LOGIC
// ===================================================================

function setupWizardTriggers() {
    const openButtons = document.querySelectorAll('#open-wizard-btn, #open-wizard-btn-filled, #open-wizard-btn-projects, #add-project-placeholder');
    
    openButtons.forEach(btn => {
        if(btn){
            btn.onclick = () => {
                // Lade den Wizard, falls er noch nicht da ist
                if (!document.getElementById('wizard-modal')) {
                    fetch('wizard_content.html')
                        .then(response => response.text())
                        .then(html => {
                            document.body.insertAdjacentHTML('beforeend', html);
                            initializeWizard();
                            document.getElementById('wizard-modal').classList.remove('hidden');
                        });
                } else {
                    initializeWizard();
                    document.getElementById('wizard-modal').classList.remove('hidden');
                }
            };
        }
    });
}

function initializeWizard() {
    currentStep = 0;
    newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null };
    
    // Event-Listener zuweisen
    document.getElementById('close-wizard-btn').onclick = () => document.getElementById('wizard-modal').classList.add('hidden');
    document.getElementById('next-button').onclick = nextStep;
    document.getElementById('prev-button').onclick = prevStep;
    
    document.querySelectorAll('#step-0 .option-button').forEach(button => {
        button.onclick = () => selectWizardType(button, button.dataset.wizardType);
    });

    document.querySelectorAll('#deadline-options .option-button').forEach(button => {
        button.onclick = (e) => handleDeadlineChoice(e.target);
    });
    
    const deadlineInput = document.getElementById('deadline-input');
    deadlineInput.oninput = () => {
        newProjectData.deadline = deadlineInput.value;
        document.getElementById('next-button').disabled = !deadlineInput.value;
    };
    
    updateWizardState();
}

function updateWizardState() {
    const wizardModal = document.getElementById('wizard-modal');
    if (!wizardModal) return;

    const steps = wizardModal.querySelectorAll('.wizard-step');
    steps.forEach(step => step.classList.add('hidden'));

    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    if (currentStep === 0) {
        document.getElementById('step-0').classList.remove('hidden');
        prevButton.style.visibility = 'hidden';
        nextButton.style.display = 'none'; // Verstecke den Weiter-Button komplett
        progressFill.style.width = '0%';
        progressLabel.textContent = 'Erstellungstyp wählen';
        return;
    }
    
    prevButton.style.visibility = 'visible';
    nextButton.style.display = 'inline-flex';

    const currentWizardSteps = newProjectData.wizardType === 'manual' ? [1, 2] : [1, 2, 3, 4];
    const totalSteps = currentWizardSteps.length;
    
    document.getElementById(`step-${currentStep}`).classList.remove('hidden');
    
    const stepIndex = currentWizardSteps.indexOf(currentStep);
    progressFill.style.width = `${((stepIndex + 1) / totalSteps) * 100}%`;
    progressLabel.textContent = `Schritt ${stepIndex + 1} von ${totalSteps}`;

    nextButton.innerHTML = (stepIndex === totalSteps - 1) 
        ? '<span>Ziel erstellen</span><span class="material-icons">done</span>' 
        : '<span>Weiter</span><span class="material-icons">arrow_forward</span>';
    
    // Logik für das Deaktivieren des "Weiter"-Buttons
    nextButton.disabled = false;
    if (currentStep === 1) nextButton.disabled = !document.getElementById('goal-input').value;
    if (currentStep === 2) nextButton.disabled = !newProjectData.deadlineType;
    if (currentStep === 3) nextButton.disabled = !newProjectData.startingPoint;
}

function nextStep() {
    if (currentStep === 1) newProjectData.goal = document.getElementById('goal-input').value;

    const isManual = newProjectData.wizardType === 'manual';
    const finalStep = isManual ? 2 : 4;
    
    if (currentStep === finalStep) {
        createNewProject();
        return;
    }

    const currentWizardSteps = isManual ? [1, 2] : [1, 2, 3, 4];
    const stepIndex = currentWizardSteps.indexOf(currentStep);
    currentStep = currentWizardSteps[stepIndex + 1];
    
    if (currentStep === 3) populateStep3Options();
    if (currentStep === 4) generateAiPlan();
    
    updateWizardState();
}

function prevStep() {
    const isManual = newProjectData.wizardType === 'manual';
    const currentWizardSteps = isManual ? [1, 2] : [1, 2, 3, 4];
    const stepIndex = currentWizardSteps.indexOf(currentStep);

    if (stepIndex > 0) {
        currentStep = currentWizardSteps[stepIndex - 1];
    } else {
        currentStep = 0; // Zurück zum Auswahl-Screen
    }
    updateWizardState();
}

function selectWizardType(button, type) {
    document.querySelectorAll('#step-0 .option-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    newProjectData.wizardType = type;
    currentStep = 1; // Gehe immer zu Schritt 1
    updateWizardState();
}

function handleDeadlineChoice(button) {
    const allButtons = button.parentElement.querySelectorAll('.option-button');
    allButtons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    const choice = button.dataset.value;
    newProjectData.deadlineType = choice;
    
    const deadlineInputContainer = document.getElementById('deadline-input-container');
    if (choice === 'user_date') {
        deadlineInputContainer.classList.add('visible');
        document.getElementById('next-button').disabled = !document.getElementById('deadline-input').value;
    } else {
        deadlineInputContainer.classList.remove('visible');
        document.getElementById('next-button').disabled = false;
    }
}

function populateStep3Options() {
    // Diese Logik ist aus deiner alten Datei übernommen und sollte funktionieren
    const goalText = document.getElementById('goal-input').value.toLowerCase();
    const optionsContainer = document.getElementById('ausgangslage-options');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';
    
    // Simulierte Logik - normal würde man `mockDB.ausgangslage` verwenden
    let options = [{id: 'beginner', text: 'Anfänger'}, {id: 'advanced', text: 'Fortgeschritten'}];
    if (goalText.includes('lauf')) {
        options = [{id: 'running_beginner', text: 'Ich laufe selten'}, {id: 'running_advanced', text: 'Ich laufe regelmäßig'}];
    }
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.textContent = option.text;
        button.dataset.value = option.id;
        button.onclick = () => {
            document.querySelectorAll('#ausgangslage-options .option-button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            newProjectData.startingPoint = option.id;
            updateWizardState();
        };
        optionsContainer.appendChild(button);
    });
}

function generateAiPlan() {
    // Simulierte KI-Planung
    const planDisplay = document.getElementById('plan-display-container');
    planDisplay.innerHTML = '';
    const template = [
        { title: 'Grundlagen schaffen', duration: 'Woche 1-2' },
        { title: 'Distanz langsam steigern', duration: 'Woche 3-5' },
        { title: 'Intensität erhöhen', duration: 'Woche 6-8' },
        { title: 'Wettkampfvorbereitung', duration: 'Woche 9-10' },
    ];
    newProjectData.generatedPlan = template;
    template.forEach(milestone => {
        planDisplay.innerHTML += `
          <div class="milestone-item">
            <span class="material-icons milestone-icon">flag</span>
            <div class="milestone-details">
              <h3>${milestone.title}</h3>
              <p>${milestone.duration}</p>
            </div>
          </div>
        `;
    });
}

function createNewProject() {
    const newProject = {
        id: `proj_${Date.now()}`,
        title: newProjectData.goal,
        progress: 0,
        nextMilestone: (newProjectData.generatedPlan && newProjectData.generatedPlan.length > 0) ? newProjectData.generatedPlan[0].title : "Noch keine Meilensteine",
        milestones: newProjectData.generatedPlan || [],
        status: 'active'
    };
    mockDB.projects.push(newProject);
    console.log("Neues Projekt hinzugefügt:", mockDB.projects);
    
    document.getElementById('wizard-modal').classList.add('hidden');
    navigateTo('dashboard-filled-content');
}