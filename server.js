const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcryptjs");

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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
