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
    'ui.bootstrap',
    'angular-loading-bar',
//    'ngAnimate'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/licitacionesActivas.html',
        controller: 'LicitacionesActivasController',
        controllerAs: 'controller'
      })
      .when('/activas', {
        templateUrl: 'views/licitacionesActivas.html',
        controller: 'LicitacionesActivasController',
        controllerAs: 'controller'
      })
      .when('/historicas', {
        templateUrl: 'views/licitacionesHistoricas.html',
        controller: 'LicitacionesHistoricasController',
        controllerAs: 'controller'
      })
      .when('/licitacion/:licitacionId', {
        templateUrl: 'views/licitacion.html',
        controller: 'LicitacionController',
        controllerAs: 'controller'
      })
      .when('/licitacion', {
        templateUrl: 'views/licitacion.html',
        controller: 'LicitacionController',
        controllerAs: 'controller'
      })

 
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }])

angular.module('chilecompraApp')
.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                this.select();
            });
        }
    };
});