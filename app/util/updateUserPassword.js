/**
 * Created by no on 01.05.2016.
 */
var passwords = require('./passwords');
var users = require('../sqlClient/users');

var user = "";
var pw = "";


passwords.hash_password(pw).then(function (hash) {
    users.updateLoginInformation(user, hash);
    console.log("Operation performed. You can terminate this process now");
});
