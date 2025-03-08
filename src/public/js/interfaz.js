document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión
  try {
    const sessionResponse = await fetch("/auth/session")
    const sessionData = await sessionResponse.json()
    if (!sessionData.isLoggedIn) {
      window.location.href = "/"
      return
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error)
  }

  // Variables globales
  let currentJobId = null
  let currentSkills = []
  let currentLogoUrl = null
  let jobOffers = [] // Unificamos las ofertas aquí

  // Referencias al DOM
  const jobCardsContainer = document.getElementById("job-cards-container")
  const jobModal = document.getElementById("job-modal")
  const jobFormContainer = document.getElementById("job-form-container")
  const jobDetailsContainer = document.getElementById("job-details-container")
  const jobOfferForm = document.getElementById("job-offer-form")
  const createJobBtn = document.getElementById("create-job-btn")
  const closeModalBtn = document.getElementById("close-modal-btn")
  const cancelFormBtn = document.getElementById("cancel-form-btn")
  const modalTitle = document.getElementById("modal-title")
  const skillsInput = document.getElementById("job-skills-input")
  const addSkillBtn = document.getElementById("add-skill-btn")
  const skillsContainer = document.getElementById("skills-container")
  const createdOffersBtn = document.getElementById("created-offers-btn")
  const createdOffersModal = document.getElementById("created-offers-modal")
  const createdOffersContainer = document.getElementById("created-offers-container")
  const closeCreatedOffersModalBtn = document.getElementById("close-created-offers-modal-btn")
  const logoutBtn = document.getElementById("logoutBtn")

  // Elementos adicionales (perfil, logo, modales de reportes, CV, favoritos, borradas, etc.)
  const profileImg = document.getElementById("profileImg")
  const menuPerfil = document.getElementById("menuPerfil")
  const uploadLogoBtn = document.getElementById("upload-logo-btn")
  const uploadModal = document.getElementById("upload-modal")
  const uploadDropzone = document.getElementById("upload-dropzone")
  const logoFileInput = document.getElementById("logo-file-input")
  const removePreviewBtn = document.getElementById("remove-preview-btn")
  const previewImage = document.getElementById("logo-preview")
  const previewImageContainer = document.getElementById("preview-image-container")
  const confirmUploadBtn = document.getElementById("confirm-upload-btn")
  const cancelUploadBtn = document.getElementById("cancel-upload-btn")
  const uploadProgressContainer = document.getElementById("upload-progress-container")
  const uploadProgressBar = document.getElementById("upload-progress-bar")
  const uploadProgressText = document.getElementById("upload-progress-text")

  const modalReportes = document.getElementById("modal-reportes")
  const openReportesBtn = document.getElementById("open-reportes-modal")
  const closeReportesBtn = document.getElementById("close-reportes-modal-btn")

  const modalCv = document.getElementById("modal-cv")
  const openCvLink = document.getElementById("open-cv")
  const closeCvBtn = document.getElementById("close-cv-modal-btn")

  const modalFavoritos = document.getElementById("modal-favoritos")
  const openFavoritosBtn = document.getElementById("open-favoritos-modal")
  const closeFavoritosBtn = document.getElementById("close-favoritos-modal-btn")

  const modalBorradasOffers = document.getElementById("borradas-offers-modal")
  const closeBorradasOffersModalBtn = document.getElementById("close-borradas-offers-modal-btn")
  const borradasOffersContainer = document.getElementById("borradas-offers-container")

  // Variable para almacenar datos de la imagen subida
  let uploadedImageData = null

  // Cargar ofertas desde el servidor
  await loadJobs()

  // Configurar todos los event listeners
  setupEventListeners()

  // Funcionalidad para el menú de perfil
  if (profileImg && menuPerfil) {
    profileImg.addEventListener("click", () => {
      menuPerfil.style.display = menuPerfil.style.display === "block" ? "none" : "block"
    })
    document.addEventListener("click", (event) => {
      if (!menuPerfil.contains(event.target) && !profileImg.contains(event.target)) {
        menuPerfil.style.display = "none"
      }
    })
  }

  // Manejar clic en el enlace del perfil
  const profileLink = document.getElementById('profileLink');
  if (profileLink) {
    profileLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/profile';
    });
  }

  // ─── FUNCIONES ─────────────────────────────────────────────

  // Cargar ofertas de empleo desde el backend
  async function loadJobs() {
    try {
      jobCardsContainer.innerHTML = '<div class="loading">Cargando ofertas...</div>';
      
      const response = await fetch("/jobs/all", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Datos recibidos:', data); // Para depuración

      if (data.success && Array.isArray(data.jobs)) {
        jobOffers = data.jobs;
        if (jobOffers.length === 0) {
          jobCardsContainer.innerHTML = `
            <div class="empty-state">
              <p>No hay ofertas disponibles</p>
              <button onclick="openCreateJobModal()" class="btn btn-primary">
                Crear nueva oferta
              </button>
            </div>`;
        } else {
          renderJobCards();
        }
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error("Error al cargar ofertas:", error);
      jobCardsContainer.innerHTML = `
        <div class="error-message">
          <p>Error al cargar las ofertas: ${error.message}</p>
          <button onclick="window.location.reload()" class="retry-button">
            Reintentar
          </button>
        </div>`;
    }
  }

  // Renderizar las tarjetas de empleo (solo ofertas activas)
  function renderJobCards() {
    try {
      jobCardsContainer.innerHTML = "";
      const activeJobs = jobOffers.filter(job => job.estado === 'Active');
      
      console.log('Ofertas activas:', activeJobs); // Para depuración

      if (activeJobs.length === 0) {
        jobCardsContainer.innerHTML = `
          <div class="empty-state">
            <p>No hay ofertas activas</p>
          </div>`;
        return;
      }

      activeJobs.forEach(job => {
        const card = createJobCard(job);
        jobCardsContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Error al renderizar tarjetas:', error);
      jobCardsContainer.innerHTML = `
        <div class="error-message">
          <p>Error al mostrar las ofertas</p>
          <button onclick="renderJobCards()" class="retry-button">
            Reintentar
          </button>
        </div>`;
    }
  }

  // Crear una tarjeta para cada oferta
  function createJobCard(job) {
    const card = document.createElement("div")
    card.className = "job-card"
    card.dataset.id = job.id
    const skillsHtml = job.habilidades
      .slice(0, 3)
      .map((skill) => `<span class="skill-badge">${skill}</span>`)
      .join("")
    const moreSkillsHtml =
      job.habilidades.length > 3 ? `<span class="more-skills-badge">+${job.habilidades.length - 3}</span>` : ""
    
    // Función para obtener el texto completo del tipo de contrato
    function getTipoContratoTexto(tipo) {
      const tipos = {
        'Tiempo Completo': 'Tiempo Completo',
        'Tiempo Parcial': 'Tiempo Parcial',
        'Tiempo Parcial': 'Contrato',
        'Freelance': 'Freelance',
        'Prácticas': 'Prácticas'
      };
      return tipos[tipo] || tipo;
    }

    // Función para obtener el texto completo de la modalidad
    function getModalidadTexto(modalidad) {
      const modalidades = {
        'Presencial': 'Presencial',
        'Remoto': 'Remoto',
        'Híbrido': 'Híbrido'
      };
      return modalidades[modalidad] || modalidad;
    }

    // Usar las funciones al crear la tarjeta
    card.innerHTML = `
      <div class="job-card-header">
        <div class="job-card-header-left">
          <div class="job-logo-container">
            <img src="${job.logo || "../public/images/Secciones.jpeg"}" alt="${job.titulo} logo" class="job-logo" onerror="this.src='/public/images/Secciones.jpeg'">
          </div>
          <div>
            <h3 class="job-title">${job.titulo}</h3>
            <p class="job-salary">${job.salario}</p>
          </div>
        </div>
        <button class="star-btn ${job.starred ? "starred" : ""}" data-id="${job.id}">
          <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="job-card-content">
        <p class="job-description">${job.descripcion}</p>
        <div class="job-skills">
          ${skillsHtml}
          ${moreSkillsHtml}
        </div>
      </div>
      <div class="job-card-footer">
        <div class="job-details">
          <span class="job-badge">${getTipoContratoTexto(job.tipo_contrato)}</span>
          <span class="job-badge">${getModalidadTexto(job.modalidad)}</span>
        </div>
        <span class="status-badge ${job.estado.toLowerCase()}">${job.estado}</span>
      </div>
    `
    return card
  }

  // Configurar los event listeners de la interfaz
  function setupEventListeners() {
    createJobBtn.addEventListener("click", openCreateJobModal)
    closeModalBtn.addEventListener("click", closeModal)
    cancelFormBtn.addEventListener("click", closeModal)
    jobCardsContainer.addEventListener("click", (e) => {
      const jobCard = e.target.closest(".job-card")
      if (!jobCard) return
      const starBtn = e.target.closest(".star-btn")
      if (starBtn) {
        e.stopPropagation()
        toggleFavorite(jobCard.dataset.id || starBtn.dataset.id)
      } else {
        openJobDetails(jobCard.dataset.id)
      }
    })
    addSkillBtn.addEventListener("click", addSkill)
    skillsInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addSkill()
      }
    })
    jobOfferForm.addEventListener("submit", (e) => {
      e.preventDefault()
      submitJobForm()
    })
    createdOffersBtn.addEventListener("click", openCreatedOffersModal)
    closeCreatedOffersModalBtn.addEventListener("click", closeCreatedOffersModal)

    // Eventos para funcionalidad de logo (subida de imagen)
    if (uploadLogoBtn) {
      uploadLogoBtn.addEventListener("click", openUploadModal)
    }
    if (cancelUploadBtn) {
      cancelUploadBtn.addEventListener("click", closeUploadModal)
    }
    if (uploadDropzone) {
      uploadDropzone.addEventListener("click", () => logoFileInput.click())
    }
    if (logoFileInput) {
      logoFileInput.addEventListener("change", handleFileSelect)
    }
    if (removePreviewBtn) {
      removePreviewBtn.addEventListener("click", clearPreviewImage)
    }
    if (confirmUploadBtn) {
      confirmUploadBtn.addEventListener("click", simulateUpload)
    }
    // Cerrar modales al hacer clic fuera
    window.addEventListener("click", (e) => {
      if (e.target === jobModal) closeModal()
      if (e.target === uploadModal) closeUploadModal()
      if (e.target === createdOffersModal) closeCreatedOffersModal()
      if (e.target === modalCv) modalCv.style.display = "none"
      if (e.target === modalFavoritos) modalFavoritos.style.display = "none"
      if (e.target === modalBorradasOffers) modalBorradasOffers.style.display = "none"
      if (e.target === modalReportes) modalReportes.style.display = "none"
    })
    // Eventos para modales de reportes, CV y favoritos
    if (openReportesBtn) {
      openReportesBtn.addEventListener("click", (e) => {
        e.preventDefault()
        modalReportes.style.display = "block"
      })
    }
    if (closeReportesBtn) {
      closeReportesBtn.addEventListener("click", () => {
        modalReportes.style.display = "none"
      })
    }
    if (openCvLink) {
      openCvLink.addEventListener("click", (e) => {
        e.preventDefault()
        modalCv.style.display = "block"
      })
    }
    if (closeCvBtn) {
      closeCvBtn.addEventListener("click", () => {
        modalCv.style.display = "none"
      })
    }
    if (openFavoritosBtn) {
      openFavoritosBtn.addEventListener("click", (e) => {
        e.preventDefault()
        modalFavoritos.style.display = "block"
      })
    }
    if (closeFavoritosBtn) {
      closeFavoritosBtn.addEventListener("click", () => {
        modalFavoritos.style.display = "none"
      })
    }
    // Modal de ofertas borradas
    const openModalBorradas = document.querySelector(".nav-item")
    if (openModalBorradas && modalBorradasOffers) {
      openModalBorradas.addEventListener("click", (e) => {
        e.preventDefault()
        console.log('Abriendo modal de ofertas borradas'); // Para depuración
        modalBorradasOffers.style.display = "block"
        renderDeletedOffers()
      })
    }
    if (closeBorradasOffersModalBtn && modalBorradasOffers) {
      closeBorradasOffersModalBtn.addEventListener("click", () => {
        modalBorradasOffers.style.display = "none"
      })
    }
    // Cerrar sesión
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault()

      try {
        const response = await fetch("/auth/logout", {
          method: "POST",
        })

        if (response.ok) {
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Error al cerrar sesión:", error)
      }
    })

    const estadoSelect = document.getElementById("job-status");
    if (estadoSelect) {
      estadoSelect.addEventListener("change", (e) => {
        if (e.target.value === "Draft") {
          // Confirmar con el usuario
          if (confirm("¿Estás seguro de cambiar el estado a Borrador? La oferta se moverá a la sección de ofertas borradas.")) {
            // El cambio se procesará al enviar el formulario
          } else {
            // Revertir la selección si el usuario cancela
            e.target.value = e.target.dataset.previousValue || "Active";
          }
        }
        // Guardar el valor actual para posible reversión
        e.target.dataset.previousValue = e.target.value;
      });
    }
  }

  // Abrir modal para crear una nueva oferta
  function openCreateJobModal() {
    resetForm()
    currentJobId = null
    modalTitle.textContent = "Crear oferta de trabajo"
    jobFormContainer.style.display = "block"
    jobDetailsContainer.style.display = "none"
    jobModal.style.display = "block"
  }

  // Abrir modal para ver los detalles de una oferta
  async function openJobDetails(jobId) {
    let job = jobOffers.find((j) => j.id === jobId)
    if (!job) {
      try {
        const response = await fetch(`/jobs/${jobId}`)
        const data = await response.json()
        if (data.success) {
          job = data.job
        }
      } catch (error) {
        console.error("Error al cargar detalles:", error)
      }
    }
    if (job) {
      currentJobId = jobId
      modalTitle.textContent = job.titulo
      jobDetailsContainer.innerHTML = createJobDetailsHtml(job)
      // Agregar eventos a los botones de reportar y aplicar
      const reportBtn = jobDetailsContainer.querySelector("#report-job-btn")
      if (reportBtn) {
        reportBtn.addEventListener("click", () => reportJob(jobId))
      }
      const applyBtn = jobDetailsContainer.querySelector("#apply-job-btn")
      if (applyBtn) {
        applyBtn.addEventListener("click", () => applyJob(jobId))
      }
      // Evento para mostrar el nombre del archivo seleccionado en el CV
      const fileInput = jobDetailsContainer.querySelector("#cv-file-input")
      const fileChosen = jobDetailsContainer.querySelector("#file-chosen")
      if (fileInput && fileChosen) {
        fileInput.addEventListener("change", () => {
          fileChosen.textContent =
            fileInput.files.length > 0
              ? `Archivo seleccionado: ${fileInput.files[0].name}`
              : "Sube tu currículum en formato PDF, DOC o DOCX"
        })
      }
      jobFormContainer.style.display = "none"
      jobDetailsContainer.style.display = "block"
      jobModal.style.display = "block"
    }
  }

  // Crear el HTML de los detalles de la oferta
  function createJobDetailsHtml(job) {
    const skillsHtml = job.habilidades.map((skill) => `<span class="skill-badge">${skill}</span>`).join("")
    return `
      <div class="job-details-container">
        <div class="job-details-header">
          <div class="job-details-logo">
            <img src="${job.logo || "../public/images/Secciones.jpeg"}" alt="${job.titulo} logo">
          </div>
          <div>
            <h2 class="job-details-title">${job.titulo}</h2>
            <p class="job-details-salary">${job.salario}</p>
          </div>
        </div>
        <div class="job-details-section">
          <h3>Descripción</h3>
          <p>${job.descripcion}</p>
        </div>
        <div class="job-details-section">
          <h3>Requisitos</h3>
          <p>${job.requisitos}</p>
        </div>
        <div class="job-details-section">
          <h3>Habilidades</h3>
          <div class="job-details-skills">
            ${skillsHtml}
          </div>
        </div>
        <div class="job-details-info">
          <div class="job-details-info-item">
            <h3>Tipo de Contrato</h3>
            <span class="job-badge">${job.tipo_contrato}</span>
          </div>
          <div class="job-details-info-item">
            <h3>Modalidad</h3>
            <span class="job-badge">${job.modalidad}</span>
          </div>
          <div class="job-details-info-item">
            <h3>Estado</h3>
            <span class="status-badge ${job.estado.toLowerCase()}">${job.estado}</span>
          </div>
        </div>
        <div class="cv-section">
          <label for="cv-file-input" class="cv-label">Curriculum</label>
          <input type="file" id="cv-file-input" class="cv-input" accept=".pdf, .doc, .docx" />
          <span class="cv-format" id="file-chosen">Sube tu currículum en formato PDF, DOC o DOCX</span>
        </div>
        <div class="job-details-actions">
          <button id="report-job-btn" class="btn-report">Reportar oferta</button>
          <button id="apply-job-btn" class="btn-apply">Aplicar Oferta</button>
        </div>
      </div>
    `
  }

  // Abrir modal para editar una oferta
  async function openEditJobModal(jobId) {
    try {
      console.log('Iniciando edición de oferta:', jobId); // Para depuración
      
      const response = await fetch(`/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (data.success) {
        console.log('Datos de la oferta recibidos:', data.job); // Para depuración
        resetForm();
        populateForm(data.job);
        currentJobId = jobId;
        modalTitle.textContent = "Editar oferta de trabajo";
        jobFormContainer.style.display = "block";
        jobDetailsContainer.style.display = "none";
        jobModal.style.display = "block";
      } else {
        throw new Error(data.message || 'Error al obtener los datos de la oferta');
      }
    } catch (error) {
      console.error("Error al cargar oferta para editar:", error);
      alert(`Error al cargar la oferta: ${error.message}`);
    }
  }

  // Abrir modal con las ofertas creadas por el usuario
  async function openCreatedOffersModal() {
    try {
      const response = await fetch('/jobs/user/created', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error('Error al obtener las ofertas creadas');
      }
  
      const data = await response.json();
      
      if (data.success) {
        const modal = document.getElementById('created-offers-modal');
        const container = document.getElementById('created-offers-container');
        
        if (!modal || !container) {
          console.error('No se encontró el modal o el contenedor');
          return;
        }
  
        container.innerHTML = '';
  
        if (!data.jobs || data.jobs.length === 0) {
          container.innerHTML = `
            <div class="text-center py-8">
              <p class="text-gray-500 mb-4">No has creado ninguna oferta todavía</p>
              <button id="create-offer-from-modal" class="btn btn-primary">Crear oferta</button>
            </div>
          `;
  
          const createBtn = container.querySelector('#create-offer-from-modal');
          if (createBtn) {
            createBtn.addEventListener('click', () => {
              modal.style.display = 'none';
              openCreateJobModal();
            });
          }
        } else {
          data.jobs.forEach(job => {
            const abbreviatedId = job.id.toString().substring(0, 8);
            const offerItem = document.createElement('div');
            offerItem.className = 'created-offer-item';
            offerItem.innerHTML = `
              <div class="created-offer-info">
                <div class="created-offer-logo">
                  <img src="${job.logo || '/public/images/Secciones.jpeg'}" alt="${job.titulo} logo">
                </div>
                <div class="created-offer-details">
                  <h3>${job.titulo}</h3>
                  <div class="created-offer-meta">
                    <span class="created-offer-id">ID: ${abbreviatedId}</span>
                    <span class="status-badge ${job.estado.toLowerCase()}">${job.estado}</span>
                  </div>
                </div>
              </div>
              <div class="offer-actions">
                <button class="btn btn-primary edit-offer-btn" data-id="${job.id}">
                  Editar Oferta
                </button>
              </div>
            `;
            container.appendChild(offerItem);
  
            // Agregar event listeners a los botones
            const editBtn = offerItem.querySelector('.edit-offer-btn');
            const deleteBtn = offerItem.querySelector('.delete-offer-btn');
  
            if (editBtn) {
              editBtn.addEventListener('click', async () => {
                console.log('Editando oferta:', job.id);
                modal.style.display = 'none';
                await openEditJobModal(job.id);
              });
            }
  
            if (deleteBtn) {
              deleteBtn.addEventListener('click', async () => {
                console.log('Eliminando oferta:', job.id);
                await deleteJob(job.id);
              });
            }
          });
        }
  
        modal.style.display = 'block';
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar las ofertas creadas');
    }
  }

  // Cerrar el modal de la oferta
  function closeModal() {
    jobModal.style.display = "none"
    resetForm()
  }

  // Cerrar modal de ofertas creadas
  function closeCreatedOffersModal() {
    createdOffersModal.style.display = "none"
  }

  // Reiniciar formulario
  function resetForm() {
    jobOfferForm.reset()
    currentSkills = []
    currentLogoUrl = "/public/images/Secciones.jpeg"
    skillsContainer.innerHTML = ""
    if (previewImage) {
      previewImage.src = currentLogoUrl
    }
  }

  // Rellenar el formulario con datos de la oferta
  function populateForm(job) {
    document.getElementById("job-title").value = job.titulo
    document.getElementById("job-description").value = job.descripcion
    document.getElementById("job-requirements").value = job.requisitos
    document.getElementById("job-salary").value = job.salario
    document.getElementById("job-contract-type").value = job.tipo_contrato
    document.getElementById("job-modality").value = job.modalidad
    document.getElementById("job-status").value = job.estado
    currentSkills = [...job.habilidades]
    renderSkills()
    currentLogoUrl = job.logo
    if (previewImage) {
      previewImage.src = currentLogoUrl
    }
  }

  // Agregar una habilidad
  function addSkill() {
    const skill = skillsInput.value.trim()
    if (skill && !currentSkills.includes(skill)) {
      currentSkills.push(skill)
      renderSkills()
      skillsInput.value = ""
    }
  }

  // Renderizar las habilidades en el formulario
  function renderSkills() {
    skillsContainer.innerHTML = ""
    currentSkills.forEach((skill) => {
      const skillElement = document.createElement("div")
      skillElement.className = "skill-item"
      skillElement.innerHTML = `${skill} <button type="button" class="remove-skill-btn" data-skill="${skill}">×</button>`
      skillsContainer.appendChild(skillElement)
    })
    const removeButtons = skillsContainer.querySelectorAll(".remove-skill-btn")
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        removeSkill(btn.dataset.skill)
      })
    })
  }

  // Eliminar una habilidad
  function removeSkill(skill) {
    currentSkills = currentSkills.filter((s) => s !== skill)
    renderSkills()
  }

  // Enviar el formulario (crear o actualizar oferta) mediante API
  async function submitJobForm() {
    try {
      const formData = new FormData(jobOfferForm);
      const jobData = {
        titulo: formData.get("title"),
        descripcion: formData.get("description"),
        requisitos: formData.get("requirements"),
        salario: formData.get("salary"),
        tipo_contrato: formData.get("contractType"), // Los valores del select ya coinciden con los esperados
        modalidad: formData.get("modality"),
        estado: formData.get("status"),
        habilidades: currentSkills,
        logo: currentLogoUrl || null
      };

      // Validación de datos antes de enviar
      if (!jobData.titulo || !jobData.descripcion || !jobData.requisitos || !jobData.salario) {
        throw new Error("Por favor, complete todos los campos obligatorios");
      }

      const url = currentJobId ? `/jobs/${currentJobId}` : "/jobs";
      const method = currentJobId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include', // Importante: incluir credenciales
        body: JSON.stringify(jobData),
      });

      // Verificar el tipo de contenido de la respuesta
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La respuesta del servidor no es JSON válido");
      }

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Error en la respuesta del servidor");
      }

      if (result.success) {
        // Si el estado es Draft, mostrar en el modal de borradas
        if (jobData.estado === 'Draft') {
          await loadJobs(); // Recargar todas las ofertas
          closeModal();
          const modalBorradas = document.getElementById('borradas-offers-modal');
          if (modalBorradas) {
            modalBorradas.style.display = 'block';
            renderDeletedOffers(); // Mostrar ofertas borradas
          }
        } else {
          closeModal();
          await loadJobs();
        }
        
        alert(currentJobId ? "Oferta actualizada con éxito" : "Oferta creada con éxito");
      } else {
        throw new Error(result.message || "Error al procesar la solicitud");
      }
    } catch (error) {
      console.error("Error al guardar la oferta:", error);
      alert(error.message || "Hubo un error al guardar la oferta. Por favor, inténtalo de nuevo.");
    }
  }

  // Marcar o desmarcar oferta como favorita
  async function toggleFavorite(jobId) {
    try {
      const response = await fetch(`/jobs/${jobId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        const job = jobOffers.find((j) => j.id === jobId)
        if (job) {
          job.starred = !job.starred
          renderJobCards()
        }
      }
    } catch (error) {
      console.error("Error al marcar favorito:", error)
    }
  }

  // Renderizar las ofertas creadas por el usuario
  function renderCreatedOffers() {
    createdOffersContainer.innerHTML = ""
    const createdOffers = jobOffers.filter((job) => job.estado === "Active" || job.estado === "Closed")
    if (createdOffers.length === 0) {
      createdOffersContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500 mb-4">No has creado ninguna oferta todavía</p>
          <button id="create-offer-from-modal" class="btn btn-primary">Crear oferta</button>
        </div>
      `
      const createOfferFromModalBtn = document.getElementById("create-offer-from-modal")
      if (createOfferFromModalBtn) {
        createOfferFromModalBtn.addEventListener("click", () => {
          closeCreatedOffersModal()
          openCreateJobModal()
        })
      }
      return
    }
    createdOffers.forEach((job) => {
      const offerItem = document.createElement("div")
      offerItem.className = "created-offer-item"
      const abbreviatedId = job.id.substring(0, 8)
      offerItem.innerHTML = `
        <div class="created-offer-info">
          <div class="created-offer-logo">
            <img src="${job.logo || "/public/images/Secciones.jpeg"}" alt="${job.titulo} logo">
          </div>
          <div class="created-offer-details">
            <h3>${job.titulo}</h3>
            <div class="created-offer-meta">
              <span class="created-offer-id">ID: ${abbreviatedId}</span>
              <span class="status-badge ${job.estado.toLowerCase()}">${job.estado}</span>
            </div>
          </div>
        </div>
        <div class="offer-actions">
          <button class="btn btn-primary edit-offer-btn" data-id="${job.id}">
            Editar Oferta
          </button>
          <button class="btn btn-danger delete-offer-btn" data-id="${job.id}">
            Eliminar Oferta
          </button>
        </div>
      `
      createdOffersContainer.appendChild(offerItem)
    })
    const editButtons = createdOffersContainer.querySelectorAll(".edit-offer-btn")
    editButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const jobId = btn.dataset.id
        closeCreatedOffersModal()
        openEditJobModal(jobId)
      })
    })
    const deleteButtons = createdOffersContainer.querySelectorAll(".delete-offer-btn")
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const jobId = btn.dataset.id
        deleteJob(jobId)
      })
    })
  }

  // Renderizar las ofertas borradas (estado "Draft")
  function renderDeletedOffers() {
    if (!borradasOffersContainer) {
      console.error('No se encontró el contenedor de ofertas borradas');
      return;
    }
  
    borradasOffersContainer.innerHTML = "";
    console.log('Todas las ofertas:', jobOffers); // Para depuración
  
    // Filtrar ofertas que estén en estado Draft o eliminadas
    const deletedOffers = jobOffers.filter(job => 
      job.estado === 'Draft' || job.estado === 'Borrador' || job.eliminado === true
    );
    
    console.log('Ofertas filtradas:', deletedOffers); // Para depuración
  
    if (deletedOffers.length === 0) {
      borradasOffersContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500">No hay ofertas borradas</p>
        </div>`;
      return;
    }
  
    deletedOffers.forEach(job => {
      const abbreviatedId = job.id.toString().substring(0, 8);
      const offerItem = document.createElement('div');
      offerItem.className = 'created-offer-item';
      offerItem.innerHTML = `
        <div class="created-offer-info">
          <div class="created-offer-logo">
            <img src="${job.logo || '/public/images/Secciones.jpeg'}" 
                 alt="${job.titulo} logo"
                 onerror="this.src='/public/images/Secciones.jpeg'">
          </div>
          <div class="created-offer-details">
            <h3>${job.titulo}</h3>
            <div class="created-offer-meta">
              <span class="created-offer-id">ID: ${abbreviatedId}</span>
              <span class="status-badge draft">Borrador</span>
              <span class="deleted-date">Actualizado: ${
                job.actualizado_en 
                ? new Date(job.actualizado_en).toLocaleDateString()
                : new Date().toLocaleDateString()
              }</span>
            </div>
            <div class="deleted-job-info">
              <p class="job-description">${job.descripcion}</p>
              <p class="job-salary">Salario: ${job.salario}</p>
              <p class="job-type">Tipo: ${job.tipo_contrato}</p>
              <p class="job-modality">Modalidad: ${job.modalidad}</p>
            </div>
          </div>
        </div>
      `;
      borradasOffersContainer.appendChild(offerItem);
    });
  }

  // Reportar una oferta
  function reportJob(jobId) {
    const job = jobOffers.find((j) => j.id === jobId)
    if (!job) return
    const abbreviatedId = job.id.substring(0, 8)
    const reportesContainer = document.getElementById("reportes-container")
    const reportItem = document.createElement("div")
    reportItem.className = "created-offer-item"
    const fechaReporte = new Date().toLocaleDateString()
    reportItem.innerHTML = `
      <div class="created-offer-info">
        <div class="created-offer-logo">
          <img src="${job.logo || "/public/images/Secciones.jpeg"}" alt="${job.titulo} logo">
        </div>
        <div class="created-offer-details">
          <h3>${job.titulo}</h3>
          <div class="created-offer-meta">
            <span class="created-offer-id">ID: ${abbreviatedId}</span>
            <span class="status-badge ${job.estado.toLowerCase()}">${job.estado}</span>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary" disabled>
        En revisión
      </button>
      <p class="reporte-fecha">Fecha del reporte: ${fechaReporte}</p>
    `
    if (reportesContainer) {
      reportesContainer.appendChild(reportItem)
    }
    if (modalReportes) {
      modalReportes.style.display = "block"
    }
  }

  // Aplicar a una oferta (requiere subir CV)
  function applyJob(jobId) {
    const job = jobOffers.find((j) => j.id === jobId)
    if (!job) return
    const fileInput = document.querySelector("#cv-file-input")
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Por favor, selecciona tu currículum antes de aplicar.")
      return
    }
    const cvFile = fileInput.files[0]
    alert(`Has aplicado a la oferta "${job.titulo}" con el archivo: ${cvFile.name}`)
  }

  // ─── Funcionalidades para subir logo ─────────────────────

  function openUploadModal() {
    if (uploadModal) {
      uploadModal.style.display = "block"
      if (previewImageContainer) previewImageContainer.style.display = "none"
      if (uploadDropzone) uploadDropzone.style.display = "block"
      if (uploadProgressContainer) uploadProgressContainer.style.display = "none"
      if (confirmUploadBtn) confirmUploadBtn.disabled = true
    }
  }

  function closeUploadModal() {
    if (uploadModal) {
      uploadModal.style.display = "none"
    }
    uploadedImageData = null
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        uploadedImageData = event.target.result
        showPreviewImage(uploadedImageData)
      }
      reader.readAsDataURL(file)
    }
  }

  function showPreviewImage(imageData) {
    if (previewImage) {
      previewImage.src = imageData
    }
    if (uploadDropzone) uploadDropzone.style.display = "none"
    if (previewImageContainer) previewImageContainer.style.display = "block"
    if (confirmUploadBtn) confirmUploadBtn.disabled = false
  }

  function clearPreviewImage() {
    uploadedImageData = null
    if (previewImageContainer) previewImageContainer.style.display = "none"
    if (uploadDropzone) uploadDropzone.style.display = "block"
    if (confirmUploadBtn) confirmUploadBtn.disabled = true
  }

  function simulateUpload() {
    if (!uploadedImageData) return;
    
    const formData = new FormData();
    // Convertir base64 a blob
    const blob = dataURLtoBlob(uploadedImageData);
    formData.append('logo', blob, 'logo.png');
  
    uploadProgressContainer.style.display = "block";
    confirmUploadBtn.disabled = true;
    cancelUploadBtn.disabled = true;
  
    fetch('/jobs/upload-logo', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        currentLogoUrl = data.logoUrl;
        // Actualizar previsualizaciones
        if (previewImage) {
          previewImage.src = currentLogoUrl;
        }
        if (logoPreview) {
          logoPreview.src = currentLogoUrl;
        }
        closeUploadModal();
        console.log('Logo guardado:', currentLogoUrl); // Para depuración
      } else {
        throw new Error(data.message || 'Error al subir el logo');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al subir el logo: ' + error.message);
    })
    .finally(() => {
      confirmUploadBtn.disabled = false;
      cancelUploadBtn.disabled = false;
      uploadProgressContainer.style.display = "none";
    });
  }
  
  // Función auxiliar para convertir base64 a blob
  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Configurar drag and drop para la subida de logo
  function setupDragAndDrop() {
    if (!uploadDropzone) return
    ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      uploadDropzone.addEventListener(eventName, preventDefaults, false)
    })
    function preventDefaults(e) {
      e.preventDefault()
      e.stopPropagation()
    }
    ;["dragenter", "dragover"].forEach((eventName) => {
      uploadDropzone.addEventListener(eventName, highlight, false)
    })
    ;["dragleave", "drop"].forEach((eventName) => {
      uploadDropzone.addEventListener(eventName, unhighlight, false)
    })
    function highlight() {
      uploadDropzone.classList.add("highlight")
    }
    function unhighlight() {
      uploadDropzone.classList.remove("highlight")
    }
    uploadDropzone.addEventListener("drop", handleDrop, false)
    function handleDrop(e) {
      const dt = e.dataTransfer
      const file = dt.files[0]
      if (file && file.type.match("image.*")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          uploadedImageData = event.target.result
          showPreviewImage(uploadedImageData)
        }
        reader.readAsDataURL(file)
      }
    }
  }
  setupDragAndDrop()

  // Inicializar la interfaz
  await loadJobs()
  cargarImagenPerfil();
})

