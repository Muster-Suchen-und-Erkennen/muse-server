/**
 * Created by michaelfalkenthal on 10.07.14.
 */
'use strict';

var film = require('./film');
var Q = require('q');

Q.all([
    film.loadFilm(43),
    film.loadFilm(44),
    film.loadFilm(45)
]).spread(function(film1, film2, film3){
    console.log(film1);
    console.log(film2);
    console.log(film3);
});