const moment = require('moment');

var setFilterAffects = (tweet) => {
    var affects = [];
    var routes = tweet.substr(0, tweet.indexOf(':'));
    
    if(hasNumbers(routes)) {
        routes = routes.replace(/\/|,/g, ' ');
        routes = routes.split(' ');

        routes.forEach(route => {
            if(hasNumbers(route)) {
                affects.push(route);
            }
        });
    } else {
        affects = routes;
    }
    return affects;

}

var hasNumbers = (filter) => {
    return /\d+.?/.test(filter);
}

var sendLogMessage = (error) => {
    return `There was a problem on the bot\n${error.message}`;
  }

  var createMessage = (myTweet) => {
    let message =  
`🚫 <strong>A new alert has been posted by TTC</strong>

💬 <strong>${myTweet.text.substr(0, myTweet.text.indexOf(':'))}:</strong> ${myTweet.text.substring(myTweet.text.indexOf(':') + 1)}
🕑 <strong>When:</strong> <i>${moment(myTweet.createdAt, 'x').format('LLL')}</i>`;

    return message;
  }


  var addDescription = (userFilter) => {
    var description;

    if(hasNumbers(userFilter)) {
        switch (userFilter) {
            
            case '1':
            case '2':
            case '3':
                description = 'Line ' + userFilter;
                break;
        
            default:
                description = 'Route ' + userFilter;
                break;
        }
    } else {
        description = userFilter;
    }
    return description;
}
module.exports = { setFilterAffects, hasNumbers, sendLogMessage, createMessage, addDescription }