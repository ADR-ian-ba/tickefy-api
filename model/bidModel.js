const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bidSchema = new Schema({
    catId: {
        type: Number,
        required: true},
    showId: {
        type: String,
        required: true,
    },
    buyOffer: [{
        buyerId: {
            type: String,
        },
        price: Number
    }],
    sellOffer: [{
        sellerId: {
            type: String,
        },
        price: Number
    }]
});

const BidModel = mongoose.model('Bid', bidSchema);

module.exports = BidModel;
