var mongoose = require('mongoose');

var TweetSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: String,
        required: true
    },
    tweetId: {
        type: String,
        required: true
    }
});

var Tweet = mongoose.model('Tweet', TweetSchema);

module.exports = { Tweet };