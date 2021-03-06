/**
 * Created by michaelfalkenthal on 01.07.14.
 */
'use strict';

var logger = require("../util/logger");

exports.index = function(req, res){
    var db = require('../sqlClient/mysqlclient').dbClient;
    db.loadFieldFromTable("Schauspielervorname", "Rolle").then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};