const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    catId: String,
    showId: String,
    concertId: String,
    buySellId: String
}, { _id: false });

const userSchema = new Schema({
    username: {
        type: String, 
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    buyOfferId: [offerSchema],
    sellOfferId: [offerSchema],
    liked: [{
        type: String,
    }],
    tickets: [{
        type: String,
    }]
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
