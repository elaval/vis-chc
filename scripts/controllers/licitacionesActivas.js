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
.controller('LicitacionesActivasController', ['$scope','$http','$location','$modal','$filter', 'termRelationsService', 'licitacionDataService',function ($scope, $http, $location, $modal, $filter, termRelations, licitacionDataService) {
  var myself = this;

  this.cloudText = [];

  this.today = new Date();

  this.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    myself.opened = true;
  };

  var myself = this;

  this.data = null;
  this.search = null;

  this.tooltipMessage = function(d) {
      ga('send', 'event', 'licitacion', 'tooltip', d["CodigoExterno"]);

      var mensajeDias = d["FechaCierre"] == null ? "Se asume hoy" : d.diasParaCierre == 0 ? "Hoy" : d.diasParaCierre == 1 ? "Falta 1 día" : "Faltan "+d.diasParaCierre+" días";
      var mensajeFechaCierre = d["FechaCierre"] !== null ? $filter('date')(new Date(d["FechaCierre"]), 'mediumDate') : "No especificada"

      var msg = "<strong>"+ d["Nombre"] +"</strong>";
      msg += "<br>"+ "Fecha de cierre: "+ mensajeFechaCierre + " ("+mensajeDias+")."
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

  this.categoriaCierre = {
    '01dia' : 'Cierre hoy',
    '07dias' : 'Cierre en 7 días',
    '30dias' : 'Cierre en 30 días',
    'sobre30dias' : 'Cierre sobre 30 días',
  };
  


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
    myself.apiError = false;

    licitacionDataService.getActivas()
    .then(function(data) {
      myself.data = data;
      myself.gettingData = false;
      licitacionDataService.getAllTags()
      .then(function(tags) {
        myself.cloudText = tags;
      })


       
    })
    .catch(function(err) {
      myself.gettingData = false;
      myself.apiError = true;
    })
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
      myself.similarTerms = termRelations.similarTerms(myself.searchText);
    }
  }

  this.clickHandlerCloud = function(d) {
    ga('send', 'event', 'cloudword', 'select', d.text);

    $scope.$apply(function() {
      myself.searchText = d.text;
      myself.dontDisplay = false;   
      //myself.similarTerms = termRelations.similarTerms(myself.searchText);
    })

  }

  this.clickHandler = function(d) {
    ga('send', 'event', 'licitacion', 'open', d.CodigoExterno);



    //$location.path("/licitacion/"+d.CodigoExterno)

    
    //var nodesAndLinks = termRelations.similarNodes(d);

    licitacionDataService.similarNodes2(d.CodigoExterno)
    .then(function(similarNodes) {

      var modalInstance = $modal.open({
        templateUrl: 'views/fichaLicitacion.html',
        controller: 'ModalInstanceCtrl',
        controllerAs: 'controller',
        size: 'lg',
        resolve: {
            licitacion: function() {
              return d;
            },
            nodesAndLinks: function() {
              return similarNodes;
            }
        }
      });


    })



    
  }


  this.initWorlde = function(data) {
    var texts = [];

    data.forEach(function(d) {
      texts.push(d.Nombre);
    })

    myself.cloudText = texts;
  }


  this.searchSimilar = function(term) {
    myself.similarTerms = termRelations.similarTerms(term);
  }


  this.fecha = new Date();
  this.updateData();

}]);

