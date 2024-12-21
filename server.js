import { createServer } from "http";
import fs from "fs"; // Para leer archivos
import path from "path"; // Para manejar rutas de archivos

const server = createServer((req, res) => {
  // Definir la ruta del archivo HTML
  const filePath = path.join(__dirname, "index.html");

  // Verificar si el archivo existe
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error interno del servidor");
      return;
    }

    // Si el archivo se encuentra, servirlo con código 200
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(3000, () => {
  console.log("Servidor ejecutándose en http://localhost:3001");
});
