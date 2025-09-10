// Referencias al formulario y la lista de citass
const appointmentForm = document.getElementById("appointment-form");
const appointmentsList = document.getElementById("appointments-list");

// Manejar el envío del formulario
appointmentForm.addEventListener("submit", function (e) {
  e.preventDefault(); // Evita el envío del formulario

  // Obtener los valores de los campos
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const procedure = document.getElementById("procedure").value;

  // Enviar los datos al backend
  fetch("/api/citas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre: name,
      email: email,
      fecha: date,
      hora: time,
      procedimiento: procedure,
    }),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      
      alert("Cita registrada Correctamente. ID de cita: " + data.citaId);
    } else {
      alert("Error al agendar la cita: " + (data.error || "Desconocido"));
    }
  })
  .catch((error) => {
    alert("Error de red o del servidor: " + error);
  });


  document.getElementById("appointment-form").reset();



});
