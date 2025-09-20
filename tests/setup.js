// Configuración para pruebas: crea una base de datos temporal para testing
const fs = require('fs');
if (fs.existsSync('ap0102_test.db')) fs.unlinkSync('ap0102_test.db');
fs.copyFileSync('ap0102.db', 'ap0102_test.db');