document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...

  const createdOffersBtn = document.getElementById('created-offers-btn');
  const createdOffersModal = document.getElementById('created-offers-modal');
  const closeCreatedOffersModalBtn = document.getElementById('close-created-offers-modal-btn');

  if (createdOffersBtn) {
    createdOffersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCreatedOffersModal();
    });
  }

  if (closeCreatedOffersModalBtn) {
    closeCreatedOffersModalBtn.addEventListener('click', () => {
      if (createdOffersModal) {
        createdOffersModal.style.display = 'none';
      }
    });
  }

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === createdOffersModal) {
      createdOffersModal.style.display = 'none';
    }
  });

  // ...existing code...
});

// Actualizar la función renderDeletedOffers
function renderDeletedOffers() {
  if (!borradasOffersContainer) {
    console.error('No se encontró el contenedor de ofertas borradas');
    return;
  }

  borradasOffersContainer.innerHTML = "";
  
  // Filtrar ofertas eliminadas
  const deletedOffers = jobOffers.filter(job => job.eliminado === 1);
  
  if (deletedOffers.length === 0) {
    borradasOffersContainer.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500">No hay ofertas eliminadas</p>
      </div>`;
    return;
  }

  deletedOffers.forEach(job => {
    const abbreviatedId = job.id.toString().substring(0, 8);
    const offerItem = document.createElement('div');
    offerItem.className = 'deleted-offer-item';
    offerItem.innerHTML = `
      <div class="deleted-offer-info">
        <div class="deleted-offer-header">
          <div class="deleted-offer-logo">
            <img src="${job.logo || '/public/images/Secciones.jpeg'}" 
                 alt="${job.titulo} logo"
                 onerror="this.src='/public/images/Secciones.jpeg'">
          </div>
          <div class="deleted-offer-main">
            <h3>${job.titulo}</h3>
            <div class="deleted-offer-meta">
              <span class="deleted-offer-id">ID: ${abbreviatedId}</span>
              <span class="deleted-badge">Eliminada</span>
            </div>
          </div>
        </div>
        <div class="deleted-offer-details">
          <p><strong>Descripción:</strong> ${job.descripcion}</p>
          <p><strong>Salario:</strong> ${job.salario}</p>
          <p><strong>Tipo:</strong> ${job.tipo_contrato}</p>
          <p><strong>Modalidad:</strong> ${job.modalidad}</p>
          <p><strong>Fecha de eliminación:</strong> ${job.fecha_eliminacion_formatted || 'No disponible'}</p>
        </div>
      </div>
    `;
    borradasOffersContainer.appendChild(offerItem);
  });
}

// Actualizar la función deleteJob
async function deleteJob(jobId) {
  if (confirm('¿Estás seguro de que deseas eliminar esta oferta? Se moverá a la sección de ofertas eliminadas.')) {
    try {
      const response = await fetch(`/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la oferta');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar las ofertas localmente
        await loadJobs();
        
        // Cerrar el modal de ofertas creadas si está abierto
        if (createdOffersModal) {
          createdOffersModal.style.display = 'none';
        }

        // Mostrar el modal de ofertas borradas
        if (modalBorradasOffers) {
          modalBorradasOffers.style.display = 'block';
          renderDeletedOffers();
        }

        alert('Oferta eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la oferta');
    }
  }
}

// Al inicio del archivo, agregar:
async function cargarImagenPerfil() {
  try {
      const response = await fetch('/auth/user-profile', {
          credentials: 'include'
      });
      const data = await response.json();
      
      const imgPerfil = document.getElementById('profileImg');
      if (data.success && data.user && data.user.foto_perfil) {
          imgPerfil.src = data.user.foto_perfil;
      } else {
          imgPerfil.src = "../public/images/profile.jpeg"; // Imagen por defecto
      }
  } catch (error) {
      console.error('Error al cargar la imagen de perfil:', error);
      // En caso de error, mantener la imagen por defecto
      const imgPerfil = document.getElementById('profileImg');
      imgPerfil.src = "../public/images/profile.jpeg";
  }
}

