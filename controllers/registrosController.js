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
  // Extracción de datos del cuerpo de la solicitud
  const {
    correoElectronico,
    contrasena,
    repetircontrasena,
    pin,
    nombre,
    apellido,
    pais,
    fechaNacimiento,
    telefono
  } = req.body;

  // Validación de campos requeridos
  // ... (código de validación existente)

  // Generación de un código único para el mensaje de texto
  const codigoUnico = generarCodigoUnico();

  try {
    // Guardar el registro en la base de datos
    const usuario = new Registro({ 
      ...req.body, // Spread de los otros campos
      codigoUnico // Agregar el código único
    });

    // Enviar mensaje de texto con el código único
    await enviarMensajeTexto(nombre, telefono, codigoUnico);

    // Generar un token de verificación JWT
    const verificationToken = jwt.sign({ correoElectronico, codigoUnico }, 'secreto', { expiresIn: '1d' });

    // Actualizar el estado de verificación del usuario a false
    usuario.verificado = false;

    await usuario.save();

    // Enviar correo electrónico de verificación con el token JWT
    sendVerificationEmail(correoElectronico, verificationToken);

    // Devolver el token de verificación al frontend
    res.status(201).json({ verificationToken });
  } catch (err) {
    res.status(400);
    console.error("Error al enviar mensaje de texto:", err);
    res.json({
      error: "Hubo un error al enviar el código de verificación. Revisa el número de teléfono e inténtalo de nuevo."
    });
  }
};

/**
 * Función para enviar mensaje de texto con un código único
 *
 * @param {string} nombreUsuario Nombre del usuario
 * @param {string} numeroTelefono Número de teléfono del usuario
 * @param {string} codigoUnico Código único generado
 */
async function enviarMensajeTexto(nombreUsuario, numeroTelefono, codigoUnico) {
  try {
    // Parsear el número de teléfono
    const parsedNumber = phoneUtil.parsePhoneNumber(numeroTelefono, 'CR'); // Indicar el código de país: 'CR' para Costa Rica

    // Validar que el número de teléfono sea válido
    if (parsedNumber.isValid()) {
      // Formatear el número de teléfono al formato E.164
      const formattedNumber = parsedNumber.format('E.164');

      await twilioClient.messages.create({
        body: `Hola ${nombreUsuario}, este es tu código de verificación de Pablo.com: ${codigoUnico}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber
      });
      console.log('Mensaje de texto enviado exitosamente.');
    } else {
      throw new Error('Número de teléfono inválido');
    }
  } catch (error) {
    console.error('Error al enviar mensaje de texto:', error);
    throw error;
  }
}

/**
 * Función para generar un código único
 *
 * @returns {string} Código único de 6 dígitos
 */
function generarCodigoUnico() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Función para enviar correo electrónico de verificación
 *
 * @param {string} userEmail Correo electrónico del usuario
 * @param {string} verificationToken Token JWT de verificación
 */
const sendVerificationEmail = (userEmail, verificationToken) => {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: userEmail,
    subject: 'Verifica tu correo electrónico',
    text: `Por favor haz clic en el siguiente enlace para verificar tu correo electrónico: http://localhost:3000/api/verify?token=${verificationToken}`
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.error('Error al enviar el correo electrónico de verificación:', error);
    } else {
      console.log('Correo electrónico de verificación enviado exitosamente:', info.response);
    }
  });
};

/**
 * Controlador para autenticar un usuario mediante correo electrónico, contrasena y código único
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  const { correoElectronico, contrasena, codigoUnico } = req.body;
  
  try {
      // Buscar el usuario en la base de datos por su correo electrónico y estado verificado
      const usuario = await Registro.findOne({ correoElectronico, verificado: true });
  
      // Verificar si el usuario existe y está verificado
      if (!usuario) {
          return res.status(401).json({ error: "Usuario o contrasena/código inválidos." });
      }
  
      // Verificar la contrasena ingresada
      if (contrasena !== usuario.contrasena) {
          return res.status(401).json({ error: "Usuario o contrasena/código inválidos." });
      }
      
      // Verificar el código único ingresado
      if (codigoUnico !== usuario.codigoUnico) {
          return res.status(401).json({ error: "Usuario o contrasena/código inválidos." });
      }
      
      // Si todo es válido, generar un token de autenticación
      const token = jwt.sign({ userId: usuario._id }, 'secreto', { expiresIn: '1h' });

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

// Exportación de los controladores
module.exports = {
  registroPost,
  login,
  loginUsuarios,
  verificarCorreo,
  verifyToken
};
