/**
 * Created by michaelfalkenthal on 02.12.13.
 */
'use strict';

var db = require('../sqlClient/mysqlclient').dbClient;
var fs = require('fs');
var gm = require('gm');
var logger = require("../util/logger");

exports.index = function (req, res) {
    res.status(501).end();
};

exports.indexThumbs = function (req, res) {
    db.loadRoleScreenshotThumbs(req.params.filmId, req.params.rollenId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.loadScreenshot = function (req, res) {
    db.loadRoleScreenshot(req.params.filmId, req.params.rollenId, req.params.screenshotId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.send(500, reason.message);
    });
};

exports.indexScreenshots = function (req, res) {
    db.loadRoleScreenshots(req.params.filmId, req.params.rollenId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.new = function (req, res) {
    res.status(501).end();
};

exports.show = function (req, res) {
    db.loadRoleFlat(req.params.filmId, req.params.rollenId).then(function(result){
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.roleOfFilm = function (req, res) {
    db.loadRoleFlat(req.params.filmId, req.params.rollenId).then(function(result){
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.edit = function (req, res) {
    res.status(501).end();
};

exports.rolesOfFilm = function(req, res){
    db.loadRolesOfFilmFlat(req.params.filmId).then(function (result) {
        res.status(200).send(result);
    }).catch(function (reason) {
        logger.error(reason.message);
        res.status(500).send(reason.message);
    });
};

exports.deleteRoleOfFilm = function(req, res){
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info("DELETING ROLE " + req.params.rollenId + " FROM FILM " + req.params.filmId);
            db.deleteRole(req.params.filmId, req.params.rollenId).then(function(result){
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

exports.createRoleOfFilm = function(req, res){
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info("CREATING ROLE FOR FILM " + req.params.filmId);
            db.createRole(req.body).then(function(result){
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

exports.createScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info(JSON.stringify(req.files.screenshot));
            fs.readFile(req.files.screenshot.path, function (err, data) {
                gm(data).resize(320).toBuffer(function(err, thumbData){
                    if(!err){
                        db.createRoleScreenshot(req.params.filmId, req.params.rollenId, data, thumbData, req.files.screenshot.mimetype).then(function (result) {
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

exports.updateRoleOfFilm = function(req, res){
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            logger.info("UPDATING ROLE OF FILM " + req.params.filmId);
            db.updateRole(req.body).then(function(result){
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

exports.destroyScreenshot = function (req, res) {
    db.hasUserRole(req.user.username, 'Editor').then(function (userHasRole) {
        if (userHasRole) {

            db.deleteRoleScreenshot(req.params.filmId, req.params.rollenId, req.params.screenshotId).then(function(result){
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