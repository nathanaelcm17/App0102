const sqlite3 = require("sqlite3").verbose();

// Crear o abrir la base de datos
let db = new sqlite3.Database("ap0102.db");

// Limpiar registros de pruebas y crear tablas normalizadas para citas y procedimientos
db.serialize(() => {
  // Tabla de procedimientos
  db.run(
    `CREATE TABLE IF NOT EXISTS procedimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    )`,
    (err) => {
      if (err) throw err;
      console.log("Tabla 'procedimientos' creada o ya existe.");
    }
  );

  // Tabla de citas
  db.run(
    `CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_paciente TEXT NOT NULL,
      email TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      procedimiento_id INTEGER NOT NULL,
      FOREIGN KEY (procedimiento_id) REFERENCES procedimientos(id)
    )`,
    (err) => {
      if (err) throw err;
      console.log("Tabla 'citas' creada o ya existe.");
    }
  );

  // Consultar y mostrar todas las citas con el nombre del procedimiento
  db.all(
    `SELECT c.id, c.nombre_paciente, c.email, c.fecha, c.hora, p.nombre as procedimiento
     FROM citas c
     JOIN procedimientos p ON c.procedimiento_id = p.id
     ORDER BY c.fecha DESC, c.hora DESC`,
    [],
    (err, rows) => {
      if (err) throw err;
      console.log("Citas almacenadas:", rows);
      db.close();
    }
  );
});
