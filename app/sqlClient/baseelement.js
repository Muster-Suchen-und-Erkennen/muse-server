/**
 * Created by michaelfalkenthal on 14.07.14.
 */
'use strict';
var pool = require('./databaseConnectionPool').pool;
var logger = require("../util/logger");
var config = require('./databaseConnectionPool').config;
var systemConfig = require('../config/configurationValues').systemConfig;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');
var primitiveAPI = require('./primitive');

var protocol = systemConfig.protocol;
var port = systemConfig.port;
var route = systemConfig.route;
var routeEnding = systemConfig.routeEnding;


function createBaseelement(filmId, roleId, costumeId, newBaseelement) {
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('INSERT INTO ??.?? SET ?', [config.db, 'Basiselement', {Basiselementname: newBaseelement.Basiselementname}], function (err, result) {
                conn.release();
                if(!err){
                    newBaseelement.BasiselementID = result.insertId;
                    updateBaseelementMappings(newBaseelement).then(function(result){
                        mapBasiselementToCostume(filmId, roleId, costumeId, newBaseelement.BasiselementID).then(function(result){
                            deferred.resolve(newBaseelement);
                        }).catch(function (reason) {
                            deferred.reject(reason);
                            logger.error(reason);
                        });
                    }).catch(function (reason) {
                        deferred.reject(reason);
                        logger.error(reason);
                    });
                }else{
                    deferred.reject(err);
                    logger.error(err);
                }
            });
        }else{
            deferred.reject(err);
            logger.error(err);
        }
    });
    return deferred.promise;
}

function loadBaseelement(baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, 'Basiselement', 'BasiselementID', baseelementId], function(err, result){
                conn.release();
                if(!err){
                    if(result.length > 0){
                        var baseelement = result[0];
                        Q.all([
                            loadBaseelementMapping('BasiselementDesign', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementFarbe', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementForm', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementMaterial', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementTrageweise', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementZustand', baseelement.BasiselementID),
                            loadBaseelementMapping('BasiselementFunktion', baseelement.BasiselementID),
                            loadBaseelementRelations(baseelement.BasiselementID)
                        ]).spread(function(designs, farben, formen, materialien, trageweisen, zustaende, funktionen, relationen){
                            Q.all([
                                resultUtils.extractValueList(designs, 'Designname'),
                                resultUtils.removeKeysFromValueList(['BasiselementID'], farben),
                                resultUtils.extractValueList(formen, 'Formname'),
                                resultUtils.removeKeysFromValueList(['BasiselementID'], materialien),
                                resultUtils.extractValueList(trageweisen, 'Trageweisename'),
                                resultUtils.extractValueList(zustaende, 'Zustandsname'),
                                resultUtils.extractValueList(funktionen, 'Funktionsname'),
                                loadPrimitivesOfBaseelement(baseelement.BasiselementID)
                            ]).spread(function(designs, farben, formen, materialien, trageweisen, zustaende, funktionen, teilelemente){
                                baseelement.BasiselementDesigns = designs;
                                baseelement.BasiselementFarben = farben;
                                baseelement.BasiselementFormen = formen;
                                baseelement.BasiselementMaterialien = materialien;
                                baseelement.BasiselementTrageweisen = trageweisen;
                                baseelement.BasiselementZustaende = zustaende;
                                baseelement.BasiselementFunktionen = funktionen;
                                baseelement.BasiselementRelationen = relationen;
                                baseelement.BasiselementTeilelemente = teilelemente;
                                deferred.resolve(baseelement);
                            }).catch(function(reason){
                                deferred.reject(reason);
                                logger.error(reason);
                            });
                        }).catch(function(reason){
                            deferred.reject(reason);
                            logger.error(reason);
                        });
                    }else{
                        deferred.reject(new Error('No Baseelement found with ID: ' + baseelementId));
                        logger.error('No Baseelement found with ID: ' + baseelementId);
                    }
                }else{
                    deferred.reject(err);
                    logger.error(err);
                }
            });
        }else{
            deferred.reject(err);
            logger.error(err);
        }
    });
    return deferred.promise;
}

