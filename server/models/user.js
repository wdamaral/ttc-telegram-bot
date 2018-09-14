var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
        unique: true
    },
    lastAccess: {
        type: Date,
        default: Date.now()
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = { User };