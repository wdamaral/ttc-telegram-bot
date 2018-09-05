var { Tweet } = require('../models/tweet');

var getAllTweets = () => {
    return Tweet.find()
        .then((tweets) => {
        return tweets; 
      }, (e) => {
        return e;
      });
}

var addTweet = async (text, createdAt, tweetId, affects) => {
    if(!text.includes('@TTCnotices')) {
        var tweet = new Tweet({
            text,
            createdAt,
            tweetId,
            affects
        });

        return tweet.save().then((doc) => {
            // console.log(doc);
            return doc;
        }, (e) => {
            // console.log(e);
            return e;
        });
    }
    return;
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