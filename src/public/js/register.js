document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm")
    const messageDiv = document.getElementById("message")
  
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()
  
      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("confirmPassword").value
  
      // Validaciones básicas
      if (!name || !email || !password || !confirmPassword) {
        showMessage("Por favor, complete todos los campos.", "error")
        return
      }
  
      if (password !== confirmPassword) {
        showMessage("Las contraseñas no coinciden.", "error")
        return
      }
  
      if (password.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres.", "error")
        return
      }
  
      try {
        const response = await fetch("/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        })
  
        const data = await response.json()
        console.log('Respuesta del servidor:', data); // Añadir este log
  
        if (response.ok) {
          showMessage("Registro exitoso. Redirigiendo...", "success")
  
          // Redirigir después de 1 segundo
          setTimeout(() => {
            window.location.href = "/home"
          }, 1000)
        } else {
          showMessage(data.message || "Error en el registro: " + data.error, "error")
        }
      } catch (error) {
        console.error("Error detallado:", error)
        showMessage("Error de conexión con el servidor", "error")
      }
    })
  
    // Función para mostrar mensajes
    function showMessage(text, type) {
      messageDiv.textContent = text
      messageDiv.className = "message " + type
      messageDiv.style.display = "block"
  
      // Ocultar después de 5 segundos
      setTimeout(() => {
        messageDiv.style.display = "none"
      }, 5000)
    }
  })

