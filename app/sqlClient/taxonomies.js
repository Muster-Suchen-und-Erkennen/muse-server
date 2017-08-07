'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');

var taxonomies = {
    //'': { type: 'list', tableName: '', columnName: '' },
    //'t': { type: 'tree', tableName: '', columnName: '', parentColumnName: '' },
    'Basiselement': { type: 'tree', tableName: 'BasiselementDomaene', columnName: 'BasiselementName', parentColumnName: 'UebergeordnetesElement' },
    'Genre': { type: 'tree', tableName: 'GenreDomaene', columnName: 'GenreName', parentColumnName: 'UebergeordnetesElement' },
    'Körpermodifikationen': { type: 'tree', tableName: 'KoerpermodifikationsDomaene', columnName: 'KoerpermodifikationsName', parentColumnName: 'UebergeordnetesElement' },
    'Material': { type: 'tree', tableName: 'MaterialDomaene', columnName: 'MaterialName', parentColumnName: 'UebergeordnetesElement' },
    'Produktionsort': { type: 'tree', tableName: 'ProduktionsortDomaene', columnName: 'ProduktionsortName', parentColumnName: 'UebergeordnetesElement' },
    'Beruf': { type: 'tree', tableName: 'RollenberufDomaene', columnName: 'RollenberufName', parentColumnName: 'UebergeordnetesElement' },
    'Spielort': { type: 'tree', tableName: 'SpielortDomaene', columnName: 'SpielortName', parentColumnName: 'UebergeordnetesElement' },
    'Spielort (Detail)': { type: 'tree', tableName: 'SpielortDetailDomaene', columnName: 'SpielortDetailName', parentColumnName: 'UebergeordnetesElement' },
    'Spielzeit': { type: 'tree', tableName: 'SpielzeitDomaene', columnName: 'SpielzeitName', parentColumnName: 'UebergeordnetesElement' },
    'Stereotyp': { type: 'tree', tableName: 'StereotypDomaene', columnName: 'StereotypName', parentColumnName: 'UebergeordnetesElement' },
    'Teilelement': { type: 'tree', tableName: 'TeilelementDomaene', columnName: 'TeilelementName', parentColumnName: 'UebergeordnetesElement' },
};

function updateableTaxonomies() {
    var deferred = Q.defer();

    var updateableTaxonomies = [];

    Object.keys(taxonomies).forEach(function (name) {
        updateableTaxonomies.push({ name: name, type: taxonomies[name].type });
    });

    deferred.resolve(updateableTaxonomies);

    return deferred.promise;
}


function deleteTaxonomyElement(taxonomy, name) {
    var deferred = Q.defer();

    var taxonomyInfo = taxonomies[taxonomy];

    if (taxonomyInfo) {
        return genericUtils.deleteElementMappings(taxonomyInfo.tableName, taxonomyInfo.columnName, name);
    } else {
        deferred.reject('Unknown taxonomy ' + taxonomy);
        return deferred.promise;
    }
}


function addTaxonomyElement(taxonomy, element) {
    var deferred = Q.defer();

    var taxonomyInfo = taxonomies[taxonomy];

    if (taxonomyInfo) {
        var mapping = {};
        if (taxonomyInfo.type === 'list') {
            mapping[taxonomyInfo.columnName] = element.name;

            return genericUtils.createElementTripleMapping(taxonomyInfo.tableName, mapping);
        } else {
            mapping[taxonomyInfo.columnName] = element.name;
            mapping[taxonomyInfo.parentColumnName] = element.parent;

            return genericUtils.createElementTripleMapping(taxonomyInfo.tableName, mapping);
        }
    } else {
        deferred.reject('Unknown taxonomy ' + taxonomy);
        return deferred.promise;
    }
}


module.exports.updateableTaxonomies = updateableTaxonomies;
module.exports.addTaxonomyElement = addTaxonomyElement;
module.exports.deleteTaxonomyElement = deleteTaxonomyElement;
