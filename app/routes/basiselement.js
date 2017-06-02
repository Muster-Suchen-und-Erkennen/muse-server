/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var db = require('../sqlClient/mysqlclient').dbClient;
var logger = require("../util/logger");

exports.index = function (req, res) {
    db.loadBaseelementsOfCostume(req.params.filmId, req.params.rollenId, req.params.kostuemId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.create = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.createBaseelement(req.params.filmId, req.params.rollenId, req.params.kostuemId, req.body).then(function (result) {
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

exports.update = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.updateBaseelement(req.body).then(function (result) {
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

exports.destroy = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteBaseelement(req.params.basiselementId).then(function(result){
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

exports.queryBasiselement = function (req, res){
    db.loadBaseelement(req.params.basiselementId).then(function(result){
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.loadThumb = function (req, res) {
    db.loadBaseelementThumb(req.params.basiselementId).then(function (result) {
        //res.status(200).type(result.ImageType).send(result.ImageThumb);
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.getImageLink = function (req, res) {
    db.getImageLink(req.params.basiselementId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.loadImage = function (req, res) {
    db.loadBaseelementImage(req.params.basiselementId).then(function (result) {
        res.setHeader('Content-Type', result.ImageType);
        res.status(200).send(result.ImageThumb);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500).send(reason.message);
    });
};

exports.loadBaseelementImageFileName = function (req, res) {
    db.loadBaseelementImageFileName(req.params.basiselementId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500).send(reason.message);
    });
};