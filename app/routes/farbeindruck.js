/**
 * Created by michaelfalkenthal on 06.10.14.
 */
'use strict';

var logger = require("../util/logger");
var db = require('../sqlClient/mysqlclient').dbClient;

exports.index = function (req, res) {
    db.loadAllFromTable('FarbeindruckDomaene').then(function(result){
        res.status(200).send(result);
    }).catch(function (reason) {
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};