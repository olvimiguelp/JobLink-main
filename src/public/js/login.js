document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const messageDiv = document.getElementById("message");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita la recarga del formulario

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    // Validación básica
    if (!email || !password) {
      showMessage("Por favor, complete todos los campos.", "error");
      return;
    }

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      const data = await response.json();

      if (data.success) {
        showMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

        // Redirigir después de 1 segundo
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      } else {
        showMessage(data.message || "Credenciales inválidas", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("Error de conexión. Intente nuevamente.", "error");
    }
  });

  // Función para mostrar mensajes
  function showMessage(message, type) {
    console.log(`Mostrando mensaje: ${message} (${type})`); // Debugging
    const popup = document.createElement("div");
    popup.className = `popup-message ${type}`;
    popup.textContent = message;
    document.body.appendChild(popup);
  
    setTimeout(() => {
      popup.classList.add("fade-out");
      setTimeout(() => {
        popup.remove();
      }, 1000);
    }, 5000);
  }

  // Estilos para el popup
  const style = document.createElement("style");
  style.textContent = `
    .popup-message {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transition: opacity 0.5s ease-in-out;
    }
    .success {
      background-color: #28a745;
    }
    .error {
      background-color: #dc3545;
    }
    .fade-out {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
});
