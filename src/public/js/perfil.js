document.addEventListener("DOMContentLoaded", initializeProfile);

function initializeProfile() {
  loadProfileData();
  setupEventListeners();
  updateInterestTags();
}

function setupEventListeners() {
  document.getElementById("closeBtn").addEventListener("click", closeImagePopup);
  document.getElementById("fileInput").addEventListener("change", handleFileSelect);
  document.getElementById("uploadBtn").addEventListener("click", handleImageUpload);
  document.getElementById("addInterestBtn").addEventListener("click", () => {
    document.getElementById("modal").style.display = "block";
    updateCurrentInterests();
  });
  document.getElementById("saveInterest").addEventListener("click", saveNewInterest);
  window.onclick = (event) => {
    if (event.target == document.getElementById("modal")) {
      document.getElementById("modal").style.display = "none";
    }
  };
}

function toggleEditPopup() {
  const editPopup = document.getElementById("editPopup");
  const profileNameInput = document.getElementById("profileNameInput");
  const profileHeadlineInput = document.getElementById("profileHeadlineInput");
  
  // Cargar valores actuales al abrir el popup
  if (editPopup.style.display !== "flex") {
    profileNameInput.value = document.querySelector(".profile-name").textContent;
    profileHeadlineInput.value = document.querySelector(".profile-headline").textContent;
  }
  
  editPopup.style.display = editPopup.style.display === "flex" ? "none" : "flex";
}

// Agregar event listeners para actualización en tiempo real
document.getElementById("profileNameInput").addEventListener("input", function() {
    document.querySelector(".profile-name").textContent = this.value;
});

document.getElementById("profileHeadlineInput").addEventListener("input", function() {
    document.querySelector(".profile-headline").textContent = this.value;
});

function closeEditPopup() {
  document.getElementById("editPopup").style.display = "none";
}

// Modificar la función saveEditPopup existente
async function saveEditPopup() {
  try {
    const saveButton = document.querySelector('.button-primary');
    saveButton.classList.add('saving');
    saveButton.textContent = 'Guardando...';

    // Primero guardar experiencia
    const experienceData = collectExperienceData();
    const experienceResponse = await fetch('/users/profile/experience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ experiences: experienceData })
    });

    if (!experienceResponse.ok) {
      throw new Error('Error al guardar la experiencia');
    }

    // Guardar el resto de los datos
    const [profileSaved, skillsSaved, languagesSaved] = await Promise.all([
      saveProfileData(),
      saveSkills(),
      saveLanguages()
    ]);

    if (profileSaved && skillsSaved && languagesSaved) {
      saveButton.classList.remove('saving');
      saveButton.classList.add('success');
      saveButton.textContent = '¡Guardado!';
      
      closeEditPopup();

      // Mostrar mensaje de éxito
      showNotificationPopup('Cambios guardados exitosamente');
      
      // Esperar 1 segundo antes de cerrar y refrescar
      setTimeout(() => {
        closeEditPopup();
        window.location.reload(); // Esto refrescará la página
      }, 1000);
      
    } else {
      throw new Error('Error al guardar algunos datos');
    }
  } catch (error) {
    console.error('Error:', error);
    const saveButton = document.querySelector('.button-primary');
    saveButton.classList.remove('saving');
    saveButton.classList.add('error');
    saveButton.textContent = 'Error al guardar';
    
    showNotificationPopup('Error al guardar los cambios: ' + error.message);
    
    setTimeout(() => {
      saveButton.classList.remove('error');
      saveButton.textContent = 'Guardar';
    }, 2000);
  }
}

function addExperience() {
  const container = document.getElementById("experienceEntries");
  const entryCard = createEntryCard("experience");
  container.appendChild(entryCard);
}

async function saveExperience(card) {
  try {
    const empresa = card.querySelector('input[name="company"]').value.trim();
    const puesto = card.querySelector('input[name="position"]').value.trim();
    const startYear = card.querySelector('input[name="startYear"]').value.trim();
    const endYear = card.querySelector('input[name="endYear"]').value.trim();

    if (!empresa || !puesto || !startYear) {
      showNotificationPopup('Por favor complete los campos obligatorios');
      return;
    }

    const experienceData = {
      empresa,
      puesto,
      fecha_inicio: startYear,
      fecha_fin: endYear || null
    };

    const response = await fetch('/users/profile/experience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ experiences: [experienceData] })
    });

    const result = await response.json();

    if (result.success) {
      showNotificationPopup('Experiencia guardada exitosamente');
      // Recargar los datos para actualizar la visualización
      await loadProfileData();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    showNotificationPopup('Error al guardar la experiencia: ' + error.message);
  }
}

function addEducation() {
  const container = document.getElementById("educationEntries");
  const entryCard = createEntryCard("education");
  
  // Agregar el evento submit para guardar los datos
  const saveHandler = async () => {
    try {
      const institucion = entryCard.querySelector('input[name="institution"]').value.trim();
      const titulo = entryCard.querySelector('input[name="degree"]').value.trim();
      const startYear = entryCard.querySelector('input[name="eduStartYear"]').value.trim();
      const endYear = entryCard.querySelector('input[name="eduEndYear"]').value.trim();

      if (!institucion || !titulo || !startYear) {
        showNotificationPopup('Por favor complete los campos obligatorios');
        return;
      }

      const educationData = {
        institucion,
        titulo,
        fecha_inicio: `${startYear}-01-01`,
        fecha_fin: endYear ? `${endYear}-01-01` : null
      };

      const response = await fetch('/users/profile/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ education: [educationData] })
      });

      const result = await response.json();

      if (result.success) {
        showNotificationPopup('Educación guardada exitosamente');
        await loadProfileData(); // Recargar los datos para actualizar la visualización
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showNotificationPopup('Error al guardar la educación: ' + error.message);
    }
  };

  // Agregar event listeners a los campos para guardar automáticamente cuando se completen
  const inputs = entryCard.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('change', saveHandler);
  });

  container.appendChild(entryCard);
}

