
var encryption = require('./encryption');
var users = require('../sqlClient/users');
var pool = require('../sqlClient/databaseConnectionPool').pool;
var config = require('../sqlClient/databaseConnectionPool').config;
var Q = require('q');
var passwords = require('./passwords');


var userList = Q.defer();

pool.getConnection(function (err, conn) {
    if (err) {
        console.log('No connection to database.');
        userList.reject({message:'No connection to database.'});
        return;
    }
    conn.query('SELECT * FROM ??.??', [ config.db, "Users", 'User'], function (err, result) {
        conn.release();
        if (err) {
            console.log('Database connection failed.');
            userList.reject({message:'Database connection failed.'});
            return;
        }
        userList.resolve(result);
    });
});

userList.promise.then(function (userList) {
    var usersToProcess = userList.length;

    function checkFinish() {
        usersToProcess -= 1;
        if (usersToProcess <= 0) {
            console.log('\n----------------------------------------' +
                '\nFinished migrating users.');
        }
    }

    userList.forEach(function (user) {
        var encryptedName = user.User,
            encryptedPassword = user.Login,
            cleartextName = encryption.decrypt(encryptedName),
            cleartextPassword = encryption.decrypt(encryptedPassword),
            bcryptPassword = passwords.hash_password(cleartextPassword);

        bcryptPassword.then(function (bcryptPassword) {
            console.log('Updating User: \n' +
                'Username: "' + cleartextName + '"\n' +
                'Password: "' + cleartextPassword + '"\n' +
                'Old values: "' + encryptedName + '" "' + encryptedPassword + '"\n' +
                'New values: "' + cleartextName + '" "' + bcryptPassword + '"\n');
                users.deleteUser(encryptedName).then(function (result) {
                    var newUser = users.createUser(cleartextName, bcryptPassword);
                    newUser.then(function (result) {
                        console.log('User "' + cleartextName + '" successfully updated.');
                        users.loadLoginInformation(cleartextName).then(function (hash) {
                            passwords.compare_password(cleartextPassword, hash).then(function (success) {
                                if (success) {
                                    console.log('Successfully testet password for user "' + cleartextName + '"');
                                } else {
                                    console.log('Could not login user "' + cleartextName + '" with password "' + cleartextPassword + '"');
                                }
                                checkFinish();
                            }, function (err) {
                                console.log('Password check failed for user "' + cleartextName + '"');
                                checkFinish();
                            });
                        }, function (err) {
                            console.log('Could not load new login credentials for user "' + cleartextName + '" from database.');
                            checkFinish();
                        });
                    }, function (err) {
                        console.log('User "' + cleartextName + '" could not be created.');
                        checkFinish();
                    });

                }, function (err) {
                    console.log('User "' + cleartextName + '" could not be deleted.');
                    checkFinish();
                });
        });
    });
});

