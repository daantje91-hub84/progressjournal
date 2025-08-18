// ===================================================================
// GLOBAL APP STATE & MOCK DATABASE
// mockDB wird jetzt aus mockdb.js geladen.
// ===================================================================
let currentView = 'dashboard-empty';
let newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null };


// ===================================================================
// CORE APP NAVIGATION & VIEW MANAGEMENT
// ===================================================================
const appContent = document.getElementById('app-content');

async function navigateTo(viewId) {
    console.log(`Navigating to: ${viewId}`);
    try {
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
        if (item.dataset.nav === currentView) {
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
    // Initialer Ladevorgang, um die Ansicht zu rendern
    navigateTo('dashboard-empty-content');
});

function runViewSpecificScripts() {
  const hamburgerBtn = document.getElementById('hamburger');
  const bodyEl = document.body;
  if (hamburgerBtn) { 
      if (window.innerWidth >= 768) { 
          bodyEl.classList.add('sidenav-expanded'); 
      }
      hamburgerBtn.addEventListener('click', () => { 
          bodyEl.classList.toggle('sidenav-expanded'); 
      }); 
  }

  // Check which view is currently loaded and run specific scripts
  switch (currentView) {
      case 'dashboard-empty-content':
          // The empty dashboard needs no rendering logic, only the wizard trigger
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
      case 'today-content':
          // Logic for the today view goes here
          // e.g. runTimerScripts()
          break;
      case 'project-detail-content':
          // Logic for project detail goes here
          // e.g. renderProjectDetails()
          break;
      default:
          break;
  }
}

// ===================================================================
// DYNAMIC CONTENT RENDERERS & WIZARD TRIGGERS
// ===================================================================

function renderDashboardFilled() {
    const projectsGrid = document.getElementById('projects-grid-dashboard');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = '';

    mockDB.projects.forEach(project => {
        const projectCardHtml = `
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
                        <span class="progress-percent">${project.progressPercent}%</span>
                    </div>
                    <div class="card-progress-bar">
                        <div class="card-progress-fill" style="width: ${project.progressPercent}%;"></div>
                    </div>
                </div>
            </a>
        `;
        projectsGrid.innerHTML += projectCardHtml;
    });

    const placeholderHtml = `
        <div class="project-card-placeholder" id="add-project-placeholder-dashboard">
            <span class="material-icons">add_circle_outline</span>
            <span>Neues Projekt hinzufügen</span>
        </div>
    `;
    projectsGrid.innerHTML += placeholderHtml;

    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('project-detail-content');
        });
    });
}

function renderProjects() {
  const projectsGrid = document.getElementById('projects-grid-projects');
  if (!projectsGrid) return;

  projectsGrid.innerHTML = '';

  mockDB.projects.forEach(project => {
    const projectCardHtml = `
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
                    <span class="progress-percent">${project.progressPercent}%</span>
                </div>
                <div class="card-progress-bar">
                    <div class="card-progress-fill" style="width: ${project.progressPercent}%;"></div>
                </div>
            </div>
        </a>
    `;
    projectsGrid.innerHTML += projectCardHtml;
  });

  const placeholderHtml = `
      <div class="project-card-placeholder" id="add-project-placeholder-projects">
          <span class="material-icons">add_circle_outline</span>
          <span>Neues Projekt hinzufügen</span>
      </div>
  `;
  projectsGrid.innerHTML += placeholderHtml;

  document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo('project-detail-content');
      });
  });
}

function setupWizardTriggers() {
    const wizardModal = document.getElementById('wizard-modal');
    if (!wizardModal) {
      // Wenn der Wizard noch nicht im DOM ist, laden wir ihn
      fetch('wizard_content.html')
        .then(response => response.text())
        .then(html => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          document.body.appendChild(tempDiv.firstElementChild);
          setupWizardEvents();
        });
    } else {
        // Sonst nur die Events neu zuweisen
        setupWizardEvents();
    }
}

function setupWizardEvents() {
    // Buttons in den verschiedenen Views
    const openWizardBtnEmpty = document.getElementById('open-wizard-btn');
    const openWizardBtnFilled = document.getElementById('open-wizard-btn-filled');
    const openWizardBtnProjects = document.getElementById('open-wizard-btn-projects');
    const addProjectPlaceholderDashboard = document.getElementById('add-project-placeholder-dashboard');
    const addProjectPlaceholderProjects = document.getElementById('add-project-placeholder-projects');

    if (openWizardBtnEmpty) {
        openWizardBtnEmpty.addEventListener('click', () => { initializeWizard(); wizardModal.classList.remove('hidden'); });
    }
    if (openWizardBtnFilled) {
        openWizardBtnFilled.addEventListener('click', () => { initializeWizard(); wizardModal.classList.remove('hidden'); });
    }
    if (openWizardBtnProjects) {
        openWizardBtnProjects.addEventListener('click', () => { initializeWizard(); wizardModal.classList.remove('hidden'); });
    }
    if (addProjectPlaceholderDashboard) {
        addProjectPlaceholderDashboard.addEventListener('click', () => { initializeWizard(); wizardModal.classList.remove('hidden'); });
    }
    if (addProjectPlaceholderProjects) {
        addProjectPlaceholderProjects.addEventListener('click', () => { initializeWizard(); wizardModal.classList.remove('hidden'); });
    }
    
    // Wizard-spezifische Buttons
    const closeWizardBtn = document.getElementById('close-wizard-btn');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');
    
    if (closeWizardBtn) closeWizardBtn.addEventListener('click', () => { wizardModal.classList.add('hidden'); });
    if (nextButton) nextButton.addEventListener('click', nextStep);
    if (prevButton) prevButton.addEventListener('click', prevStep);
}


