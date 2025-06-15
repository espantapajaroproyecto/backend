const agregarUsuario = require('./functions/usuario/agregarUsuario');

(async () => {
  const mockEvent = {
    body: JSON.stringify({
      nombre: "Marco",
      apellido: "Motineshi",
      usuario: "marcos.m",
      contrasenia: "clave123",
      telefono: "099000000",
      dni: "12345678"
    })
  };

console.log('Conectando con:', process.env.DB_HOST, process.env.DB_PORT);
  const result = await agregarUsuario.handler(mockEvent);
  console.log('Respuesta:', result);
})();
