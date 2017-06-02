/**
 * Created by michaelfalkenthal on 10.07.14.
 */
'use strict';

var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var resultUtils = require('./dbResultUtils');
var Q = require('q');
var roleAPI = require('./role');

function createFilm(film) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var genres = film.Genres;
            var produktionsorte = film.Produktionsorte;
            var farbkonzepte = film.Farbkonzepte;
            delete film['Farbkonzepte'];
            delete film['Produktionsorte'];
            delete film['Genres'];
            delete film['FilmID'];
            if (film.Erscheinungsjahr === '') {
                film.Erscheinungsjahr = 0;
            }
            conn.query('INSERT INTO ??.?? SET ?', [config.db, 'Film', film], function (err, result) {
                conn.release();
                if (!err) {
                    film.FilmID = result.insertId;
                    film.Genres = genres;
                    film.Produktionsorte = produktionsorte;
                    film.Farbkonzepte = farbkonzepte;
                    console.log('CREATING FILM MAPPINGS FOR NEW FILM ' + JSON.stringify(film));

                    updateAllFilmMappings(film).then(function (result) {
                        deferred.resolve(film);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                } else {
                    console.log('ERROR AT CREATING FILM');
                    console.log(JSON.stringify(err));
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function updateAllFilmMappings(film) {
    var deferred = Q.defer();
    Q.all([
        updateFilmMappings('FilmGenre', 'Genre', film.FilmID, film.Genres),
        updateFilmMappings('FilmFarbkonzept', 'Farbkonzept', film.FilmID, film.Farbkonzepte),
        updateFilmMappings('FilmProduktionsort', 'Produktionsort', film.FilmID, film.Produktionsorte)
    ]).then(function (result) {
        deferred.resolve('Film successfully created');
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;

}

function loadFilm(filmId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, 'Film', 'FilmID', filmId], function (err, result) {
                conn.release();
                if (!err) {
                    if (result.length > 0) {
                        var film = result[0];
                        Q.all([
                            loadFilmMappings('FilmGenre', film.FilmID),
                            loadFilmMappings('FilmFarbkonzept', film.FilmID),
                            loadFilmMappings('FilmProduktionsort', film.FilmID)
                        ]).spread(function(genres, farbkonzepte, produktionsorte){
                            Q.all([
                                resultUtils.extractValueList(genres, 'Genre'),
                                resultUtils.extractValueList(farbkonzepte, 'Farbkonzept'),
                                resultUtils.extractValueList(produktionsorte, 'Produktionsort')
                            ]).spread(function(genres, farbkonzepte, produktionsorte){
                                film.Genres = genres;
                                film.Farbkonzepte = farbkonzepte;
                                film.Produktionsorte = produktionsorte;
                                deferred.resolve(film);
                            });
                        });
                    } else {
                        deferred.reject(new Error('No film found with ID: ' + filmId));
                    }
                } else {
                    deferred.reject(new Error(err));
                }
            });
        }else{
            deferred.reject(new Error(err));
        }
    });
    return deferred.promise;
}

function updateFilm(film) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var genres = film.Genres;
            var produktionsorte = film.Produktionsorte;
            var farbkonzepte = film.Farbkonzepte;
            delete film['Farbkonzepte'];
            delete film['Produktionsorte'];
            delete film['Genres'];
            conn.query('UPDATE ??.?? SET ? WHERE `FilmID` = ?', [config.db, 'Film', film, film.FilmID], function (err, result) {
                conn.release();
                if(!err){
                    film.Genres = genres;
                    film.Produktionsorte = produktionsorte;
                    film.Farbkonzepte = farbkonzepte;
                    updateAllFilmMappings(film).then(function (result) {
                        deferred.resolve(film);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
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

function loadRoleIdsOfFilm(filmid){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ??, ?? FROM ??.?? WHERE ?? = ?', ['FilmID', 'RollenID', config.db, 'Rolle', 'FilmID', filmid], function(err, result){
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

function deleteFilm(filmId) {
    var deferred = Q.defer();

    loadRoleIdsOfFilm(filmId).then(function (roleIdsList) {
        var promises = [];
        var counter = 0;
        if(roleIdsList.length > 0){
            roleIdsList.forEach(function (r) {
                promises.push(roleAPI.deleteRole(r.FilmID, r.RollenID));
                counter++;
                if(counter === roleIdsList.length){
                    promises.push(deleteFilmMappings('FilmGenre', filmId));
                    promises.push(deleteFilmMappings('FilmProduktionsort', filmId));
                    promises.push(deleteFilmMappings('FilmFarbkonzept', filmId));
                    Q.all(promises).then(function (result) {
                        deleteFilmFromMainTable(filmId).then(function (result) {
                            deferred.resolve('Film successfully deleted!');
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        });
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                }
            });
        }else{
            promises.push(deleteFilmMappings('FilmGenre', filmId));
            promises.push(deleteFilmMappings('FilmProduktionsort', filmId));
            promises.push(deleteFilmMappings('FilmFarbkonzept', filmId));
            Q.all(promises).then(function (result) {
                deleteFilmFromMainTable(filmId).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                });
            }).catch(function (reason) {
                deferred.reject(reason);
            });
        }
    }).catch(function (reason) {
        deferred.reject(reason);
    });

    return deferred.promise;
}

function deleteFilmFromMainTable(filmId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.`Film` WHERE ?? = ?', [config.db, 'FilmID', filmId], function (err, result) {
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

function updateFilmMappings(mappingTbl, mappingField, filmId, mappingValues) {
    var deferred = Q.defer();
    deleteFilmMappings(mappingTbl, filmId).then(function (result) {
        var counter = 0;
        if(mappingValues.length === 0){
            deferred.resolve(mappingValues);
        }else{
            var promises = [];
            mappingValues.forEach(function (mappingValue) {
                promises.push(createFilmMapping(mappingTbl, mappingField, filmId, mappingValue));
                counter++;
                if(counter === mappingValues.length){
                    Q.all(promises).then(function (result) {
                        deferred.resolve(result);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                }
            });
        }
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createFilmMapping(mappingTbl, mappingField, filmId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId
            };
            mapping[mappingField] = mappingValue;
            conn.query('INSERT INTO ??.?? SET ?', [config.db, mappingTbl, mapping], function (err, result) {
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

function deleteFilmMappings(mappingTbl, filmId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, mappingTbl, 'FilmID', filmId], function (err, result) {
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

function loadFilmMappings(mappingTbl, filmId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, mappingTbl, 'FilmID', filmId], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(JSON.stringify(err));
                }
            });
        }else{
            deferred.reject(JSON.stringify(err));
        }
    });
    return deferred.promise;
}

function loadRolesOfFilmFlat(filmId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, 'Rolle', 'FilmID', filmId], function (err, roles) {
                conn.release();
                if(!err){
                    var counter = 0;
                    if(roles.length === 0){
                        deferred.resolve(roles)
                    }
                    var promises = [];
                    roles.forEach(function(role) {
                        promises.push(roleAPI.loadRoleFlat(role.FilmID, role.RollenID));
                        counter++;
                        if(counter === roles.length){
                            Q.all(promises).then(function (result) {
                                deferred.resolve(result);
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            })
                        }
                    });
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

function createScreenshot(filmId, data, thumbData, mimeType){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? ORDER BY ?? desc LIMIT 1', ['ScreenshotID', config.db,'FilmScreenshot', 'FilmID', filmId, 'ScreenshotID'], function(err, result){
                if(!err){
                    var newId = 1;
                    if(result.length > 0){
                        newId = result[0].ScreenshotID + 1;
                    }
                    var screenshot = {
                        FilmID: filmId,
                        ScreenshotID: newId,
                        Position: newId
                    };
                    conn.query('INSERT INTO ??.?? SET ?', [config.db, 'FilmScreenshot', screenshot], function(err, result){
                        if(!err){
                            conn.query('UPDATE ??.?? SET ? WHERE ?? = ? AND ?? = ?', [config.db, 'FilmScreenshot', {Screenshot: data, ScreenshotThumb: thumbData, ImageType: mimeType}, 'FilmID', filmId, 'ScreenshotID', newId], function(err, result){
                                conn.release();
                                if(!err){
                                    screenshot.ScreenshotThumb = 'data:' + mimeType + ';base64,' + thumbData.toString('base64');
                                    screenshot.Screenshot = null;
                                    deferred.resolve(screenshot);
                                }else{
                                    deferred.reject(err);
                                }
                            });
                        }else{
                            console.log('ERROR AT FIRST INSERTING!');
                            console.log(err.message);
                            conn.release();
                            deferred.reject(err);
                        }
                    });
                }else {
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

function loadScreenshotThumbs(filmId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ??, ??, ??, ??, ?? FROM ??.?? WHERE ?? = ? ORDER BY ? asc', ['FilmID', 'ScreenshotID', 'ScreenshotThumb', 'Position', 'ImageType', config.db, 'FilmScreenshot', 'FilmID', filmId, 'Position'], function(err, result){
                conn.release();
                if(result.length === 0){
                    deferred.resolve(result);
                }else{
                    var counter = 0;
                    result.forEach(function(s){
                        if(s.ScreenshotThumb){
                            s.ScreenshotThumb = 'data:' + s.ImageType + ';base64,' +  s.ScreenshotThumb.toString('base64');
                        }
                        s.Screenshot = null;
                        counter++;
                        if(counter === result.length){
                            deferred.resolve(result);
                        }
                    });
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function loadScreenshots(filmId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? ORDER BY ? asc', [config.db, 'FilmScreenshot', 'FilmID', filmId, 'Position'], function(err, result){
                conn.release();
                if(result.length === 0){
                    deferred.resolve(result);
                }else{
                    var counter = 0;
                    result.forEach(function(s){
                        if(s.Screenshot){
                            s.Screenshot = 'data:' + s.ImageType + ';base64,' +  s.Screenshot.toString('base64');
                        }
                        counter++;
                        if(counter === result.length){
                            deferred.resolve(result);
                        }
                    });
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function loadThumb(filmId, imgId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ??, ?? FROM ??.?? WHERE ?? = ? AND ?? = ?', ['ScreenshotThumb', 'ImageType',config.db , 'FilmScreenshot', 'FilmID', filmId, 'ScreenshotID', imgId], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length === 0){
                        deferred.reject({message:'No image with ID ' + imgId + ' available for film ' + filmId});
                    }else{
                        deferred.resolve(result[0]);
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

function loadScreenshot(filmId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? ORDER BY ? asc', [config.db, 'FilmScreenshot', 'FilmID', filmId, 'ScreenshotID', screenshotId, 'Position'], function(err, result){
                conn.release();
                if(result.length === 0){
                    deferred.resolve(result);
                }else{
                    var s = result[0];
                    if(s.Screenshot){
                        s.Screenshot = 'data:image/gif;base64,' +  s.Screenshot.toString('base64');
                    }
                    if(s.ScreenshotThumb){
                        s.ScreenshotThumb = 'data:image/gif;base64,' +  s.ScreenshotThumb.toString('base64');
                    }
                    deferred.resolve(s);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function deleteScreenshot(filmId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, 'FilmScreenshot', 'FilmID', filmId, 'ScreenshotID', screenshotId], function(err, result){
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

module.exports.createFilm = createFilm;
module.exports.loadFilm = loadFilm;
module.exports.updateFilm = updateFilm;
module.exports.deleteFilm = deleteFilm;
module.exports.loadRolesOfFilmFlat = loadRolesOfFilmFlat;
module.exports.createScreenshot = createScreenshot;
module.exports.loadScreenshots = loadScreenshots;
module.exports.loadScreenshot = loadScreenshot;
module.exports.loadScreenshotThumbs = loadScreenshotThumbs;
module.exports.deleteScreenshot = deleteScreenshot;
module.exports.loadThumb = loadThumb;