// ===================================================================
// WIZARD LOGIC
// (Wird global gehalten und durch setupWizardEvents verbunden)
// ===================================================================
let currentStep = 0;
// 'newProjectData' ist bereits global deklariert
const wizardModal = document.getElementById('wizard-modal');
const closeWizardBtn = document.getElementById('close-wizard-btn');
const steps = document.querySelectorAll('.wizard-step');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const goalInput = document.getElementById('goal-input')
// Deklarationen global, um Fehler zu vermeiden
let deadlineOptions = null;
let deadlineInputContainer = null;
let deadlineInput = null;

const stepMap = { 'ai': [0, 1, 2, 3, 4], 'manual': [0, 1, 2] };


function getPlanKey() {
    const goalText = newProjectData.goal ? newProjectData.goal.toLowerCase() : '';
    if (goalText.includes('lauf') || goalText.includes('marathon')) return 'laufen';
    if (goalText.includes('lern') || goalText.includes('sprache')) return 'lernen';
    return 'standard';
}

function generateAiPlan() {
  const planKey = getPlanKey();
  const startingPointKey = newProjectData.startingPoint;
  const planDisplay = document.getElementById('plan-display-container');
  planDisplay.innerHTML = '';

  let template = (mockDB.planTemplates[planKey] && mockDB.planTemplates[planKey][startingPointKey]) 
               ? mockDB.planTemplates[planKey][startingPointKey]
               : mockDB.planTemplates.standard;
  
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

function updateWizardState() {
  if (!wizardModal) return;

  const currentWizardSteps = newProjectData.wizardType === 'manual' ? [1, 2, 'manual-final'] : [1, 2, 3, 4];
  const stepIndex = currentWizardSteps.indexOf(currentStep);
  
  document.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));

  if (currentStep === 'manual-final') {
    document.getElementById('step-4').classList.remove('hidden');
    document.querySelector('#step-4 h1').textContent = 'Dein manuelles Projekt wird erstellt.';
    document.querySelector('#step-4 p').textContent = 'Keine Sorge, du kannst die Meilensteine später im Projekt manuell hinzufügen.';
  } else {
    document.getElementById(`step-${currentStep}`).classList.remove('hidden');
  }

  if (currentStep === 0) {
    prevButton.style.visibility = 'hidden';
    nextButton.style.display = 'none';
  } else {
    prevButton.style.visibility = 'visible';
    nextButton.style.display = 'inline-flex';
    const progressPercent = ((stepIndex + 1) / currentWizardSteps.length) * 100;
    progressFill.style.width = `${progressPercent}%`;
    progressLabel.textContent = `Schritt ${stepIndex + 1} von ${currentWizardSteps.length}`;
    nextButton.innerHTML = (currentStep === 4 || currentStep === 'manual-final') ? '<span>Ziel erstellen</span>' : '<span>Weiter</span><span class="material-icons">arrow_forward</span>';
  }

  if (currentStep === 3) { populateStep3(); nextButton.disabled = !newProjectData.startingPoint; } 
  else if (currentStep === 2) { nextButton.disabled = !newProjectData.deadlineType || (newProjectData.deadlineType === 'user_date' && !newProjectData.deadline); }
  else if (currentStep === 4) { generateAiPlan(); nextButton.disabled = false; }
  else { nextButton.disabled = false; }
}

function nextStep() {
    if (currentStep === 0) {
        return;
    }

    if (currentStep === 1) newProjectData.goal = goalInput.value;
    if (currentStep === 2 && newProjectData.deadlineType === 'user_date') newProjectData.deadline = document.getElementById('deadline-input').value;

    const currentWizardSteps = newProjectData.wizardType === 'manual' ? [1, 2, 'manual-final'] : [1, 2, 3, 4];
    const stepIndex = currentWizardSteps.indexOf(currentStep);
    
    if (currentStep === 4 || currentStep === 'manual-final') {
        alert('Ziel wird erstellt! Daten: ' + JSON.stringify(newProjectData));
        closeWizardBtn.click();
        navigateTo('dashboard-filled-content');
    } else {
        currentStep = currentWizardSteps[stepIndex + 1];
        updateWizardState();
    }
}

