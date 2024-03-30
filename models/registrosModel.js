const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  contraseña: { type: String, required: true },
  pin: { type: Number, required: true },
  correoElectronico: { type: String, required: true, unique: true },
  pais: { type: String },
  fechaNacimiento: { type: Date, required: true }
});

module.exports = mongoose.model('Registro', registroSchema);
