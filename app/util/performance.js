/*
 * performance test
 *
 * use: time node performance.js
 *
 * change passwords saltRounds variable so that this  runs in ~10s
 */

var passwords = require('./passwords');

var numberOfTries = 1250;

var numberOfFails = 0;
var testedPasswords = 0;

var plaintext = 'helloWorld$234567';


passwords.hash_password(plaintext).then(function (hash) {
    for (var i = 0; i<numberOfTries; i++) {
        passwords.compare_password(plaintext, hash).then(function (success) {
            if (!success) {
                numberOfFails ++;
                console.log('Number of Fails: ' + numberOfFails);
            }
        });
    }
});
