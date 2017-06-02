'use strict';

var logger = require("../util/logger");
var q = require('q');
var passwords = require('../util/passwords');
var db = require('../sqlClient/mysqlclient').dbClient;


function genericError(rejected){
    res.status(500).send('Something went wrong. Please contact your system administrator.');
    logger.log(rejected);
}

function isAdmin(req, res) {
    var authToken = req.headers.authorization.split('Bearer ')[1];

    var requestingUser = req.user.username;

    return db.loadUserRoles(requestingUser).then(function (roles) {
        var isAdmin = q.defer();
        roles.forEach(function (role) {
            if (role === 'Admin') {
                isAdmin.resolve(true);
                return isAdmin.promise;
            }
        }, genericError);
        isAdmin.resolve(false);
        return isAdmin.promise;
    });
}

exports.index = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        if (isAdmin) {
            db.loadUserList().then(function (result) {
                res.status(200).send(result);
            }, function (err) {
                logger.log('Error while retrieving user list.');
            });
        } else {
            res.status(403).send('Only admins can see the user list.');
        }
    });
};

exports.getOwnRoles = function(req, res) {
    var authToken = req.headers.authorization.split('Bearer ')[1];

    var requestingUser = req.user.username;

    db.loadUserRoles(requestingUser).then(function (result) {
        res.status(200).send(result);
    }, function (err) {
        logger.log('Error while retrieving user roles.');
    });
};

exports.getUserRoles = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        if (isAdmin) {
            db.loadUserRoles(req.username).then(function (result) {
                res.status(200).send(result);
            }, function (err) {
                logger.log('Error while retrieving user roles.');
            });
        } else {
            res.status(403).send('Only admins can see the user roles.');
        }
    });
};

exports.createUser = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        var body = req.body;
        if (isAdmin) {
            passwords.hash_password(body.password).then(function (hash) {
                db.createUser(req.params.username, hash, body.roles).then(function (result) {
                    res.status(200).send();
                }, function (err) {
                    logger.log('Error while creating user.');
                    res.status(501).send('User could not be stored in database. Please contact your administrator.');
                });
            }, function (err) {
                logger.log('Error while hashing password.');
                res.status(501).send('Password could not be hashed. Please contact your administrator.');
            });
        } else {
            res.status(403).send('Only admins can create the users.');
        }
    });
};

exports.deleteUser = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        if (isAdmin) {
            var authToken = req.headers.authorization.split('Bearer ')[1];

            var requestingUser = req.user.username;

            if (req.params.username === requestingUser) {
                res.status(403).send('Admins can not delete their own account.');
                return;
            }
            db.deleteUser(req.params.username).then(function (result) {
                res.status(200).send();
            }, function (err) {
                logger.log('Error while deleting user.');
            });
        } else {
            res.status(403).send('Only admins can delete the users.');
        }
    });
};

exports.addUserRole = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        if (isAdmin) {
            var body = req.body;
            db.addUserRole(req.params.username, req.params.role).then(function (result) {
                res.status(200).send();
            }, function (err) {
                logger.log('Error while adding role to user.');
            });
        } else {
            res.status(403).send('Only admins can add roles to users.');
        }
    });
};

exports.removeUserRole = function(req, res) {
    isAdmin(req, res).then(function (isAdmin) {
        if (isAdmin) {
            var authToken = req.headers.authorization.split('Bearer ')[1];

            var requestingUser = req.user.username;

            if ((req.params.role === 'Admin') && (req.params.username === requestingUser)) {
                res.status(403).send('Admins can not revoke their own admin role.');
                return;
            }

            db.removeUserRole(req.params.username, req.params.role).then(function (result) {
                res.status(200).send();
            }, function (err) {
                logger.log('Error while adding role to user.');
            });
        } else {
            res.status(403).send('Only admins can add roles to users.');
        }
    });
};

