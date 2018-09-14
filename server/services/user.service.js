var {
    mongoose
} = require('mongoose');
var moment = require('moment');

var {
    User
} = require('../models/user');

var addUser = (userId) => {
    var user = new User({
        userId
    });

    return user.save().then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var getUser = (userId) => {
    return User.findOneAndUpdate({userId}, {
        $set: {
            lastAccess: moment()
        }
    }).then((doc) => {
        return doc;
    }, (e) => {
        return e;
    });
}

var deleteUsers = () => {
    var hoursToDelete = 48;
    return User.deleteMany({
        lastAccess: {
            $lt: moment().subtract(hoursToDelete, 'hours')
        }
    }).then((docs) => {
        return docs;
    }, (e) => {
        return e;
    });
}

module.exports = {
    addUser,
    getUser,
    deleteUsers
}