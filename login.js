// login.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  // Redirigir a /admin si ya hay sesión activa
  fetch("/api/check-session").then(res => {
    if (res.status === 200) {
      window.location.href = "/admin";
    }
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = "/admin";
        } else {
          loginError.textContent = data.error || "Credenciales incorrectas";
          loginError.style.display = "block";
        }
      })
      .catch(() => {
        loginError.textContent = "Error de red o del servidor";
        loginError.style.display = "block";
      });
  });
});
