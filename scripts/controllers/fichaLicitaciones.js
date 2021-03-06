'use strict';
/* jshint undef: true, unused: true */
/* global angular */




/**
 * @ngdoc controller
 * @name chilecompraApp.controller:CarrerasController
 * @requires $scope
 *
 */
angular.module('chilecompraApp').controller('ModalInstanceCtrl', function ($scope, $http, $modalInstance, $location, licitacion, nodesAndLinks, licitacionDataService) {
  var myself = this;

  this.licitacion = licitacion;
  this.nodes = nodesAndLinks.nodes;
  this.links = nodesAndLinks.links;

  this.ok = function () {
    $modalInstance.dismiss('cancel');
  };

  this.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  myself.gettingData = true;
  $http.jsonp('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?codigo='+licitacion['CodigoExterno']+'&ticket=615F615F-3B2E-458D-A6E6-C1AEAAE85CC7&callback=JSON_CALLBACK').
    success(function(data, status, headers, config) {
        if (data.Listado) {
          myself.fichaLicitacion = data.Listado[0];
        } else {
          myself.fichaLicitacion = null;
        }
        
        licitacionDataService.similarNodes2(licitacion['CodigoExterno'])
        .then(function(similarNodes) {
          myself.nodes = similarNodes.nodes;
          myself.links = similarNodes.links;
        })


        myself.gettingData = false;
        // this callback will be called asynchronously
        // when the response is available
    }).
    error(function(data, status, headers, config) {
        myself.gettingData = false;
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

  this.GoToRelated = function() {
    $location.path('licitacion/1636-205-L114');
  }

});

