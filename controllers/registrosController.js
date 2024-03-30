// Importación del módulo jwt para la generación de tokens de autenticación
const jwt = require('jsonwebtoken');

// Importación del modelo Registro desde "../models/registrosModel"
const Registro = require("../models/registrosModel");

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
  } = req.body;

  // Validación de campos requeridos
  if (
    !correoElectronico ||
    !contraseña ||
    !repetirContraseña ||
    !pin ||
    !nombre ||
    !apellido ||
    !fechaNacimiento
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

  // Resto del código para guardar el registro
  let usuario = await Registro.findOne({ correoElectronico });

  if (usuario) {
    return res
      .status(400)
      .json({ error: "El correo electrónico ya está registrado." });
  }

  // Guardar el registro en la base de datos
  usuario = new Registro(req.body);
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
 * Controlador para autenticar un usuario mediante correo electrónico y contraseña
 *
 * @param {*} req
 * @param {*} res
 */
const login = async (req, res) => {
  const { correoElectronico, contraseña } = req.body;
  
  try {
      // Buscar el usuario en la base de datos por su correo electrónico
      const usuario = await Registro.findOne({ correoElectronico });
  
      // Verificar si el usuario existe
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
  loginUsuarios
};