async function saveEducation(card) {
  try {
    const institucion = card.querySelector('input[name="institution"]').value.trim();
    const titulo = card.querySelector('input[name="degree"]').value.trim();
    const startYear = card.querySelector('input[name="eduStartYear"]').value.trim();
    const endYear = card.querySelector('input[name="eduEndYear"]').value.trim();

    if (!institucion || !titulo || !startYear) {
      showNotificationPopup('Por favor complete los campos obligatorios');
      return;
    }

    const educationData = {
      institucion,
      titulo,
      fecha_inicio: startYear,
      fecha_fin: endYear || null
    };

    const response = await fetch('/users/profile/education', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ education: [educationData] })
    });

    const result = await response.json();

    if (result.success) {
      showNotificationPopup('Educación guardada exitosamente');
      await loadProfileData(); // Recargar los datos
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error:', error);
    showNotificationPopup('Error al guardar la educación: ' + error.message);
  }
}

function createEntryCard(type) {
  const card = document.createElement("div");
  card.className = "entry-card";
  const fields = type === "experience"
    ? [
        { label: "Empresa", name: "company" },
        { label: "Cargo", name: "position" },
        { label: "Año de entrada", name: "startYear", type: "number" },
        { label: "Año de salida", name: "endYear", type: "number" },
      ]
    : [
        { label: "Institución", name: "institution" },
        { label: "Título", name: "degree" },
        { label: "Año de entrada", name: "eduStartYear", type: "number" },
        { label: "Año de salida", name: "eduEndYear", type: "number" },
      ];
  
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn.1";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.onclick = () => {
    if (type === "education") {
      removeEducationEntry(card);
    } else {
      removeExperienceEntry(card);
    }
  };
  card.appendChild(deleteBtn);
  
  fields.forEach((field) => {
    const group = createFormGroup(field);
    card.appendChild(group);
  });

  return card;
}

async function removeExperienceEntry(card) {
  try {
    const experienceId = card.dataset.experienceId;
    if (experienceId) {
      // Si tiene ID, eliminar de la base de datos
      const response = await fetch(`/users/profile/experience/${experienceId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar la experiencia');
      }
    }
    
    // Eliminar del DOM
    card.remove();
    showNotificationPopup('Experiencia eliminada exitosamente');
    
    // Actualizar la visualización
    await loadProfileData();
  } catch (error) {
    console.error('Error:', error);
    showNotificationPopup('Error al eliminar la experiencia: ' + error.message);
  }
}

async function removeEducationEntry(card) {
  try {
    const educationId = card.dataset.educationId;
    if (educationId) {
      const response = await fetch(`/users/profile/education/${educationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Error al eliminar la educación');
      }
    }
    
    card.remove();
    showNotificationPopup('Educación eliminada exitosamente');
    
    await loadProfileData();
  } catch (error) {
    console.error('Error:', error);
    showNotificationPopup('Error al eliminar la educación: ' + error.message);
  }
}

function createFormGroup(field) {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.textContent = field.label;

  const input = document.createElement("input");
  input.type = field.type || "text";
  input.name = field.name;

  group.appendChild(label);
  group.appendChild(input);

  return group;
}

function removeEntry(button) {
  const entry = button.closest(".entry-card");
  if (entry) {
    entry.remove();
  }
}

function addSkill() {
  const input = document.getElementById("skillInput");
  const value = input.value.trim();
  
  if (value) {
    const container = document.getElementById("skillsContainer");
    const skillItem = document.createElement("div");
    skillItem.className = "skill-item";
    
    const skillText = document.createElement("span");
    skillText.textContent = value;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn.2";
    deleteBtn.innerHTML = '<i class="bx bx-trash"></i>'; // Ícono de papelera
    deleteBtn.onclick = () => skillItem.remove();
    
    skillItem.appendChild(skillText);
    skillItem.appendChild(deleteBtn);
    container.appendChild(skillItem);
    input.value = "";
  }
}

function addLanguage() {
  const input = document.getElementById("languageInput");
  const value = input.value.trim();
  
  if (value) {
    const container = document.getElementById("languagesContainer");
    const langItem = document.createElement("div");
    langItem.className = "language-item";
    
    const langText = document.createElement("span");
    langText.textContent = value;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn.3";
    deleteBtn.innerHTML = '<i class="bx bx-trash"></i>'; // Ícono de papelera
    deleteBtn.onclick = () => langItem.remove();
    
    langItem.appendChild(langText);
    langItem.appendChild(deleteBtn);
    container.appendChild(langItem);
    input.value = "";
  }
}

function addItem(input, container, className) {
  const value = input.value.trim();
  if (value) {
    const item = document.createElement("div");
    item.className = className;
    item.textContent = value;
    container.appendChild(item);
    input.value = "";
  }
}

function openPopup(imageType) {
  selectedImageType = imageType;
  const popup = document.getElementById("popup");
  const imageTypeText = imageType === "profile" ? "foto de perfil" : "foto de portada";
  document.getElementById("image-type").textContent = `Selecciona una nueva ${imageTypeText}.`;
  popup.style.display = "flex";
}

function closeImagePopup() {
  document.getElementById("popup").style.display = "none";
  document.getElementById("fileInput").value = "";
  document.getElementById("uploadBtn").disabled = true;
}

function handleFileSelect(event) {
  const fileInput = event.target;
  document.getElementById("uploadBtn").disabled = !fileInput.files.length;
}

function handleImageUpload() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  const formData = new FormData();
  const uploadType = selectedImageType === "profile" ? "profilePhoto" : "coverPhoto";
  formData.append(uploadType, file);

  fetch(`/users/profile/${selectedImageType === "profile" ? "photo" : "cover"}`, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      if (selectedImageType === "profile") {
        updateProfileImage(result.photoUrl);
      } else {
        updateCoverPhoto(result.photoUrl);
      }
      closeImagePopup();
      showNotificationPopup("Imagen actualizada exitosamente");
    } else {
      throw new Error(result.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotificationPopup("Error al subir la imagen");
  });
}

function updateProfileImage(imageUrl) {
  const profileImg = document.getElementById("profile-img");
  const navProfileImg = document.querySelector(".nav-profile-img");

  if (profileImg) profileImg.src = imageUrl;
  if (navProfileImg) navProfileImg.src = imageUrl;
}

function updateCoverPhoto(imageUrl) {
  const coverPhoto = document.querySelector(".cover-photo");
  if (coverPhoto) {
    coverPhoto.style.backgroundImage = `url('${imageUrl}')`;
    coverPhoto.style.backgroundSize = "cover";
    coverPhoto.style.backgroundPosition = "center";
  }
}

