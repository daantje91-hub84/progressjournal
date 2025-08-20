// ===================================================================
// WIZARD LOGIC
// Dieses Modul enthält die Logik für mehrstufige Prozesse wie die Projekterstellung.
// ===================================================================

function setupWizardTriggers() {
    document.querySelectorAll('#open-wizard-btn, #open-wizard-btn-filled, #open-wizard-btn-projects').forEach(btn => {
        if(btn) btn.addEventListener('click', startProjectWizard);
    });
}

function closeWizard() {
    document.getElementById('wizard-modal')?.remove();
}

async function startProjectWizard() {
    closeWizard();
    try {
        const response = await fetch('views/wizard_content.html');
        if (!response.ok) throw new Error('Wizard-Datei nicht gefunden');
        document.body.insertAdjacentHTML('beforeend', await response.text());
        initializeWizard();
    } catch (error) {
        console.error("Fehler beim Laden des Wizards:", error);
    }
}

function initializeWizard() {
    newProjectData = {
        goal: null, context_id: null, wizardType: null, milestones: []
    };

    let wizardStep = 0;
    let totalSteps = 4;

    const wizardModal = document.getElementById('wizard-modal');
    if (!wizardModal) return;

    function updateWizardUI() {
        const progressLabel = wizardModal.querySelector('#progress-label');
        const progressFill = wizardModal.querySelector('#progress-fill');
        const prevButton = wizardModal.querySelector('#prev-button');
        const nextButton = wizardModal.querySelector('#next-button');
        
        wizardModal.querySelectorAll('.wizard-step').forEach(step => step.classList.add('hidden'));
        wizardModal.querySelector(`#step-${wizardStep}`)?.classList.remove('hidden');

        if (progressLabel) progressLabel.textContent = `Schritt ${wizardStep + 1} von ${totalSteps}`;
        if (progressFill) progressFill.style.width = `${((wizardStep + 1) / totalSteps) * 100}%`;
        if (prevButton) prevButton.classList.toggle('hidden', wizardStep === 0);
        
        if (nextButton) {
            let isEnabled = false;
            let buttonText = "Weiter";
            let buttonIcon = "arrow_forward";

            switch(wizardStep) {
                case 0: isEnabled = newProjectData.wizardType === 'manual'; break;
                case 1: isEnabled = newProjectData.goal && newProjectData.goal.length >= 5; break;
                case 2: isEnabled = newProjectData.context_id !== null; break;
                case 3:
                    isEnabled = true;
                    buttonText = "Projekt erstellen";
                    buttonIcon = "check_circle_outline";
                    break;
            }
            nextButton.disabled = !isEnabled;
            nextButton.innerHTML = `<span>${buttonText}</span><span class="material-icons">${buttonIcon}</span>`;
        }
    }
    
    function nextStep() {
        if (wizardStep < totalSteps - 1) {
            wizardStep++;
            if (wizardStep === 2) {
                populateContextOptions();
            }
            updateWizardUI();
        } else {
            const newProject = createNewProject();
            closeWizard();
            if (newProject) {
                navigateTo('project-detail-content', { projectId: newProject.id });
            }
        }
    }
    
    function prevStep() {
        if (wizardStep > 0) {
            wizardStep--;
            updateWizardUI();
        }
    }

    // KORRIGIERT: Fügt ein name-Attribut hinzu, um die Konsolenwarnung zu beheben.
    function addMilestoneInput() {
        const container = wizardModal.querySelector('#milestones-container');
        if (!container) return;
        const newMilestoneHTML = `
            <div class="milestone-input-group">
                <input type="text" class="milestone-input" name="milestone" placeholder="z.B. Grundlagen recherchieren">
                <button type="button" class="button-icon remove-milestone-btn" title="Entfernen">
                    <span class="material-icons">delete_outline</span>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', newMilestoneHTML);
    }

    // --- Event Listeners ---
    wizardModal.querySelector('#close-wizard-btn')?.addEventListener('click', closeWizard);
    wizardModal.querySelector('#prev-button')?.addEventListener('click', prevStep);
    wizardModal.querySelector('#next-button')?.addEventListener('click', nextStep);
    wizardModal.querySelector('#add-milestone-btn')?.addEventListener('click', addMilestoneInput);

    wizardModal.querySelector('#milestones-container')?.addEventListener('click', (e) => {
        if (e.target.closest('.remove-milestone-btn')) {
            e.target.closest('.milestone-input-group').remove();
        }
    });

    const step0 = wizardModal.querySelector('#step-0');
    if (step0) {
        step0.addEventListener('click', (e) => {
            const typeBtn = e.target.closest('[data-wizard-type="manual"]');
            if (typeBtn) {
                step0.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
                typeBtn.classList.add('selected');
                newProjectData.wizardType = 'manual';
                updateWizardUI();
            }
        });
    }
    
    wizardModal.querySelector('#goal-input')?.addEventListener('input', (e) => {
        newProjectData.goal = e.target.value;
        updateWizardUI();
    });
    
    wizardModal.querySelector('#context-options')?.addEventListener('click', (e) => {
        const contextBtn = e.target.closest('[data-value]');
        if (contextBtn) {
            wizardModal.querySelectorAll('#context-options .option-button').forEach(btn => btn.classList.remove('selected'));
            contextBtn.classList.add('selected');
            newProjectData.context_id = contextBtn.dataset.value;
            updateWizardUI();
        }
    });
    
    wizardModal.classList.remove('hidden');
    updateWizardUI();
}

function populateContextOptions() {
    const container = document.getElementById('context-options');
    if (!container) return;
    container.innerHTML = database.contexts.map(context => 
        `<button type="button" class="option-button" data-value="${context.id}">${context.emoji} ${context.title}</button>`
    ).join('');
}

function createNewProject() {
    if (!newProjectData.goal) return null;

    const milestoneInputs = document.querySelectorAll('#milestones-container .milestone-input');
    const milestones = Array.from(milestoneInputs)
        .map(input => input.value.trim())
        .filter(text => text.length > 0)
        .map(text => ({ title: text }));

    if (milestones.length === 0) {
        milestones.push({ title: 'Erster Meilenstein' });
    }

    const projectToCreate = {
        title: newProjectData.goal,
        context_id: newProjectData.context_id,
        milestones: milestones
    };

    const newProject = database.addProject(projectToCreate);
    
    return newProject;
}

async function startProcessWizard(taskId) {
    console.log(`Starte Verarbeitung für Task: ${taskId}`);
}
