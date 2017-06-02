/**
 * Created by michaelfalkenthal on 11.07.14.
 */
'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');
var Q = require('q');

function createPrimitive(baseelementId, newPrimitive){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('INSERT INTO ??.?? SET ?', [config.db, 'Teilelement', {Teilelementname: newPrimitive.Teilelementname}], function (err, result) {
                conn.release();
                if(!err){
                    newPrimitive.TeilelementID = result.insertId;
                    updatePrimitiveMappings(newPrimitive).then(function(result){
                        //now assign new teilelement to its basiselement!
                        mapPrimitiveToBaseelement(baseelementId, newPrimitive.TeilelementID).then(function(result){
                            deferred.resolve(newPrimitive);
                        }).catch(function (reason) {
                            deferred.reject(reason);
                        });
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

function loadPrimitive(primitiveId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, 'Teilelement', 'TeilelementID', primitiveId], function(err, result){
                conn.release();
                if(!err){
                    if(result.length > 0){
                        var primitive = result[0];
                        Q.all([
                            loadPrimitiveMapping('TeilelementDesign', primitive.TeilelementID),
                            loadPrimitiveMapping('TeilelementFarbe', primitive.TeilelementID),
                            loadPrimitiveMapping('TeilelementForm', primitive.TeilelementID),
                            loadPrimitiveMapping('TeilelementMaterial', primitive.TeilelementID),
                            loadPrimitiveMapping('TeilelementTrageweise', primitive.TeilelementID),
                            loadPrimitiveMapping('TeilelementZustand', primitive.TeilelementID)
                        ]).spread(function(designs, farben, formen, materialien, trageweisen, zustaende){
                            Q.all([
                                resultUtils.extractValueList(designs, 'Designname'),
                                resultUtils.removeKeysFromValueList(['TeilelementID'], farben),
                                resultUtils.extractValueList(formen, 'Formname'),
                                resultUtils.removeKeysFromValueList(['TeilelementID'], materialien),
                                resultUtils.extractValueList(trageweisen, 'Trageweisename'),
                                resultUtils.extractValueList(zustaende, 'Zustandsname')
                            ]).spread(function(designs, farben, formen, materialien, trageweisen, zustaende){
                                primitive.TeilelementDesigns = designs;
                                primitive.TeilelementFarben = farben;
                                primitive.TeilelementFormen = formen;
                                primitive.TeilelementMaterialien = materialien;
                                primitive.TeilelementTrageweisen = trageweisen;
                                primitive.TeilelementZustaende = zustaende;
                                deferred.resolve(primitive);
                            }).catch(function(reason){
                                deferred.reject(new Error(reason));
                            });
                        });
                    }else{
                        deferred.reject(new Error('No primitive found with ID: ' + primitiveId));
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

function updatePrimitive(primitive){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('UPDATE ??.?? SET ? WHERE ?? = ?', [config.db, 'Teilelement', {Teilelementname: primitive.Teilelementname}, 'TeilelementID', primitive.TeilelementID], function(err, result){
                conn.release();
                if(!err){
                    updatePrimitiveMappings(primitive).then(function(result){
                        deferred.resolve(primitive);
                    }).catch(function(reason){
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

function deletePrimitive(primitiveId){
    var deferred = Q.defer();
    Q.all([
        genericUtils.deleteElementMappings('TeilelementDesign', 'TeilelementID', primitiveId),
        genericUtils.deleteElementMappings('TeilelementFarbe', 'TeilelementID', primitiveId),
        genericUtils.deleteElementMappings('TeilelementForm', 'TeilelementID', primitiveId),
        genericUtils.deleteElementMappings('TeilelementMaterial', 'TeilelementID', primitiveId),
        genericUtils.deleteElementMappings('TeilelementTrageweise', 'TeilelementID', primitiveId),
        genericUtils.deleteElementMappings('TeilelementZustand', 'TeilelementID', primitiveId)
    ]).then(function (result) {
        unmapPrimitiveFromBaseelement(primitiveId).then(function (result) {
            pool.getConnection(function(err, conn){
                if(!err){
                    conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, 'Teilelement', 'TeilelementID', primitiveId], function(err, result){
                        conn.release();
                        if(!err){
                            deferred.resolve('Primitive successfully deleted!');
                        }else{
                            deferred.reject(err);
                        }
                    });
                }else{
                    deferred.reject(err);
                }
            });
        }).catch(function (reason) {
            deferred.reject(reason);
        });
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function loadPrimitiveMapping(mappingTbl, primitiveId) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.?? WHERE ?? = ?', [config.db, mappingTbl, 'TeilelementID', primitiveId], function (err, result) {
                conn.release();
                deferred.resolve(result);
            });
        }else{
            deferred.reject(new Error(err));
        }
    });
    return deferred.promise;
}

function updatePrimitiveMappings(primitive){
    var deferred = Q.defer();
    Q.all([
        genericUtils.updateElementMappings('TeilelementDesign', 'Designname', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementDesigns),
        genericUtils.updateElementMappings('TeilelementForm', 'Formname', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementFormen),
        genericUtils.updateElementMappings('TeilelementTrageweise', 'Trageweisename', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementTrageweisen),
        genericUtils.updateElementMappings('TeilelementZustand', 'Zustandsname', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementZustaende),
        genericUtils.updateElementTripleMappings('TeilelementFarbe', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementFarben),
        genericUtils.updateElementTripleMappings('TeilelementMaterial', 'TeilelementID', primitive.TeilelementID, primitive.TeilelementMaterialien)
    ]).then(function(result){
        deferred.resolve(result);
    }).catch(function (reason) {
        deferred.reject(reason);
    });
    return deferred.promise;
}

function mapPrimitiveToBaseelement(baseelementId, primitiveId){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            var mapping = {
                BasiselementID: baseelementId,
                TeilelementID: primitiveId
            };
            conn.query('INSERT INTO ??.?? SET ?', [config.db, 'BasiselementTeilelement', mapping], function(err, result){
                conn.release();
                if(!err) {
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

function unmapPrimitiveFromBaseelement(primitiveId){
    var deferred = Q.defer();
    console.log('UNMAPPING PRIMITIVE FROM BASEELEMENT');
    pool.getConnection(function(err, conn){
        if(!err){
            var qry = conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, 'BasiselementTeilelement', 'TeilelementID', primitiveId], function(err, result){
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            });
            console.log(qry.sql);
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

module.exports.loadPrimitive = loadPrimitive;
module.exports.createPrimitive = createPrimitive;
module.exports.updatePrimitive = updatePrimitive;
module.exports.deletePrimitive = deletePrimitive;