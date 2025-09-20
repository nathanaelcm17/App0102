const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { testUser } = require('./config');

const app = express();
const PORT = 3001;

// Configuración de sesión
app.use(
  session({
    secret: "citasodontosecret2025",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true solo si usas HTTPS
  })
);

// Middleware para parsear JSON y servir archivos estáticos
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Middleware de autenticación para rutas protegidas
function requireLogin(req, res, next) {
  // Permitir autenticación básica para pruebas
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    const base64 = auth.split(' ')[1];
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    if (user === testUser.username && pass === testUser.password) {
      req.session = req.session || {};
      req.session.user = { id: 0, username: user };
      return next();
    }
  }
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "No autorizado" });
  }
}

// Endpoint de login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = new sqlite3.Database("ap0102.db");
  db.get(
    "SELECT * FROM usuarios WHERE username = ?",
    [username],
    (err, user) => {
      db.close();
      if (err || !user) {
        return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
      }
      if (bcrypt.compareSync(password, user.password)) {
        req.session.user = { id: user.id, username: user.username };
        return res.json({ success: true });
      } else {
        return res.json({ success: false, error: "Usuario o contraseña incorrectos" });
      }
    }
  );
});

// Endpoint de logout
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Ruta para insertar una cita
app.post("/api/citas", requireLogin, (req, res) => {
  const { nombre, email, fecha, hora, procedimiento } = req.body;
  if (!nombre || !email || !fecha || !hora || !procedimiento) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const db = new sqlite3.Database("ap0102.db");

  // Insertar el procedimiento si no existe y obtener su id
  db.run(
    "INSERT OR IGNORE INTO procedimientos (nombre) VALUES (?)",
    [procedimiento],
    function (err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: "Error al insertar procedimiento" });
      }
      // Obtener el id del procedimiento
      db.get(
        "SELECT id FROM procedimientos WHERE nombre = ?",
        [procedimiento],
        (err, row) => {
          if (err || !row) {
            db.close();
            return res.status(500).json({ error: "Error al obtener id de procedimiento" });
          }
          const procedimiento_id = row.id;
          // Insertar la cita
          db.run(
            `INSERT INTO citas (nombre_paciente, email, fecha, hora, procedimiento_id)
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, email, fecha, hora, procedimiento_id],
            function (err) {
              db.close();
              if (err) {
                return res.status(500).json({ error: "Error al insertar cita" });
              }
              res.json({ success: true, citaId: this.lastID });
            }
          );
        }
      );
    }
  );
});

// Ruta para obtener todas las citas con el nombre del procedimiento
app.get("/api/citas", requireLogin, (req, res) => {
  const db = new sqlite3.Database("ap0102.db");
  db.all(
    `SELECT c.id, c.nombre_paciente, c.email, c.fecha, c.hora, p.nombre as procedimiento
     FROM citas c
     JOIN procedimientos p ON c.procedimiento_id = p.id
     ORDER BY c.fecha DESC, c.hora DESC`,
    [],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: "Error al consultar citas" });
      }
      res.json(rows);
    }
  );
});

// Endpoint para recibir registro de citas desde WhatsApp Business API
app.post("/api/whatsapp-cita", (req, res) => {
  const { nombre, email, fecha, hora, procedimiento } = req.body;
  if (!nombre || !fecha || !hora || !procedimiento) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  const db = new sqlite3.Database("ap0102.db");
  db.run(
    "INSERT OR IGNORE INTO procedimientos (nombre) VALUES (?)",
    [procedimiento],
    function (err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: "Error al insertar procedimiento" });
      }
      db.get(
        "SELECT id FROM procedimientos WHERE nombre = ?",
        [procedimiento],
        (err, row) => {
          if (err || !row) {
            db.close();
            return res.status(500).json({ error: "Error al obtener id de procedimiento" });
          }
          const procedimiento_id = row.id;
          db.run(
            `INSERT INTO citas (nombre_paciente, email, fecha, hora, procedimiento_id)
             VALUES (?, ?, ?, ?, ?)`,
            [nombre, email || "", fecha, hora, procedimiento_id],
            function (err) {
              db.close();
              if (err) {
                return res.status(500).json({ error: "Error al insertar cita" });
              }
              res.json({ success: true, citaId: this.lastID });
            }
          );
        }
      );
    }
  );
});

// Crear tabla de inventario si no existe
const dbInit = new sqlite3.Database("ap0102.db");
dbInit.run(`CREATE TABLE IF NOT EXISTS inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  cantidad INTEGER NOT NULL,
  unidad TEXT,
  proveedor TEXT,
  fecha_ingreso TEXT,
  observaciones TEXT,
  stock_minimo INTEGER DEFAULT 0
)`);
dbInit.close();

// ENDPOINTS CRUD INVENTARIO
// Obtener todo el inventario
app.get("/api/inventario", requireLogin, (req, res) => {
  const db = new sqlite3.Database("ap0102.db");
  db.all("SELECT * FROM inventario ORDER BY nombre ASC", [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: "Error al consultar inventario" });
    res.json(rows);
  });
});

// Agregar producto
app.post("/api/inventario", requireLogin, (req, res) => {
  const { nombre, categoria, cantidad, unidad, proveedor, fecha_ingreso, observaciones, stock_minimo } = req.body;
  if (!nombre || cantidad == null) return res.status(400).json({ error: "Nombre y cantidad son obligatorios" });
  const db = new sqlite3.Database("ap0102.db");
  db.run(
    `INSERT INTO inventario (nombre, categoria, cantidad, unidad, proveedor, fecha_ingreso, observaciones, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, categoria, cantidad, unidad, proveedor, fecha_ingreso, observaciones, stock_minimo],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: "Error al agregar producto" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Editar producto
app.put("/api/inventario/:id", requireLogin, (req, res) => {
  const { nombre, categoria, cantidad, unidad, proveedor, fecha_ingreso, observaciones, stock_minimo } = req.body;
  const { id } = req.params;
  if (!nombre || cantidad == null) return res.status(400).json({ error: "Nombre y cantidad son obligatorios" });
  const db = new sqlite3.Database("ap0102.db");
  db.run(
    `UPDATE inventario SET nombre=?, categoria=?, cantidad=?, unidad=?, proveedor=?, fecha_ingreso=?, observaciones=?, stock_minimo=? WHERE id=?`,
    [nombre, categoria, cantidad, unidad, proveedor, fecha_ingreso, observaciones, stock_minimo, id],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: "Error al editar producto" });
      res.json({ success: true });
    }
  );
});

// Eliminar producto
app.delete("/api/inventario/:id", requireLogin, (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database("ap0102.db");
  db.run("DELETE FROM inventario WHERE id=?", [id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: "Error al eliminar producto" });
    res.json({ success: true });
  });
});

// Verifica si hay sesión activa
app.get("/api/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ loggedIn: true });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Endpoint para obtener datos del usuario logeado
app.get('/api/user-info', requireLogin, (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const db = new sqlite3.Database('ap0102.db');
  db.get('SELECT nombre, email FROM usuarios WHERE id = ?', [req.session.user.id], (err, user) => {
    db.close();
    if (err || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ nombre: user.nombre, email: user.email });
  });
});

// Servir index.html por defecto
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Servir admin.html para el BackOffice
app.get("/admin", (req, res) => {
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, "admin.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

module.exports = app;
