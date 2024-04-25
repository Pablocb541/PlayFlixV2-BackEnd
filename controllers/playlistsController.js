const Playlist = require('../models/playlistsModel');
const Video = require('../models/videosModel');
const Usuario = require('../models/registrosModel');

const getPlaylists = async (req, res) => {
  try {
    const userId = req.query.userId;
    const playlists = await Playlist.find({ associatedProfiles: userId })
      .populate('videos')
      .exec();
    res.json(playlists);
  } catch (error) {
    console.error('Error al obtener las playlists:', error);
    res.status(500).json({ error: 'Hubo un error al obtener las playlists' });
  }
};

const createPlaylist = async (req, res) => {
  const { name, associatedProfiles } = req.body;

  try {
    if (!name || !associatedProfiles) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const newPlaylist = new Playlist({ name, associatedProfiles, videos: [] });
    const savedPlaylist = await newPlaylist.save();
    res.status(201).json(savedPlaylist);
  } catch (error) {
    console.error('Error al crear la playlist:', error);
    res.status(500).json({ error: 'Hubo un error al crear la playlist' });
  }
};

const updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { name, associatedProfiles, videos } = req.body;

  try {
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    if (name) {
      playlist.name = name;
    }

    if (associatedProfiles) {
      playlist.associatedProfiles = associatedProfiles;
    }

    if (videos) {
      playlist.videos = videos;
    }

    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('Error al actualizar la playlist:', error);
    res.status(500).json({ error: 'Hubo un error al actualizar la playlist' });
  }
};

const deletePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPlaylist = await Playlist.findByIdAndDelete(id);

    if (!deletedPlaylist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    await Video.updateMany({ playlist: id }, { $unset: { playlist: 1 } });

    res.json(deletedPlaylist);
  } catch (error) {
    console.error('Error al eliminar la playlist:', error);
    res.status(500).json({ error: 'Hubo un error al eliminar la playlist' });
  }
};

const addVideoToPlaylist = async (req, res) => {
  const { playlistId, videoId } = req.body;

  try {
    if (!playlistId || !videoId) {
      return res.status(400).json({ error: 'Playlist ID y Video ID son requeridos' });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    playlist.videos.push(videoId);
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('Error al agregar video a la playlist:', error);
    res.status(500).json({ error: 'Hubo un error al agregar video a la playlist' });
  }
};

const getVideosInPlaylist = async (req, res) => {
  const { id } = req.params;
  try {
    const playlist = await Playlist.findById(id).populate('videos');
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }
    res.json(playlist.videos);
  } catch (error) {
    console.error('Error al obtener los videos de la playlist:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los videos de la playlist' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los usuarios' });
  }
};

module.exports = {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  getVideosInPlaylist,
  obtenerUsuarios
};
