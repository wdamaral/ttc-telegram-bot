const moment = require('moment');

var setFilterAffects = (tweet) => {
    var affects = [];
    var routes = tweet.substr(0, tweet.indexOf(':'));
    // console.log(routes);
    if (hasAnyNumber(routes)) {
        // console.log('has numbers');
        routes = routes.replace(/\/|,/g, ' ');
        routes = routes.split(' ');

        routes.forEach(route => {
            if (hasNumbers(route)) {
                affects.push(route);
            }
        });
    } else {
        affects.push(routes);
    }
    return affects;

}

var hasNumbers = (filter) => {
    return /\d+.?/.test(filter);
}

var hasAnyNumber = (filter) => {
    return /\d+/.test(filter);
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

    if (hasNumbers(userFilter)) {
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

var getMessageStep = (step) => {
    var message;
    switch (step) {
        case 1:
            message = 'I *promise to send you all notifications that TTC posts*, but to do it I need you to read some instructions.';
        break;
        case 2:
            message = `*Here they are:*\n*First*, If you type /start, below the typing box I'll show you a menu with some options.\nThey are simple and easy to follow.\nYou tell me what you need and I execute.`;
        break;
        case 3:
            message = `The options are:\n*1) 📢 Create alert*\nHere you will define *routes, stations and subways* you want to be alerted in case of any issue.\nI only understand the following pattern:\n_Route nnn_ where _'n'_ is a number. You *must* write _route_ or _line_ before a number. _Eg: Line 1, Line 2, Route 34, Route 24B._\n\nAfter you typed, I'll save it on me and check if there is any alert to send to you.\nI won't bother you with problems that you don't need to know. *Am I cool*?`;
        break;
        case 4:
            message = `*2) 🔍 Show MY alerts*\nHere I'll show you what alerts you asked me to create.\nEach one will be a button and if you click, I will remove the alert then I won't tell you anything about it anymore. *Easy, isn't it?*`;
        break;
        case 5:
            message = 
        `*3) 🔍 Show TTC alerts*\nAnother cool thing I provide to you.\nLet's say you want to see the alerts from the _last 15 hours_. Just type *15* and I show the alerts.\nI try to make it simple showing you some buttons. If you click on *<2*, I'll show you the alerts from the last 2 hours.\n💭 *Remember*, I'll only show you alerts that you asked me to create, ok?\n\n*That's it. Hope you like me!* ☺️`;
        break;
    
        default:
            break;
    }
    return message;
}
module.exports = {
    setFilterAffects,
    hasNumbers,
    sendLogMessage,
    createMessage,
    addDescription,
    getMessageStep
}