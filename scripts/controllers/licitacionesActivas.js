'use strict';
/* jshint undef: true, unused: true */
/* global angular */




/**
 * @ngdoc controller
 * @name chilecompraApp.controller:CarrerasController
 * @requires $scope
 * @requires chilecompraApp.CarrerasDataService
 *
 * @property {array} colorOptions Array with options for colorAttributes
 * @property {string} colorAttribute Selected color attribute
 * @property {array} data Array with student data for the selected career & semester
 * @property {int} n Number of students in the selected data array
 * @property {int} maxCarreras Maximum number of carreras to be displayed when filtraTopCarreras is true
 * @property {array} semestres Array with the semesters options to be chosen
 * @property {string} selectedSemestre Selected semester for data selection
 * @property {string} psuValido Flag to select only data values with a valid psu score (prom_paa>0)
 * @property {string} loading Flag to show a "loading" message when its value is true
 * @description
 *
 * Controller for Carreras explorer
 *
 */
angular.module('chilecompraApp')
.controller('LicitacionesActivasController', ['$scope','$http','$modal', 'LicitacionesDataService',function ($scope,$http,$modal, dataService) {
  var myself = this;

  this.cloudText = [];

  this.today = new Date();

  this.clear = function () {
    //myself.fecha = null;
  };

  this.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    myself.opened = true;
  };

  this.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  var myself = this;

  this.data = null;
  this.search = null;

  this.tooltipMessage = function(d) {
      var msg = "Nombre" + " : " + d["Nombre"];
      msg += "<br>" + "Estado" +  " : " + myself.estados[d["CodigoEstado"]];
      msg += "<br>" + "Código" +  " : " + d["CodigoExterno"];

      return  msg;
  };

  this.estados = {
  };
  this.estados[5] = "Publicada";
  this.estados[6] = "Cerrada";
  this.estados[7] = "Desierta";
  this.estados[8] = "Adjudicada";
  this.estados[15] = "Revocada";
  this.estados[16] = "Suspendida";
  this.estados[18] = "Revocada";
  this.estados[19] = "Suspendida";

  this.excludedTokens = [
    "2013","2014",
    "de","para","del","en","con","al",
    "la","el","los","un",
    "compra","adquisición","adquisicion","adq", "adq.",
    "y","a","e","i","o","u","x","ii",
    "nº","/","n°","-",
    "0","1","2","3","4","5","6","7","8","9","10","sc",
  ];

  this.getDateParam = function(inputDate) {
    var dateObj = new Date(inputDate),
      month,
      day,
      year,
      outputDate;

    month = dateObj.getMonth() + 1; //months from 1-12
    month = month < 10 ? '0'+month : ''+month;

    day = dateObj.getDate();
    day = day < 10 ? '0'+day : ''+day;
 
    year = dateObj.getFullYear();

    outputDate = day+month+year
 
    return outputDate;
  }
  
  this.updateData = function() {
    var dateParameter = myself.getDateParam(myself.fecha);

    myself.gettingData = true;

    myself.data = [];
    myself.search = null;

    myself.dontDisplay = true;

    $http.jsonp('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?estado=activas&ticket=615F615F-3B2E-458D-A6E6-C1AEAAE85CC7&callback=JSON_CALLBACK').
    success(function(data, status, headers, config) {
        myself.data = data.Listado;
        myself.gettingData = false;

        myself.initWorlde(myself.data);
        // this callback will be called asynchronously
        // when the response is available
    }).
    error(function(data, status, headers, config) {
        myself.gettingData = false;
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });
  }


  this.openModal = function (size) {

    var modalInstance = $modal.open({
      templateUrl: 'views/fichaLicitacion.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
          licitacion: function() {
            return {name:'a'}
          },
          items: function () {
            return [];
          }
      }
    });
  }

  this.changeSearch = function() {
    if (myself.search.length > 2) {
      myself.searchText = myself.search;
    }
  }

  this.clickHandlerCloud = function(d) {

    $scope.$apply(function() {
      myself.searchText = d.text;
      myself.dontDisplay = false;     
    })

  }

  this.clickHandler = function(d) {

    var modalInstance = $modal.open({
      templateUrl: 'views/fichaLicitacion.html',
      controller: 'ModalInstanceCtrl',
      controllerAs: 'controller',
      size: 'lg',
      resolve: {
          licitacion: function() {
            return d
          }
      }
    });
  }


  this.initWorlde = function(data) {
    var texts = [];

    data.forEach(function(d) {
      texts.push(d.Nombre);
    })

    myself.cloudText = texts;
  }



 

  this.fecha = new Date();
  this.updateData();

}]);
