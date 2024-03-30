// Importación del módulo bcrypt para el cifrado de contraseñas
const bcrypt = require('bcrypt');

// Importación del modelo UsuarioRestringido desde "../models/perfilesModel"
const UsuarioRestringido = require("../models/perfilesModel");

/**
 * Controlador para crear un nuevo usuario restringido
 *
 * @param {*} req
 * @param {*} res
 */
const usuarioRestringidoPost = async (req, res) => {
  // Extraer datos del cuerpo de la solicitud
  const { nombreCompleto, pin, avatar, edad ,userId} = req.body;
  const errorMessages = [];

  // Validación de campos requeridos
  if (!nombreCompleto || !pin || !avatar || !edad) {
    errorMessages.push("Todos los campos marcados con (*) son requeridos.");
  }

  // Verificar si ya existe un usuario con el mismo nombre
  const usuarioExistente = await UsuarioRestringido.findOne({ nombreCompleto });
  if (usuarioExistente) {
    errorMessages.push("Ya existe un usuario con el mismo nombre.");
  }

  if (errorMessages.length > 0) {
    return res.status(400).json({ errors: errorMessages }); // Devolver mensajes de error
  }

  try {
    // Crear un nuevo usuario restringido
    const nuevoUsuarioRestringido = new UsuarioRestringido(req.body);
    await nuevoUsuarioRestringido.save();
    
    res.status(201).json(nuevoUsuarioRestringido); // Respuesta exitosa con el usuario creado
  } catch (error) {
    console.error("Error al crear el usuario restringido:", error);
    res.status(500).json({ error: "Hubo un error al crear el usuario restringido." });
  }
};

/**
 * Controlador para obtener todos los usuarios restringidos asociados con un userId
 *
 * @param {*} req
 * @param {*} res
 */
const usuarioRestringidoGet = async (req, res) => {
  try {
      const userId = req.query.userId; // Obtener el ID del usuario desde la consulta

      // Buscar los perfiles restringidos asociados con el ID de usuario
      const usuariosRestringidos = await UsuarioRestringido.find({ userId: userId });

      // Buscar el perfil de administrador
      const adminProfile = await UsuarioRestringido.findOne({ nombreCompleto: "administrador" });

      // Ordenar los perfiles para que el perfil de administrador aparezca primero
      let profiles = usuariosRestringidos;
      if (adminProfile) {
          // Si se encuentra el perfil de administrador, lo agregamos al inicio de la lista
          profiles = [adminProfile, ...usuariosRestringidos.filter(profile => profile._id !== adminProfile._id)];
      }

      res.status(200).json(profiles);
  } catch (error) {
      console.error("Error al obtener los usuarios restringidos:", error);
      res.status(500).json({ error: "Hubo un error al obtener los usuarios restringidos." });
  }
};

/**
 * Controlador para actualizar un usuario restringido
 *
 * @param {*} req
 * @param {*} res
 */
const usuarioRestringidoUpdate = async (req, res) => {
  const { id } = req.params;
  const { nombreCompleto, pin, avatar, edad } = req.body;

  // Validación de campos requeridos
  if (!nombreCompleto || !pin || !avatar || !edad) {
    return res.status(400).json({ error: "Todos los campos marcados con (*) son requeridos." });
  }

  try {
    // Intentar actualizar el usuario restringido en la base de datos
    const usuarioRestringido = await UsuarioRestringido.findByIdAndUpdate(id, req.body, { new: true });

    // Si el usuario no se encuentra en la base de datos, responder con un error 404
    if (!usuarioRestringido) {
      return res.status(404).json({ error: "Usuario restringido no encontrado." });
    }

    // Si la actualización tiene éxito, responder con el usuario actualizado
    res.status(200).json(usuarioRestringido);
  } catch (error) {
    // Si ocurre un error durante la actualización, responder con un error 500
    console.error("Error al actualizar el usuario restringido:", error);
    res.status(500).json({ error: "Hubo un error al actualizar el usuario restringido." });
  }
};

/**
 * Controlador para eliminar un usuario restringido
 *
 * @param {*} req
 * @param {*} res
 */
const usuarioRestringidoDelete = async (req, res) => {
  const { id } = req.query; // Modificado para obtener el ID desde la consulta (query) en lugar de los parámetros de ruta

  try {
    const usuarioRestringido = await UsuarioRestringido.findByIdAndDelete(id);
    if (!usuarioRestringido) {
      return res.status(404).json({ error: "Usuario restringido no encontrado." });
    }
    res.status(200).json({ message: "Usuario restringido eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar el usuario restringido:", error);
    res.status(500).json({ error: "Hubo un error al eliminar el usuario restringido." });
  }
};

/**
 * Controlador para autenticar un usuario restringido por PIN
 *
 * @param {*} req
 * @param {*} res
 */
const loginPin = async (req, res) => {
  const { pin } = req.body;
  
  try {
    // Buscar el usuario restringido en la base de datos por su PIN
    const usuario = await UsuarioRestringido.findOne({ pin });

    // Verificar si el usuario existe y si el PIN coincide
    if (!usuario || usuario.pin !== pin) {
      return res.status(401).json({ error: "PIN inválido." });
    }

    // Si el PIN es válido, enviar la URL de redirección para usuarios regulares
    res.status(200).json({ redirectURL: "./videos.html" });
  } catch (error) {
    console.error("Error al autenticar usuario por PIN:", error);
    res.status(500).json({ error: "Hubo un error al autenticar el usuario por PIN." });
  }
};

// Exportación de los controladores
module.exports = {
  usuarioRestringidoPost,
  usuarioRestringidoGet,
  usuarioRestringidoUpdate,
  usuarioRestringidoDelete,
  loginPin
};
