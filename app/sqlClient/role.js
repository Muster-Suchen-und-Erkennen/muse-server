/**
 * Created by michaelfalkenthal on 16.07.14.
 */
'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');
var costumeAPI = require('./costume');

function createRole(newRole) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? ORDER BY ?? desc LIMIT 1', ['RollenID', config.db, 'Rolle', 'FilmId', newRole.FilmID, 'RollenID'], function (err, result) {
                if (!err) {
                    var newId = 1;
                    if(result.length > 0){
                        newId = result[0].RollenID + 1;
                    }
                    console.log("NEW ROLE ID = " + newId);
                    newRole.RollenID = newId;
                    var dominantecharaktereigenschaften = newRole.DominanteCharaktereigenschaften;
                    var familienstaende = newRole.Familienstaende;
                    var sterotypen = newRole.Stereotypen;
                    delete newRole['DominanteCharaktereigenschaften'];
                    delete newRole['Familienstaende'];
                    delete newRole['RolleAlterseindruecke'];
                    delete newRole['RolleCharaktereigenschaften'];
                    delete newRole['Stereotypen'];
                    conn.query('INSERT INTO ??.?? SET ?', [config.db, 'Rolle', newRole], function (err, result) {
                        conn.release();
                        if (!err) {
                            newRole.DominanteCharaktereigenschaften = dominantecharaktereigenschaften;
                            newRole.Familienstaende = familienstaende;
                            newRole.Stereotypen = sterotypen;
                            updateAllRoleMappings(newRole).then(function (result) {
                                deferred.resolve(newRole);
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            });
                        } else {
                            console.log('ERROR AT CREATING ROLE');
                            console.log(JSON.stringify(err));
                            deferred.reject(err);
                        }
                    });
                } else {
                    console.log('ERROR AT CREATING ROLE');
                    console.log(JSON.stringify(err));
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

function loadRoleFlat(filmId, roleId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, 'Rolle', 'FilmID', filmId, 'RollenID', roleId], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length > 0){
                        var role = result[0];
                        Q.all([
                            loadRoleMappings('RolleFamilienstand', filmId, roleId),
                            loadRoleMappings('RolleDominanteCharaktereigenschaft', filmId, roleId),
                            loadRoleMappings('RolleStereotyp', filmId, roleId),
                            loadAggregationsFromCostumesOfRole(filmId, roleId)
                        ]).spread(function (familienstaende, dominantecharaktereigenschaften,stereotypen, aggregations) {
                            Q.all([
                                resultUtils.extractValueList(familienstaende, 'Familienstand'),
                                resultUtils.extractValueList(dominantecharaktereigenschaften, 'DominanteCharaktereigenschaft'),
                                resultUtils.extractValueList(stereotypen, 'Stereotyp')
                            ]).spread(function (familienstaende, dominantecharaktereigenschaften,stereotypen) {
                                role.RolleAlterseindruecke = aggregations.RolleAlterseindruecke;
                                role.RolleCharaktereigenschaften = aggregations.RolleCharaktereigenschaften;
                                role.DominanteCharaktereigenschaften = dominantecharaktereigenschaften;
                                role.Familienstaende = familienstaende;
                                role.Stereotypen = stereotypen;
                                deferred.resolve(role);
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            });
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        });
                    }else{
                        deferred.reject({message:'No role available with id ' + roleId + ' of film ' + filmId});
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

function updateRole(role) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var dominantecharaktereigenschaften = role.DominanteCharaktereigenschaften;
            var familienstaende = role.Familienstaende;
            var stereotypen = role.Stereotypen;
            delete role['DominanteCharaktereigenschaften'];
            delete role['Familienstaende'];
            delete role['RolleAlterseindruecke'];
            delete role['RolleCharaktereigenschaften'];
            delete role['Stereotypen'];
            conn.query('UPDATE ??.?? SET ? WHERE ?? = ? AND ?? = ?', [config.db, 'Rolle', role, 'FilmID', role.FilmID, 'RollenID', role.RollenID], function (err, result) {
                console.log("Rolle : " + JSON.stringify(role));
                conn.release();
                if(!err){
                    role.DominanteCharaktereigenschaften = dominantecharaktereigenschaften;
                    role.Familienstaende = familienstaende;
                    role.Stereotypen = stereotypen;
                    updateAllRoleMappings(role).then(function(result){
                        deferred.resolve(role);
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

function deleteRole(filmId, roleId) {
    var deferred = Q.defer();
    console.log('DELETE ' + filmId + ' ' + roleId);
    var promises = [];
    var counter = 0;
    loadCostumeIdsOfRole(filmId, roleId).then(function (costumeIdList) {
        if(costumeIdList.length > 0){
            costumeIdList.forEach(function (c) {
                promises.push(costumeAPI.deleteCostume(c.FilmID, c.RollenID, c.KostuemID));
                counter++;
                if(counter === costumeIdList.length){
                    promises.push(deleteAllRoleMappings('RolleFamilienstand', filmId, roleId));
                    promises.push(deleteAllRoleMappings('RolleDominanteCharaktereigenschaft', filmId, roleId));
                    promises.push(deleteAllRoleMappings('RolleStereotyp', filmId, roleId));
                    Q.all(promises).then(function (result) {
                        deleteRoleFromMainTable(filmId, roleId);
                        deferred.resolve('Role successfully deleted!');
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                }
            });
        }else{
            promises.push(deleteAllRoleMappings('RolleFamilienstand', filmId, roleId));
            promises.push(deleteAllRoleMappings('RolleDominanteCharaktereigenschaft', filmId, roleId));
            promises.push(deleteAllRoleMappings('RolleStereotyp', filmId, roleId));
            Q.all(promises).then(function (result) {
                deleteRoleFromMainTable(filmId, roleId).then(function (result) {
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

function deleteRoleFromMainTable(filmId, roleId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, 'Rolle', 'FilmID', filmId, 'RollenID', roleId], function (err, result) {
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

function loadAggregationsFromCostumesOfRole(filmId, roleId){
    var deferred = Q.defer();
    var aggregations = {};
    aggregations.RolleAlterseindruecke = [];
    aggregations.RolleCharaktereigenschaften = [];
    var promises = [];
    loadCostumeIdsOfRole(filmId, roleId).then(function (costumeIdsList) {
        if(costumeIdsList.length === 0){
            deferred.resolve(aggregations);
        }
        var counter = 0;
        costumeIdsList.forEach(function (c) {
            promises.push(costumeAPI.loadCostumeForRoleAggregations(c.FilmID, c.RollenID, c.KostuemID));
            counter++;
            if(counter === costumeIdsList.length){
                Q.all(promises).then(function (costumes) {
                    Q.all([
                        extractValuesFromCostumes(costumes, 'KostuemAlterseindruecke', 'Alterseindruck'),
                        extractValuesFromCostumes(costumes, 'KostuemCharaktereigenschaften')
                    ]).spread(function (alterseindruecke, charaktereigenschaften) {
                        aggregations.RolleAlterseindruecke = alterseindruecke;
                        aggregations.RolleCharaktereigenschaften = charaktereigenschaften;
                        deferred.resolve(aggregations);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    })
                }).catch(function (reason) {
                    deferred.reject(reason);
                });
            }
        })
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function extractValuesFromCostumes(costumes, valueFieldName, valueKey){
    var deferred = Q.defer();
    var values = [];
    var counter = 0;
    var promises = [];
    if(costumes.length === 0){
        deferred.resolve(values);
    }
    costumes.forEach(function (c) {
        promises.push(extractValuesFromCostume(c, valueFieldName, valueKey));
        counter++;
        if(counter === costumes.length){
            Q.all(promises).then(function (results) {
                values = Array.prototype.concat.apply([], results);
                deferred.resolve(values);
            }).catch(function (reason) {
                deferred.reject(reason);
            })
        }
    });
    return deferred.promise;
}

function extractValuesFromCostume(c, valueFieldName, valueKey){
    var deferred = Q.defer();
    var counter = 0;
    var values = [];
    if(c[valueFieldName].length === 0){
        deferred.resolve(values);
    }else{
        c[valueFieldName].forEach(function(v){
            values.push(valueKey ? v[valueKey] : v);
            counter++;
            if(counter === c[valueFieldName].length){
                deferred.resolve(values);
            }
        });
    }
    return deferred.promise;
}

function loadCostumeIdsOfRole(filmId, roleId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ??, ??, ?? FROM ??.?? WHERE ?? = ? AND ?? = ?',['FilmID', 'RollenID','KostuemID', config.db, 'Kostuem', 'FilmID', filmId, 'RollenID', roleId], function(err, result){
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



function updateAllRoleMappings(role){
    var deferred = Q.defer();
    Q.all([
        updateRoleMappings('RolleDominanteCharaktereigenschaft', 'DominanteCharaktereigenschaft', role.FilmID, role.RollenID, role.DominanteCharaktereigenschaften),
        updateRoleMappings('RolleFamilienstand', 'Familienstand', role.FilmID, role.RollenID, role.Familienstaende),
        updateRoleMappings('RolleStereotyp', 'Stereotyp', role.FilmID, role.RollenID, role.Stereotypen)
    ]).then(function (result) {
        deferred.resolve(role);
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function updateRoleMappings (mappingTbl, mappingField, filmId, roleId, mappingValues) {
    var deferred = Q.defer();
    deleteAllRoleMappings(mappingTbl, filmId, roleId).then(function (result) {
        var counter = 0;
        if(mappingValues.length === 0){
            deferred.resolve(mappingValues);
        }else{
            var promises = [];
            mappingValues.forEach(function (mappingValue) {
                promises.push(createRoleMapping(mappingTbl, mappingField, filmId, roleId, mappingValue));
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

function createRoleMapping (mappingTbl, mappingField, filmId, roleId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId
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

function loadRoleMappings(mappingTbl, filmId, roleId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, mappingTbl, 'FilmID', filmId, 'RollenID', roleId], function (err, result) {
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

function deleteAllRoleMappings (mappingTbl, filmId, roleId) {
    var deferred = Q.defer();

    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, mappingTbl, 'FilmID', filmId, 'RollenID', roleId], function (err, result) {
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

function loadCostumesOfRoleFlat(filmId, roleId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err) {
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ?', [config.db, 'Kostuem', 'FilmID', filmId, 'RollenID', roleId], function (err, result) {
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

function createScreenshot(filmId, roleId, data, thumbData, mimeType){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? AND ?? = ? ORDER BY ?? desc LIMIT 1', ['ScreenshotID', config.db,'RolleScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'ScreenshotID'], function(err, result){
                if(!err){
                    var newId = 1;
                    if(result.length > 0){
                        newId = result[0].ScreenshotID + 1;
                    }
                    var screenshot = {
                        RollenID: roleId,
                        FilmID: filmId,
                        ScreenshotID: newId,
                        Position: newId
                    };
                    conn.query('INSERT INTO ??.?? SET ?', [config.db, 'RolleScreenshot', screenshot], function(err, result){
                        if(!err){
                            conn.query('UPDATE ??.?? SET ? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'RolleScreenshot', {Screenshot: data, ScreenshotThumb: thumbData, ImageType: mimeType}, 'FilmID', filmId, 'RollenID', roleId, 'ScreenshotID', newId], function(err, result){
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
                            conn.release();
                            deferred.reject(err);
                        }
                    });
                }else {
                    console.log('ERROR AT CREATING SCREENSHOT');
                    console.log(JSON.stringify(err));
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

function loadScreenshotThumbs(filmId, roleId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ??, ??, ??, ??, ??, ?? FROM ??.?? WHERE ?? = ? AND ?? = ? ORDER BY ? asc', ['FilmID', 'RollenID', 'ScreenshotID', 'Position', 'ScreenshotThumb', 'ImageType', config.db, 'RolleScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'Position'], function(err, result){
                conn.release();
                if(!err){
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

function loadScreenshots(filmId, roleId){
    console.log('I AM HERE!');
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? ORDER BY ? asc', [config.db, 'RolleScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'Position'], function(err, result){
                conn.release();
                console.log(JSON.stringify(result));
                if(!err){
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

function loadScreenshot(filmId, rollenId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? ORDER BY ? asc', [config.db, 'RolleScreenshot', 'FilmID', filmId, 'RollenID', rollenId, 'ScreenshotID', screenshotId, 'Position'], function(err, result){
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

function deleteScreenshot(filmId, roleId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'RolleScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'ScreenshotID', screenshotId], function(err, result){
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

module.exports.createRole = createRole;
module.exports.loadRoleFlat = loadRoleFlat;
module.exports.updateRole = updateRole;
module.exports.deleteRole = deleteRole;
module.exports.loadCostumesOfRoleFlat = loadCostumesOfRoleFlat;
module.exports.createScreenshot = createScreenshot;
module.exports.loadScreenshots = loadScreenshots;
module.exports.loadScreenshotThumbs = loadScreenshotThumbs;
module.exports.loadScreenshot = loadScreenshot;
module.exports.deleteScreenshot = deleteScreenshot;