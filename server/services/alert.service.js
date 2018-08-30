var { Alert } = require('../models/alert');
var {mongoose} = require('../db/mongoose');

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

module.exports = {
    getAllAlerts,
    addAlert,
    deleteAlert
}


