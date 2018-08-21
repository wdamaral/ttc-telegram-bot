var mongoose = require('mongoose');

var AlertSchema = new mongoose.Schema({
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

var getAllAlerts = (userId) => {
    return Alert.find({userId}).exec();
}

var Alert = mongoose.model('Alert', AlertSchema);

module.exports = { Alert, getAllAlerts };