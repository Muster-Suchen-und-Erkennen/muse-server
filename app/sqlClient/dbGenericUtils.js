/**
 * Created by michaelfalkenthal on 10.07.14.
 */
'use strict';

var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');

function loadAllFromTable(tbl) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.??', [config.db, tbl], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
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

function loadFieldFromTable(field, tbl) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
        conn.query('SELECT DISTINCT ?? FROM ??.??', [field, config.db, tbl], function (err, result) {
            conn.release();
            if(!err){
                deferred.resolve(result);
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

function loadKostuemRepoBackupInfo(){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
        var qry = '';
        qry += 'SELECT "AlterseindruckDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.AlterseindruckDomaene UNION ALL ';
        qry += 'SELECT "Basiselement" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.Basiselement UNION ALL ';
        qry += 'SELECT "BasiselementDesign" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementDesign UNION ALL ';
        qry += 'SELECT "BasiselementDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementDomaene UNION ALL ';
        qry += 'SELECT "BasiselementFarbe" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementFarbe UNION ALL ';
        qry += 'SELECT "BasiselementForm" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementForm UNION ALL ';
        qry += 'SELECT "BasiselementFunktion" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementFunktion UNION ALL ';
        qry += 'SELECT "BasiselementMaterial" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementMaterial UNION ALL ';
        qry += 'SELECT "BasiselementRelation" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementRelation UNION ALL ';
        qry += 'SELECT "BasiselementTeilelement" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementTeilelement UNION ALL ';
        qry += 'SELECT "BasiselementTrageweise" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementTrageweise UNION ALL ';
        qry += 'SELECT "BasiselementZustand" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.BasiselementZustand UNION ALL ';
        qry += 'SELECT "CharaktereigenschaftsDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.CharaktereigenschaftsDomaene UNION ALL ';
        qry += 'SELECT "DesignDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.DesignDomaene UNION ALL ';
        qry += 'SELECT "FarbenDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FarbenDomaene UNION ALL ';
        qry += 'SELECT "FarbkonzeptDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FarbkonzeptDomaene UNION ALL ';
        qry += 'SELECT "Film" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.Film UNION ALL ';
        qry += 'SELECT "FilmFarbkonzept" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FilmFarbkonzept UNION ALL ';
        qry += 'SELECT "FilmGenre" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FilmGenre UNION ALL ';
        qry += 'SELECT "FilmProduktionsort" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FilmProduktionsort UNION ALL ';
        qry += 'SELECT "FilmScreenshot" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FilmScreenshot UNION ALL ';
        qry += 'SELECT "FormenDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FormenDomaene UNION ALL ';
        qry += 'SELECT "FunktionsDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.FunktionsDomaene UNION ALL ';
        qry += 'SELECT "GenreDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.GenreDomaene UNION ALL ';
        qry += 'SELECT "KoerpermodifikationsDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KoerpermodifikationsDomaene UNION ALL ';
        qry += 'SELECT "KoerperteilDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KoerperteilDomaene UNION ALL ';
        qry += 'SELECT "Kostuem" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.Kostuem UNION ALL ';
        qry += 'SELECT "KostuemAlterseindruck" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemAlterseindruck UNION ALL ';
        qry += 'SELECT "KostuemBasiselement" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemBasiselement UNION ALL ';
        qry += 'SELECT "KostuemCharaktereigenschaft" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemCharaktereigenschaft UNION ALL ';
        qry += 'SELECT "KostuemKoerpermodifikation" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemKoerpermodifikation UNION ALL ';
        qry += 'SELECT "KostuemScreenshot" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemScreenshot UNION ALL ';
        qry += 'SELECT "KostuemSpielort" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemSpielort UNION ALL ';
        qry += 'SELECT "KostuemSpielzeit" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemSpielzeit UNION ALL ';
        qry += 'SELECT "KostuemTageszeit" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemTageszeit UNION ALL ';
        qry += 'SELECT "KostuemTimecode" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.KostuemTimecode UNION ALL ';
        qry += 'SELECT "MaterialDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.MaterialDomaene UNION ALL ';
        qry += 'SELECT "OperatorDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.OperatorDomaene UNION ALL ';
        qry += 'SELECT "ProduktionsortDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.ProduktionsortDomaene UNION ALL ';
        qry += 'SELECT "Rolle" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.Rolle UNION ALL ';
        qry += 'SELECT "RolleDominanteCharaktereigenschaft" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.RolleDominanteCharaktereigenschaft UNION ALL ';
        qry += 'SELECT "RolleFamilienstand" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.RolleFamilienstand UNION ALL ';
        qry += 'SELECT "RolleScreenshot" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.RolleScreenshot UNION ALL ';
        qry += 'SELECT "SpielortDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.SpielortDomaene UNION ALL ';
        qry += 'SELECT "SpielzeitDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.SpielzeitDomaene UNION ALL ';
        qry += 'SELECT "TageszeitDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TageszeitDomaene UNION ALL ';
        qry += 'SELECT "Teilelement" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.Teilelement UNION ALL ';
        qry += 'SELECT "TeilelementDesign" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementDesign UNION ALL ';
        qry += 'SELECT "TeilelementDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementDomaene UNION ALL ';
        qry += 'SELECT "TeilelementFarbe" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementFarbe UNION ALL ';
        qry += 'SELECT "TeilelementForm" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementForm UNION ALL ';
        qry += 'SELECT "TeilelementMaterial" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementMaterial UNION ALL ';
        qry += 'SELECT "TeilelementTrageweise" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementTrageweise UNION ALL ';
        qry += 'SELECT "TeilelementZustand" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TeilelementZustand UNION ALL ';
        qry += 'SELECT "TrageweisenDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TrageweisenDomaene UNION ALL ';
        qry += 'SELECT "TypusDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.TypusDomaene UNION ALL ';
        qry += 'SELECT "ZustandsDomaene" as TableName, COUNT(*) as RowCount FROM ' + config.db + '.ZustandsDomaene;';
        conn.query(qry, function(err, result){
            conn.release();
            if(!err){
                deferred.resolve(result);
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

function loadTaxonomy(tbl) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.??', [config.db, tbl], function (err, result) {
                conn.release();
                if(!err){
                    deferred.resolve(result);
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

function loadTaxonomyTree(tbl, mainColName, subColName, rootName) {
    var deferred = Q.defer();
    pool.getConnection(function (err, conn) {
        if(!err){
            conn.query('SELECT * FROM ??.??', [config.db, tbl], function (err, result) {
                conn.release();
                if(!err){
                    var items = {};
                    var children = {};
                    var counter = 0;
                    result.forEach(function(value){
                        if(value[mainColName] !== '') {
                            // Kind speichern
                            items[value[mainColName]] = items[value[mainColName]] || {id: value[mainColName], label: value[mainColName], children: []};

                            if(value[subColName] !== ''){
                                // Vater speichern
                                if (!items[value[subColName]]) {
                                    items[value[subColName]] = { id: value[subColName],label: value[subColName],children: []};

                                }
                            }
                        }
                        counter++;
                        if(counter === result.length){
                            var counter2 = 0;
                            result.forEach(function(value){
                                if(value[subColName] !== ''){
                                    // Kinder den Vätern zuordnen
                                    items[value[subColName]].children.push(items[value[mainColName]]);
                                }
                                counter2++;
                                if(counter2 === result.length){
                                    var tree = [];
                                    tree.push(items[rootName]);
                                    deferred.resolve(tree);
                                }
                            });
                        }
                    });
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


function updateElementMappings(mappingTbl, mappingField, idField, elementId, mappingValues){
    var deferred = Q.defer();
    deleteElementMappings(mappingTbl, idField, elementId).then(function(result) {
        var counter = 0;
        if(mappingValues.length === 0){
            deferred.resolve(mappingValues);
        }
        var promises = [];
        mappingValues.forEach(function(value){
            promises.push(createElementMapping(mappingTbl, mappingField, idField, elementId, value));
            counter++;
            if(counter === mappingValues.length){
                Q.all(promises).then(function (result) {
                    deferred.resolve(result);
                }).catch(function (reason) {
                    deferred.reject(reason);
                })
            }
        });
    }).catch(function(reason){
        deferred.reject(reason);
    });
    return deferred.promise;
}

function createElementMapping(mappingTbl, mappingField, idField, elementId, mappingValue){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            var mapping = {};
            mapping[idField] = elementId;
            mapping[mappingField] = mappingValue;
            conn.query('INSERT INTO ??.?? SET ?', [config.db, mappingTbl, mapping], function(err, result){
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

function deleteElementMappings(mappingTbl, idField, elementId){
    var deferrd = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ?', [config.db, mappingTbl, idField, elementId], function(err, result){
                conn.release();
                if(!err){
                    deferrd.resolve(result);
                }else{
                    deferrd.reject(err);
                }
            });
        }else{
            deferrd.reject(err);
        }
    });
    return deferrd.promise;
}

function updateElementTripleMappings(mappingTbl, idField, elementId, mappingValues){
    var deferred = Q.defer();
    deleteElementMappings(mappingTbl, idField, elementId).then(function (result) {
        var results = [];
        var errors = [];
        var counter = 0;
        if(mappingValues.length === 0){
            deferred.resolve(result)
        }else{
            var promises = [];
            mappingValues.forEach(function(value){
                //if teilelement is just created TeilelementID is still new, therefore overwrite it with new TeilelementID
                value[idField] = elementId;
                promises.push(createElementTripleMapping(mappingTbl, value));
                counter++;
                if(counter === mappingValues.length){
                    Q.all(promises).then(function (result) {
                        deferred.resolve(result);
                    }).catch(function (reason) {
                        deferred.reject(reason);
                    })
                }
            });
        }
    });
    return deferred.promise;
}

function createElementTripleMapping(mappingTbl, mappingValue){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('INSERT INTO ??.?? SET ?', [config.db, mappingTbl, mappingValue], function(err, result){
                conn.release();
                if(!err){
                    deferred.resolve(result);
                }else{
                    deferred.reject(err);
                }
            })
        }else{
            deferred.reject(err);
        }
    });
    return deferred.promise;
}

function updateElementRelationMappings(mappingTbl, subjectField, objectField, elementId, mappingValues){
    var deferred = Q.defer();
    deleteElementRelations(mappingTbl, elementId, subjectField, objectField).then(function(result){
        var counter = 0;
        var promises = [];
        if(mappingValues.length === 0){
            deferred.resolve(result)
        }
        mappingValues.forEach(function(value){
            //for the case that subject or object === new just overwrite it with elementId
            if(value[subjectField] === 'new'){value[subjectField] = elementId}
            if(value[objectField] === 'new'){value[objectField] = elementId}
            promises.push(createElementTripleMapping(mappingTbl,
                {
                    SubjektBasiselement: value.SubjektBasiselement,
                    PraedikatBasiselement: value.PraedikatBasiselement,
                    ObjektBasiselement: value.ObjektBasiselement
                }));
            counter++;
            if(counter === mappingValues.length){
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

function deleteElementRelation(mappingTbl, subjectFieldName, operatorFieldName, objectFieldName, triple){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? AND ?? = ? AND ?? = ?', [config.db, mappingTbl, subjectFieldName, triple[subjectFieldName], operatorFieldName, triple[operatorFieldName], objectFieldName, triple[objectFieldName]], function(err, result){
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

function deleteElementRelations(mappingTbl, elementId, subjectField, objectField){
    var deferred = Q.defer();
    pool.getConnection(function(err, conn){
        if(!err){
            conn.query('DELETE FROM ??.?? WHERE ?? = ? OR ?? = ?', [config.db, mappingTbl, subjectField, elementId, objectField, elementId], function(err, result){
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

module.exports.loadAllFromTable = loadAllFromTable;
module.exports.updateElementMappings = updateElementMappings;
module.exports.updateElementRelationMappings = updateElementRelationMappings;
module.exports.updateElementTripleMappings = updateElementTripleMappings;
module.exports.loadFieldFromTable = loadFieldFromTable;
module.exports.loadKostuemRepoBackupInfo = loadKostuemRepoBackupInfo;
module.exports.loadTaxonomy = loadTaxonomy;
module.exports.loadTaxonomyTree = loadTaxonomyTree;
module.exports.createElementTripleMapping = createElementTripleMapping;
module.exports.deleteElementRelation = deleteElementRelation;
module.exports.deleteElementMappings = deleteElementMappings;
