const sqlite3 = require("sqlite3").verbose();

// Crear o abrir la base de datos
let db = new sqlite3.Database("ap0102.db");

// Limpiar registros de pruebas y crear tablas normalizadas para citas y procedimientos
db.serialize(() => {
  // Eliminar registros de las tablas si existen
  db.run("DELETE FROM citas", (err) => {
    if (err) console.log("No se pudo limpiar la tabla 'citas' o no existe aún.");
    else console.log("Registros de 'citas' eliminados.");
  });
  db.run("DELETE FROM procedimientos", (err) => {
    if (err) console.log("No se pudo limpiar la tabla 'procedimientos' o no existe aún.");
    else console.log("Registros de 'procedimientos' eliminados.");
  });

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
      db.close();
    }
  );
});
