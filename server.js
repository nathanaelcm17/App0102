import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("¡Hola Mundo desde Node.js!");
});

server.listen(3000, () => {
    const newLocal = "Servidor ejecutándose en http://localhost:300";
    console.log(newLocal);
  });
