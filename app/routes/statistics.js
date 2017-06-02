'use strict';

var logger = require("../util/logger");
var db = require('../sqlClient/mysqlclient').dbClient;

exports.general = function(req, res){
    var statistic = {
        films: 0,
        costumes: 0,
        costumesPerFilm: 0,
        baseElements: 0,
        baseElementPerCostume: 0,
        teilelemente: 0,
        teilelementePerCostume: 0,
        teilelementePerBaseElement: 0,
        assignedColors: 0,
        assignedMaterials: 0,
    };

    db.numberOfFilms().then(function (result) {
        statistic.films = result;
        return db.numberOfCostumes();
    }).then(function (result) {
        statistic.costumes = result;
        return db.numberOfCostumesPerFilm();
    }).then(function (result) {
        statistic.costumesPerFilm = result;
        return db.numberOfBaseElements();
    }).then(function (result) {
        statistic.baseElements = result;
        return db.numberOfBaseElementsPerCostume();
    }).then(function (result) {
        statistic.baseElementPerCostume = result;
        return db.numberOfPrimitives();
    }).then(function (result) {
        statistic.teilelemente = result;
        return db.numberOfPrimitivesPerCostume();
    }).then(function (result) {
        statistic.teilelementePerCostume = result;
        return db.numberOfPrimitivesPerBaseElement();
    }).then(function (result) {
        statistic.teilelementePerBaseElement = result;
        return db.colorsBaseElement();
    }).then(function (result) {
        statistic.assignedColors += result;
        return db.colorsPrimitive();
    }).then(function (result) {
        statistic.assignedColors += result;
        return db.materialsBaseElement();
    }).then(function (result) {
        statistic.assignedMaterials += result;
        return db.materialsPrimitive();
    }).then(function (result) {
        statistic.assignedMaterials += result;
    }).then(function (end) {
        res.status(200).send(statistic);
    });

};