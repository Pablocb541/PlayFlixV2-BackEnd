const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  contraseña: { type: String, required: true },
  pin: { type: Number, required: true },
  correoElectronico: { type: String, required: true, unique: true },
  pais: { type: String },
  fechaNacimiento: { type: Date, required: true },
  telefono: { type: Number, required: true }, // Agregamos el campo para el número telefónico
  verificado: { type: Boolean, default: false }, // Campo para el estado de verificación
  codigoUnico: { type: String, required: true }
});

module.exports = mongoose.model('Registro', registroSchema);
