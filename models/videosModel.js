const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    name: { type: String },
    youtubeUrl: { type: String },
    descripcion:{ type: String },
    userId: { type: String } // Referencia al usuario que creó el video
});

module.exports = mongoose.model('Video', videoSchema);
