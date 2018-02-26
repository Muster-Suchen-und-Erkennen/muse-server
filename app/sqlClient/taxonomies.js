'use strict';
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
var Q = require('q');
var resultUtils = require('./dbResultUtils');
var genericUtils = require('./dbGenericUtils');

var taxonomies = {
    //'': { type: 'list', editable: false, tableName: '', columnName: '' },
    //'t': { type: 'tree', editable: false, tableName: '', columnName: '', parentColumnName: '' },
    'Basiselement': { type: 'tree', editable: true, tableName: 'BasiselementDomaene', columnName: 'BasiselementName', parentColumnName: 'UebergeordnetesElement' },
    'Genre': { type: 'tree', editable: true, tableName: 'GenreDomaene', columnName: 'GenreName', parentColumnName: 'UebergeordnetesElement' },
    'Körpermodifikationen': { type: 'tree', updataeditableble: true, tableName: 'KoerpermodifikationsDomaene', columnName: 'KoerpermodifikationsName', parentColumnName: 'UebergeordnetesElement' },
    'Material': { type: 'tree', editable: true, tableName: 'MaterialDomaene', columnName: 'MaterialName', parentColumnName: 'UebergeordnetesElement' },
    'Produktionsort': { type: 'tree', editable: true, tableName: 'ProduktionsortDomaene', columnName: 'ProduktionsortName', parentColumnName: 'UebergeordnetesElement' },
    'Beruf': { type: 'tree', editable: true, tableName: 'RollenberufDomaene', columnName: 'RollenberufName', parentColumnName: 'UebergeordnetesElement' },
    'Spielort': { type: 'tree', editable: true, tableName: 'SpielortDomaene', columnName: 'SpielortName', parentColumnName: 'UebergeordnetesElement' },
    'Spielort (Detail)': { type: 'tree', editable: true, tableName: 'SpielortDetailDomaene', columnName: 'SpielortDetailName', parentColumnName: 'UebergeordnetesElement' },
    'Spielzeit': { type: 'tree', editable: true, tableName: 'SpielzeitDomaene', columnName: 'SpielzeitName', parentColumnName: 'UebergeordnetesElement' },
    'Stereotyp': { type: 'tree', editable: true, tableName: 'StereotypDomaene', columnName: 'StereotypName', parentColumnName: 'UebergeordnetesElement' },
    'Teilelement': { type: 'tree', editable: true, tableName: 'TeilelementDomaene', columnName: 'TeilelementName', parentColumnName: 'UebergeordnetesElement' },

    'Charaktereigenschaft': { type: 'tree', editable: false, tableName: 'CharaktereigenschaftsDomaene', columnName: 'CharaktereigenschaftsName', parentColumnName: 'UebergeordnetesElement' },
    'Tageszeit':  { type: 'tree', editable: false, tableName: 'TageszeitDomaene', columnName: 'TageszeitName', parentColumnName: 'UebergeordnetesElement' },
    'Alterseindruck': { type: 'tree', editable: false, tableName: 'AlterseindruckDomaene', columnName: 'AlterseindruckName', parentColumnName: 'UebergeordnetesElement' },
    'Zustand': { type: 'tree', editable: false, tableName: 'ZustandsDomaene', columnName: 'ZustandsName', parentColumnName: 'UebergeordnetesElement' },
    'Farbe': { type: 'tree', editable: false, tableName: 'FarbenDomaene', columnName: 'FarbName', parentColumnName: 'UebergeordnetesElement' },
    'Farbkonzept': { type: 'tree', editable: false, tableName: 'FarbkonzeptDomaene', columnName: 'FarbkonzeptName', parentColumnName: 'UebergeordnetesElement' },
    'Design': { type: 'tree', editable: false, tableName: 'DesignDomaene', columnName: 'DesignName', parentColumnName: 'UebergeordnetesElement' },
    'Form': { type: 'tree', editable: false, tableName: 'FormenDomaene', columnName: 'FormName', parentColumnName: 'UebergeordnetesElement' },
    'Trageweise': { type: 'tree', editable: false, tableName: 'TrageweisenDomaene', columnName: 'TrageweisenName', parentColumnName: 'UebergeordnetesElement' },
    'Funktion': { type: 'tree', editable: false, tableName: 'FunktionsDomaene', columnName: 'FunktionsName', parentColumnName: 'UebergeordnetesElement' },
    'Operator': { type: 'tree', editable: false, tableName: 'OperatorDomaene', columnName: 'OperatorName', parentColumnName: 'UebergeordnetesElement' },
    'Körperteil': { type: 'tree', editable: false, tableName: 'KoerperteilDomaene', columnName: 'Koerperteilname', parentColumnName: 'UebergeordnetesElement' },
    'Dominante Charaktereigenschaft': { type: 'tree', editable: false, tableName: 'TypusDomaene', columnName: 'TypusName', parentColumnName: 'UebergeordnetesElement' },

    'Materialeindruck': { type: 'list', tableName: 'MaterialeindruckDomaene', columnName: 'Materialeindruckname' },
    'Farbeindruck': { type: 'list', editable: false, tableName: 'FarbeindruckDomaene', columnName: 'Farbeindruckname' },
};

function updateableTaxonomies() {
    var deferred = Q.defer();

    var updateableTaxonomies = [];

    Object.keys(taxonomies).forEach(function (name) {
        updateableTaxonomies.push({ name: name, type: taxonomies[name].type, editable: taxonomies[name].editable });
    });

    deferred.resolve(updateableTaxonomies);

    return deferred.promise;
}


function deleteTaxonomyElement(taxonomy, name) {
    var deferred = Q.defer();

    var taxonomyInfo = taxonomies[taxonomy];

    if (taxonomyInfo) {
        if (taxonomyInfo.editable) {
            return genericUtils.deleteElementMappings(taxonomyInfo.tableName, taxonomyInfo.columnName, name);
        } else {
            deferred.reject('Taxonomy ' + taxonomy + ' is not editable!');
            return deferred.promise;
        }
    } else {
        deferred.reject('Unknown taxonomy ' + taxonomy);
        return deferred.promise;
    }
}


function addTaxonomyElement(taxonomy, element) {
    var deferred = Q.defer();

    var taxonomyInfo = taxonomies[taxonomy];

    if (taxonomyInfo) {
        if (taxonomyInfo.editable) {
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
            deferred.reject('Taxonomy ' + taxonomy + ' is not editable!');
            return deferred.promise;
        }
    } else {
        deferred.reject('Unknown taxonomy ' + taxonomy);
        return deferred.promise;
    }
}


module.exports.updateableTaxonomies = updateableTaxonomies;
module.exports.addTaxonomyElement = addTaxonomyElement;
module.exports.deleteTaxonomyElement = deleteTaxonomyElement;
