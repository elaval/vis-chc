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
.controller('LicitacionesController', ['$scope','$http','$modal', 'LicitacionesDataService',function ($scope,$http,$modal, dataService) {
  var myself = this;

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

    $http.jsonp('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?fecha='+dateParameter+'&ticket=615F615F-3B2E-458D-A6E6-C1AEAAE85CC7&callback=JSON_CALLBACK').
    success(function(data, status, headers, config) {
        console.log(data);
        myself.data = data.Listado;
        myself.gettingData = false;
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

  this.fecha = new Date();
  this.updateData();

}]);

angular.module('chilecompraApp').controller('ModalInstanceCtrl', function ($scope, $http, $modalInstance, licitacion) {
  var myself = this;

  this.licitacion = licitacion;
 
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
        
        myself.gettingData = false;
        // this callback will be called asynchronously
        // when the response is available
    }).
    error(function(data, status, headers, config) {
        myself.gettingData = false;
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });


});

/**
 * @ngdoc service
 * @name chilecompraApp.CarrerasDataService
 * @requires $q
 * @requires d3
 * @requires _
 *
 * @description
 * Manages data corresponidng to carreras at PUC
 *
 */
angular.module('chilecompraApp')
.service('LicitacionesDataService',['$q', 'd3', '_',function($q, d3,_) {

  // Directory with data files
  var datadir = './data/';

  // File location of carreras catalogue (one record per career) 
  var carrerasurl = datadir+'carreras.txt';

  // Directory where each career individual file is located 
  var estudiantesPorCarreraDataDir = datadir+"carreras/";
  
  // Dictionary that holds, for each career, an array with the records for each student in that career
  var carrerasData = {};
  var estudiantesPorCarreraData = {};

  // Dictionary that willl hold each career's basic info (name, num. records & filename)
  var carreras = {};

  /**
   * Ensures that the carreras catalogue is loaded (file with each carrer's name, number of records and individual filenam).
   * Returns a promise which is resolved when the data is loaded
   */
  function init() {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    // Check if it os already loaded
    if (_.keys(carreras).length>0) {
      deferred.resolve();
    } else {
      // Load data file and build a dictionary - carreras - with each carrera and it's corresponding record  
      d3.tsv(carrerasurl, function(error, data) {
        _.each(data, function(d) {
          carreras[d.carrera]=d;
        });
        deferred.resolve();
      });
    }

    return deferred.promise;
  };

  /**
   * Startup filter to allow only valid data records for students data
   */ 
  var startupFilter = function(data) {
    var filteredData = data;
    //filteredData = _.filter(filteredData, function(d) {return d.prom_paa >0;});

    return filteredData;
  };

  /**
   * Initial setting or modification of attributes in  data set 
   */ 
  var dataSetup = function(data) {
    angular.forEach(data, function(d) {
      if (d.agnosEnCarrera >= 7) {
        d.agnosEnCarrera = '7 o más'
      }
    })
  }

  /**
   * @ngdoc function
   * @name chilecompraApp.CarrerasDataService:carreras
   * @methodOf chilecompraApp.CarrerasDataService
   * @param {int} maxCarreras Máximum number of data items to return (select the top with more associated records)
   * @returns {promise} promise that would return data arary with carerras
   *
   * @description
   * Return a promise that will deliver the array with carreras.
   * Select the top number of carreras (maxCarreras) according to the number of records per carrera.  If maxCarreras is undefined, selects all records 
   *
   */
  this.carreras = function(maxCarreras) {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    init().then(function() {
      var nombresCarreras = _.keys(carreras);

      var top = [];

      // Select a mximum number of carreras if defined

      if (maxCarreras) {
        top = _.first(_.sortBy(nombresCarreras, function(d) {return -carreras[d].n;}), maxCarreras).sort();
      } else {
        top = nombresCarreras.sort();
      }

      top = nombresCarreras.sort();

      var output = _.map(top, function(d) {
        return {name:d, size:carreras[d].n, area:carreras[d].area};
      });

      if (maxCarreras) {
        output = _.filter(output, function(d) {
          return d.size > maxCarreras;
        });
      }


      deferred.resolve(output);
    });
    
    return deferred.promise;
  };

  

  this.estudiantesPorCarrera = function(filter) {
    var deferred = $q.defer();

    var carrera = filter.carrera ? filter.carrera : '';
    var semestre = filter.semestre ? filter.semestre : '2013 (I)';
    var agnoEnCarrera = filter.agnoEnCarrera ? filter.agnoEnCarrera : 'todos';
    var dependencia = filter.dependencia ? filter.dependencia : 'Todas';
    var genero = filter.genero ? filter.genero : 'todos';

    // Check if a data record passes the data filter
    var passFilter = function(d) {
      var accepted = true;

      accepted =  accepted && (d.semestre===semestre);

      if (agnoEnCarrera == 'todos') {
        accepted =  accepted && true;
      } else if (agnoEnCarrera == '7 o más') {
        accepted =  accepted && ((d.agnosEnCarrera >= 7) || (d.agnosEnCarrera >= '7 o más')) ;
      } else {
        accepted =  accepted && (agnoEnCarrera == d.agnosEnCarrera);
      } 

      if (dependencia === 'Todas') {
        accepted =  accepted && true;
      } else {
        accepted =  accepted && (d.dependencia===dependencia);
      }

      if (genero === 'todos') {
        accepted =  accepted && true;
      } else {
        accepted =  accepted && (d.genero==genero);
      }


      return accepted
    }

    // Initialize data load ... an then proceed to update
    init().then(function() {
      var carreraFile = carreras[carrera].filename;
      var filteredData = [];

      // Chek if the datafile has already been loaded
      if (estudiantesPorCarreraData[carrera]) {

        filteredData = _.filter(estudiantesPorCarreraData[carrera], passFilter);

        deferred.resolve(filteredData);
      } else {
        // Load data file  
        var datafile = estudiantesPorCarreraDataDir+carreraFile;
        d3.tsv(datafile, function(error, data) {

          dataSetup(data);

          estudiantesPorCarreraData[carrera] = startupFilter(data);

          // Fiter data for the corresponding semester only
          filteredData = _.filter(estudiantesPorCarreraData[carrera], passFilter);

          deferred.resolve(filteredData);
        });
      }
    });

 

    return deferred.promise;
  };
  
}]);





