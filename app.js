// ===================================================================
// GLOBAL APP STATE & MOCK DATABASE
// ===================================================================
let currentView = 'dashboard-empty';

const mockDB = {
  ausgangslage: {
    laufen: [ { id: 'run_beginner', text: 'Ich bin kompletter Anfänger' }, { id: 'run_intermediate', text: 'Ich laufe bereits gelegentlich (z.B. 5 km)' }, { id: 'run_advanced', text: 'Ich bin fortgeschritten (z.B. 10 km+ regelmäßig)' } ],
    lernen: [ { id: 'learn_beginner', text: 'Ich habe keine Vorkenntnisse' }, { id: 'learn_intermediate', text: 'Ich habe bereits Grundlagenwissen' }, { id: 'learn_advanced', text: 'Ich bin Experte auf einem verwandten Gebiet' } ],
    standard: [ { id: 'std_beginner', text: 'Ich fange bei Null an' }, { id: 'std_intermediate', text: 'Ich habe schon etwas Erfahrung' }, { id: 'std_advanced', text: 'Ich bin schon ziemlich gut darin' } ]
  },
  planTemplates: {
    laufen: {
      run_beginner: [
        { title: 'Grundlagen & Gewöhnung', duration: 'Woche 1-2' },
        { title: 'Erste Distanz-Steigerung', duration: 'Woche 3-5' },
        { title: 'Tempohärte entwickeln', duration: 'Woche 6-9' },
        { title: 'Wettkampf-Simulation & Tapering', duration: 'Woche 10-12' }
      ],
      run_intermediate: [
        { title: 'Kilometer-Basis festigen', duration: 'Woche 1-3' },
        { title: 'Schwellentraining & Intervalle', duration: 'Woche 4-7' },
        { title: 'Lange Läufe optimieren', duration: 'Woche 8-10' },
        { title: 'Gezieltes Tapering', duration: 'Woche 11-12' }
      ]
    },
    standard: [
        { title: 'Meilenstein 1: Recherche & Grundlagen', duration: 'Phase 1' },
        { title: 'Meilenstein 2: Erster Entwurf & Prototyp', duration: 'Phase 2' },
        { title: 'Meilenstein 3: Feedback & Überarbeitung', duration: 'Phase 3' },
        { title: 'Meilenstein 4: Finalisierung & Abschluss', duration: 'Phase 4' }
    ]
  }
};
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
    navigateTo('dashboard-empty');
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

  const openWizardBtnEmpty = document.getElementById('open-wizard-btn');
  if (openWizardBtnEmpty) {
    openWizardBtnEmpty.addEventListener('click', (e) => {
        e.preventDefault();
        initializeWizard(); 
        document.getElementById('wizard-modal').classList.remove('hidden'); 
    });
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('project-detail-content');
    });
  });

  const dateElement = document.getElementById('current-date');
  if (dateElement) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('de-DE', options);
  }

  const tasks = document.querySelectorAll('.task-item');
  tasks.forEach(task => {
      task.addEventListener('click', () => {
          task.classList.toggle('completed');
      });
  });
}


// ===================================================================
// WIZARD LOGIC
// ===================================================================
const wizardModal = document.getElementById('wizard-modal');
const closeWizardBtn = document.getElementById('close-wizard-btn');
const steps = document.querySelectorAll('.wizard-step');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const goalInput = document.getElementById('goal-input');

let currentStep = 0;
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
  let currentWizardSteps = [];
  let totalStepsForProgress = 0;

  if (newProjectData.wizardType === 'manual') {
      currentWizardSteps = [1, 2, 'manual-final'];
      totalStepsForProgress = 3;
  } else if (newProjectData.wizardType === 'ai') {
      currentWizardSteps = [1, 2, 3, 4];
      totalStepsForProgress = 4;
  } else {
      currentWizardSteps = [0];
      totalStepsForProgress = 1;
  }

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
    const progressPercent = ((stepIndex + 1) / totalStepsForProgress) * 100;
    progressFill.style.width = `${progressPercent}%`;
    progressLabel.textContent = `Schritt ${stepIndex + 1} von ${totalStepsForProgress}`;
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
    document.getElementById('wizard-form').reset(); 
    document.getElementById('deadline-input-container').classList.remove('visible'); 
    document.querySelectorAll('#step-0 .option-button').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('deadline-options').querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected')); 
    updateWizardState();
}

nextButton.addEventListener('click', nextStep);
prevButton.addEventListener('click', prevStep);
closeWizardBtn.addEventListener('click', () => { wizardModal.classList.add('hidden'); });

const deadlineOptions = document.getElementById('deadline-options');
const deadlineInputContainer = document.getElementById('deadline-input-container');
const deadlineInput = document.getElementById('deadline-input');
deadlineOptions.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') return; const allButtons = deadlineOptions.querySelectorAll('.option-button'); allButtons.forEach(btn => btn.classList.remove('selected')); e.target.classList.add('selected'); const choice = e.target.dataset.value; newProjectData.deadlineType = choice; if (choice === 'user_date') { deadlineInputContainer.classList.add('visible'); newProjectData.deadline = deadlineInput.value; nextButton.disabled = !deadlineInput.value; } else { deadlineInputContainer.classList.remove('visible'); newProjectData.deadline = null; nextButton.disabled = false; } });
deadlineInput.addEventListener('input', () => { newProjectData.deadline = deadlineInput.value; nextButton.disabled = !deadlineInput.value; });
function populateStep3() { const goalText = document.getElementById('goal-input').value.toLowerCase(); const optionsContainer = document.getElementById('ausgangslage-options'); optionsContainer.innerHTML = ''; let options = mockDB.ausgangslage.standard; if (goalText.includes('lauf') || goalText.includes('marathon')) { options = mockDB.ausgangslage.laufen; } else if (goalText.includes('lern') || goalText.includes('sprache')) { options = mockDB.ausgangslage.lernen; } options.forEach(option => { const button = document.createElement('button'); button.type = 'button'; button.className = 'option-button'; button.textContent = option.text; button.dataset.value = option.id; button.onclick = () => selectOption(button, option.id, 'startingPoint'); if (newProjectData.startingPoint === option.id) button.classList.add('selected'); optionsContainer.appendChild(button); }); }
function selectOption(selectedButton, value, group) { newProjectData[group] = value; const allButtons = selectedButton.parentElement.querySelectorAll('.option-button'); allButtons.forEach(btn => btn.classList.remove('selected')); selectedButton.classList.add('selected'); nextButton.disabled = false; }
