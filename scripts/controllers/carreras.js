'use strict';
/* jshint undef: true, unused: true */
/* global angular */




/**
 * @ngdoc controller
 * @name fondecytApp.controller:CarrerasController
 * @requires $scope
 * @requires fondecytApp.CarrerasDataService
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
angular.module('fondecytApp')
.controller('CarrerasController', ['$scope','CarrerasDataService',function ($scope, dataService) {

   this.tooltipMessage = function(d) {
    var msg = '';
    msg += 'Genero: ' + d.genero + '<br>';
    msg += 'Dependencia: ' + d.dependencia + '<br>';
    msg += 'Carrera: '+d.carrera + ' ('+d.agnosEnCarrera+' año)<br>';
    msg += 'Actividades Aleph: '+d['actividades_aleph'] +'<br>';
    msg += 'Actividades EZProxy: '+ (+d.actividades_ezproxy) +'<br>';
    msg += 'Actividades Sakai: '+d.actividades_sakai +'<br>';
    msg += 'Promedio notas: '+(+d.promedio_notas).toFixed(2) +'<br>';
    msg += 'Puntaje Z por carrera: '+(+d.zscore_carrera).toFixed(2) +'<br>';
    msg += 'Promedio PSU: '+d.prom_paa +'<br>';

    return msg;
  };

  this.useStandarizedScores = false;
  this.yAttribute = "promedio_notas";  // For standarized scores use 'zscore_carrera'

  this.testData = [{genero:"M"}, {genero:"F"}];

  this.testFilter = function(d) {

      return d.genero == "M";

  }
 

  // Opciones para categorización pro colores
  this.colorOptions = [
    {label:'Genero', value:'genero'},
    {label:'Dependencia', value:'dependencia'},
    {label:'Año en la carrera', value:'agnosEnCarrera'}
  ];
  this.colorAttribute = 'genero';

 // Opciones para tipo de actividad en Aleph
  this.alephActivityOptions = [
    {label:'Todas', value:'actividades_aleph'},
    {label:'Digital', value:'actividades_aleph_digital'},
    {label:'Impreso', value:'actividades_aleph_impreso'},
    {label:'Espacio', value:'actividades_aleph_espacio'}
  ];
  this.alephActivity = this.alephActivityOptions[0];

 // Opciones para tipo de actividad en Aleph
  this.sakaiActivityOptions = [
    {label:'Todas', value:'actividades_sakai'},
    {label:'Contenido', value:'actividades_sakai_contenido'},
    {label:'Leer', value:'actividades_sakai_leer'},
    {label:'Escribir', value:'actividades_sakai_escribir'},
    {label:'Personal', value:'actividades_sakai_personal'},
    {label:'Información', value:'actividades_sakai_informacion'},
    {label:'Test', value:'actividades_sakai_test'}
  ];
  this.sakaiActivity = this.sakaiActivityOptions[0];


   this.agnoIngresoOptions = [
    {label:'Todos', value:'todos'},
    {label:'1er año ', value:'1'},
    {label:'2do año', value:'2'},
    {label:'3er año', value:'3'},
    {label:'4to año', value:'4'},
    {label:'5to año', value:'5'},
    {label:'6to año', value:'6'},
    {label:'7mo o más', value:'7 o más'}
  ];
  this.agnoIngreso = 'todos'

  this.generoOptions = [
    {label:'Todos', value:'todos'},
    {label:'Hombres ', value:'M'},
    {label:'Mujeres', value:'F'}
  ];
  this.generoSelected = 'todos'


  // Opciones de semestres
  this.semestres = ['2012 (II)','2013 (I)'];
  this.selectedSemestre = '2013 (I)';

  // Opciones de semestres
  this.dependenciaOptions = ['Todas','Municipal','Particular Subvencionado','Particular Pagado'];
  this.dependenciaSelected = 'Todas';

  // Data records (one record per student) & number of records
  this.allData = [];
  this.data = [];

  // Subconjunto de data que contiene solo registros con valores válidos de PSU
  this.psudata = [];

   // Genera un arreglo con registrod que contengan datos validos de PSU
  var validPSUData = function(data) {
    var validdata = [];

    angular.forEach(data, function(d) {
      if (+d.prom_paa > 0) {
       validdata.push(d);
      }
     });

    return validdata;
  }


  // Número de estudiantes en el data set
  this.n = null;

  // Cantidad minima de estudiantes por carrera para lista por default
  this.minEstudiantesPorCarrera = 150;

  // Flag para filtrar carreras más numerosas
  this.mostrarTodasLasCarreras = true;

  // Lista de carreras
  this.carreras = [];

  // Incluir todos los datos (incluso datos de PSU no válidos)
  this.incluirPSUInvalida = false;

  // Loading data - when true, display a message
  this.loading = false;
  
  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateCarreras
  * @methodOf fondecytApp.controller:CarrerasController
  * @description 
  * Updates the list of valid careers to be displayed (this.carreras) acording to the option this.filtraTopCarreras.
  * If this.filtraTopCarreras is true, it will select a maximum of this.maxCarreras, if not it will display all careers. 
  * 
  * Once updated, will assign the first career to this.selectedCarrera.
  */
  this.updateCarreras = function() {
    var minEstudiantesPorCarrera =  this.mostrarTodasLasCarreras ? "":this.minEstudiantesPorCarrera;
    this.loading = true;
    dataService.carreras(minEstudiantesPorCarrera).then(function(carreras) {
      this.loading = false;
      this.carreras = carreras;
      this.selectedCarrera = this.carreras[0].name;
      this.updateStudentData();
    }.bind(this));
  };

  
  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateStudentData
  * @methodOf fondecytApp.controller:CarrerasController
  * @description 
  * Updates data for the selected carrera & semestre 
  */
 this.updateStudentData = function() {
    this.loading = true;
    dataService.estudiantesPorCarrera({
        'semestre': this.selectedSemestre, 
        'carrera': this.selectedCarrera, 
        'agnoEnCarrera':this.agnoIngreso,
        'dependencia':this.dependenciaSelected,
        'genero':this.generoSelected
      })
    .then(function(data) {
      this.loading = false;
      this.allData = data;
      this.data = data;
      this.psudata = validPSUData(data);
      this.n = this.data.length;
    }.bind(this));
  };

  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateScoreType
  * @methodOf fondecytApp.controller:CarrerasController
  * @description 
  * Updates changes the yAttribute from raw average to standarised score 
  */
  this.updateScoreType = function() {
    if (this.useStandarizedScores) {
      this.yAttribute = 'zscore_carrera';
    } else {
      this.yAttribute = 'promedio_notas';
    }
  }

  // Initial loading of carreras & student data
  this.updateCarreras();


}]);


/**
 * @ngdoc service
 * @name fondecytApp.CarrerasDataService
 * @requires $q
 * @requires d3
 * @requires _
 *
 * @description
 * Manages data corresponidng to carreras at PUC
 *
 */
angular.module('fondecytApp')
.service('CarrerasDataService',['$q', 'd3', '_',function($q, d3,_) {

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
   * @name fondecytApp.CarrerasDataService:carreras
   * @methodOf fondecytApp.CarrerasDataService
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





