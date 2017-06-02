/**
 * Created by michaelfalkenthal on 16.07.14.
 */
'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var logger = require("../util/logger");
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var baseelementAPI = require('./baseelement');

function indexFull() {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query("SELECT FilmID, RollenID, KostuemID FROM ??.KostuemBasiselement GROUP BY FilmID, RollenID, KostuemID", [ config.db], function (err, result) {
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

function createCostume(newCostume){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? AND ?? = ? ORDER BY ?? desc LIMIT 1', ['KostuemID', config.db,'Kostuem', 'FilmID', newCostume.FilmID, 'RollenID', newCostume.RollenID, 'KostuemID'], function (err, result) {
                if (!err) {
                    var newId = 1;
                    if(result.length > 0){
                        newId = result[0].KostuemID + 1;
                    }
                    var alterseindruecke = newCostume.KostuemAlterseindruecke;
                    var basiselemente = newCostume.KostuemBasiselemente;
                    var charaktereigenschaften = newCostume.KostuemCharaktereigenschaften;
                    var koerpermodifikationen = newCostume.KostuemKoerpermodifikationen;
                    var spielorte = newCostume.KostuemSpielorte;
                    var spielzeiten = newCostume.KostuemSpielzeiten;
                    var tageszeiten = newCostume.KostuemTageszeiten;
                    var timecodes = newCostume.KostuemTimecodes;
                    delete newCostume['KostuemAlterseindruecke'];
                    delete newCostume['KostuemBasiselemente'];
                    delete newCostume['KostuemCharaktereigenschaften'];
                    delete newCostume['KostuemFarben'];
                    delete newCostume['KostuemFunktionen'];
                    delete newCostume['KostuemKoerpermodifikationen'];
                    delete newCostume['KostuemSpielorte'];
                    delete newCostume['KostuemSpielzeiten'];
                    delete newCostume['KostuemTageszeiten'];
                    delete newCostume['KostuemTimecodes'];
                    delete newCostume['KostuemZustaende'];

                    logger.info("NEW COSTUME ID = " + newId);
                    newCostume.KostuemID = newId;
                    if (newCostume.DominanteFarbe === "") {
                        delete newCostume['DominanteFarbe'];
                    }
                    if (newCostume.DominanteFunktion === "") {
                        delete newCostume['DominanteFunktion'];
                    }
                    if (newCostume.DominanterZustand === "") {
                        delete newCostume['DominanterZustand'];
                    }
                    conn.query('INSERT INTO ??.?? SET ?', [config.db,'Kostuem', newCostume], function (err, result) {
                        conn.release();
                        if (!err) {
                            logger.info('NEW COSTUME CREATED IN DB');
                            newCostume['KostuemAlterseindruecke'] = alterseindruecke;
                            newCostume['KostuemBasiselemente'] = basiselemente;
                            newCostume['KostuemCharaktereigenschaften'] = charaktereigenschaften;
                            newCostume['KostuemKoerpermodifikationen'] = koerpermodifikationen;
                            newCostume['KostuemSpielorte'] = spielorte;
                            newCostume['KostuemSpielzeiten'] = spielzeiten;
                            newCostume['KostuemTageszeiten'] = tageszeiten;
                            newCostume['KostuemTimecodes'] = timecodes;
                            updateAllCostumeMappings(newCostume).then(function (result) {
                                deferred.resolve(newCostume);
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            });
                        } else {
                            logger.error('ERROR AT CREATING COSTUME');
                            logger.error(JSON.stringify(err));
                            deferred.reject(err);
                        }
                    });
                } else {
                    logger.error('ERROR AT CREATING COSTUME');
                    logger.error(JSON.stringify(err));
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



function loadCostumeFlat(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'Kostuem', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function (err, result) {
            conn.release();
            if (!err) {
                if (result.length > 0) {
                    var costume = result[0];
                    Q.all([
                        loadCostumeMapping('KostuemAlterseindruck', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemCharaktereigenschaft', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemKoerpermodifikation', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemSpielort', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemSpielzeit', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemTageszeit', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadCostumeMapping('KostuemTimecode', costume.FilmID, costume.RollenID, costume.KostuemID),
                        loadAggregationsFromBasiselementsOfCostume(costume.FilmID, costume.RollenID, costume.KostuemID)
                    ]).spread(function(alterseindruecke, charaktereigenschaften, koerpermodifikationen, spielorte, spielzeiten, tageszeiten, timecodes, aggregations){
                        Q.all([
                            resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], alterseindruecke),
                            resultUtils.extractValueList(charaktereigenschaften, 'Charaktereigenschaft'),
                            resultUtils.extractValueList(koerpermodifikationen, 'Koerpermodifikationname'),
                            resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], spielorte),
                            resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], spielzeiten),
                            resultUtils.extractValueList(tageszeiten, 'Tageszeit'),
                            buildTimecodes(timecodes)
                        ]).spread(function(alterseindruecke, charaktereigenschaften, koerpermodifikationen, spielorte, spielzeiten, tageszeiten, timecodes){
                            costume.KostuemAlterseindruecke = alterseindruecke;
                            costume.KostuemCharaktereigenschaften = charaktereigenschaften;
                            costume.KostuemFarben = aggregations.KostuemFarben;
                            costume.KostuemFunktionen = aggregations.KostuemFunktionen;
                            costume.KostuemKoerpermodifikationen = koerpermodifikationen;
                            costume.KostuemSpielorte = spielorte;
                            costume.KostuemSpielzeiten = spielzeiten;
                            costume.KostuemTageszeiten = tageszeiten;
                            costume.KostuemTimecodes = timecodes;
                            costume.KostuemZustaende = aggregations.KostuemZustaende;
                            deferred.resolve(costume);
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        })
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                } else {
                    var errObj = {
                        FilmID: filmId,
                        RollenID: roleId,
                        KostuemID: costumeId
                    };
                    deferred.reject(new Error('No costume found with ID: ' + JSON.stringify(errObj)));
                }
            } else {
                deferred.reject(err);
            }
        });
    });
    return deferred.promise;
}

