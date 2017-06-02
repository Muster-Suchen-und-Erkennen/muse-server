/**
 * Created by michaelfalkenthal on 11.03.14.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadTaxonomy("KoerperteilDomaene").then(function(result){
        res.status(200).send(result);
    }).catch(function(err){
        res.status(500).send(err.message);
        logger.error(reason);
    });
};
