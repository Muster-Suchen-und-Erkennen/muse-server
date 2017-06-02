/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var db = require('../sqlClient/mysqlclient').dbClient;
var logger = require("../util/logger");

exports.create = function (req, res) {
    logger.info("GOT CREATE BASISELEMENTRELATION REQUEST " + JSON.stringify(req.body));
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.createBaseelementRelation(req.body).then(function (result) {
                res.status(201).send(result);
            }).catch(function (reason) {
                logger.error(reason.message);
                res.status(500).send(reason.message);
            });

        } else {
            res.status(403).send('You have no edit rights!');
        }
    }, function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.destroy = function (req, res) {
    logger.info("GOT DELETE BASISELEMENTRELATION REQUEST " + JSON.stringify(req.body));
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            var triple = {SubjektBasiselement: req.params.subjekt, PraedikatBasiselement: req.params.praedikat, ObjektBasiselement: req.params.objekt};
            db.deleteBaseelementRelation(triple).then(function (result) {
                res.status(200).send(result);
            }).catch(function (reason) {
                logger.error(reason.message);
                res.status(500).send(reason.message);
            });

        } else {
            res.status(403).send('You have no edit rights!');
        }
    }, function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};


exports.getEmptyRelations = function (req, res) {
    db.getEmptyRelations(req.body).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};
