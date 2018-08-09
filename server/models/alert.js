var mongoose = require('mongoose');

var Alert = mongoose.model('Alert', {
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    chatId: {
        type: Number,
        required: true
    }
});

module.exports = { Alert };