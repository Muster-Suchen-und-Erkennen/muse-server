'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');

var listTaxonomies = {
    '': {tableName:'', columnName:''},
};

var treeTaxonomies = {
    '': {tableName:'', columnName:'', parentColumnName:''},
};

function updateableTaxonomies() {
    var deferred = Q.defer();

    var taxonomies = {
        list: [],
        tree: []
    };

    Object.keys(listTaxonomies).forEach(function(name) {
        taxonomies.list.push(name);
    });

    Object.keys(treeTaxonomies).forEach(function(name) {
        taxonomies.tree.push(name);
    });

    deferred.resolve(taxonomies);

    return deferred.promise;
}


function deleteTaxonomyElement(taxonomy, name) {
    var deferred = Q.defer();

    var taxonomyInfo = listTaxonomies[taxonomy];

    if (taxonomyInfo) {
        return genericUtils.deleteElementMappings(taxonomyInfo.tableName, taxonomyInfo.columnName, name);
    } else {
        taxonomyInfo = treeTaxonomies[taxonomy];
        if (taxonomyInfo) {
            return genericUtils.deleteElementMappings(taxonomyInfo.tableName, taxonomyInfo.columnName, name);
        } else {
            deferred.reject('Unknown taxonomy ' + taxonomy);
            return deferred.promise;
        }
    }
}


function addTaxonomyElement(taxonomy, element) {
    var deferred = Q.defer();

    var taxonomyInfo = listTaxonomies[taxonomy];

    if (taxonomyInfo) {
        var mapping = {};
        mapping[taxonomyInfo.columnName] = element.name;

        return genericUtils.createElementTripleMapping(taxonomyInfo.tableName, mapping);
    } else {
        taxonomyInfo = treeTaxonomies[taxonomy];
        if (taxonomyInfo) {
            var mapping = {};
            mapping[taxonomyInfo.columnName] = element.name;
            mapping[taxonomyInfo.parentColumnName] = element.parent;

            return genericUtils.createElementTripleMapping(taxonomyInfo.tableName, mapping);
        } else {
            deferred.reject('Unknown taxonomy ' + taxonomy);
            return deferred.promise;
        }
    }
}


module.exports.updateableTaxonomies = updateableTaxonomies;
module.exports.addTaxonomyElement = addTaxonomyElement;
module.exports.deleteTaxonomyElement = deleteTaxonomyElement;
