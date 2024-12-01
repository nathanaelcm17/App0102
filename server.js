const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("¡Hola Mundo desde Node.js!");
});

server.listen(3000, () => {
    const newLocal = "Servidor ejecutándose en http://localhost:3000";
  console.log(newLocal);
});