function prevStep() {
  const currentWizardSteps = newProjectData.wizardType === 'manual' ? [1, 2, 'manual-final'] : [1, 2, 3, 4];
  const stepIndex = currentWizardSteps.indexOf(currentStep);
  if (stepIndex > 0) {
    currentStep = currentWizardSteps[stepIndex - 1];
    updateWizardState();
  } else if (currentStep === 1) {
    currentStep = 0;
    updateWizardState();
  }
}

function selectWizardType(button, type) {
  document.querySelectorAll('#step-0 .option-button').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  newProjectData.wizardType = type;
  currentStep = 1;
  updateWizardState();
}

function initializeWizard() {
    currentStep = 0; 
    newProjectData = { goal: null, deadline: null, deadlineType: null, startingPoint: null, generatedPlan: null, wizardType: null }; 
    const wizardForm = document.getElementById('wizard-form');
    if (wizardForm) wizardForm.reset(); 
    
    const deadlineInputContainer = document.getElementById('deadline-input-container');
    if (deadlineInputContainer) deadlineInputContainer.classList.remove('visible'); 
    
    const step0Options = document.querySelectorAll('#step-0 .option-button');
    if (step0Options) step0Options.forEach(btn => btn.classList.remove('selected'));
    
    const deadlineOptions = document.getElementById('deadline-options');
    if (deadlineOptions) deadlineOptions.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected')); 
    
    wizardModal = document.getElementById('wizard-modal');
    closeWizardBtn = document.getElementById('close-wizard-btn');
    steps = document.querySelectorAll('.wizard-step');
    prevButton = document.getElementById('prev-button');
    nextButton = document.getElementById('next-button');
    progressLabel = document.getElementById('progress-label');
    progressFill = document.getElementById('progress-fill');
    goalInput = document.getElementById('goal-input');

    // Event listeners, only if they don't already exist
    if (nextButton && !nextButton.hasAttribute('data-event-attached')) {
      nextButton.addEventListener('click', nextStep);
      nextButton.setAttribute('data-event-attached', 'true');
    }
    if (prevButton && !prevButton.hasAttribute('data-event-attached')) {
      prevButton.addEventListener('click', prevStep);
      prevButton.setAttribute('data-event-attached', 'true');
    }
    if (closeWizardBtn && !closeWizardBtn.hasAttribute('data-event-attached')) {
      closeWizardBtn.addEventListener('click', () => { wizardModal.classList.add('hidden'); });
      closeWizardBtn.setAttribute('data-event-attached', 'true');
    }
    if (goalInput && !goalInput.hasAttribute('data-event-attached')) {
        goalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nextStep();
            }
        });
        goalInput.setAttribute('data-event-attached', 'true');
    }
    
    deadlineOptions = document.getElementById('deadline-options');
    deadlineInputContainer = document.getElementById('deadline-input-container');
    deadlineInput = document.getElementById('deadline-input');
    if (deadlineOptions && !deadlineOptions.hasAttribute('data-event-attached')) {
        deadlineOptions.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            const allButtons = deadlineOptions.querySelectorAll('.option-button');
            allButtons.forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            const choice = e.target.dataset.value;
            newProjectData.deadlineType = choice;
            if (choice === 'user_date') {
                deadlineInputContainer.classList.add('visible');
                newProjectData.deadline = deadlineInput.value;
                nextButton.disabled = !deadlineInput.value;
            } else {
                deadlineInputContainer.classList.remove('visible');
                newProjectData.deadline = null;
                nextButton.disabled = false;
            }
        });
        deadlineOptions.setAttribute('data-event-attached', 'true');
    }

    if (deadlineInput && !deadlineInput.hasAttribute('data-event-attached')) {
      deadlineInput.addEventListener('input', () => {
        newProjectData.deadline = deadlineInput.value;
        nextButton.disabled = !deadlineInput.value;
      });
      deadlineInput.setAttribute('data-event-attached', 'true');
    }

    updateWizardState();
}

function populateStep3() {
    const goalText = document.getElementById('goal-input').value.toLowerCase();
    const optionsContainer = document.getElementById('ausgangslage-options');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';
    let options = mockDB.ausgangslage.standard;
    if (goalText.includes('lauf') || goalText.includes('marathon')) { options = mockDB.ausgangslage.laufen; } 
    else if (goalText.includes('lern') || goalText.includes('sprache')) { options = mockDB.ausgangslage.lernen; } 
    options.forEach(option => { 
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.textContent = option.text;
        button.dataset.value = option.id;
        button.onclick = () => selectOption(button, option.id, 'startingPoint');
        if (newProjectData.startingPoint === option.id) button.classList.add('selected');
        optionsContainer.appendChild(button);
    });
}

function selectOption(selectedButton, value, group) {
    newProjectData[group] = value;
    const allButtons = selectedButton.parentElement.querySelectorAll('.option-button');
    allButtons.forEach(btn => btn.classList.remove('selected'));
    selectedButton.classList.add('selected');
    document.getElementById('next-button').disabled = false;
}
