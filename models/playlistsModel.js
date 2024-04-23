const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  associatedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;