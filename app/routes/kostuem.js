/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var db = require('../sqlClient/mysqlclient').dbClient;
var fs = require('fs');
var gm = require('gm');
var logger = require("../util/logger");

exports.index = function (req, res) {
    db.loadCostumesOfRoleFlat(req.params.filmId, req.params.rollenId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.indexFull = function (req, res) {
    db.indexFull().then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.indexThumbs = function (req, res) {
    db.loadCostumeScreenshotThumbs(req.params.filmId, req.params.rollenId, req.params.kostuemId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.indexScreenshots = function (req, res) {
    db.loadCostumeScreenshots(req.params.filmId, req.params.rollenId, req.params.kostuemId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.loadScreenshot = function (req, res) {
    db.loadCostumeScreenshot(req.params.filmId, req.params.rollenId, req.params.kostuemId, req.params.screenshotId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        res.send(500, reason.message);
        logger.error(reason);
    });
};

exports.new = function (req, res) {
    res.status(501).end();
};

exports.create = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info("GOT CREATE COSTUME REQUEST " + JSON.stringify(req.body));
            db.createCostume(req.body).then(function (result) {
                res.status(201).send(result);
            }).catch(function (reason) {
                logger.error("Error: " + reason.message);
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

exports.createScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info(JSON.stringify(req.files.screenshot));
            fs.readFile(req.files.screenshot.path, function (err, data) {
                gm(data).resize(320).toBuffer(function(err, thumbData){
                    if(!err){
                        db.createCostumeScreenshot(req.params.filmId, req.params.rollenId, req.params.kostuemId, data, thumbData, req.files.screenshot.mimetype).then(function (result) {
                            res.status(201).send(result);
                            fs.unlink(req.files.screenshot.path);
                        }).catch(function (reason) {
                            logger.error(reason.message);
                            res.status(500).send(reason.message);
                            fs.unlink(req.files.screenshot.path);
                        });
                    }else{
                        logger.error(err.message);
                        res.status(500).send(err.message);
                        fs.unlink(req.files.screenshot.path);
                    }
                });
            });

        } else {
            res.status(403).send('You have no edit rights!');
        }
    }, function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.show = function (req, res) {
    db.loadCostume(req.params.filmId, req.params.rollenId, req.params.kostuemId).then(function (result) {
        res.status(200).send(result);
    }).catch(function(reason){
        res.status(500).send(reason.message);
        logger.error(reason);
    });
};

exports.edit = function (req, res) {
    res.status(501).end();
};

exports.update = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.updateCostume(req.body).then(function (result) {
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

exports.destroy = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteCostume(req.params.filmId, req.params.rollenId, req.params.kostuemId).then(function(result){
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

exports.destroyScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteCostumeScreenshot(req.params.filmId, req.params.rollenId, req.params.kostuemId, req.params.screenshotId).then(function(result){
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

