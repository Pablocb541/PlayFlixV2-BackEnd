// Importación de paquetes y configuraciones
require('dotenv').config(); // Cargar variables de entorno desde .env
const cors = require('cors'); // Middleware para habilitar CORS
const express = require('express'); // Framework web para Node.js
const mongoose = require('mongoose'); // ODM para MongoDB
const mongoString = process.env.DATABASE_URL; // Obtener la URL de la base de datos desde las variables de entorno
const app = express(); // Crear una instancia de la aplicación Express
const PORT = 3000; // Puerto en el que se ejecutará el servidor

// Conexión a la base de datos MongoDB
mongoose.connect(mongoString, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
  .then(() => {
    console.log('Conexión exitosa a la base de datos');
  })
  .catch(error => {
    console.error('Error de conexión a la base de datos:', error);
  });

// Importación de controladores
const { usuarioRestringidoPost, usuarioRestringidoGet, usuarioRestringidoUpdate, usuarioRestringidoDelete, loginPin } = require('./controllers/perfilesController.js');
const { videoPost, videoGet, videoDelete, videoUpdate } = require('./controllers/VIdeosController');
const { registroPost, login, loginUsuarios, verificarCorreo, verifyToken } = require("./controllers/registrosController.js");
const { getPlaylists, createPlaylist, updatePlaylist, deletePlaylist, addVideoToPlaylist, getVideosInPlaylist, obtenerUsuarios, searchVideos } = require('./controllers/playlistsController');

// Middleware para analizar el cuerpo de las solicitudes en formato JSON
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Middleware para habilitar CORS
app.use(cors({
  domains: '*',
  methods: "*"
}));

// Rutas de Registro
app.post("/api/registros", registroPost);
app.get("/api/verify", verificarCorreo);

// Rutas de Login
app.post("/api/login", login);
app.post("/api/loginUsuarios", loginUsuarios);

// Aplicar el middleware verifyToken a todas las rutas restantes
app.use(verifyToken);

// Rutas de Videos
app.post('/api/videos', videoPost);
app.get('/api/videos', videoGet);
app.put('/api/videos/:id', videoUpdate);
app.delete('/api/videos', videoDelete);

// Rutas de Perfiles
app.post('/api/perfiles', usuarioRestringidoPost);
app.get('/api/perfiles', usuarioRestringidoGet);
app.put('/api/perfiles/:id', usuarioRestringidoUpdate); // Modificado para incluir el ID en la ruta
app.delete('/api/perfiles', usuarioRestringidoDelete);

// Rutas de Playlists
app.get('/api/playlists', getPlaylists);
app.post('/api/playlists', createPlaylist);
app.put('/api/playlists/:id', updatePlaylist);
app.delete('/api/playlists/:id', deletePlaylist);
app.put('/api/playlists/:id/videos', addVideoToPlaylist);
app.get('/api/playlists/:id/videos', getVideosInPlaylist);

// Ruta para búsqueda de Videos
app.get('/api/videos/search', searchVideos);

// Ruta para obtener usuarios
app.get('/api/usuarios', obtenerUsuarios);

// Ruta para verificar el PIN durante la autenticación de 2 pasos
app.post("/api/loginPin", loginPin);

// Iniciar el servidor en el puerto especificado
app.listen(PORT, () => console.log(`Aplicación iniciando en el puerto ${PORT} !`));
module.exports = app;
