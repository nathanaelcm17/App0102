const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database("ap0102.db");

const usuario = "INNOVATRIX";
const password = "Mena00123";
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`
  );

  db.run(
    `INSERT OR IGNORE INTO usuarios (username, password) VALUES (?, ?)`,
    [usuario, hash],
    (err) => {
      if (err) throw err;
      console.log("Usuario INNOVATRIX creado o ya existe.");
      db.close();
    }
  );
});
