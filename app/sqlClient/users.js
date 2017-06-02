/**
 * Created by simon on 30.07.2015.
 */
'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');



function loadLoginInformation(user) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [ config.db, "Users", 'User', user], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Login);
                    }
                    catch (Exception)
                    {
                        deferred.reject(err);
                    }
                    }else{
                        deferred.reject(err);
                    }


            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function createUser(user, pw, roles) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('INSERT INTO ??.?? SET ?', [ config.db, "Users",  {User: user, Login: pw}], function (err, result) {
                if(!err){
                    if (roles && roles.length>0) {
                        var promises = [];
                        roles.forEach(function (role) {
                            var p = Q.defer();
                            promises.push(p.promise);
                            conn.query('INSERT INTO ??.?? SET ?', [ config.db, "UserRoles",  {User: user, Role: role}], function (err, result) {
                                if (err) {
                                    p.reject(err);
                                } else {
                                    p.resolve(result);
                                }
                            });
                        });
                        Q.allSettled(promises).then(function (success) {
                            conn.release();
                            deferred.resolve(result);
                        });
                    } else {
                        conn.release();
                        deferred.resolve(result);
                    }
                }else{
                    conn.release();
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function deleteUser(user) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ?', [ config.db, "Users", "User",  user], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function updateLoginInformation(user, pw) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('UPDATE ??.?? SET ? WHERE ?? = ?', [ config.db, "Users",{Login: pw} ,'User', user], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}




/**
 * Load the list of all users (with roles as comma seperated string).
 *
 * @returns
 */
function loadUserList() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT Users.User, group_concat(ifnull(Role, 'User')) as Roles FROM ??.Users LEFT JOIN ??.UserRoles ON Users.User = UserRoles.User GROUP BY Users.User", [ config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

/**
 * Loads all roles of a user as a list.
 *
 * @param {string} user
 * @returns {Q.Promise<string[]>}
 */
function loadUserRoles(user) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT GROUP_CONCAT(ifnull(Role, 'User')) as Roles FROM ??.?? WHERE ?? = ?", [ config.db, "UserRoles", "User",  user], function (err, result) {
                conn.release();
                if(!err){
                    if (result[0].Roles) {
                        deferred.resolve(result[0].Roles.toString().split(','));
                    } else {
                        deferred.resolve(['User']);
                    }
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}


/**
 * Adds a role to the user.
 *
 * @param {string} user
 * @param {string} role
 * @returns
 */
function addUserRole(user, role) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('INSERT INTO ??.?? (??, ??) VALUES (?, ?)', [ config.db, "UserRoles", "User", "Role", user, role], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

/**
 * Removes a role from the user.
 *
 * @param {string} user
 * @param {string} role
 * @returns
 */
function removeUserRole(user, role) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ?', [ config.db, "UserRoles", "User", user, "Role", role], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

/**
 * Returns a boolean Promise, which is true, if the user has the role.
 *
 * @param {string} user
 * @param {string} role
 * @returns {Q.promise<boolean>}
 */
function hasUserRole(user, role) {
    return loadUserRoles(user).then(function (roles) {
        var hasRole = Q.defer();
        roles.forEach(function (userRole) {
            if (userRole === role) {
                hasRole.resolve(true);
                return hasRole.promise;
            }
        }, function (err) {
            hasRole.reject(err);
        });
        hasRole.resolve(false);
        return hasRole.promise;
    });
}

module.exports.loadLoginInformation = loadLoginInformation;
module.exports.createUser = createUser;
module.exports.deleteUser = deleteUser;
module.exports.updateLoginInformation = updateLoginInformation;
module.exports.loadUserList = loadUserList;
module.exports.loadUserRoles = loadUserRoles;
module.exports.addUserRole = addUserRole;
module.exports.removeUserRole = removeUserRole;
module.exports.hasUserRole = hasUserRole;
