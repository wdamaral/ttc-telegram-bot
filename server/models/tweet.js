var mongoose = require('mongoose');

var TweetSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Number,
        required: true
    },
    tweetId: {
        type: Number,
        required: true
    }
});

var Tweet = mongoose.model('Tweet', TweetSchema);

module.exports = { Tweet };