function showEdit() {
  const editContainer = document.getElementById("editContainer");
  const textarea = document.getElementById("aboutTextarea");
  const currentText = document.getElementById("aboutText").textContent;
  textarea.value = currentText;
  editContainer.classList.add("active");
}

function cancelEdit() {
  const editContainer = document.getElementById("editContainer");
  editContainer.classList.remove("active");
}

async function saveEdit() {
    const saveButton = document.querySelector('.button-primary');
    
    try {
        saveButton.classList.add('saving');
        saveButton.textContent = 'Guardando...';
        
        // Guardar datos con validación
        const success = await saveExperienceAndEducation();
        
        if (success) {
            saveButton.classList.remove('saving');
            saveButton.classList.add('success');
            saveButton.textContent = '¡Guardado!';
            
            setTimeout(() => {
                saveButton.classList.remove('success');
                saveButton.textContent = 'Guardar';
                closeEditPopup();
                cancelEdit();
            }, 1500);
        } else {
            throw new Error('No se pudieron guardar los datos');
        }
    } catch (error) {
        console.error('Error:', error);
        saveButton.classList.remove('saving');
        saveButton.classList.add('error');
        saveButton.textContent = 'Error al guardar';
        
        setTimeout(() => {
            saveButton.classList.remove('error');
            saveButton.textContent = 'Guardar';
        }, 2000);
    }
}

function updateInterestTags() {
  const interestTags = document.getElementById("interestTags");
  interestTags.innerHTML = "";
  interests.forEach((interest) => {
    const span = document.createElement("span");
    span.className = "interest-tag";
    span.textContent = interest;
    interestTags.appendChild(span);
  });
}

function updateCurrentInterests() {
  const currentInterests = document.getElementById("currentInterests");
  currentInterests.innerHTML = "";
  interests.forEach((interest) => {
    const div = document.createElement("div");
    div.className = "interest-item";
    div.textContent = interest;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "X";
    removeBtn.className = "remove-interest";
    removeBtn.onclick = () => removeInterest(interest);
    div.appendChild(removeBtn);
    currentInterests.appendChild(div);
  });
}

function addInterest(interest) {
  if (interest && !interests.includes(interest)) {
    interests.push(interest);
    updateInterestTags();
    updateCurrentInterests();
    saveToLocalStorage("interests", JSON.stringify(interests));
  }
}

function removeInterest(interest) {
  interests = interests.filter((i) => i !== interest);
  updateInterestTags();
  updateCurrentInterests();
  saveToLocalStorage("interests", JSON.stringify(interests));
}

function saveNewInterest() {
  const newInterest = document.getElementById("newInterest").value.trim();
  if (newInterest) {
    addInterest(newInterest);
    document.getElementById("newInterest").value = "";
  }
  document.getElementById("modal").style.display = "none";
}

function collectFormData() {
  return {
    name: document.getElementById("profileNameInput").value,
    headline: document.getElementById("profileHeadlineInput").value,
    experience: collectEntries("experienceEntries", ["company", "position", "startYear", "endYear"]),
    education: collectEntries("educationEntries", ["institution", "degree", "eduStartYear", "eduEndYear"]),
    skills: Array.from(document.getElementById("skillsContainer").children).map((item) => item.textContent),
    languages: Array.from(document.getElementById("languagesContainer").children).map((item) => item.textContent),
  };
}

function collectEntries(containerId, fields) {
  const entries = [];
  document.getElementById(containerId).querySelectorAll(".entry-card").forEach((card) => {
    const entry = {};
    fields.forEach((field) => {
      const input = card.querySelector(`input[name="${field}"]`);
      const value = input.value.trim();
      
      // Validar años
      if (field.includes('Year')) {
        const year = parseInt(value);
        if (isNaN(year) || year < 1900 || year > 2100) {
          throw new Error(`Año inválido: ${value}`);
        }
        entry[field] = year;
      } else {
        entry[field] = value;
      }
    });
    entries.push(entry);
  });
  return entries;
}

function updateProfile(data) {
  updateSection(
    "experienceSectionDisplay",
    data.experience,
    (exp) => `<div class="profile-desc-row"><strong>${exp.company}</strong> (${exp.startYear} - ${exp.endYear}): ${exp.position}</div>`
  );

  updateSection(
    "educationSectionDisplay",
    data.education,
    (edu) => `<div class="profile-desc-row"><strong>${edu.institution}</strong> (${edu.eduStartYear} - ${edu.eduEndYear}): ${edu.degree}</div>`
  );

  updateContainer("skillsSectionDisplay", data.skills, "skill-item");
  updateContainer("languagesSectionDisplay", data.languages, "language-item");
}

function updateSection(sectionId, data, formatter) {
  const section = document.getElementById(sectionId);
  section.innerHTML = data.map(formatter).join("");
}

function updateContainer(containerId, items, className) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map((item) => `<span class="${className}">${item}</span>`).join("");
}

