'use strict';
/* jshint undef: true, unused: true */
/* global angular */

/**
 * @ngdoc controller
 * @name fondecytApp.controller:CursosController
 * @requires $scope
 * @requires fondecytApp.CursosDataService
 *
  * @description
 *
 * Controller for Cursos explorer
 *
 */
 angular.module('fondecytApp')
 .controller('CursosController', ['$scope', 'CursosDataService', function ($scope, dataService) {

  this.tooltipMessage = function(d) {
    var msg = '';
    msg += 'Unidad: ' + d.unidad + '<br>';
    msg += 'Curso: ' + d.sigla + '<br>';
    msg += 'Número de estudiantes: ' + d.n + '<br>';
    msg += 'Promedio Act. Sakai: '+(+d.promedio_sakai).toFixed(2) +'<br>';
    msg += 'Promedio Notas: '+(+d.promedio_notas).toFixed(2) +'<br>';
    msg += 'Pendiente: '+(+d.slope).toFixed(4) +'<br>';
    msg += 'R2: '+(+d.r2).toFixed(2) +'%<br>';


    return msg;
  };

  this.tooltipMessageCurso = function(d) {
    var msg = '';
    msg += 'Curso: ' + d.sigla + '<br>';
    msg += 'Promedio Act. Sakai: '+d.actividades_sakai +'<br>';
    msg += 'Promedio Notas: '+(+d.nota_final).toFixed(2) +'<br>';
    msg += 'Dependencia: '+d.dependencia +'<br>';
    msg += 'Género: '+d.genero +'<br>';
    msg += 'Carrera: '+d.carrera +' ('+d.agnosEnCarrera+' año)<br>';
    msg += 'Unidad: '+d.unidad +'<br>';


    return msg;
  };



  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#colorOptions
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {array}  colorOptions Listado con opciones de atributo para categorizar por colores
  */
  this.colorOptions = [
    {label:'Genero', value:'genero'},
    {label:'Dependencia', value:'dependencia'},
    {label:'Carrera', value:'carrera'},
    {label:'Area', value:'area'},
    {label:'Año en la carrera', value:'agnosEnCarrera'}
  ];
  this.colorAttribute = 'genero';

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

  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#colorAttribute
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {string}  colorAttribute atributo seleccionado para categorizar por colores
  */
  this.colorAttribute = 'carrera';


  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#cursosPorUnidadData
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {array}  Datos correspondientes a los cursos de la unidad seleccionada
  * @description
  * Cada registro es un objecto que contiene información agregada por curso (r2, promedio_sakai, ...)
  */
  this.cursosPorUnidadData = [];

  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#estudiantesPorCursoData
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {array}  Datos correspondientes a los estudiantes del curso seleccionado
  * @description
  * Cada registro es un objecto que contiene información detallada de cada estudiante (actividades_sakai, prom_notas, ...)
  */
  this.estudiantesPorCursoData = [];


  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#minEstudiantesPorCurso
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {int}  Define el número mínimo de estudiantes por curso a ser seleccionado
   */
  this.minEstudiantesPorCurso = 15;


 /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#unidades
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {array}  Lista con las unidades académicas disponibles para ser seleccionadas
  */
  this.unidades = [];


  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#semestres
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {array}  Lista con los semestres disponibles para ser seleccionados
  */
  this.semestres = ['2012 (II)','2013 (I)'];

  /**
  * @ngdoc property
  * @name fondecytApp.controller:CursosController#selectedSemestre
  * @propertyOf fondecytApp.controller:CursosController
  * @returns {string}  Semestre seleccionado
  */
  this.selectedSemestre = '2013 (I)';

  // Monitorea si se cambia el curso seleccionado en el gráfico de cursos, y actualiza la selección de sus estudiantes
  $scope.$watch(function() {return this.selectedCurso;}.bind(this), function() {
    this.updateEstudiantesPorCursodata();
  }.bind(this));


  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateSemestre
  * @methodOf fondecytApp.controller:CursosController
  * @description 
  * Actualiza selección datos de cursos & estudiantes por curso (utilizado luego de un cambio en la selección de semestre)
  */
  this.updateSemestre = function() {
    this.updateCursosPorUnidadData();
    this.updateEstudiantesPorCursodata();
  };

  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateCursosPorUnidadData
  * @methodOf fondecytApp.controller:CursosController
  * @description 
  * Updates the data for all the courses corresponing to the selected unit & semester
  */
  this.updateCursosPorUnidadData = function() {
    dataService.dataCursosPorUnidad({'semestre': this.selectedSemestre, 'unidad': this.selectedUnidad, 'minRecords' : this.minEstudiantesPorCurso}).then(function(data) {
      this.cursosPorUnidadData = data;
      this.n = this.cursosPorUnidadData.length;
    }.bind(this));
  };

  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateEstudiantesPorCursodata
  * @methodOf fondecytApp.controller:CursosController
  * @description 
  * Updates the data corresponing to all the students from a particular course & semester
  */
  this.updateEstudiantesPorCursodata = function() {
    if (this.selectedCurso) {
      dataService.dataEstudiantesPorCurso({'sigla':this.selectedCurso.sigla, 'semestre': this.selectedSemestre}).then(function(data) {
        this.estudiantesPorCursoData = data;
      }.bind(this));
    } else {
      this.estudiantesPorCursoData = [];
    }

  };

  /**
  * @ngdoc function
  * @name fondecytApp.CarrerasController:updateUnidadesData
  * @methodOf fondecytApp.controller:CursosController
  * @description 
  * Updates the list of valid academic units (unidades academicas).
  * Once updated, will assign the first unit to selectedUnidad and will update the data for all the courses in that unit.
  */
  this.updateUnidadesData = function() {
    dataService.unidades(this.minEstudiantesPorCurso).then(function(unidades) {
      this.unidades = unidades;
      this.selectedUnidad = this.unidades[0].name;
      this.updateCursosPorUnidadData();
    }.bind(this));
  };

  this.updateUnidadesData();


}]);


