/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';
var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomyTree("AlterseindruckDomaene", "AlterseindruckName", "UebergeordnetesElement", "Alter").then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};