async function loadProfileData() {
  try {
    // Mostrar un indicador de carga discreto
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    document.body.appendChild(loading);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // Timeout de 1 segundo

    const response = await fetch('/users/profile/full', {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    const result = await response.json();
    
    if (result.success) {
      const { user, experience, education, skills, languages } = result.data;
      
      // Actualizar todo en paralelo
      await Promise.all([
        updateBasicInfo(user),
        updateExperienceDisplay(experience),
        updateEducationDisplay(education),
        updateSkillsDisplay(skills),
        updateLanguagesDisplay(languages)
      ]);

      // Rellenar formularios si es necesario
      if (document.getElementById('editPopup').style.display === 'flex') {
        populateExperienceForm(experience);
        populateEducationForm(education);
        populateSkillsForm(skills);
        populateLanguagesForm(languages);
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('La solicitud tardó demasiado tiempo');
    } else {
      console.error('Error al cargar datos del perfil:', error);
    }
    showNotificationPopup('Error al cargar los datos del perfil');
  } finally {
    // Remover el indicador de carga
    const loading = document.querySelector('.loading-indicator');
    if (loading) loading.remove();
  }
}

// Función auxiliar para actualizar información básica
async function updateBasicInfo(user) {
  if (!user) return;
  
  const updates = [
    user.nombre && document.querySelector('.profile-name') && 
      (document.querySelector('.profile-name').textContent = user.nombre),
    user.titular && document.querySelector('.profile-headline') && 
      (document.querySelector('.profile-headline').textContent = user.titular),
    user.foto_perfil && updateProfileImage(user.foto_perfil),
    user.foto_portada && updateCoverPhoto(user.foto_portada),
    user.acerca_de && document.getElementById('aboutText') && 
      (document.getElementById('aboutText').textContent = user.acerca_de)
  ];

  await Promise.all(updates.filter(Boolean));
}

function populateExperienceForm(experiences) {
  const container = document.getElementById("experienceEntries");
  container.innerHTML = ''; // Limpiar contenedor

  experiences.forEach(exp => {
    const entryCard = createEntryCard("experience");
    
    // Rellenar campos
    entryCard.querySelector('input[name="company"]').value = exp.empresa;
    entryCard.querySelector('input[name="position"]').value = exp.puesto;
    entryCard.querySelector('input[name="startYear"]').value = new Date(exp.fecha_inicio).getFullYear();
    if (exp.fecha_fin) {
      entryCard.querySelector('input[name="endYear"]').value = new Date(exp.fecha_fin).getFullYear();
    }

    // Agregar ID para identificar registro existente
    entryCard.dataset.experienceId = exp.id;
    container.appendChild(entryCard);
  });
}

function populateEducationForm(education) {
  const container = document.getElementById("educationEntries");
  container.innerHTML = '';

  education.forEach(edu => {
    const entryCard = createEntryCard("education");
    
    entryCard.querySelector('input[name="institution"]').value = edu.institucion;
    entryCard.querySelector('input[name="degree"]').value = edu.titulo;
    entryCard.querySelector('input[name="eduStartYear"]').value = new Date(edu.fecha_inicio).getFullYear();
    if (edu.fecha_fin) {
      entryCard.querySelector('input[name="eduEndYear"]').value = new Date(edu.fecha_fin).getFullYear();
    }

    entryCard.dataset.educationId = edu.id;
    container.appendChild(entryCard);
  });
}

// Actualizar la función populateSkillsForm
function populateSkillsForm(skills) {
  const container = document.getElementById("skillsContainer");
  container.innerHTML = '';
  
  skills.forEach(skill => {
    const skillItem = document.createElement("div");
    skillItem.className = "skill-item";
    skillItem.setAttribute('data-skill', skill); // Agregar atributo para identificar la habilidad
    
    const skillText = document.createElement("span");
    skillText.textContent = skill;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn.4";
    deleteBtn.innerHTML = '<i class="bx bx-trash"></i>'; // Ícono de papelera usando BoxIcons
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm(`¿Estás seguro de que deseas eliminar la habilidad "${skill}"?`)) {
        try {
          const response = await fetch('/users/profile/skills', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ habilidad: skill })
          });

          if (response.ok) {
            skillItem.remove();
            showNotificationPopup('Habilidad eliminada exitosamente');
          } else {
            throw new Error('Error al eliminar la habilidad');
          }
        } catch (error) {
          console.error('Error:', error);
          showNotificationPopup('Error al eliminar la habilidad');
        }
      }
    });
    
    skillItem.appendChild(skillText);
    skillItem.appendChild(deleteBtn);
    container.appendChild(skillItem);
  });
}

function populateLanguagesForm(languages) {
  const container = document.getElementById("languagesContainer");
  container.innerHTML = '';
  
  languages.forEach(lang => {
    const langItem = document.createElement("div");
    langItem.className = "language-item";
    langItem.setAttribute('data-language', lang.idioma || lang);
    
    const langText = document.createElement("span");
    langText.textContent = lang.idioma || lang;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn.5";
    deleteBtn.innerHTML = '<i class="bx bx-trash"></i>'; // Ícono de papelera usando BoxIcons
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idioma = lang.idioma || lang;
      if (confirm(`¿Estás seguro de que deseas eliminar el idioma "${idioma}"?`)) {
        try {
          const response = await fetch('/users/profile/languages', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idioma: idioma })
          });

          if (response.ok) {
            langItem.remove();
            showNotificationPopup('Idioma eliminado exitosamente');
          } else {
            throw new Error('Error al eliminar el idioma');
          }
        } catch (error) {
          console.error('Error:', error);
          showNotificationPopup('Error al eliminar el idioma');
        }
      }
    });
    
    langItem.appendChild(langText);
    langItem.appendChild(deleteBtn);
    container.appendChild(langItem);
  });
}

async function removeSkill(skillText) {
  if (confirm(`¿Estás seguro de que deseas eliminar la habilidad "${skillText}"?`)) {
    try {
      const response = await fetch('/users/profile/skills', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habilidad: skillText })
      });
      
      if (response.ok) {
        loadProfileData(); // Recargar datos
        showNotificationPopup('Habilidad eliminada exitosamente');
      } else {
        throw new Error('Error al eliminar habilidad');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotificationPopup('Error al eliminar la habilidad');
    }
  }
}

async function removeLanguage(languageText) {
  if (confirm(`¿Estás seguro de que deseas eliminar el idioma "${languageText}"?`)) {
    try {
      const response = await fetch('/users/profile/languages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idioma: languageText })
      });
      
      if (response.ok) {
        loadProfileData(); // Recargar datos
        showNotificationPopup('Idioma eliminado exitosamente');
      } else {
        throw new Error('Error al eliminar idioma');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotificationPopup('Error al eliminar el idioma');
    }
  }
}

