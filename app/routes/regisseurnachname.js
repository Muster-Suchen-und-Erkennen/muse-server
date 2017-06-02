/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadFieldFromTable("Regiseurnachname", "Film").then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.show = function(req, res){
    res.status(501).end();
};