function loadCostumeForRoleAggregations(filmId, roleId, costumeId){
    var deferred = Q.defer();
    Q.all([
        loadCostumeMapping('KostuemAlterseindruck', filmId, roleId, costumeId),
        loadCostumeMapping('KostuemCharaktereigenschaft', filmId, roleId, costumeId)
    ]).spread(function (alterseindruecke, charaktereigenschaften) {
        Q.all([
            resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], alterseindruecke),
            resultUtils.extractValueList(charaktereigenschaften, 'Charaktereigenschaft')
        ]).spread(function (alterseindruecke, charaktereigenschaften) {
            var costume = {};
            costume.FilmID = filmId;
            costume.RollenID = roleId;
            costume.KostuemID = costumeId;
            costume.KostuemAlterseindruecke = alterseindruecke;
            costume.KostuemCharaktereigenschaften = charaktereigenschaften;
            deferred.resolve(costume);
        }).catch(function (reason) {
            deferred.reject(reason);
        })
    }).catch(function (reason) {
        deferred.reject(reason);
    })
    return deferred.promise;
}

function loadAggregationsFromBasiselementsOfCostume(filmId, roleId, costumeId){
    var deferred = Q.defer();
    var aggregations = {};
    aggregations.KostuemFarben = [];
    aggregations.KostuemFunktionen = [];
    aggregations.KostuemZustaende = [];
    var promises = [];
    var counter = 0;
    loadBaseelementIdsOfCostume(filmId, roleId, costumeId).then(function (baseelementIdList) {
        if(baseelementIdList.length === 0){
            deferred.resolve(aggregations)
        }
        baseelementIdList.forEach(function (be) {
            promises.push(baseelementAPI.loadBaseelementForCostumeAggregations(be.BasiselementID));
            counter++;
            if(counter === baseelementIdList.length){
                Q.all(promises).then(function (baseelements) {
                    Q.all([
                        extractValuesFromBaseelements(baseelements, 'BasiselementFarben', 'Farbname'),
                        extractValuesFromBaseelements(baseelements, 'BasiselementFunktionen'),
                        extractValuesFromBaseelements(baseelements, 'BasiselementZustaende')
                    ]).spread(function (coloursFromBaseelements, functionsFromBaseelements, statusFromBaseelements) {
                        aggregations.KostuemFarben = coloursFromBaseelements;
                        aggregations.KostuemFunktionen = functionsFromBaseelements;
                        aggregations.KostuemZustaende = statusFromBaseelements;
                        deferred.resolve(aggregations);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    })
                }).catch(function (reason) {
                    deferred.reject(reason);
                });
            }
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}


function loadCostume(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'Kostuem', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function (err, result) {
                conn.release();
                if (!err) {
                    if (result.length > 0) {
                        var costume = result[0];
                        Q.all([
                            loadCostumeMapping('KostuemAlterseindruck', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemCharaktereigenschaft', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemKoerpermodifikation', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemSpielort', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemSpielzeit', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemTageszeit', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadCostumeMapping('KostuemTimecode', costume.FilmID, costume.RollenID, costume.KostuemID),
                            loadBaseelementsOfCostume(filmId, roleId, costumeId)
                        ]).spread(function(alterseindruecke, characktereigenschaften, koerpermodifikationen, spielorte, spielzeiten, tageszeiten, timecodes, baseelements){
                            Q.all([
                                resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], alterseindruecke),
                                resultUtils.extractValueList(characktereigenschaften, 'Charaktereigenschaft'),
                                resultUtils.extractValueList(koerpermodifikationen, 'Koerpermodifikationname'),
                                resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], spielorte),
                                resultUtils.removeKeysFromValueList(['FilmID', 'RollenID', 'KostuemID'], spielzeiten),
                                resultUtils.extractValueList(tageszeiten, 'Tageszeit'),
                                buildTimecodes(timecodes),
                                extractValuesFromBaseelements(baseelements, 'BasiselementFarben', 'Farbname'),
                                extractValuesFromBaseelements(baseelements, 'BasiselementFunktionen'),
                                extractValuesFromBaseelements(baseelements, 'BasiselementZustaende')
                            ]).spread(function(alterseindruecke, characktereigenschaften, koerpermodifikationen, spielorte, spielzeiten, tageszeiten, timecodes, coloursFromBaseelements, functionsFromBaseelements, statusFromBaseelements){
                                costume.KostuemAlterseindruecke = alterseindruecke;
                                costume.KostuemBasiselemente = baseelements;
                                costume.KostuemCharaktereigenschaften = characktereigenschaften;
                                costume.KostuemFarben = coloursFromBaseelements;
                                costume.KostuemFunktionen = functionsFromBaseelements;
                                costume.KostuemKoerpermodifikationen = koerpermodifikationen;
                                costume.KostuemSpielorte = spielorte;
                                costume.KostuemSpielzeiten = spielzeiten;
                                costume.KostuemTageszeiten = tageszeiten;
                                costume.KostuemTimecodes = timecodes;
                                costume.KostuemZustaende = statusFromBaseelements;
                                deferred.resolve(costume);
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            })
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        });
                    } else {
                        var errObj = {
                            FilmID: filmId,
                            RollenID: roleId,
                            KostuemID: costumeId
                        };
                        deferred.reject(new Error('No costume found with ID: ' + JSON.stringify(errObj)));
                    }
                } else {
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function extractValuesFromBaseelements(baseelements, valueFieldName, valueKey){
    var deferred = Q.defer();
    var values = [];
    var counter = 0;
    var promises = [];
    if(baseelements.length === 0){
        deferred.resolve(values);
    }
    baseelements.forEach(function (be) {
        promises.push(extractValuesFromBaseelement(be, valueFieldName, valueKey));
        counter++;
        if(counter === baseelements.length){
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

function extractValuesFromBaseelement(be, valueFieldName, valueKey){
    var deferred = Q.defer();
    var counter = 0;
    var values = [];
    if(be[valueFieldName].length === 0){
        deferred.resolve(values);
    }else{
        be[valueFieldName].forEach(function(v){
            values.push(valueKey ? v[valueKey] : v);
            counter++;
            if(counter === be[valueFieldName].length){
                deferred.resolve(values);
            }
        });
    }
    return deferred.promise;
}

function updateCostume(costume) {
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            var timecodes = costume.KostuemTimecodes;
            var basiselemente = costume.KostuemBasiselemente;
            var charaktereigenschaften = costume.KostuemCharaktereigenschaften;
            var koerpermodifikationen = costume.KostuemKoerpermodifikationen;
            var spielorte = costume.KostuemSpielorte;
            var spielzeiten = costume.KostuemSpielzeiten;
            var tageszeiten = costume.KostuemTageszeiten;
            var alterseindruecke = costume.KostuemAlterseindruecke;
            delete costume['KostuemTimecodes'];
            delete costume['KostuemBasiselemente'];
            delete costume['KostuemCharaktereigenschaften'];
            delete costume['KostuemFarben'];
            delete costume['KostuemFunktionen'];
            delete costume['KostuemKoerpermodifikationen'];
            delete costume['KostuemSpielorte'];
            delete costume['KostuemSpielzeiten'];
            delete costume['KostuemTageszeiten'];
            delete costume['KostuemZustaende'];
            delete costume['KostuemAlterseindruecke'];
            var filmId = costume.FilmID;
            delete costume['FilmID'];
            var roleId = costume.RollenID;
            delete costume['RollenID'];
            var costumeId = costume.KostuemID;
            delete costume['KostuemID'];

            conn.query('UPDATE ??.?? SET ? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'Kostuem', costume, 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function(err, result){
                conn.release();
                if(!err){
                    costume.FilmID = filmId;
                    costume.RollenID = roleId;
                    costume.KostuemID = costumeId;
                    costume['KostuemTimecodes'] = timecodes;
                    costume['KostuemBasiselemente'] = basiselemente;
                    costume['KostuemCharaktereigenschaften'] = charaktereigenschaften;
                    costume['KostuemKoerpermodifikationen'] = koerpermodifikationen;
                    costume['KostuemSpielorte'] = spielorte;
                    costume['KostuemSpielzeiten'] = spielzeiten;
                    costume['KostuemTageszeiten'] = tageszeiten;
                    costume['KostuemAlterseindruecke'] = alterseindruecke;
                    updateAllCostumeMappings(costume).then(function (result) {
                        deferred.resolve(costume);
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

function deleteCostume(filmId, roleId, costumeId) {
    var deferred = Q.defer();
    var promises = [];
    loadBaseelementIdsOfCostume(filmId, roleId, costumeId).then(function (result) {
        if(result.length > 0){
            var counter = 0;
            result.forEach(function(item){
                promises.push(baseelementAPI.deleteBaseelement(item.BasiselementID));
                counter++;
                if(counter === result.length){
                    Q.all(promises).then(function (result) {
                        Q.all([
                            deleteCostumeMappings('KostuemAlterseindruck', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemCharaktereigenschaft', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemKoerpermodifikation', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemSpielort', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemSpielzeit', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemTageszeit', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemTimecode', filmId, roleId, costumeId),
                            deleteCostumeMappings('KostuemScreenshot', filmId, roleId, costumeId)
                        ]).then(function (result) {
                            deleteCostumeFromMainTable(filmId, roleId, costumeId).then(function (result) {
                                deferred.resolve('Costume successfully deleted!');
                            }).catch(function (reason) {
                                deferred.reject(reason);
                            });
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        });
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    });
                }
            });
        }else{
            Q.all([
                deleteCostumeMappings('KostuemAlterseindruck', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemCharaktereigenschaft', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemKoerpermodifikation', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemSpielort', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemSpielzeit', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemTageszeit', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemTimecode', filmId, roleId, costumeId),
                deleteCostumeMappings('KostuemScreenshot', filmId, roleId, costumeId)
            ]).then(function (result) {
                deleteCostumeFromMainTable(filmId, roleId, costumeId).then(function (result) {
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

function deleteCostumeFromMainTable(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'Kostuem', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function (err, result) {
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

function updateAllCostumeMappings(costume){
    var deferred = Q.defer();
    Q.all([
        updateCostumeAlterseindruecke(costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemAlterseindruecke),
        updateCostumeMappings('KostuemCharaktereigenschaft', 'Charaktereigenschaft', costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemCharaktereigenschaften),
        updateCostumeMappings('KostuemKoerpermodifikation', 'Koerpermodifikationname', costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemKoerpermodifikationen),
        updateCostumeSpielorte(costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemSpielorte),
        updateCostumeSpielzeiten(costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemSpielzeiten),
        updateCostumeMappings('KostuemTageszeit', 'Tageszeit', costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemTageszeiten),
        updateCostumeTimecodes(costume.FilmID, costume.RollenID, costume.KostuemID, costume.KostuemTimecodes)
    ]).then(function (result) {
        deferred.resolve(costume);
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function updateCostumeMappings(mappingTbl, mappingField, filmId, roleId, costumeId, mappingValues){
    var deferred = Q.defer();
    deleteCostumeMappings(mappingTbl, filmId, roleId, costumeId).then(function(result) {
        var counter = 0;
        if(mappingValues.length === 0){
            deferred.resolve(mappingValues);
        }
        var promises = [];
        mappingValues.forEach(function(value){
            promises.push(createCostumeMapping(mappingTbl, mappingField, filmId, roleId, costumeId, value));
            counter++;
            if(counter === mappingValues.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                });
            }
        });
    }).catch(function(reason){
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createCostumeMapping(mappingTbl, mappingField, filmId, roleId, costumeId, mappingValue){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId
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

function deleteCostumeMappings(mappingTbl, filmId, roleId, costumeId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, mappingTbl, 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function (err, result) {
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



function buildTimecodes(rawTimecodes){
    var deferred = Q.defer();
    var counter = 0;
    var timecodes = [];
    if(rawTimecodes.length > 0){
        rawTimecodes.forEach(function(timecode, i){
            var timecodePair = {};
            var timecodeanfang = {};
            var timecodeende = {};
            var temp;
            temp = timecode['Timecodeanfang'].split(':');
            timecodeanfang.hours = temp[0];
            timecodeanfang.minutes = temp[1];
            timecodeanfang.seconds = temp[2];
            temp = timecode['Timecodeende'].split(':');
            timecodeende.hours = temp[0];
            timecodeende.minutes = temp[1];
            timecodeende.seconds = temp[2];

            timecodePair.Timecodeanfang = timecodeanfang;
            timecodePair.Timecodeende = timecodeende;
            timecodePair.id = i;

            timecodes.push(timecodePair);
            counter++;
            if(counter === rawTimecodes.length){
                deferred.resolve(timecodes);
            }
        });
    }else{
        deferred.resolve(timecodes);
    }
    return deferred.promise;
}

function loadCostumeMapping(mappingTbl, filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, mappingTbl, 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function (err, result) {
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

function loadBaseelementIdsOfCostume(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
       if(!err){
           conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? AND ?? = ? and ?? = ?', ['BasiselementID', config.db, 'KostuemBasiselement', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function(err, result) {
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

function loadBaseelementsOfCostume(filmId, roleId, costumeId) {
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? AND ?? = ? and ?? = ?', ['BasiselementID', config.db, 'KostuemBasiselement', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId], function(err, result){
                conn.release();
                //in result are all BasiselementIDs
                //für jede ID Basiselement laden --> async ist okay, Sortierung kann Client vornehmen
                var counter = 0;
                var basiselementList = [];
                if(result.length > 0){
                    var promises = [];
                    result.forEach(function(item){
                        promises.push(baseelementAPI.loadBaseelement(item.BasiselementID));
                        counter++;
                        if(counter === result.length){
                            Q.all(promises).then(function(result){
                                deferred.resolve(result);
                            }).catch(function(reason){
                                deferred.reject(reason);
                            });
                        }
                    });
                }else{
                    deferred.resolve(basiselementList);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function loadScreenshotThumbs(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ??, ??, ??, ??, ??, ?? FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? ORDER BY ? asc', ['FilmID', 'RollenID', 'KostuemID', 'ScreenshotID', 'Position', 'ScreenshotThumb', config.db, 'KostuemScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId, 'Position'], function(err, result){
                conn.release();
                if(!err){
                    if(result.length === 0){
                        deferred.resolve(result);
                    }else{
                        var counter = 0;
                        result.forEach(function(s){
                            if(s.ScreenshotThumb){
                                s.ScreenshotThumb = 'data:image/gif;base64,' + s.ScreenshotThumb.toString('base64');
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

function loadScreenshots(filmId, roleId, costumeId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? ORDER BY ? asc', [config.db, 'KostuemScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId, 'Position'], function(err, result){
                conn.release();
                if(!err){
                    if(result.length === 0){
                        deferred.resolve(result);
                    }else{
                        var counter = 0;
                        result.forEach(function(s){
                            if(s.Screenshot){
                                s.Screenshot = 'data:image/gif;base64,' + s.Screenshot.toString('base64');
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

function loadScreenshot(filmId, rollenId, kostuemId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? AND ?? = ? ORDER BY ? asc', [config.db, 'KostuemScreenshot', 'FilmID', filmId, 'RollenID', rollenId, 'KostuemID', kostuemId, 'ScreenshotID', screenshotId, 'Position'], function(err, result){
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

function createScreenshot(filmId, roleId, costumeId, data, thumbData, mimeType){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? ORDER BY ?? desc LIMIT 1', ['ScreenshotID', config.db,'KostuemScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId, 'ScreenshotID'], function(err, result){
                if(!err){
                    var newId = 1;
                    if(result.length > 0){
                        newId = result[0].ScreenshotID + 1;
                    }
                    var screenshot = {
                        KostuemID: costumeId,
                        RollenID: roleId,
                        FilmID: filmId,
                        ScreenshotID: newId,
                        Position: newId
                    };
                    conn.query('INSERT INTO ??.?? SET ?', [config.db, 'KostuemScreenshot', screenshot], function(err, result){
                        if(!err){
                            conn.query('UPDATE ??.?? SET ? WHERE ?? = ? AND ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'KostuemScreenshot', {Screenshot: data, ScreenshotThumb: thumbData, ImageType: mimeType}, 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId, 'ScreenshotID', newId], function(err, result){
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
                    logger.error('ERROR AT CREATING SCREENSHOT');
                    logger.error(JSON.stringify(err));
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

function deleteScreenshot(filmId, roleId, costumeId, screenshotId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ? AND ?? = ?', [config.db, 'KostuemScreenshot', 'FilmID', filmId, 'RollenID', roleId, 'KostuemID', costumeId, 'ScreenshotID', screenshotId], function(err, result){
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

function updateCostumeTimecodes(filmId, roleId, costumeId, timecodes){
    var deferred = Q.defer();
    deleteCostumeMappings('KostuemTimecode', filmId, roleId, costumeId).then(function (result) {
        var counter = 0;
        var errors = [];
        var results = [];
        if(timecodes.length === 0){
            deferred.resolve(timecodes);
        }
        var promises = [];
        timecodes.forEach(function(timecode){
            promises.push(createCostumeTimecodeMapping('KostuemTimecode', filmId, roleId, costumeId, timecode));
            counter++;
            if(counter === timecodes.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                })
            }
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createCostumeTimecodeMapping(mappingTbl, filmId, roleId, costumeId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId
            };
            mapping['Timecodeanfang'] = mappingValue.Timecodeanfang.hours + ':' + mappingValue.Timecodeanfang.minutes + ':' + mappingValue.Timecodeanfang.seconds;
            mapping['Timecodeende'] = mappingValue.Timecodeende.hours + ':' + mappingValue.Timecodeende.minutes + ':' + mappingValue.Timecodeende.seconds;
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

function updateCostumeSpielzeiten(filmId, roleId, costumeId, spielzeiten){
    var deferred = Q.defer();
    deleteCostumeMappings('KostuemSpielzeit', filmId, roleId, costumeId).then(function(result){
        var counter = 0;
        if(spielzeiten.length == 0){
            deferred.resolve(spielzeiten);
        }
        var promises = [];
        spielzeiten.forEach(function(spielzeit){
            promises.push(createCostumeSpielzeitMapping('KostuemSpielzeit', filmId, roleId, costumeId, spielzeit));
            counter++;
            if(counter === spielzeiten.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                });
            }
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createCostumeSpielzeitMapping(mappingTbl, filmId, roleId, costumeId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId
            };
            mapping['Spielzeit'] = mappingValue.Spielzeit;
            mapping['SpielzeitVon'] = mappingValue.SpielzeitVon;
            mapping['SpielzeitBis'] = mappingValue.SpielzeitBis;
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

function updateCostumeSpielorte(filmId, roleId, costumeId, spielorte){
    var deferred = Q.defer();
    deleteCostumeMappings('KostuemSpielort', filmId, roleId, costumeId).then(function(result){
        var counter = 0;
        if(spielorte.length === 0){
            deferred.resolve(spielorte);
        }
        var promises = [];
        spielorte.forEach(function(spielort){
            promises.push(createCostumeSpielortMapping('KostuemSpielort', filmId, roleId, costumeId, spielort));
            counter++;
            if(counter === spielorte.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                })
            }
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createCostumeSpielortMapping(mappingTbl, filmId, roleId, costumeId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId
            };
            mapping['Spielort'] = mappingValue.Spielort;
            mapping['SpielortDetail'] = mappingValue.SpielortDetail;
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

function updateCostumeAlterseindruecke(filmId, roleId, costumeId, alterseindruecke){
    var deferred = Q.defer();
    deleteCostumeMappings('KostuemAlterseindruck', filmId, roleId, costumeId).then(function(result){
        var counter = 0;
        if(alterseindruecke.length == 0){
            deferred.resolve(alterseindruecke)
        }
        var promises = [];
        alterseindruecke.forEach(function(alterseindruck){
            promises.push(createCostumeAlterseindruckMapping('KostuemAlterseindruck', filmId, roleId, costumeId, alterseindruck));
            counter++;
            if(counter === alterseindruecke.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                })
            }
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createCostumeAlterseindruckMapping(mappingTbl, filmId, roleId, costumeId, mappingValue) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId
            };
            mapping['Alterseindruck'] = mappingValue.Alterseindruck;
            mapping['NumAlter'] = mappingValue.NumAlter;
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

module.exports.indexFull = indexFull;
module.exports.loadCostume = loadCostume;
module.exports.loadCostumeFlat = loadCostumeFlat;
module.exports.loadCostumeForRoleAggregations = loadCostumeForRoleAggregations;
module.exports.createCostume = createCostume;
module.exports.updateCostume = updateCostume;
module.exports.deleteCostume = deleteCostume;
module.exports.loadBaseelementsOfCostume = loadBaseelementsOfCostume;
module.exports.createCostumeScreenshot = createScreenshot;
module.exports.loadCostumeScreenshots = loadScreenshots;
module.exports.loadCostumeScreenshot = loadScreenshot;
module.exports.loadCostumeScreenshotThumbs = loadScreenshotThumbs;
module.exports.deleteCostumeScreenshot = deleteScreenshot;
