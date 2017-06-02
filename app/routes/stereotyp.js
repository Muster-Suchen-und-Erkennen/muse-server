/**
 * Created by simon on 27.08.2015.
 */

'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomyTree("StereotypDomaene", "StereotypName", "UebergeordnetesElement", "Stereotyp").then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};