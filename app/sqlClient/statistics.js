'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');

function numberOfFilms() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(FilmID) as Count FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default'", [ config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfCostumes() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(KostuemID) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.Kostuem ON F.FilmID = Kostuem.FilmID", [config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfCostumesPerFilm() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT avg(CostumeCount) as Count FROM (SELECT count(KostuemID) as CostumeCount FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.Kostuem ON F.FilmID = Kostuem.FilmID GROUP BY F.FilmID) as Costumes", [config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfBaseElements() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(BasiselementID) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID", [config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfBaseElementsPerCostume() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT avg(BasiselementCount) as Count FROM (SELECT Filmtitel, F.FilmID, RollenID, KostuemID, count(BasiselementID) as BasiselementCount FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID GROUP BY F.FilmID, RollenID, KostuemID) as BaseElements", [config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfPrimitives() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(TeilelementID) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementTeilelement ON KostuemBasiselement.BasiselementID = BasiselementTeilelement.BasiselementID", [config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfPrimitivesPerCostume() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT avg(TeilelementCount) as Count FROM (SELECT count(TeilelementID) as TeilelementCount FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementTeilelement ON KostuemBasiselement.BasiselementID = BasiselementTeilelement.BasiselementID GROUP BY F.FilmID, RollenID, KostuemBasiselement.KostuemID) as Teilemente", [config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function numberOfPrimitivesPerBaseElement() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT avg(TeilelementCount) as Count FROM (SELECT count(TeilelementID) as TeilelementCount FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementTeilelement ON KostuemBasiselement.BasiselementID = BasiselementTeilelement.BasiselementID GROUP BY F.FilmID, RollenID, KostuemBasiselement.KostuemID, KostuemBasiselement.BasiselementID) as Teilemente", [config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function colorsBaseElement() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(Farbname) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementFarbe ON KostuemBasiselement.BasiselementID = BasiselementFarbe.BasiselementID", [config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function colorsPrimitive() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(Farbname) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementTeilelement ON KostuemBasiselement.BasiselementID = BasiselementTeilelement.BasiselementID JOIN ??.TeilelementFarbe ON BasiselementTeilelement.TeilelementID = TeilelementFarbe.TeilelementID", [config.db, config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function materialsBaseElement() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(Materialname) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementMaterial ON KostuemBasiselement.BasiselementID = BasiselementMaterial.BasiselementID", [config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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


function materialsPrimitive() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT count(Materialname) as Count FROM (SELECT Filmtitel, FilmID FROM ??.Film WHERE Filmtitel != '1 Testfilm' AND Filmtitel != '000 Default') as F JOIN ??.KostuemBasiselement ON F.FilmID = KostuemBasiselement.FilmID JOIN ??.BasiselementTeilelement ON KostuemBasiselement.BasiselementID = BasiselementTeilelement.BasiselementID JOIN ??.TeilelementMaterial ON BasiselementTeilelement.TeilelementID = TeilelementMaterial.TeilelementID", [config.db, config.db, config.db, config.db], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0)
                    var x = result[0];
                    try{
                        deferred.resolve(x.Count);
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

module.exports.numberOfFilms = numberOfFilms;
module.exports.numberOfCostumes = numberOfCostumes;
module.exports.numberOfCostumesPerFilm = numberOfCostumesPerFilm;
module.exports.numberOfBaseElements = numberOfBaseElements;
module.exports.numberOfBaseElementsPerCostume = numberOfBaseElementsPerCostume;
module.exports.numberOfPrimitives = numberOfPrimitives;
module.exports.numberOfPrimitivesPerCostume = numberOfPrimitivesPerCostume;
module.exports.numberOfPrimitivesPerBaseElement = numberOfPrimitivesPerBaseElement;
module.exports.colorsBaseElement = colorsBaseElement;
module.exports.colorsPrimitive = colorsPrimitive;
module.exports.materialsBaseElement = materialsBaseElement;
module.exports.materialsPrimitive = materialsPrimitive;
