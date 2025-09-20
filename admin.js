// admin.js - Lógica del BackOffice

document.addEventListener("DOMContentLoaded", () => {
  // Panel de navegación
  const navCalendar = document.getElementById("nav-calendar");
  const navList = document.getElementById("nav-list");
  const navRegister = document.getElementById("nav-register");
  const calendarView = document.getElementById("calendar-view");
  const listView = document.getElementById("list-view");
  const showFormBtn = document.getElementById("show-form-btn");
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("close-modal");
  const appointmentForm = document.getElementById("appointment-form");
  const appointmentsTableBody = document.querySelector("#appointments-table tbody");

  // Navegación
  function setNav(selected) {
    [navCalendar, navList, navRegister].forEach(btn => btn.classList.remove("selected"));
    selected.classList.add("selected");
    calendarView.style.display = selected === navCalendar ? "block" : "none";
    listView.style.display = selected === navList ? "block" : "none";
    if (selected === navRegister) {
      modal.style.display = "flex";
    }
  }
  navCalendar.addEventListener("click", () => setNav(navCalendar));
  navList.addEventListener("click", () => setNav(navList));
  navRegister.addEventListener("click", () => setNav(navRegister));

  // Mostrar el modal del formulario
  if (showFormBtn) {
    showFormBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  // Cerrar el modal
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  // --- Filtro de tabla por columnas ---
  const searchInputs = {
    id: document.getElementById("search-id"),
    nombre: document.getElementById("search-nombre"),
    email: document.getElementById("search-email"),
    fecha: document.getElementById("search-fecha"),
    hora: document.getElementById("search-hora"),
    procedimiento: document.getElementById("search-procedimiento")
  };

  let allAppointments = [];

  function renderAppointmentsTable(data) {
    appointmentsTableBody.innerHTML = "";
    data.forEach(cita => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${cita.id}</td>
        <td>${cita.nombre_paciente}</td>
        <td>${cita.email}</td>
        <td>${cita.fecha}</td>
        <td>${cita.hora}</td>
        <td>${cita.procedimiento}</td>
      `;
      appointmentsTableBody.appendChild(row);
    });
  }

  function filterAppointments() {
    let filtered = allAppointments.filter(cita => {
      return (
        (!searchInputs.id.value || cita.id.toString().includes(searchInputs.id.value)) &&
        (!searchInputs.nombre.value || cita.nombre_paciente.toLowerCase().includes(searchInputs.nombre.value.toLowerCase())) &&
        (!searchInputs.email.value || cita.email.toLowerCase().includes(searchInputs.email.value.toLowerCase())) &&
        (!searchInputs.fecha.value || cita.fecha === searchInputs.fecha.value) &&
        (!searchInputs.hora.value || cita.hora.includes(searchInputs.hora.value)) &&
        (!searchInputs.procedimiento.value || cita.procedimiento.toLowerCase().includes(searchInputs.procedimiento.value.toLowerCase()))
      );
    });
    renderAppointmentsTable(filtered);
  }

  Object.values(searchInputs).forEach(input => {
    if (input) input.addEventListener("input", filterAppointments);
  });

  // --- Filtro de tabla por búsqueda global ---
  const searchGlobal = document.getElementById("search-global");

  function filterAppointmentsGlobal() {
    const value = searchGlobal.value.trim().toLowerCase();
    let filtered = allAppointments.filter(cita => {
      return (
        cita.id.toString().toLowerCase().includes(value) ||
        cita.nombre_paciente.toLowerCase().includes(value) ||
        cita.email.toLowerCase().includes(value) ||
        cita.fecha.toLowerCase().includes(value) ||
        cita.hora.toLowerCase().includes(value) ||
        cita.procedimiento.toLowerCase().includes(value)
      );
    });
    renderAppointmentsTable(filtered);
  }
  if (searchGlobal) {
    searchGlobal.addEventListener("input", filterAppointmentsGlobal);
  }

  // Cargar citas al iniciar y para el calendario
  function loadAppointments() {
    fetch("/api/citas")
      .then(res => res.json())
      .then(data => {
        allAppointments = data;
        renderAppointmentsTable(data);
        // Calendario
        if (window.calendar) {
          window.calendar.removeAllEvents();
          data.forEach(cita => {
            window.calendar.addEvent({
              title: `${cita.nombre_paciente} - ${cita.procedimiento}`,
              start: `${cita.fecha}T${cita.hora}`,
              description: `Email: ${cita.email}`
            });
          });
        }
      });
  }

  // Inicializar FullCalendar
  if (document.getElementById("calendar")) {
    window.calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
      initialView: 'dayGridMonth',
      locale: 'es',
      height: 600,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      eventClick: function(info) {
        alert(info.event.title + "\n" + info.event.start.toLocaleString() + "\n" + (info.event.extendedProps.description || ""));
      }
    });
    window.calendar.render();
  }

  loadAppointments();

  // Registrar nueva cita
  appointmentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const procedure = document.getElementById("procedure").value;

    fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          alert("Cita registrada correctamente. ID: " + data.citaId);
          appointmentForm.reset();
          modal.style.display = "none";
          loadAppointments();
        } else {
          alert("Error al registrar cita: " + (data.error || "Desconocido"));
        }
      })
      .catch((error) => {
        alert("Error de red o del servidor: " + error);
      });
  });

  // --- Exportar a Excel ---
  function exportTableToExcel() {
    let table = document.getElementById("appointments-table");
    let rows = Array.from(table.rows);
    let csv = rows.map(row =>
      Array.from(row.cells).map(cell => '"' + cell.innerText.replace(/"/g, '""') + '"').join(",")
    ).join("\n");
    let blob = new Blob([csv], { type: 'text/csv' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'citas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  const exportBtn = document.getElementById("export-excel-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportTableToExcel);
  }

  // Botón de logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("/api/logout", { method: "POST" })
        .then(res => res.json())
        .then(() => {
          window.location.href = "/login";
        });
    });
  }
});
