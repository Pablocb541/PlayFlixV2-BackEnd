// videosController.js

const Video = require('../models/videosModel');
const Playlist = require('../models/playlistsModel');

const videoPost = async (req, res) => {
  const { name, youtubeUrl, userId, playlistId, descripcion } = req.body;

  try {
    // Crear el video
    const newVideo = new Video({ name, youtubeUrl, userId, descripcion });
    const savedVideo = await newVideo.save();

    // Si se proporcionó un playlistId, asociar el video a la playlist correspondiente
    if (playlistId) {
      // Verificar si la playlist existe
      const playlist = await Playlist.findById(playlistId);

      if (!playlist) {
        // Si la playlist no existe, crearla y agregar el video
        const newPlaylist = new Playlist({
          name: 'Default Playlist',
          videos: [savedVideo._id],
          associatedProfiles: [userId]
        });
        await newPlaylist.save();
      } else {
        // Si la playlist existe, agregar el video a su lista de videos
        playlist.videos.push(savedVideo._id);
        await playlist.save();
      }
    }

    res.status(201).json({ video: savedVideo, location: `/api/videos/${savedVideo._id}` });
  } catch (error) {
    console.error('Error al guardar el video:', error);
    res.status(500).json({ error: 'Hubo un error al guardar el video' });
  }
};

const videoGet = async (req, res) => {
  try {
    const userId = req.query.userId;
    const videos = await Video.find({ userId: userId }, 'name youtubeUrl descripcion');
    res.json(videos);
  } catch (error) {
    console.error('Error al obtener los videos:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los videos' });
  }
};

const videoDelete = async (req, res) => {
  const { id } = req.query;

  try {
    const deletedVideo = await Video.findByIdAndDelete(id);

    if (!deletedVideo) {
      res.status(404).json({ error: 'El video no existe' });
    } else {
      res.json(deletedVideo);
    }
  } catch (error) {
    console.error('Error al eliminar el video:', error);
    res.status(500).json({ error: 'Hubo un error al eliminar el video' });
  }
};

const videoUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { youtubeUrl, name, descripcion } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ message: 'Video no encontrado' });
    }

    if (youtubeUrl !== undefined && youtubeUrl.trim() !== '') {
      video.youtubeUrl = youtubeUrl.trim();
    }

    if (name) {
      video.name = name;
    }

    if (descripcion) {
      video.descripcion = descripcion;
    }

    await video.save();

    return res.status(200).json({ message: 'Video actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el video:', error);
    return res.status(500).json({ error: 'Error al actualizar el video' });
  }
};

module.exports = { videoPost, videoGet, videoDelete, videoUpdate };
