var { mongoose } = require('mongoose');

var { Alert } = require('../models/alert');
var { setFilterAffects } = require('../utils/utils');

var getAllAlerts = (userId) => {
    return Alert.find({
        userId
      }).then((alerts) => {
        return alerts; 
      }, (e) => {
        return e;
      });
}

var getAlertAffects = (userId) => {
    return Alert.find({
        userId
      }).then((alerts) => {
        let affects = [];
        alerts.forEach(alert => {
            affects.push(alert.text);
        });

        return affects;
      }, (e) => {
        return e;
      });
}

var addAlert = (userId, text) => {
    var alert = new Alert({
        userId,
        text
    });

    return alert.save().then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var deleteAlert = (userId, id) => {
    return Alert.deleteOne({
        userId,
        _id: id
    }).then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var getUsers = async (tweet) => {
    var allFilters = setFilterAffects(tweet);

    var affects = allFilters.map((filter) => {
        return new RegExp(filter, 'i');
    });

    var users = await Alert.find({ text: { $in: affects } }, (err, result) => {
            return result;
        }, (e) => {
            return e;
        });

    if(!users) {
        return [];
    }

    let uniqueUsers = [... new Set(users.map(item => item.userId))];
    return uniqueUsers;
}

module.exports = {
    getAllAlerts,
    addAlert,
    deleteAlert,
    getUsers,
    getAlertAffects
}


