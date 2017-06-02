/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var logger = require("../util/logger");

var db = require('../sqlClient/mysqlclient').dbClient;

exports.create = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.createPrimitive(req.params.basiselementId, req.body).then(function (result) {
                res.status(201).send(result);
            }).catch(function (reason) {
                res.status(500).send(reason.message);
                logger.error(reason);
            });

        } else {
            res.status(403).send('You have no edit rights!');
        }
    }, function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.update = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.updatePrimitive(req.body).then(function (result) {
                res.status(200).send(result);
            }).catch(function(reason){
                res.status(500).send(reason.message);
                logger.error(reason);
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
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deletePrimitive(req.params.teilelementId).then(function(result){
                res.status(200).send(result);
            }).catch(function (reason) {
                res.status(500).send(reason.message);
                logger.error(reason);
            });

        } else {
            res.status(403).send('You have no edit rights!');
        }
    }, function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.queryTeilelement = function (req, res){
    db.loadPrimitive(req.params.teilelementId).then(function(result){
        res.status(200).send(result);
    }).catch(function(reason){
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};