async function removeSkill(skillId) {
  try {
    const response = await fetch(`/users/profile/skills/${skillId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      document.querySelector(`[data-skill-id="${skillId}"]`).remove();
      showNotificationPopup('Habilidad eliminada exitosamente');
    }
  } catch (error) {
    console.error('Error al eliminar habilidad:', error);
    showNotificationPopup('Error al eliminar la habilidad');
  }
}

async function removeLanguage(languageId) {
  if (!languageId) {
    console.error('ID de idioma no válido');
    return;
  }

  try {
    const response = await fetch(`/users/profile/languages/${languageId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar idioma');
    }

    // Si la eliminación fue exitosa, remover el elemento del DOM
    const element = document.querySelector(`[data-language-id="${languageId}"]`);
    if (element) {
      element.remove();
      showNotificationPopup('Idioma eliminado exitosamente');
    }
  } catch (error) {
    console.error('Error al eliminar idioma:', error);
    showNotificationPopup('Error al eliminar el idioma');
  }
}

// Actualizar función saveProfileData para manejar actualizaciones
async function saveProfileData() {
  try {
    // Recolectar datos incluyendo IDs existentes
    const experiences = Array.from(document.querySelectorAll('#experienceEntries .entry-card')).map(card => ({
      id: card.dataset.experienceId,
      empresa: card.querySelector('input[name="company"]').value,
      puesto: card.querySelector('input[name="position"]').value,
      fecha_inicio: `${card.querySelector('input[name="startYear"]').value}-01-01`,
      fecha_fin: card.querySelector('input[name="endYear"]').value ? 
        `${card.querySelector('input[name="endYear"]').value}-01-01` : null
    }));

    // ... similar para education, skills y languages

    // Enviar actualizaciones
    await fetch('/users/profile/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiences,
        education: collectEducationData(),
        skills: collectSkillsData(),
        languages: collectLanguagesData()
      })
    });

    showNotificationPopup('Perfil actualizado exitosamente');
    await loadProfileData(); // Recargar datos actualizados
  } catch (error) {
    console.error('Error al guardar datos:', error);
    showNotificationPopup('Error al guardar los cambios');
  }
}

function updateExperienceDisplay(experiences) {
  const container = document.getElementById('experienceSectionDisplay');
  container.innerHTML = experiences.map(exp => `
    <div class="profile-desc-row">
      <div class="experience-item">
        <h3>${exp.empresa}</h3>
        <p>${exp.puesto}</p>
        <p>${formatDate(exp.fecha_inicio)} - ${exp.fecha_fin ? formatDate(exp.fecha_fin) : 'Presente'}</p>
        ${exp.descripcion ? `<p>${exp.descripcion}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function updateEducationDisplay(education) {
  const container = document.getElementById('educationSectionDisplay');
  container.innerHTML = education.map(edu => `
    <div class="profile-desc-row">
      <div class="education-item">
        <h3>${edu.institucion}</h3>
        <p>${edu.titulo}</p>
        <p>${formatDate(edu.fecha_inicio)} - ${edu.fecha_fin ? formatDate(edu.fecha_fin) : 'Presente'}</p>
        ${edu.descripcion ? `<p>${edu.descripcion}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function updateSkillsDisplay(skills) {
  const container = document.getElementById('skillsSectionDisplay');
  container.innerHTML = skills.map(skill => `
    <span class="skill-item">${skill}</span>
  `).join('');
}

function updateLanguagesDisplay(languages) {
  const container = document.getElementById('languagesSectionDisplay');
  container.innerHTML = languages.map(language => `
    <span class="language-item">${language}</span>
  `).join('');
}

function formatDate(dateString) {
  return new Date(dateString).getFullYear();
}

function saveToLocalStorage(key, value) {
  localStorage.setItem(key, value);
}

function updateProfileInfo() {
  const nameInput = document.getElementById("profileNameInput");
  const headlineInput = document.getElementById("profileHeadlineInput");
  const profileName = document.querySelector(".profile-name");
  const profileHeadline = document.querySelector(".profile-headline");

  if (nameInput && profileName) {
    profileName.textContent = nameInput.value;
  }
  if (headlineInput && profileHeadline) {
    profileHeadline.textContent = headlineInput.value;
  }
}

// Se ha eliminado la función saveProfileData y cualquier referencia a Firebase

function toggleMenu() {
  var menu = document.getElementById("menuPerfil")
  menu.style.display = menu.style.display === "block" ? "none" : "block"
}

document.addEventListener("click", (event) => {
  var perfil = document.querySelector(".perfil")
  if (!perfil.contains(event.target)) {
    document.getElementById("menuPerfil").style.display = "none"
  }
});

function showNotificationPopup(message) {
  var popup = document.getElementById("notificationPopup")
  document.getElementById("notificationMessage").textContent = message
  popup.style.display = "block"
  setTimeout(closeNotificationPopup, 5000) // Se cierra automáticamente después de 5 segundos
}

function closeNotificationPopup() {
  document.getElementById("notificationPopup").style.display = "none"
}

document.addEventListener("DOMContentLoaded", () => {
  // Datos de ejemplo para las notificaciones
  const notifications = [
    {
      id: 1,
      avatar: "/user1.jpg",
      name: "Melvin Desobediente",
      action: "comentó la publicación de",
      target: "Oración Diaria",
      time: "1 día",
      read: false,
    },
    {
      id: 2,
      avatar: "/user2.jpg",
      name: "Yohandri Jesus",
      action: "te envió una sugerencia de amistad",
      target: "",
      time: "7 horas",
      read: false,
    },
    {
      id: 3,
      avatar: "/user3.jpg",
      name: "Milagros Canela Gálvez",
      action: "comentó la publicación de",
      target: "Arrieche Roger",
      time: "1 día",
      read: false,
    },
  ];

  // Toggle del panel de notificaciones
  const notificationsToggle = document.getElementById("notifications-toggle");
  const notificationsLink = notificationsToggle.querySelector("a");

  notificationsLink.addEventListener("click", (e) => {
    e.preventDefault();
    notificationsToggle.classList.toggle("show");
    loadNotifications(); // Cargar notificaciones cuando se abre el panel
  });

  // Cerrar el panel cuando se hace clic fuera de él
  document.addEventListener("click", (e) => {
    if (!notificationsToggle.contains(e.target)) {
      notificationsToggle.classList.remove("show");
    }
  });

  // Función para crear un elemento de notificación
  function createNotificationElement(notification) {
    const div = document.createElement("div");
    div.className = "notification-item";

    div.innerHTML = `
          <img src="${notification.avatar}" alt="" class="notification-avatar">
          <div class="notification-details">
              <p class="notification-text">
                  <strong>${notification.name}</strong> 
                  ${notification.action} 
                  ${notification.target ? `<strong>${notification.target}</strong>` : ""}
              </p>
              <div class="notification-meta">
                  <span>${notification.time}</span>
                  ${!notification.read ? '<div class="unread-dot"></div>' : ""}
              </div>
          </div>
      `;
    return div;
  }

  // Función para cargar las notificaciones
  function loadNotifications() {
    const allNotificationsList = document.querySelector("#todas .notifications-list");
    const unreadNotificationsList = document.querySelector("#no-leidas .notifications-list");

    // Limpiar las listas
    allNotificationsList.innerHTML = "";
    unreadNotificationsList.innerHTML = "";

    // Cargar todas las notificaciones
    notifications.forEach((notification) => {
      allNotificationsList.appendChild(createNotificationElement(notification));

      // Si la notificación no está leída, también se añade a la pestaña de no leídas
      if (!notification.read) {
        unreadNotificationsList.appendChild(createNotificationElement(notification));
      }
    });
  }

  // Manejar los cambios de pestaña
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      // Remover la clase active de todos los botones
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.remove("active");
      });

      // Añadir la clase active al botón clickeado
      button.classList.add("active");

      // Ocultar todos los contenidos
      document.querySelectorAll(".notifications-content").forEach((content) => {
        content.style.display = "none";
      });

      // Mostrar el contenido correspondiente
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).style.display = "block";
    });
  });

  // Cargar las notificaciones inicialmente
  loadNotifications();
});

