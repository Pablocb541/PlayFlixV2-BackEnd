// Importa la biblioteca Twilio
const twilio = require('twilio');

// Importa la biblioteca nodemailer para enviar correos electrónicos
const nodemailer = require('nodemailer');

// Importa la biblioteca jsonwebtoken para generar y verificar tokens JWT
const jwt = require('jsonwebtoken');

const phoneUtil = require('libphonenumber-js');

require('dotenv').config(); // Cargar variables de entorno desde .env

// Importación del modelo Registro desde "../models/registrosModel"
const Registro = require("../models/registrosModel");

// Crea un transportador de correo electrónico
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
});

// Crea un cliente de Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Función middleware para verificar el token JWT
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, 'secreto');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Controlador para crear un nuevo registro de usuario
 *
 * @param {*} req
 * @param {*} res
 */
const registroPost = async (req, res) => {
  // ... (código existente)
};

/**
 * Función para enviar mensaje de texto con un código único
 *
 * @param {string} nombreUsuario Nombre del usuario
 * @param {string} numeroTelefono Número de teléfono del usuario
 * @param {string} codigoUnico Código único generado
 */
async function enviarMensajeTexto(nombreUsuario, numeroTelefono, codigoUnico) {
  // ... (código existente)
}

/**
 * Función para generar un código único
 *
 * @returns {string} Código único de 6 dígitos
 */
function generarCodigoUnico() {
  // ... (código existente)
}

/**
 * Función para enviar correo electrónico de verificación
 *
 * @param {string} userEmail Correo electrónico del usuario
 * @param {string} verificationToken Token JWT de verificación
 */
const sendVerificationEmail = (userEmail, verificationToken) => {
  // ... (código existente)
};

/**
 * Controlador para autenticar un usuario mediante correo electrónico, contraseña y código único
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  const { correoElectronico, contraseña, codigoUnico } = req.body;
  
  try {
      // Buscar el usuario en la base de datos por su correo electrónico y estado verificado
      const usuario = await Registro.findOne({ correoElectronico, verificado: true });
  
      // Verificar si el usuario existe y está verificado
      if (!usuario) {
          return res.status(401).json({ error: "Usuario o contraseña/código inválidos." });
      }
  
      // Verificar la contraseña ingresada
      if (contraseña !== usuario.contraseña) {
          return res.status(401).json({ error: "Usuario o contraseña/código inválidos." });
      }
      
      // Verificar el código único ingresado
      if (codigoUnico !== usuario.codigoUnico) {
          return res.status(401).json({ error: "Usuario o contraseña/código inválidos." });
      }
      
      // Si todo es válido, generar un token de autenticación
      const token = jwt.sign({ userId: usuario._id }, 'secreto', { expiresIn: '6d' });

      // Devolver el token junto con el ID y el pin del usuario en la respuesta
      return res.status(200).json({ message: "Inicio de sesión exitoso.", token, id: usuario._id, pin: usuario.pin });
  } catch (error) {
      console.error("Error al autenticar usuario:", error);
      res.status(500).json({ error: "Hubo un error al autenticar el usuario." });
  }
};

/**
 * Controlador para autenticar un usuario mediante PIN
 *
 * @param {*} req
 * @param {*} res
 */
const loginUsuarios = async (req, res) => {
  const { pin } = req.body;
  
  try {
      // Buscar el usuario en la base de datos por su PIN
      const usuario = await Registro.findOne({ pin });
  
      // Verificar si el usuario existe
      if (!usuario) {
          return res.status(401).json({ error: "PIN inválido." });
      }
  
      res.status(200).json({ success: true, message: "Inicio de sesión exitoso." }); // Agregamos success:true si el PIN es válido
  } catch (error) {
      console.error("Error al autenticar usuario por PIN:", error);
      res.status(500).json({ error: "Hubo un error al autenticar el usuario por PIN." });
  }
};

/**
 * Controlador para verificar el correo electrónico mediante el token JWT
 *
 * @param {*} req
 * @param {*} res
 */
const verificarCorreo = async (req, res) => {
  const { token } = req.query;

  try {
    // Verificar el token JWT
    const decoded = jwt.verify(token, 'secreto');
    const { correoElectronico, codigoUnico } = decoded;

    // Buscar el usuario en la base de datos por su correo electrónico
    const usuario = await Registro.findOneAndUpdate(
      { correoElectronico, codigoUnico },
      { verificado: true }, // Actualizar el estado de verificación del usuario a true
      { new: true } // Devolver el documento actualizado
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Enviar una respuesta JSON indicando el éxito de la verificación, el mensaje y la URL de inicio de sesión
    res.json({ success: true, message: "Correo y código verificados correctamente. Puedes iniciar sesión ahora.", redirectTo: '/login.html' });
  } catch (error) {
    console.error("Error al verificar correo electrónico:", error);
    res.status(500).json({ error: "Hubo un error al verificar el correo electrónico." });
  }
};

// Ruta protegida de ejemplo
const protectedRoute = (req, res) => {
  // Acceder a los datos del usuario autenticado
  const userId = req.user.userId;

  // Realizar alguna lógica protegida aquí
  res.json({ message: `Acceso concedido para el usuario ${userId}` });
};

// Exportación de los controladores
module.exports = {
  registroPost,
  login,
  loginUsuarios,
  verificarCorreo,
  protectedRoute,
  verifyToken
}