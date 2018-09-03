var setFilterAffects = (tweet) => {
    var affects = [];
    var routes = tweet.substr(0, tweet.indexOf(':'));
    
    if(hasNumbers(routes)) {
        routes = routes.replace(/\/|,/g, ' ');
        routes = routes.split(' ');

        affects = routes.filter((el) => {
            return el.length && el==+el;
        });
    } else {
        affects = routes;
    }
    return affects;

}

var hasNumbers = (filter) => {
    return /\d/.test(filter);
}

var sendLogMessage = (error) => {
    return `There was a problem on the bot\n${error.message}`;
  }

module.exports = { setFilterAffects, hasNumbers, sendLogMessage }