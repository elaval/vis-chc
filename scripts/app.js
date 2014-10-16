'use strict';
/**
* @ngdoc object
* @name ngAnimate
* @description
*/
angular
  .module('chilecompraApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'tide-angular',
    'underscore',
    'd3service',
    'ui.bootstrap'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/licitaciones.html',
        controller: 'LicitacionesController',
        controllerAs: 'controller'
      })
      .when('/activas', {
        templateUrl: 'views/licitacionesActivas.html',
        controller: 'LicitacionesActivasController',
        controllerAs: 'controller'
      })
      .when('/historico', {
        templateUrl: 'views/licitaciones.html',
        controller: 'LicitacionesController',
        controllerAs: 'controller'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

