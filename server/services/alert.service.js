var { mongoose } = require('mongoose');

var { Alert } = require('../models/alert');
var { setFilterAffects, hasAnyNumber } = require('../utils/utils');
var { getUsersByIds } = require('./user.service');

var getAllAlerts = (_creator) => {
    return Alert.find({
        _creator
      }).then((alerts) => {
        return alerts; 
      }, (e) => {
        return e;
      });
}

var getAlertAffects = (_creator) => {
    return Alert.find({
        _creator
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

var addAlert = (_creator, text) => {
    var alert = new Alert({
        _creator,
        text
    });

    return alert.save().then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var deleteAlert = (_creator, id) => {
    return Alert.deleteOne({
        _creator,
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
        if(!hasAnyNumber(filter)) {
            return new RegExp(filter, 'i');
        } else {
            return filter;
        }
        
    });

    var creators = await Alert.find({ text: { $in: affects } }, (err, allCreators) => {
        // console.log(allUsers);
        //==NEED TO CORRECT THIS STEP
            return allCreators;
            // return ids;
        }, (e) => {
            return e;
        });
    let onlyIds = [... new Set(creators.map(item => item._creator))];
    // console.log(onlyIds);
    var users = await getUsersByIds(onlyIds);

    // console.log(users);

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