/**
 * @ngdoc service
 * @name fondecytApp.CursosDataService
 * @requires $q
 * @requires d3
 * @requires _
 *
 * @description
 * Manages data corresponidng to cursos at PUC
 *
 */
angular.module('fondecytApp')
.service('CursosDataService', ['$q','_', 'd3', function($q,_, d3){
  var dataManager = {};

  var datadir = './data/';

  var cursosurl = datadir+'cursos.txt';
  var cursosdir = datadir+'cursos/';


  var cursosData = [];

  // Almacena los arreglos con datos de estudiantes para cada curso
  // dataEstudiantesPorCurso = {'A001':[...], 'A002':[...]}
  var dataPorCurso = {};

  /* dataSetup - Configuración inicial a los datos
  *
  */
  var dataSetup = function(data) {
    _.each(data, function(d) {

      d.r2 = d.r2*100;
    });
    return(data);
  };


  /**
   * Initial setting or modification of attributes in  data set 
   */ 
  var dataSetupEstudiantes = function(data) {
    angular.forEach(data, function(d) {
      if (d.agnosEnCarrera >= 7) {
        d.agnosEnCarrera = '7 o más'
      }
    })
  }


  // Initial filter of loaded data
  var startupFilter = function(data) {
    // Filtra sólo datos para cursos con alguna actividad en Sakai y datos válidos de r2
    var filteredData = _.filter(data, function(d) {
      return ((+d.r2>0) && (+d.promedio_sakai > 0)) ;
    });

    return filteredData;
  };

  // Initial data Setup
  // Creation or change in attribute
  var init = function() {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    // Chequear si ya se cargaron los datos

    if (cursosData.length) {
      deferred.resolve();
    } else {
      // Carga de datos (utilizano d3js)  
      d3.tsv(cursosurl, function(error, data) {
        data = startupFilter(data);
        cursosData = dataSetup(data);

        deferred.resolve();
      });
    }

    return deferred.promise;
  };

 /**
  * @ngdoc function
  * @name fondecytApp.CursosDataService:unidades
  * @methodOf fondecytApp.CursosDataService
  * @param {int} minEstudiantesPorCurso Mínimo número de estudiantes por curso para ser incluido en los datos
  * @returns {promise} promise con el listado de unidades
  *
  * @description
  * Retorna una promesa que entregará el listado de unidades a partir de los datos de cursos (que tengan más de minEstudiantesPorCurso)
  */
  this.unidades = function(minEstudiantesPorCurso) {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    init().then(function() {

      // Genera objecto con claves c/r a todas las carreras
      // {Medicina: [{}, {}, {}], Ingenieria: [{},{}], ...}
      var filteredData = _.filter(cursosData, function(d) {return d.n > minEstudiantesPorCurso;});
      var unidadesTmp = _.groupBy(filteredData, function(d) {return d.unidad;});

      // Lista con objetos del tipo {name: Medicina, size:1234}
      var unidades = [];

      _.each(_.keys(unidadesTmp), function(d) {
        var name = d;
        var numRecords = unidadesTmp[d].length;

        unidades.push({'name':name, 'size':numRecords});
      }.bind(this));

      // Ordena las unidades filtradas por orden alfabético
      unidades = _.sortBy(unidades, function(d) {return d.name;});

      deferred.resolve(unidades);
    });

return deferred.promise;
};

/**
* @ngdoc function
* @name fondecytApp.CursosDataService:dataCursosPorUnidad
* @methodOf fondecytApp.CursosDataService
* @param {object} filter parametros para filtrar datos de cursos
* @param {string} filter.unidad Unidad académica a la que pertenece el curso
* @param {string} filter.semestre Semestre para el cual se requiere el listado de cursos
* @param {int} filter.minRecords Mínimo número de estudiantes por curso para ser seleccionado
* @returns {promise} promise con los datos de los cursos de la unidad seleccionada
*
* @description
* Retorna una promesa que entregará el listado de unidades a partir de los datos de cursos (que tengan más de minEstudiantesPorCurso)
*/
this.dataCursosPorUnidad = function(filter) {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    var unidad = filter.unidad ? filter.unidad : '';
    var semestre = filter.semestre ? filter.semestre : '';
    var minRecords = filter.minRecords ? filter.minRecords : 0;

    var data = [];

    init().then(function() {
      data = _.filter(cursosData, function(d) {
        return (d.unidad === unidad && d.semestre === semestre && +d.n >= minRecords);
      });

      deferred.resolve(data);
    });


    return deferred.promise;
  };


  /**
  * @ngdoc function
  * @name fondecytApp.CursosDataService:semestres
  * @methodOf fondecytApp.CursosDataService
  * @returns {promise} promise con el listado de semestres disponibles en los datos de cursos
  *
  * @description
  * Retorna una promesa que entregará el listado de semestres disponibes en el listado de cursos
  */
  this.semestres = function() {

    var deferred = $q.defer();

    init().then(function() {
      var semestresObj = _.groupBy(cursosData, function(d) {return d.semestre;});
      var semestres = _.keys(semestresObj).sort();

      deferred.resolve(semestres);
    });

    return deferred.promise;
  };

  /**
  * @ngdoc function
  * @name fondecytApp.CursosDataService:dataEstudiantesPorCurso
  * @methodOf fondecytApp.CursosDataService
  * @returns {promise} promise con datos de estudiantes de un curso y semestre específico
  * @param {object} filter parametros para filtrar datos de estudiantes
  * @param {string} filter.curso Curso al que pertenecen los estudiantes
  * @param {string} filter.semestre Semestre para el cual se requieren los datos
  *
  * @description
  * Retorna una promesa que entregará arreglo de datos para los estudiantes de un curso y semestre dado
  */
  this.dataEstudiantesPorCurso = function(filter) {
    var deferred = $q.defer();

    var sigla = filter.sigla ? filter.sigla : 'S/I';
    var semestre = filter.semestre ? filter.semestre : '';

    var outdata = [];

    // Revisar si se han cargado los datos del curso
    if (dataPorCurso[sigla]) {
      outdata = _.filter(dataPorCurso[sigla], function(d) {
        return (d.semestre === semestre);
      });
      deferred.resolve(outdata);
    } else {
      // Carga de datos (utilizano d3js)  
      d3.tsv(cursosdir+sigla+'.txt', function(error, data) {
        dataSetupEstudiantes(data);
        dataPorCurso[sigla] = data;
        outdata = _.filter(dataPorCurso[sigla], function(d) {
          return (d.semestre === semestre);
        });
        deferred.resolve(outdata);
      });

      
    }

    return deferred.promise;
  };



}]);