// Inicializa el perfil
initializeProfile();

document.addEventListener("DOMContentLoaded", () => {
  const composeBtn = document.getElementById("compose-btn");
  const composeModal = document.getElementById("compose-modal");
  const composeOverlay = document.getElementById("compose-overlay");
  const chatModal = document.getElementById("chat-modal");
  const chatOverlay = document.getElementById("chat-overlay");
  const searchInput = document.getElementById("search-input");
  const friendsList = document.getElementById("friends-list");
  const chatAvatar = document.getElementById("chat-avatar");
  const chatFriendName = document.getElementById("chat-friend-name");
  const closeChatBtn = document.getElementById("close-chat-btn");
  const chatInput = document.getElementById("chatInput");
  const messagesContainer = document.getElementById("messagesContainer");
  const sendButton = document.getElementById("sendButton");

  const friends = [
    { id: "1", name: "Jennifer Ocasio", image: "https://via.placeholder.com/40" },
    { id: "2", name: "Laribel Jerez", image: "https://via.placeholder.com/40" }
  ];

  let selectedFriend = null;
  const messages = [];

  function openModal(modal) {
    modal.classList.remove("hidden");
  }
  function closeModal(modal) {
    modal.classList.add("hidden");
  }

  composeBtn.addEventListener("click", () => {
    openModal(composeModal);
    searchInput.value = "";
    renderFriends(friends);
  });

  composeOverlay.addEventListener("click", () => closeModal(composeModal));
  chatOverlay.addEventListener("click", () => closeModal(chatModal));
  closeChatBtn.addEventListener("click", () => closeModal(chatModal));

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = friends.filter(friend => friend.name.toLowerCase().includes(query));
    renderFriends(filtered);
  });

  function renderFriends(friendsArray) {
    friendsList.innerHTML = "";
    friendsArray.forEach(friend => {
      const btn = document.createElement("button");
      btn.className = "friend-button";
      btn.innerHTML = `<img class="friend-avatar" src="${friend.image}" alt="${friend.name}"><span>${friend.name}</span>`;
      btn.addEventListener("click", () => {
        selectedFriend = friend;
        closeModal(composeModal);
        openChatModal(friend);
      });
      friendsList.appendChild(btn);
    });
  }

  function openChatModal(friend) {
    chatAvatar.src = friend.image;
    chatAvatar.alt = friend.name;
    chatFriendName.textContent = friend.name;
    openModal(chatModal);
  }

  function renderMessages() {
    messagesContainer.innerHTML = "";
    messages.forEach(message => {
      const msgDiv = document.createElement("div");
      msgDiv.className = "message-container";
      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = message.text;
      msgDiv.appendChild(bubble);
      messagesContainer.appendChild(msgDiv);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (text !== "") {
      messages.push({ text });
      chatInput.value = "";
      renderMessages();
    }
  }

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSend();
  });

  sendButton.addEventListener("click", handleSend);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

const composeBtn = document.getElementById("compose-btn");

function openChat(friendId) {
  document.getElementById("chat-modal").classList.remove("hidden");
  composeBtn.classList.add("hidden");
}

function closeChat() {
  document.getElementById("chat-modal").classList.add("hidden");
  composeBtn.classList.remove("hidden");
}

function profileDropdown() {
  var menuPerfil = document.getElementById("menuPerfil");

  // Alternar visibilidad
  if (menuPerfil.style.display === "block") {
    menuPerfil.style.display = "none";
  } else {
    menuPerfil.style.display = "block";
  }
}

// Cerrar el menú si se hace clic fuera de él
document.addEventListener("click", (event) => {
  var menuPerfil = document.getElementById("menuPerfil");
  var profileImg = document.querySelector(".nav-profile-img");

  if (!menuPerfil.contains(event.target) && !profileImg.contains(event.target)) {
    menuPerfil.style.display = "none";
  }
});

// Update event listeners
document.getElementById("close-chat-btn").addEventListener("click", closeChat);
document.getElementById("chat-overlay").addEventListener("click", closeChat);

