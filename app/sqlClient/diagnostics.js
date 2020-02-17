'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');

function rolesWithoutDominantCharacter() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT DISTINCT RollenID, FilmID FROM ??.Kostuem as K WHERE not exists(SELECT * FROM ??.RolleDominanteCharaktereigenschaft as R WHERE K.FilmID = R.FilmID and K.RollenID = R.RollenID) ORDER BY K.FilmID;", [ config.db], function (err, result) {
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

function costumesWithoutDominantColorOrState() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT KostuemID, RollenID, FilmID, DominanteFarbe, DominanterZustand FROM ??.Kostuem as K WHERE (K.DominanterZustand is null) or (K.DominanteFarbe is null);", [ config.db], function (err, result) {
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

function rolesWithoutStereotype() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT DISTINCT RollenID, FilmID FROM ??.Kostuem as K WHERE not exists(SELECT * FROM ??.RolleStereotyp as R WHERE K.FilmID = R.FilmID and K.RollenID = R.RollenID) ORDER BY K.FilmID;", [ config.db], function (err, result) {
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


module.exports.rolesWithoutDominantCharacter = rolesWithoutDominantCharacter;
module.exports.costumesWithoutDominantColorOrState = costumesWithoutDominantColorOrState;
module.exports.rolesWithoutStereotype = rolesWithoutStereotype;
