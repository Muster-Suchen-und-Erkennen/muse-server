/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomyTree("TeilelementDomaene", "TeilelementName", "UebergeordnetesElement", "Teilelemente").then(function(result){
        res.status(200).send(result);
    }).catch(function(err){
        res.status(500).send(err.message);
        logger.error(err);
    });
};
