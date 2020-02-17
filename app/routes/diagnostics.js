'use strict';

var logger = require("../util/logger");
var db = require('../sqlClient/mysqlclient').dbClient;

exports.general = function(req, res){
    var diagnostics = {
        rolesWithoutStereotype: [],
        rolesWithoutDominantCharacter: [],
        costumesWithoutDominantColorOrState: [],
    };

    db.rolesWithoutStereotype().then(function (result) {
        diagnostics.rolesWithoutStereotype = result;
        return db.rolesWithoutDominantCharacter();
    }).then(function (result) {
        diagnostics.rolesWithoutDominantCharacter = result;
        return db.costumesWithoutDominantColorOrState();
    }).then(function (result) {
        diagnostics.costumesWithoutDominantColorOrState = result;
    }).then(function (end) {
        res.status(200).send(diagnostics);
    });

};