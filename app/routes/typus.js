/**
 * Created by michaelfalkenthal on 24.02.14.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomyTree("TypusDomaene", "TypusName", "UebergeordnetesElement", "Typus").then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};