function loadBaseelementForCostumeAggregations(baseelementId){
    var deferred = Q.defer();
    Q.all([
        loadBaseelementMapping('BasiselementFarbe', baseelementId),
        loadBaseelementMapping('BasiselementFunktion', baseelementId),
        loadBaseelementMapping('BasiselementZustand', baseelementId)
    ]).spread(function (colours, functions, status) {
        Q.all([
            resultUtils.removeKeysFromValueList(['BasiselementID'], colours),
            resultUtils.extractValueList(functions, 'Funktionsname'),
            resultUtils.extractValueList(status, 'Zustandsname')
        ]).spread(function (colours, functions, status) {
            var baseelement = {};
            baseelement.BasiselementID = baseelementId;
            baseelement.BasiselementFarben = colours;
            baseelement.BasiselementFunktionen = functions;
            baseelement.BasiselementZustaende = status;
            deferred.resolve(baseelement);
        })
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });

    return deferred.promise;
}

function updateBaseelement(baseelement) {
    var deferred = Q.defer();
    Q.all([
        updateBaseelementMainTable(baseelement),
        updateExistingBaseelementMappings(baseelement)
    ]).then(function (result) {
        deferred.resolve(baseelement);
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function updateBaseelementMainTable(baseelement){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('UPDATE ??.?? SET ? WHERE ?? = ?', [config.db, 'Basiselement', {Basiselementname: baseelement.Basiselementname}, 'BasiselementID', baseelement.BasiselementID], function(err, result){
                conn.release();
                deferred.resolve(result);
            });
        }else{
            deferred.reject(err);
            logger.error(err);
        }
    });
    return deferred.promise;
}

function deleteBaseelement(baseelementId){
    var deferred = Q.defer();
    deletePrimitivesOfBaseelement(baseelementId).then(function (result) {
        deleteBaseelementMappings(baseelementId).then(function (result) {
            unmapBasiselementFromCostume(baseelementId).then(function (result) {
                pool.getConnection(function(err, conn){
                    conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, 'Basiselement', 'BasiselementID', baseelementId], function(err, result){
                        conn.release();
                        if(!err){
                            deferred.resolve('Baseelement successfully deleted!');
                        }else{
                            deferred.reject(err);
                        }
                    });
                });
            }).catch(function (reason) {
                deferred.reject(reason);
                logger.error(reason);
            });
        }).catch(function (reason) {
            deferred.reject(reason);
            logger.error(reason);
        });
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function loadBaseelementMapping(mappingTbl, baseelementId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, mappingTbl, 'BasiselementID', baseelementId], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                    logger.error(err);
                }
            });
        }else{
            deferred.reject(err);
            logger.error(err);
        }
    });
    return deferred.promise;
}

