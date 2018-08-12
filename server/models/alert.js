var mongoose = require('mongoose');

var Alert = mongoose.model('Alert', {
    text: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 10,
        trim: true,
        unique: true
    },
    userId: {
        type: Number,
        required: true
    }
});

module.exports = { Alert };