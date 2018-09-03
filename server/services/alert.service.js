var { mongoose } = require('mongoose');

var { Alert } = require('../models/alert');
var { setFilterAffects, hasNumbers } = require('../utils/utils');

var getAllAlerts = (userId) => {
    return Alert.find({
        userId
      }).then((alerts) => {
        return alerts; 
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
    var arrayFilter = setFilterAffects(tweet);
    console.log(arrayFilter);

    if(!hasNumbers(arrayFilter.toString())) {
        arrayFilter = new RegExp(arrayFilter.toString(), 'i');
    }

    var users = await Alert.find({ text: { $in: arrayFilter } }, (err, result) => {
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

var addDescription = (userFilter) => {
    var description;

    if(!isNaN(userFilter * 1)) {
        switch (userFilter) {
            
            case '1':
            case '2':
            case '3':
                description = 'Line ' + userFilter;
                break;
        
            default:
                description = 'Route ' + userFilter;
                // console.log(description);
                break;
        }
    } else {
        description = userFilter;
    }
    return description;
}

module.exports = {
    getAllAlerts,
    addAlert,
    deleteAlert,
    getUsers,
    addDescription
}


