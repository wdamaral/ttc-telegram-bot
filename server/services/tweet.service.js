var { Tweet } = require('../models/tweet');
var {mongoose} = require('../db/mongoose');

var getAllTweets = () => {
    return Tweet.find()
        .then((tweets) => {
        return tweets; 
      }, (e) => {
        return e;
      });
}

var addTweet = (text, createdAt, tweetId) => {
    var tweet = new Tweet({
        text,
        createdAt,
        tweetId
    });

    return tweet.save().then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var deleteTweet = (tweetId) => {
    return Tweet.deleteOne({
        tweetId
    }).then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

module.exports = {
    getAllTweets,
    addTweet,
    deleteTweet
}