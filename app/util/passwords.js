
var bcrypt = require('bcrypt');
var q = require('q');

var saltRounds = 8;


/**
 * Uses the bcrypt algorithm to hash passwords securely
 *
 * @param {string} plaintextPassword
 * @returns {Promise<string>} the hashed password
 */
function hash_password(plaintextPassword) {
    var deferred = q.defer();
    bcrypt.hash(plaintextPassword, saltRounds, function(err, encrypted) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(encrypted);
        }
    });
    return deferred.promise;
}


/**
 * Compares a plaintext password securely to its bcrypt hash.
 *
 * @param {string} plaintextPassword
 * @param {string} passwordHash from database
 * @returns {Promise<boolean>} true if password is correct
 */
function compare_password(plaintextPassword, passwordHash){
    var deferred = q.defer();
    bcrypt.compare(plaintextPassword, passwordHash, function(err, success) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(success);
        }
    });
    return deferred.promise;
}

module.exports.hash_password = hash_password;
module.exports.compare_password = compare_password;