// Función para manejar el guardado de idiomas
async function saveLanguages() {
  try {
    const languages = Array.from(document.getElementById('languagesContainer').children)
      .map(item => item.textContent.trim());

    const response = await fetch('/users/profile/languages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ languages })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    // Actualizar la visualización
    updateLanguagesDisplay(languages);
    return true;
  } catch (error) {
    console.error('Error al guardar idiomas:', error);
    showNotificationPopup('Error al guardar los idiomas');
    return false;
  }
}

// Actualizar función collectSkillsData
function collectSkillsData() {
  return Array.from(document.getElementById('skillsContainer').children)
    .map(item => item.textContent.trim())
    .filter(skill => skill); // Filtrar elementos vacíos
}

// Modificar función saveProfileData
async function saveProfileData() {
  try {
    const data = {
      nombre: document.getElementById("profileNameInput").value,
      titular: document.getElementById("profileHeadlineInput").value,
      experiencia: collectExperienceData(),
      educacion: collectEducationData(),
      habilidades: collectSkillsData(), // Asegurarnos de incluir las habilidades
      idiomas: collectLanguagesData()
    };

    const response = await fetch('/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    // Actualizar visualización después de guardar
    updateSkillsDisplay(data.habilidades);
    return true;
  } catch (error) {
    console.error('Error al guardar datos:', error);
    showNotificationPopup('Error al guardar los cambios');
    return false;
  }
}

// Función para guardar habilidades
async function saveSkills() {
  try {
    const skills = Array.from(document.getElementById('skillsContainer').children)
      .map(item => item.textContent.trim())
      .filter(skill => skill); // Eliminar espacios en blanco y elementos vacíos

    const response = await fetch('/users/profile/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ skills })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }

    // Actualizar la visualización
    updateSkillsDisplay(skills);
    return true;
  } catch (error) {
    console.error('Error al guardar habilidades:', error);
    showNotificationPopup('Error al guardar las habilidades');
    return false;
  }
}
saveEditPopup();
function collectExperienceData() {
  const entries = [];
  const cards = document.getElementById('experienceEntries').querySelectorAll(".entry-card");
  
  cards.forEach(card => {
    const empresa = card.querySelector('input[name="company"]').value.trim();
    const puesto = card.querySelector('input[name="position"]').value.trim();
    const startYear = card.querySelector('input[name="startYear"]').value.trim();
    const endYear = card.querySelector('input[name="endYear"]').value.trim();
    
    // Solo agregar si los campos requeridos están llenos
    if (empresa && puesto && startYear) {
      entries.push({
        id: card.dataset.experienceId,
        empresa: empresa,
        puesto: puesto,
        fecha_inicio: startYear,
        fecha_fin: endYear || null,
      });
    }
  });
  
  return entries;
}

function collectEducationData() {
  return Array.from(document.getElementById('educationEntries').children).map(card => {
    const institucion = card.querySelector('input[name="institution"]').value.trim();
    const titulo = card.querySelector('input[name="degree"]').value.trim();
    const startYear = card.querySelector('input[name="eduStartYear"]').value.trim();
    const endYear = card.querySelector('input[name="eduEndYear"]').value.trim() || null;

    // Validación básica
    if (!institucion || !titulo || !startYear) {
      throw new Error('Por favor complete todos los campos obligatorios');
    }

    // Convertir años a números y validar
    const startYearNum = parseInt(startYear);
    const endYearNum = endYear ? parseInt(endYear) : null;

    if (isNaN(startYearNum)) {
      throw new Error('El año de inicio debe ser un número válido');
    }

    if (endYear && isNaN(endYearNum)) {
      throw new Error('El año de fin debe ser un número válido');
    }

    // No necesitamos validar el rango aquí ya que lo manejamos en el backend

    return {
      institucion,
      titulo,
      fecha_inicio: startYear,
      fecha_fin: endYear
    };
  });
}

async function saveExperienceAndEducation() {
  try {
    const experienceData = collectExperienceData();
    const educationData = collectEducationData();
    
    if (experienceData.length === 0 && educationData.length === 0) {
      showNotificationPopup('Por favor, complete los campos requeridos');
      return false;
    }

    // Obtener datos existentes
    const response = await fetch('/users/profile/full');
    const result = await response.json();
    
    if (result.success) {
      const existingExperiences = result.data.experience || [];
      const existingEducation = result.data.education || [];

      // Verificar duplicados
      for (const exp of experienceData) {
        if (isDuplicateExperience(exp, existingExperiences)) {
          showNotificationPopup(`Ya existe una experiencia en ${exp.empresa} con el mismo puesto y fechas`);
          return false;
        }
      }

      for (const edu of educationData) {
        if (isDuplicateEducation(edu, existingEducation)) {
          showNotificationPopup(`Ya existe un registro en ${edu.institucion} con el mismo título y fechas`);
          return false;
        }
      }

      // Si no hay duplicados, proceder con el guardado
      const [experienceSaved, educationSaved] = await Promise.all([
        fetch('/users/profile/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experiences: experienceData })
        }),
        fetch('/users/profile/education', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ education: educationData })
        })
      ]);

      if (!experienceSaved.ok || !educationSaved.ok) {
        throw new Error('Error al guardar los datos');
      }

      showNotificationPopup('Datos guardados exitosamente');
      await loadProfileData();
      return true;
    }
    
    throw new Error('Error al obtener datos existentes');
  } catch (error) {
    console.error('Error:', error);
    showNotificationPopup('Error al guardar los datos: ' + error.message);
    return false;
  }
}

function isDuplicateExperience(newExperience, existingExperiences) {
  const currentExperiences = existingExperiences.filter(exp => exp.id !== newExperience.id);
  
  return currentExperiences.some(exp => {
    const existingStartYear = new Date(exp.fecha_inicio).getFullYear();
    const newStartYear = new Date(newExperience.fecha_inicio).getFullYear();
    
    const existingEndYear = exp.fecha_fin ? new Date(exp.fecha_fin).getFullYear() : null;
    const newEndYear = newExperience.fecha_fin ? new Date(newExperience.fecha_fin).getFullYear() : null;
    
    return exp.empresa.toLowerCase() === newExperience.empresa.toLowerCase() &&
           exp.puesto.toLowerCase() === newExperience.puesto.toLowerCase() &&
           existingStartYear === newStartYear &&
           existingEndYear === newEndYear;
  });
}

function isDuplicateEducation(newEducation, existingEducation) {
  // Ignorar el registro actual si estamos editando
  const currentEducation = existingEducation.filter(edu => edu.id !== newEducation.id);
  
  return currentEducation.some(edu => 
    edu.institucion.toLowerCase() === newEducation.institucion.toLowerCase() &&
    edu.titulo.toLowerCase() === newEducation.titulo.toLowerCase() &&
    new Date(edu.fecha_inicio).getFullYear() === parseInt(newEducation.fecha_inicio) &&
    (
      (edu.fecha_fin === null && newEducation.fecha_fin === null) ||
      (edu.fecha_fin && newEducation.fecha_fin && 
       new Date(edu.fecha_fin).getFullYear() === parseInt(newEducation.fecha_fin))
    )
  );
}
// Obtener los elementos
const openModalButton = document.getElementById('open-amigos-modal');
const closeModalButton = document.getElementById('close-amigos-modal-btn');
const modal = document.getElementById('amigos-modal');

