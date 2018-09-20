var { Tweet } = require('../models/tweet');
const moment = require('moment');
var { hasAnyNumber } = require('../utils/utils');

var getLastTweets = (affects, hours) => {
    let timeDif = moment().subtract(hours, 'hours');
    
    affects = affects.map((route) => {
        if(!hasAnyNumber(route)) {
            return new RegExp(route, 'i');
        }
        return route;
    });

    return Tweet.find({ 
            affects: { $in: affects },
            createdAt: {
                $gt: timeDif
            }
        })
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
            return doc;
        }, (e) => {
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
    getLastTweets,
    addTweet,
    deleteTweet
}