function deleteBaseelementMappings(baseelementId) {
    var deferred = Q.defer();
    var basiselement = {};
    basiselement.BasiselementID = baseelementId;
    basiselement.BasiselementDesigns = [];
    basiselement.BasiselementFarben = [];
    basiselement.BasiselementFormen = [];
    basiselement.BasiselementFunktionen = [];
    basiselement.BasiselementMaterialien = [];
    basiselement.BasiselementRelationen = [];
    basiselement.BasiselementTeilelemente = [];
    basiselement.BasiselementTrageweisen = [];
    basiselement.BasiselementZustaende = [];
    updateBaseelementMappings(basiselement).then(function (result) {
        deferred.resolve(result);
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function updateExistingBaseelementMappings(baseelement){
    var deferred = Q.defer();
    Q.all([
        genericUtils.updateElementMappings('BasiselementDesign', 'Designname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementDesigns),
        genericUtils.updateElementMappings('BasiselementForm', 'Formname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFormen),
        genericUtils.updateElementMappings('BasiselementTrageweise', 'Trageweisename','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementTrageweisen),
        genericUtils.updateElementMappings('BasiselementZustand', 'Zustandsname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementZustaende),
        genericUtils.updateElementMappings('BasiselementFunktion', 'Funktionsname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFunktionen),
        genericUtils.updateElementTripleMappings('BasiselementFarbe', 'BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFarben),
        genericUtils.updateElementTripleMappings('BasiselementMaterial', 'BasiselementID', baseelement.BasiselementID, baseelement.BasiselementMaterialien)
    ]).then(function (result) {
        deferred.resolve(baseelement);
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function updateBaseelementMappings(baseelement){
    var deferred = Q.defer();
    Q.all([
        genericUtils.updateElementMappings('BasiselementDesign', 'Designname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementDesigns),
        genericUtils.updateElementMappings('BasiselementForm', 'Formname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFormen),
        genericUtils.updateElementMappings('BasiselementTrageweise', 'Trageweisename','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementTrageweisen),
        genericUtils.updateElementMappings('BasiselementZustand', 'Zustandsname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementZustaende),
        genericUtils.updateElementMappings('BasiselementFunktion', 'Funktionsname','BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFunktionen),
        genericUtils.updateElementTripleMappings('BasiselementFarbe', 'BasiselementID', baseelement.BasiselementID, baseelement.BasiselementFarben),
        genericUtils.updateElementTripleMappings('BasiselementMaterial', 'BasiselementID', baseelement.BasiselementID, baseelement.BasiselementMaterialien),
        genericUtils.updateElementRelationMappings('BasiselementRelation', 'SubjektBasiselement', 'ObjektBasiselement', baseelement.BasiselementID, baseelement.BasiselementRelationen)
    ]).then(function (result) {
        deferred.resolve(baseelement);
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function loadBaseelementRelations(baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ? OR ?? = ?', [config.db, 'BasiselementRelation', 'SubjektBasiselement', baseelementId, 'ObjektBasiselement', baseelementId], function(err, result){
                conn.release();
                deferred.resolve(result);
            });
        }else{
            deferred.reject(err);
            logger.error(err);
        }
    });
    return deferred.promise;
}

function deletePrimitivesOfBaseelement(baseelementId){
    var deferred = Q.defer();
    loadPrimitiveIdsOfBaseelement(baseelementId).then(function (result) {
        if(result.length === 0){
            deferred.resolve('All primitives deleted of baseelement: ' + baseelementId);
        }else{
            var promises = [];
            var counter = 0;
            result.forEach(function (primitive) {
                promises.push(primitiveAPI.deletePrimitive(primitive.TeilelementID));
                counter++;
                if(counter === result.length){
                    Q.all(promises).then(function (result) {
                        deferred.resolve(result);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                        logger.error(reason);
                    })
                }
            });
        }
    }).catch(function (reason) {
        deferred.reject(reason);
        logger.error(reason);
    });
    return deferred.promise;
}

function loadPrimitiveIdsOfBaseelement(baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ?', ['TeilelementID', config.db, 'BasiselementTeilelement', 'BasiselementID', baseelementId], function(err, result){
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(new Error(err));
                }
            });
        }else{
            deferred.reject(new Error(err));
            logger.error(err);
        }
    });
    return deferred.promise;
}

function loadPrimitivesOfBaseelement(baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ?? FROM ??.?? WHERE ?? = ?', ['TeilelementID', config.db, 'BasiselementTeilelement', 'BasiselementID', baseelementId], function(err, result){
                conn.release();
                if(!err){
                    var counter = 0;
                    if(result.length > 0){
                        var promises = [];
                        result.forEach(function(primitive, index){
                            promises.splice(index, 0, primitiveAPI.loadPrimitive(primitive.TeilelementID));
                            counter++;
                            if(counter === result.length){
                                Q.all(promises).then(function(result){
                                    deferred.resolve(result);
                                }, function(reason){
                                    var err = new Error('Loading of Primitives failed due to: ' + reason.message)
                                    deferred.reject(err);
                                });
                            }
                        });
                    }else{
                        deferred.resolve([]);
                    }
                }else{
                    deferred.reject(new Error(err));
                }
            });
        }else{
            deferred.reject(new Error(err));
        }
    });
    return deferred.promise;
}

function mapBasiselementToCostume(filmId, roleId, costumeId, baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            var mapping = {
                FilmID: filmId,
                RollenID: roleId,
                KostuemID: costumeId,
                BasiselementID: baseelementId
            };
            conn.query('INSERT INTO ??.?? SET ?', [config.db, 'KostuemBasiselement', mapping], function(err, result){
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

function unmapBasiselementFromCostume(baseelementId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, 'KostuemBasiselement', 'BasiselementID', baseelementId], function(err, result){
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

function createBaseelementRelation(triple){
    var deferred = Q.defer();
    genericUtils.createElementTripleMapping('BasiselementRelation', triple).then(function(result){
        deferred.resolve(result);
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function deleteBaseelementRelation(triple){
    var deferred = Q.defer();
    genericUtils.deleteElementRelation('BasiselementRelation', 'SubjektBasiselement', 'PraedikatBasiselement', 'ObjektBasiselement', triple).then(function(result){
        deferred.resolve(result);
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function getEmptyRelations(){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if (!err) {
            conn.query('SELECT a.BasiselementID FROM ??.?? a LEFT JOIN ??.?? b ON a.BasiselementID = b.SubjektBasiselement LEFT JOIN ??.?? c on a.BasiselementID = c.ObjektBasiselement WHERE (b.SubjektBasiselement IS NULL AND c.ObjektBasiselement IS NULL ) '
                ,[config.db, 'Basiselement', config.db, 'BasiselementRelation', config.db, 'BasiselementRelation'  ] , function (err, result) {
                conn.release();
                if (!err) {
                    if (result.length === 0) {
                        deferred.reject({message: 'No empty Relations available'});
                    } else {
                        deferred.resolve(result);
                    }
                } else {
                    deferred.reject(err);
                }
            });
        } else {
            deferred.reject(err);
        }
    });
    return deferred.promise;
}



function loadThumb(basiselementId){
    var deferred = Q.defer();
    getBaseelementImageMapping(basiselementId).then( function (value){
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT ??,?? FROM ??.?? WHERE ?? = ? ', ['ImageThumb','ImageType', config.db , 'BasiselementImage', 'ImageID', JSON.stringify(value.ImageID)], function (err, result) {
                conn.release();
                if(!err){
                    if(result.length === 0){
                        deferred.reject({message:'No image with ID ' + basiselementId + ' available'});
                    }else{
                        var thumb = result[0];
                        thumb.ImageThumb = 'data:' + thumb.ImageType + ';base64,' +  thumb.ImageThumb.toString('base64');
                        deferred.resolve(thumb);
                    }
                }else{
                    deferred.reject(err);
                }
            });
        }else{
            deferred.reject(err);
        }
    });
    },function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

function loadFileName(basiselementId){
    var deferred = Q.defer();
    getBaseelementImageMapping(basiselementId).then( function (value){
        pool.getConnection(function (err, conn) {
            if(!err){
                conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? ', ['Filename', config.db , 'BasiselementImage', 'ImageID', JSON.stringify(value.ImageID)], function (err, result) {
                    conn.release();
                    if(!err){
                        if(result.length === 0){
                            deferred.reject({message:'No image with ID ' + basiselementId + ' available'});
                        }else{
                            var thumb = result[0];

                            deferred.resolve(thumb);
                        }
                    }else{
                        deferred.reject(err);
                    }
                });
            }else{
                deferred.reject(err);
            }
        });
    },function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

//Helper Class to get the ImageID of a baseelement

function getBaseelementImageMapping(basiselementId){
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
    if (!err) {
        conn.query('SELECT ?? FROM ??.?? WHERE ?? = ? ', ['ImageID', config.db, 'BasiselementDomaeneBasiselementImage', 'BasiselementID', basiselementId], function (err, result) {
            conn.release();
            if (!err) {
                if (result.length === 0) {
                    deferred.reject({message:'No image with ID ' + basiselementId + ' available'});
                } else {
                    deferred.resolve(result[0]);
                }
            } else {
                deferred.reject(err);
            }
        });
    } else {
        deferred.reject(err);
    }
    });
    return deferred.promise;
}


function loadImage(basiselementId){
    var deferred = Q.defer();

    getBaseelementImageMapping(basiselementId).then( function (value){
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT ??,?? FROM ??.?? WHERE ?? = ? ', ['ImageThumb','ImageType', config.db, 'BasiselementImage', 'ImageID', JSON.stringify(value.ImageID)], function(err, result){

                conn.release();
                if(!err){
                    if(result.length === 0){
                        deferred.reject({message:'No image with ID ' + basiselementId + ' available'});
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
,function (err) {
    deferred.reject(err);
});
return deferred.promise;
}


function getImageLink(basiselementId){
    var deferred = Q.defer();
    var link = protocol +config.host + ":" + port + route + basiselementId + routeEnding + "";
    var result ={
        "link": link
    };
    deferred.resolve(result);
    return deferred.promise;
}

module.exports.createBaseelement = createBaseelement;
module.exports.getEmptyRelations = getEmptyRelations;
module.exports.loadBaseelement = loadBaseelement;
module.exports.loadBaseelementForCostumeAggregations = loadBaseelementForCostumeAggregations;
module.exports.updateBaseelement = updateBaseelement;
module.exports.deleteBaseelement = deleteBaseelement;
module.exports.createBaseelementRelation = createBaseelementRelation;
module.exports.deleteBaseelementRelation = deleteBaseelementRelation;
module.exports.loadThumb = loadThumb;
module.exports.loadImage = loadImage;
module.exports.getImageLink = getImageLink;
module.exports.loadBaseelementImageFileName = loadFileName;