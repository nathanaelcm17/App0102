const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3001;

// Middleware para parsear JSON y servir archivos estáticos
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Ruta para insertar una cita
app.post("/api/citas", (req, res) => {
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

// Servir index.html por defecto
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
