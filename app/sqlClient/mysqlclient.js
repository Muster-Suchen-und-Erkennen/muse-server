/**
 * Created by michaelfalkenthal on 09.12.13.
 */
'use strict';

//Promises with Q
var Q = require('q');
//Database
var mysql = require('mysql');
var pool = require('./databaseConnectionPool').pool;
var config = require('./databaseConnectionPool').config;
//Business Logic
var film = require('./film');
var role = require('./role');
var costume = require('./costume');
var baseelement = require('./baseelement');
var primitive = require('./primitive');
var dbGenericUtils = require('./dbGenericUtils');
var statistics = require('./statistics');
var users = require('./users');

var client = {
    //General
    loadAllFromTable: dbGenericUtils.loadAllFromTable,
    loadFieldFromTable: dbGenericUtils.loadFieldFromTable,
    loadKostuemRepoBackupInfo: dbGenericUtils.loadKostuemRepoBackupInfo,
    loadTaxonomy: dbGenericUtils.loadTaxonomy,
    loadTaxonomyTree: dbGenericUtils.loadTaxonomyTree,
    //Film
    createFilm: film.createFilm,
    loadFilm: film.loadFilm,
    loadFilmThumb: film.loadThumb,
    createFilmScreenshot: film.createScreenshot,
    loadFilmScreenshots: film.loadScreenshots,
    loadFilmScreenshot: film.loadScreenshot,
    loadFilmScreenshotThumbs: film.loadScreenshotThumbs,
    updateFilm: film.updateFilm,
    deleteFilm: film.deleteFilm,
    deleteFilmScreenshot: film.deleteScreenshot,
    //Roles
    createRole: role.createRole,
    loadRoleFlat: role.loadRoleFlat,
    updateRole: role.updateRole,
    deleteRole: role.deleteRole,
    createRoleScreenshot: role.createScreenshot,
    loadRoleScreenshots: role.loadScreenshots,
    loadRoleScreenshot: role.loadScreenshot,
    loadRoleScreenshotThumbs: role.loadScreenshotThumbs,
    deleteRoleScreenshot: role.deleteScreenshot,
    loadRolesOfFilmFlat: film.loadRolesOfFilmFlat,
    //Costumes
    indexFull: costume.indexFull,
    createCostume: costume.createCostume,
    loadCostume: costume.loadCostume,
    loadCostumeFlat: costume.loadCostumeFlat,
    updateCostume: costume.updateCostume,
    deleteCostume: costume.deleteCostume,
    createCostumeScreenshot: costume.createCostumeScreenshot,
    loadCostumeScreenshots: costume.loadCostumeScreenshots,
    loadCostumeScreenshot: costume.loadCostumeScreenshot,
    loadCostumeScreenshotThumbs: costume.loadCostumeScreenshotThumbs,
    deleteCostumeScreenshot: costume.deleteCostumeScreenshot,
    loadCostumesOfRoleFlat: role.loadCostumesOfRoleFlat,
    //Baseelements
    createBaseelement: baseelement.createBaseelement,
    loadBaseelement: baseelement.loadBaseelement,
    updateBaseelement: baseelement.updateBaseelement,
    deleteBaseelement: baseelement.deleteBaseelement,
    loadBaseelementsOfCostume: costume.loadBaseelementsOfCostume,
    createBaseelementRelation: baseelement.createBaseelementRelation,
    deleteBaseelementRelation: baseelement.deleteBaseelementRelation,
    loadBaseelementThumb: baseelement.loadThumb,
    loadBaseelementImage: baseelement.loadImage,
    loadBaseelementImageFileName: baseelement.loadBaseelementImageFileName,
    getImageLink: baseelement.getImageLink,
    getEmptyRelations: baseelement.getEmptyRelations,
    //Primitives
    createPrimitive: primitive.createPrimitive,
    loadPrimitive: primitive.loadPrimitive,
    updatePrimitive: primitive.updatePrimitive,
    deletePrimitive: primitive.deletePrimitive,
    //statistics
    numberOfFilms: statistics.numberOfFilms,
    numberOfCostumes: statistics.numberOfCostumes,
    numberOfCostumesPerFilm: statistics.numberOfCostumesPerFilm,
    numberOfBaseElements: statistics.numberOfBaseElements,
    numberOfBaseElementsPerCostume: statistics.numberOfBaseElementsPerCostume,
    numberOfPrimitives: statistics.numberOfPrimitives,
    numberOfPrimitivesPerCostume: statistics.numberOfPrimitivesPerCostume,
    numberOfPrimitivesPerBaseElement: statistics.numberOfPrimitivesPerBaseElement,
    colorsBaseElement: statistics.colorsBaseElement,
    colorsPrimitive: statistics.colorsPrimitive,
    materialsBaseElement: statistics.materialsBaseElement,
    materialsPrimitive: statistics.materialsPrimitive,
    //users
    loadUserList: users.loadUserList,
    loadUserRoles: users.loadUserRoles,
    createUser: users.createUser,
    deleteUser: users.deleteUser,
    addUserRole: users.addUserRole,
    removeUserRole: users.removeUserRole,
    hasUserRole: users.hasUserRole,
};

exports.dbClient = client;