// Función para abrir el modal
openModalButton.addEventListener('click', (event) => {
  event.preventDefault(); // Evita la acción por defecto del enlace
  modal.classList.remove('hidden'); // Remueve la clase para mostrar el modal
});

// Función para cerrar el modal
closeModalButton.addEventListener('click', () => {
  modal.classList.add('hidden'); // Agrega la clase para ocultar el modal
});

// Cerrar el modal si se hace clic fuera de él
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.classList.add('hidden');
  }
});
// ... existing code ...

function setupEventListeners() {
  document.getElementById("closeBtn").addEventListener("click", closeImagePopup);
  document.getElementById("fileInput").addEventListener("change", handleFileSelect);
  document.getElementById("uploadBtn").addEventListener("click", handleImageUpload);
  
  // Add event listener for the amigos modal
  document.getElementById("open-amigos-modal").addEventListener("click", function(e) {
    e.preventDefault();
    openAmigosModal();
  });
  
  // Add event listener for closing the amigos modal
  document.getElementById("close-amigos-modal-btn").addEventListener("click", function() {
    closeAmigosModal();
  });
  
  document.getElementById("addInterestBtn").addEventListener("click", () => {
    document.getElementById("modal").style.display = "block";
    updateCurrentInterests();
  });
  document.getElementById("saveInterest").addEventListener("click", saveNewInterest);
  window.onclick = (event) => {
    if (event.target == document.getElementById("modal")) {
      document.getElementById("modal").style.display = "none";
    }
    // Close amigos modal when clicking outside
    if (event.target == document.getElementById("amigos-modal")) {
      closeAmigosModal();
    }
  };
}

// ... existing code ...

// Add these new functions to handle the amigos modal
function openAmigosModal() {
  const amigosModal = document.getElementById("amigos-modal");
  amigosModal.classList.remove("hidden");
  
  // Load friends data
  loadAmigos();
}

function closeAmigosModal() {
  const amigosModal = document.getElementById("amigos-modal");
  amigosModal.classList.add("hidden");
}

function loadAmigos() {
  const amigosContainer = document.getElementById("amigos-container");
  
  // Show loading state
  amigosContainer.innerHTML = '<div class="loading-message">Cargando amigos...</div>';
  
  // You can replace this with an actual API call to get friends
  // For now, let's use some sample data
  setTimeout(() => {
    const sampleAmigos = [
      { id: 1, nombre: "Juan Pérez", titular: "Desarrollador Web", foto: "/public/images/Secciones.jpeg" },
      { id: 2, nombre: "María García", titular: "Diseñadora UX/UI", foto: "/public/images/Secciones.jpeg" },
      { id: 3, nombre: "Carlos Rodríguez", titular: "Ingeniero de Software", foto: "/public/images/Secciones.jpeg" }
    ];
    
    renderAmigos(sampleAmigos);
  }, 500);
  
  // Uncomment and modify this when you have the actual API endpoint
  /*
  fetch('/api/amigos')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderAmigos(data.amigos);
      } else {
        amigosContainer.innerHTML = '<div class="error-message">Error al cargar amigos: ' + data.message + '</div>';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      amigosContainer.innerHTML = '<div class="error-message">Error al cargar amigos</div>';
    });
  */
}

function renderAmigos(amigos) {
  const amigosContainer = document.getElementById("amigos-container");
  
  if (!amigos || amigos.length === 0) {
    amigosContainer.innerHTML = '<div class="empty-message">No tienes amigos agregados aún.</div>';
    return;
  }
  
  let html = '';
  amigos.forEach(amigo => {
    html += `
      <div class="amigo-card">
        <div class="amigo-avatar">
          <img src="${amigo.foto || '/public/images/Secciones.jpeg'}" alt="${amigo.nombre}">
        </div>
        <div class="amigo-info">
          <h3>${amigo.nombre}</h3>
          <p>${amigo.titular || ''}</p>
        </div>
        <div class="amigo-actions">
          <button class="message-btn" data-id="${amigo.id}" onclick="openChatWithFriend(${amigo.id})">
            <i class='bx bx-message-square-detail'></i>
          </button>
          <button class="remove-btn" data-id="${amigo.id}" onclick="removeAmigo(${amigo.id})">
            <i class='bx bx-user-x'></i>
          </button>
        </div>
      </div>
    `;
  });
  
  amigosContainer.innerHTML = html;
}

function openChatWithFriend(friendId) {
  // Close the amigos modal
  closeAmigosModal();
  
  // Here you would implement the logic to open a chat with the selected friend
  console.log("Opening chat with friend ID:", friendId);
  
  // For example, you could use your existing chat functionality
  // This is just a placeholder - modify according to your actual chat implementation
  const friend = { id: friendId, name: "Amigo " + friendId, image: "/public/images/Secciones.jpeg" };
  selectedFriend = friend;
  openChatModal(friend);
}

function removeAmigo(amigoId) {
  if (confirm("¿Estás seguro de que deseas eliminar a este amigo?")) {
    console.log("Removing friend with ID:", amigoId);
    
    // Here you would implement the actual API call to remove the friend
    // For now, let's just remove it from the DOM
    const amigoCard = document.querySelector(`.amigo-card button[data-id="${amigoId}"]`).closest('.amigo-card');
    if (amigoCard) {
      amigoCard.remove();
      
      // Check if there are no more friends
      const remainingCards = document.querySelectorAll('.amigo-card');
      if (remainingCards.length === 0) {
        document.getElementById("amigos-container").innerHTML = '<div class="empty-message">No tienes amigos agregados aún.</div>';
      }
    }
    
    // Uncomment and modify this when you have the actual API endpoint
    /*
    fetch(`/api/amigos/${amigoId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Remove from DOM
          const amigoCard = document.querySelector(`.amigo-card button[data-id="${amigoId}"]`).closest('.amigo-card');
          if (amigoCard) {
            amigoCard.remove();
            
            // Check if there are no more friends
            const remainingCards = document.querySelectorAll('.amigo-card');
            if (remainingCards.length === 0) {
              document.getElementById("amigos-container").innerHTML = '<div class="empty-message">No tienes amigos agregados aún.</div>';
            }
          }
        } else {
          alert('Error al eliminar amigo: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar amigo');
      });
    */
  }
}

// ... existing code ...