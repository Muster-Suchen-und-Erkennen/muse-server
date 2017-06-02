/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var db = require('../sqlClient/mysqlclient').dbClient;
var fs = require('fs');
var gm = require('gm');
var logger = require("../util/logger");

exports.loadThumb = function (req, res) {
    db.loadFilmThumb(req.params.filmId, req.params.imgId).then(function (result) {
        res.status(200).type(result.ImageType).send(result.ScreenshotThumb);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.index = function (req, res) {
    db.loadAllFromTable("Film").then(function(result) {
        res.status(200).send(result);
    })
    .catch(function(reason){
            logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.indexScreenshots = function (req, res) {
    db.loadFilmScreenshots(req.params.filmId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500, reason.message);
    });
};

exports.indexThumbs = function (req, res) {
    db.loadFilmScreenshotThumbs(req.params.filmId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500, reason.message);
    });
};

exports.loadScreenshot = function (req, res) {
    db.loadFilmScreenshot(req.params.filmId, req.params.screenshotId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500, reason.message);
    });
};

exports.create = function (req, res) {
    logger.info("GOT CREATE FILM REQUEST " + JSON.stringify(req.body));
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.createFilm(req.body).then(function (result) {
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

exports.createScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info(JSON.stringify(req.files.screenshot));
            fs.readFile(req.files.screenshot.path, function (err, data) {
                gm(data).resize(320).toBuffer(function(err, thumbData){
                    if(!err){
                        db.createFilmScreenshot(req.params.filmId, data, thumbData, req.files.screenshot.mimetype).then(function (result) {
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
    db.loadFilm(req.params.filmId).then(function(result){
        res.status(200).send(result);
    })
    .catch(function(err){
            logger.error(err.message);
        res.status(500).send(err.message);
    });
};

exports.edit = function (req, res) {
    res.status(501).end();
};

exports.update = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.updateFilm(req.body).then(function (result) {
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
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteFilm(req.params.filmId).then(function(result){
                res.status(200).send(result);
            }).catch(function (reason) {
                logger.error('FAILURE AT DELETING FILM: ' + req.params.filmId);
                logger.error(reason.message);
                logger.error(reason.stack);
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

exports.destroyScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteFilmScreenshot(req.params.filmId, req.params.screenshotId).then(function(result){
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