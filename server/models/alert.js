var mongoose = require('mongoose');

var AlertSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 10,
        trim: true
    },
    userId: {
        type: Number,
        required: true
    }
});

AlertSchema.index({userId: 1, text: 1}, {unique: true});

var Alert = mongoose.model('Alert', AlertSchema);

module.exports = { Alert };