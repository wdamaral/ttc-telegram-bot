var mongoose = require('mongoose');

var AlertSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 20,
        trim: true
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
});

AlertSchema.index({userId: 1, text: 1}, {unique: true});

var Alert = mongoose.model('Alert', AlertSchema);

module.exports = { Alert };