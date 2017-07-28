'use strict';

var logger = require("../util/logger");
var db = require('../sqlClient/mysqlclient').dbClient;

exports.updateableTaxonomies = function(req, res){

    db.updateableTaxonomies().then(function (updateableTaxonomies) {
        res.status(200).send(updateableTaxonomies);
    }, function (err) {
        logger.log('Error while retrieving updateable taxonomies.');
        res.status(501).send('Error while retrieving updateable taxonomies.');
    });
};

exports.addTaxonomyElement = function(req, res){
    var body = req.body;

    db.addTaxonomyElement(req.params.taxonomy, body).then(function () {
        res.status(200).end();
    }, function (err) {
        logger.log('Error while retrieving adding new taxonomy element.');
        res.status(501).send('Error while retrieving adding new taxonomy element.');
    });
};

exports.deleteTaxonomyElement = function(req, res){
    db.deleteTaxonomyElement(req.params.taxonomy, req.params.name).then(function () {
        res.status(200).end();
    }, function (err) {
        logger.log('Error while retrieving deleting taxonomy element.');
        res.status(501).send('Error while retrieving deleting taxonomy element.');
    });
};
