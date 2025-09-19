const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("ap0102.db");

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS usuarios", (err) => {
    if (err) throw err;
    console.log("Tabla 'usuarios' eliminada.");
    db.close();
  });
});
