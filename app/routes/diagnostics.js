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
        statistic.rolesWithoutStereotype = result;
        return db.rolesWithoutDominantCharacter();
    }).then(function (result) {
        statistic.rolesWithoutDominantCharacter = result;
        return db.costumesWithoutDominantColorOrState();
    }).then(function (result) {
        statistic.costumesWithoutDominantColorOrState = result;
    }).then(function (end) {
        res.status(200).send(statistic);
    });

};