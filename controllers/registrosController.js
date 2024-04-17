// Importa la biblioteca nodemailer para enviar correos electrónicos
const nodemailer = require('nodemailer');
// Importa la biblioteca jsonwebtoken para generar y verificar tokens JWT
const jwt = require('jsonwebtoken');

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
    contraseña,
    repetirContraseña,
    pin,
    nombre,
    apellido,
    pais,
    fechaNacimiento,
    telefono // Nuevo campo requerido
  } = req.body;

  // Validación de campos requeridos
  if (
    !correoElectronico ||
    !contraseña ||
    !repetirContraseña ||
    !pin ||
    !nombre ||
    !apellido ||
    !fechaNacimiento ||
    !telefono // Asegúrate de incluir el número telefónico como requerido
  ) {
    return res
      .status(400)
      .json({ error: "Todos los campos marcados con (*) son requeridos." });
  }

  // Validación de la edad del usuario
  const edadUsuario = calcularEdad(fechaNacimiento);
  if (edadUsuario < 18) {
    return res
      .status(400)
      .json({ error: "Debes tener al menos 18 años para registrarte." });
  }

  // Validación de contraseña y repetición de contraseña
  if (contraseña !== repetirContraseña) {
    return res.status(400).json({ error: "Las contraseñas no coinciden." });
  }

  // Generación de un token de verificación JWT
  const verificationToken = jwt.sign({ correoElectronico }, 'secreto', { expiresIn: '1d' });

  // Guardar el registro en la base de datos
  const usuario = new Registro(req.body);

  // Envío de correo electrónico de verificación con el token JWT
  sendVerificationEmail(correoElectronico, verificationToken);

  // Actualizar el estado de verificación del usuario a false
  usuario.verificado = false;

  await usuario
    .save()
    .then((registro) => {
      res.status(201); // CREATED
      res.header({
        location: `/api/registros/?id=${usuario.id}`,
      });
      res.json(registro);
    })
    .catch((err) => {
      res.status(422);
      console.log("Error al guardar el registro", err);
      res.json({
        error: "Hubo un error al guardar el registro",
      });
    });
};

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
 * Controlador para autenticar un usuario mediante correo electrónico y contraseña
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  const { correoElectronico, contraseña } = req.body;
  
  try {
      // Buscar el usuario en la base de datos por su correo electrónico y estado verificado
      const usuario = await Registro.findOne({ correoElectronico, verificado: true });
  
      // Verificar si el usuario existe y está verificado
      if (!usuario) {
          return res.status(401).json({ error: "Usuario o contraseña inválida." });
      }
  
      // Comparar la contraseña ingresada con la contraseña almacenada en la base de datos
      if (contraseña !== usuario.contraseña) {
          return res.status(401).json({ error: "Usuario o contraseña inválida." });
      }
      
      // Si el usuario existe y la contraseña coincide, generar un token de autenticación
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
    const { correoElectronico } = decoded;

    // Buscar el usuario en la base de datos por su correo electrónico
    const usuario = await Registro.findOneAndUpdate(
      { correoElectronico },
      { verificado: true }, // Actualizar el estado de verificación del usuario a true
      { new: true } // Devolver el documento actualizado
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Enviar una respuesta JSON indicando el éxito de la verificación, el mensaje y la URL de inicio de sesión
    res.json({ success: true, message: "Correo verificado correctamente. Puedes iniciar sesión ahora.", redirectTo: '/login.html' });
  } catch (error) {
    console.error("Error al verificar correo electrónico:", error);
    res.status(500).json({ error: "Hubo un error al verificar el correo electrónico." });
  }
};


// Función para calcular la edad a partir de la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  const hoy = new Date();
  const cumpleaños = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumpleaños.getFullYear();
  const mes = hoy.getMonth() - cumpleaños.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleaños.getDate())) {
    edad--;
  }
  return edad;
}


// Exportación de los controladores
module.exports = {
  registroPost,
  login,
  loginUsuarios,
  verificarCorreo
};
