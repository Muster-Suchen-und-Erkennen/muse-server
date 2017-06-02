/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomyTree("BasiselementDomaene", "BasiselementName", "UebergeordnetesElement", "Basiselemente").then(function(result){
        res.send(result);
    }).catch(function(err){
        logger.error(reason.message);
        res.send(500, err.message);
    });
};
