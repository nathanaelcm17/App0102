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

  const navInventory = document.getElementById("nav-inventory");
  const inventoryView = document.getElementById("inventory-view");
  const addInventoryBtn = document.getElementById("add-inventory-btn");
  const inventoryTableBody = document.querySelector("#inventory-table tbody");
  const searchInventory = document.getElementById("search-inventory");
  const modalInventory = document.getElementById("modal-inventory");
  const closeModalInventory = document.getElementById("close-modal-inventory");
  const inventoryForm = document.getElementById("inventory-form");
  const inventoryModalTitle = document.getElementById("inventory-modal-title");

  let lastSelectedNav = navCalendar;
  let allInventory = [];
  let editingInventoryId = null;

  // Navegación
  function setNav(selected) {
    [navCalendar, navList, navRegister, navInventory].forEach(btn => btn && btn.classList.remove("selected"));
    selected.classList.add("selected");
    if (selected === navCalendar) {
      calendarView.style.display = "block";
      listView.style.display = "none";
      modal.style.display = "none";
      if (inventoryView) inventoryView.style.display = "none";
      lastSelectedNav = navCalendar;
    } else if (selected === navList) {
      calendarView.style.display = "none";
      listView.style.display = "block";
      modal.style.display = "none";
      if (inventoryView) inventoryView.style.display = "none";
      lastSelectedNav = navList;
    } else if (selected === navRegister) {
      calendarView.style.display = "none";
      listView.style.display = "none";
      modal.style.display = "flex";
      if (inventoryView) inventoryView.style.display = "none";
      // No cambiar lastSelectedNav aquí
    } else if (selected === navInventory) {
      calendarView.style.display = "none";
      listView.style.display = "none";
      modal.style.display = "none";
      if (inventoryView) inventoryView.style.display = "block";
      modalInventory.style.display = "none";
      document.querySelector('.content-area').style.background = '#e3e6ec';
      loadInventory();
      lastSelectedNav = navInventory;
    }
  }
  navCalendar.addEventListener("click", () => setNav(navCalendar));
  navList.addEventListener("click", () => setNav(navList));
  navRegister.addEventListener("click", () => setNav(navRegister));
  navInventory.addEventListener("click", () => setNav(navInventory));

  // Mostrar el modal del formulario
  if (showFormBtn) {
    showFormBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  // Cerrar el modal
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    // Restaurar la vista seleccionada antes de abrir el modal
    setNav(lastSelectedNav);
  });
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      setNav(lastSelectedNav);
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

  // --- Ordenar y renderizar tabla de citas ---
  let orderAppointmentsBy = 'id'; // 'id' o 'fecha'

  function sortAppointments(data) {
    if (orderAppointmentsBy === 'id') {
      return data.slice().sort((a, b) => a.id - b.id);
    } else if (orderAppointmentsBy === 'fecha') {
      return data.slice().sort((a, b) => {
        if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
        return a.fecha.localeCompare(b.fecha);
      });
    }
    return data;
  }

  function renderAppointmentsTable(data) {
    const sorted = sortAppointments(data);
    appointmentsTableBody.innerHTML = "";
    sorted.forEach(cita => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${cita.id}</td>
        <td>${cita.nombre_paciente}</td>
        <td>${cita.email}</td>
        <td>${cita.fecha}</td>
        <td>${formatHourAMPM(cita.hora)}</td>
        <td>${cita.procedimiento}</td>
      `;
      row.addEventListener('mouseenter', () => {
        row.classList.add('hovered');
      });
      row.addEventListener('mouseleave', () => {
        row.classList.remove('hovered');
      });
      row.addEventListener('click', () => {
        document.querySelectorAll('#appointments-table tbody tr.selected').forEach(tr => tr.classList.remove('selected'));
        row.classList.add('selected');
        showAppointmentDetailCard(cita);
      });
      appointmentsTableBody.appendChild(row);
    });
  }

  // Card de detalle de cita
  function showAppointmentDetailCard(cita) {
    // Eliminar cualquier card existente
    document.querySelectorAll('.appointment-detail-card').forEach(card => card.remove());
    const card = document.createElement('div');
    card.className = 'appointment-detail-card';
    card.innerHTML = `
      <button class="close-card" title="Cerrar">&times;</button>
      <h3>Detalle de la Cita</h3>
      <div class="card-row"><span class="card-label">ID:</span> ${cita.id}</div>
      <div class="card-row"><span class="card-label">Paciente:</span> ${cita.nombre_paciente}</div>
      <div class="card-row"><span class="card-label">Email:</span> ${cita.email}</div>
      <div class="card-row"><span class="card-label">Fecha:</span> ${cita.fecha}</div>
      <div class="card-row"><span class="card-label">Hora:</span> ${formatHourAMPM(cita.hora)}</div>
      <div class="card-row"><span class="card-label">Procedimiento:</span> ${cita.procedimiento}</div>
    `;
    card.querySelector('.close-card').onclick = () => card.remove();
    document.body.appendChild(card);
    // Cerrar card al presionar Escape
    function escListener(e) { if (e.key === 'Escape') { card.remove(); document.removeEventListener('keydown', escListener); } }
    document.addEventListener('keydown', escListener);
  }

  // Formatea una hora 24h ("14:30") a 12h AM/PM
  function formatHourAMPM(hora) {
    if (!hora) return '';
    const [h, m] = hora.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m} ${ampm}`;
  }

  // Controles de ordenamiento
  const orderByIdBtn = document.getElementById('order-by-id-btn');
  const orderByFechaBtn = document.getElementById('order-by-fecha-btn');
  if (orderByIdBtn && orderByFechaBtn) {
    orderByIdBtn.addEventListener('click', () => {
      orderAppointmentsBy = 'id';
      renderAppointmentsTable(allAppointments);
    });
    orderByFechaBtn.addEventListener('click', () => {
      orderAppointmentsBy = 'fecha';
      renderAppointmentsTable(allAppointments);
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

  // --- Search global dinámico para la tabla ---
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

  // --- Cargar citas al iniciar y para el calendario ---
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
              id: cita.id, // <-- Asigna el id de la cita al evento
              title: `${cita.nombre_paciente} - ${cita.procedimiento}`,
              start: `${cita.fecha}T${cita.hora}`,
              description: `Email: ${cita.email}`
            });
          });
          window.calendar.updateSize && window.calendar.updateSize();
        }
      });
  }

  // Inicializar FullCalendar con theme moderno, drag & drop, tooltips y creación/edición rápida
  if (document.getElementById("calendar")) {
    window.calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
      initialView: 'dayGridMonth',
      locale: 'es',
      height: 600,
      themeSystem: 'bootstrap5', // Theme moderno
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      eventClick: function(info) {
        // Buscar la cita por id si existe, si no por fecha/hora/paciente
        let cita = allAppointments.find(c => {
          // Si el evento tiene id, usarlo
          if (info.event.id && c.id == info.event.id) return true;
          // Si no, comparar por fecha/hora/paciente/procedimiento
          return (
            `${c.nombre_paciente} - ${c.procedimiento}` === info.event.title &&
            `${c.fecha}T${c.hora}` === info.event.startStr
          );
        });
        if (cita) {
          document.querySelectorAll('.appointment-detail-card').forEach(card => card.remove());
          const card = document.createElement('div');
          card.className = 'appointment-detail-card appointment-detail-card-small';
          card.innerHTML = `
            <button class="close-card" title="Cerrar">&times;</button>
            <h3>Detalle de la Cita</h3>
            <div class="card-row"><span class="card-label">ID:</span> ${cita.id}</div>
            <div class="card-row"><span class="card-label">Paciente:</span> ${cita.nombre_paciente}</div>
            <div class="card-row"><span class="card-label">Email:</span> ${cita.email}</div>
            <div class="card-row"><span class="card-label">Fecha:</span> ${cita.fecha}</div>
            <div class="card-row"><span class="card-label">Hora:</span> ${formatHourAMPM(cita.hora)}</div>
            <div class="card-row"><span class="card-label">Procedimiento:</span> ${cita.procedimiento}</div>
          `;
          card.querySelector('.close-card').onclick = () => card.remove();
          document.body.appendChild(card);
          // Cerrar card al presionar Escape
          function escListener(e) { if (e.key === 'Escape') { card.remove(); document.removeEventListener('keydown', escListener); } }
          document.addEventListener('keydown', escListener);
        }
        info.jsEvent.preventDefault();
      },
      editable: true, // Drag & drop
      selectable: true, // Permite seleccionar para crear
      select: function(info) {
        // Mostrar el modal de registro de cita reutilizando el formulario
        document.getElementById('modal').style.display = 'flex';
        // Prellenar fecha y hora si es posible
        document.getElementById('date').value = info.startStr.split('T')[0] || '';
        if (info.startStr.includes('T')) {
          document.getElementById('time').value = info.startStr.split('T')[1]?.substring(0,5) || '';
        } else {
          document.getElementById('time').value = '';
        }
        // Limpiar otros campos
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('procedure').value = '';
      },
      eventDrop: function(info) {
        // Actualizar cita al mover
        const cita = allAppointments.find(c => c.id == info.event.id);
        if (cita) {
          fetch(`/api/citas/${cita.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...cita, fecha: info.event.startStr.split('T')[0], hora: info.event.startStr.split('T')[1]?.substring(0,5) })
          }).then(res => res.json()).then(() => loadAppointments());
        }
      },
      eventDidMount: function(arg) {
        // Badge de estado (ejemplo: confirmada)
        if(arg.event.extendedProps.estado) {
          arg.el.querySelector('.fc-event-title').innerHTML += ` <span class="badge bg-success">${arg.event.extendedProps.estado}</span>`;
        }
      },
      events: [] // Se cargan dinámicamente
    });
    window.calendar.render();
  }

  // Mejorar accesibilidad visual de hover en días y eventos del calendario
  setTimeout(() => {
    // Hover sobre días
    document.querySelectorAll('.fc-daygrid-day').forEach(dayCell => {
      dayCell.addEventListener('mouseenter', () => dayCell.classList.add('fc-day-hover'));
      dayCell.addEventListener('mouseleave', () => dayCell.classList.remove('fc-day-hover'));
    });
    // Hover sobre eventos
    document.querySelectorAll('.fc-event').forEach(eventEl => {
      eventEl.addEventListener('mouseenter', () => eventEl.classList.add('fc-event-hover'));
      eventEl.addEventListener('mouseleave', () => eventEl.classList.remove('fc-event-hover'));
    });
  }, 800);

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

  // --- Reconstrucción de la funcionalidad de registrar citas ---
  let lastView = navCalendar;

  // Forzar el display del modal correctamente
  function showView(view) {
    if (view === 'calendar') {
      calendarView.style.display = 'block';
      listView.style.display = 'none';
      modal.style.display = 'none';
      document.querySelector('.content-area').style.background = '#e3e6ec';
    } else if (view === 'list') {
      calendarView.style.display = 'none';
      listView.style.display = 'block';
      modal.style.display = 'none';
      document.querySelector('.content-area').style.background = '#f4f6f8';
    } else if (view === 'modal') {
      calendarView.style.display = 'none';
      listView.style.display = 'none';
      modal.style.display = 'flex';
      document.querySelector('.content-area').style.background = '#f4f6f8';
    }
  }

  navCalendar.addEventListener('click', () => {
    [navCalendar, navList, navRegister].forEach(btn => btn.classList.remove('selected'));
    navCalendar.classList.add('selected');
    showView('calendar');
    lastView = navCalendar;
    if (window.calendar) {
      window.calendar.render();
      window.calendar.updateSize && window.calendar.updateSize();
      loadAppointments(); // Refresca eventos
    }
  });

  navList.addEventListener('click', () => {
    [navCalendar, navList, navRegister].forEach(btn => btn.classList.remove('selected'));
    navList.classList.add('selected');
    showView('list');
    lastView = navList;
    loadAppointments(); // <-- Actualiza el listado cada vez
  });

  navRegister.addEventListener('click', () => {
    [navCalendar, navList, navRegister].forEach(btn => btn.classList.remove('selected'));
    navRegister.classList.add('selected');
    showView('modal');
    // No cambiar lastView aquí
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    // Restaurar la vista anterior
    if (lastView === navCalendar) {
      navCalendar.classList.add('selected');
      navList.classList.remove('selected');
      showView('calendar');
    } else {
      navList.classList.add('selected');
      navCalendar.classList.remove('selected');
      showView('list');
    }
    navRegister.classList.remove('selected');
  });

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      if (lastView === navCalendar) {
        navCalendar.classList.add('selected');
        navList.classList.remove('selected');
        showView('calendar');
      } else {
        navList.classList.add('selected');
        navCalendar.classList.remove('selected');
        showView('list');
      }
      navRegister.classList.remove('selected');
    }
  };

  // --- Al registrar cita, ir automáticamente al calendario ---
  appointmentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const procedure = document.getElementById("procedure").value;

    // Validación nombre: solo letras y espacios, máximo 100 caracteres
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,100}$/;
    if (!nameRegex.test(name)) {
      alert("El nombre solo puede contener letras y espacios (máx 100 caracteres)");
      return;
    }
    // Validación email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      alert("Ingrese un correo electrónico válido");
      return;
    }
    // Validación procedimiento
    if (!procedure) {
      alert("Seleccione un procedimiento válido");
      return;
    }

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
        setTimeout(() => {
          navCalendar.classList.add('selected');
          navList.classList.remove('selected');
          navRegister.classList.remove('selected');
          showView('calendar');
          loadAppointments();
        }, 200);
      } else {
        alert("Error al registrar cita: " + (data.error || "Desconocido"));
      }
    })
    .catch((error) => {
      alert("Error de red o del servidor: " + error);
    });
  });

  // Navegación Inventario
  navInventory.addEventListener("click", () => {
    [navCalendar, navList, navRegister, navInventory].forEach(btn => btn.classList.remove("selected"));
    navInventory.classList.add("selected");
    calendarView.style.display = "none";
    listView.style.display = "none";
    modal.style.display = "none";
    inventoryView.style.display = "block";
    modalInventory.style.display = "none";
    document.querySelector('.content-area').style.background = '#e3e6ec';
    loadInventory();
  });

  // Mostrar modal de inventario para agregar
  addInventoryBtn.addEventListener("click", () => {
    editingInventoryId = null;
    inventoryModalTitle.textContent = "Agregar Producto";
    inventoryForm.reset();
    modalInventory.style.display = "flex";
  });

  // Cerrar modal inventario
  closeModalInventory.addEventListener("click", () => {
    modalInventory.style.display = "none";
  });
  window.addEventListener("click", (event) => {
    if (event.target == modalInventory) {
      modalInventory.style.display = "none";
    }
  });

  // Cargar inventario
  function loadInventory() {
    fetch("/api/inventario")
      .then(res => res.json())
      .then(data => {
        allInventory = data;
        renderInventoryTable(data);
      });
  }

  // Renderizar tabla de inventario
  function renderInventoryTable(data) {
    inventoryTableBody.innerHTML = "";
    data.forEach(producto => {
      const row = document.createElement("tr");
      let alertStock = producto.stock_minimo && producto.cantidad <= producto.stock_minimo ? ' style="background:#fff3e0;color:#e65100;font-weight:bold;"' : '';
      row.innerHTML = `
        <td>${producto.id}</td>
        <td${alertStock}>${producto.nombre}</td>
        <td>${producto.categoria || ''}</td>
        <td${alertStock}>${producto.cantidad}</td>
        <td>${producto.unidad || ''}</td>
        <td>${producto.proveedor || ''}</td>
        <td>${producto.fecha_ingreso || ''}</td>
        <td>${producto.stock_minimo || ''}</td>
        <td>${producto.observaciones || ''}</td>
        <td>
          <button class="edit-inventory-btn" data-id="${producto.id}">✏️</button>
          <button class="delete-inventory-btn" data-id="${producto.id}">🗑️</button>
        </td>
      `;
      inventoryTableBody.appendChild(row);
    });
    // Botones editar/eliminar
    document.querySelectorAll('.edit-inventory-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const prod = allInventory.find(p => p.id == id);
        if (prod) {
          editingInventoryId = id;
          inventoryModalTitle.textContent = "Editar Producto";
          document.getElementById("inv-nombre").value = prod.nombre;
          document.getElementById("inv-categoria").value = prod.categoria || '';
          document.getElementById("inv-cantidad").value = prod.cantidad;
          document.getElementById("inv-unidad").value = prod.unidad || '';
          document.getElementById("inv-proveedor").value = prod.proveedor || '';
          document.getElementById("inv-fecha").value = prod.fecha_ingreso || '';
          document.getElementById("inv-stock-minimo").value = prod.stock_minimo || '';
          document.getElementById("inv-observaciones").value = prod.observaciones || '';
          modalInventory.style.display = "flex";
        }
      });
    });
    document.querySelectorAll('.delete-inventory-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Eliminar este producto?')) {
          fetch(`/api/inventario/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
              if (data.success) loadInventory();
              else alert('Error al eliminar producto');
            });
        }
      });
    });
  }

  // Buscar inventario
  searchInventory.addEventListener("input", () => {
    const value = searchInventory.value.trim().toLowerCase();
    let filtered = allInventory.filter(prod =>
      (prod.nombre && prod.nombre.toLowerCase().includes(value)) ||
      (prod.categoria && prod.categoria.toLowerCase().includes(value)) ||
      (prod.proveedor && prod.proveedor.toLowerCase().includes(value))
    );
    renderInventoryTable(filtered);
  });

  // Guardar producto (agregar o editar)
  inventoryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const producto = {
      nombre: document.getElementById("inv-nombre").value,
      categoria: document.getElementById("inv-categoria").value,
      cantidad: parseInt(document.getElementById("inv-cantidad").value),
      unidad: document.getElementById("inv-unidad").value,
      proveedor: document.getElementById("inv-proveedor").value,
      fecha_ingreso: document.getElementById("inv-fecha").value,
      stock_minimo: parseInt(document.getElementById("inv-stock-minimo").value) || 0,
      observaciones: document.getElementById("inv-observaciones").value
    };
    if (!producto.nombre || isNaN(producto.cantidad)) {
      alert('Nombre y cantidad son obligatorios');
      return;
    }
    if (editingInventoryId) {
      fetch(`/api/inventario/${editingInventoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            modalInventory.style.display = "none";
            loadInventory();
          } else {
            alert('Error al editar producto');
          }
        });
    } else {
      fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            modalInventory.style.display = "none";
            loadInventory();
          } else {
            alert('Error al agregar producto');
          }
        });
    }
  });

  // --- Cargar citas al iniciar y para el calendario ---
  loadAppointments(); // <-- Cargar citas y eventos al iniciar

  // Quitar selección de fila al hacer click fuera de la tabla
  window.addEventListener('click', function(e) {
    const table = document.getElementById('appointments-table');
    if (!table.contains(e.target)) {
      document.querySelectorAll('#appointments-table tbody tr.selected').forEach(tr => tr.classList.remove('selected'));
    }
  });

  // --- User menu logic ---
  const userBtn = document.getElementById('user-btn');
  const userMenu = document.getElementById('user-menu');
  const userBtnName = document.getElementById('user-btn-name');
  const userMenuName = document.getElementById('user-menu-name');
  const userMenuEmail = document.getElementById('user-menu-email');
  const logoutBtnMenu = document.getElementById('logout-btn-menu');

  // Obtener datos del usuario logeado
  fetch('/api/user-info').then(res => res.json()).then(user => {
    if (user && user.nombre) {
      userBtnName.textContent = user.nombre.split(' ')[0];
      userMenuName.textContent = user.nombre;
      userMenuEmail.textContent = user.email || '';
    } else if (user && user.error) {
      userBtnName.textContent = 'Usuario';
      userMenuName.textContent = 'Usuario';
      userMenuEmail.textContent = '';
    }
  }).catch(() => {
    userBtnName.textContent = 'Usuario';
    userMenuName.textContent = 'Usuario';
    userMenuEmail.textContent = '';
  });

  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', (e) => {
    if (userMenu.style.display === 'block' && !userMenu.contains(e.target) && e.target !== userBtn) {
      userMenu.style.display = 'none';
    }
  });
  // Cerrar menú con Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') userMenu.style.display = 'none';
  });
  // Logout desde menú
  if (logoutBtnMenu) {
    logoutBtnMenu.addEventListener('click', () => {
      fetch('/api/logout', { method: 'POST' })
        .then(res => res.json())
        .then(() => window.location.href = '/login');
    });
  }
});
