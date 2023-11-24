const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const showSchema = new Schema({
    catNumber: { type: Number, required: true },
    catPrices: [{ type: Number, required: true }],
    catImage: { type: String, required: true }, // Base64 string for the image
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true }
});

const concertSchema = new Schema({
    eventType: {type: String, required: true},
    concertName: { type: String, required: true },
    concertDescription: { type: String, required: true },
    concertArtist: { type: String, required: true },
    concertHeroImage: { type: String, required: true }, // Base64 string for the image
    concertPosterImage: { type: String, required: true }, // Base64 string for the image
    shows: [showSchema]
});

const ConcertModel = mongoose.model('Concert', concertSchema);

module.exports = ConcertModel;

