'use strict';
/* jshint undef: true, unused: true */
/* global angular */




/**
 * @ngdoc controller
 * @name chilecompraApp.controller:CarrerasController
 * @requires $scope
 *
 */
angular.module('chilecompraApp').controller('LicitacionController',[ '$scope', '$http', '$routeParams', '$location','termRelationsService','licitacionDataService', function ($scope, $http, $routeParams, $location, termRelations, licitacionDataService) {
  var myself = this;

  this.licitacionId = $routeParams.licitacionId

  myself.gettingData = true;

  licitacionDataService.getLicitacion(this.licitacionId)
  .then(function(data) {
    myself.fichaLicitacion = data;
    licitacionDataService.similarNodes2(myself.licitacionId)
    .then(function(similarNodes) {
      myself.nodes = similarNodes.nodes;
      myself.links = similarNodes.links;
    })
    myself.gettingData = false;

    //var a = licitacionDataService.getAllTags();
  })
  .catch(function(err) {
    myself.fichaLicitacion = null;
    myself.gettingData = false;
  })


}]);

angular.module('chilecompraApp')
.factory("nodesData", function() {
  var nodesData = {};

  nodesData.nodes = {};
  nodesData.terms = {};

  return nodesData

})

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
angular.module('chilecompraApp')
.service('termRelationsService',['$q', 'd3', '_', 'nodesData',function($q, d3,_, nodesData) {
  var myself = this;
  var minCount = 1;
  var maxNumber = 1000;

  //var nodes = nodesData.nodes;
  //var terms = nodesData.terms;
  var nodes = {};
  var terms = {};

  var excludedTerms = [
    "2013","2014",
    "de","para","del","en","con","al",
    "la","el","los","un","las",
    "compra","adquisición","adquisicion","adq", "adq.",
    "y","a","e","i","o","u","x","ii",
    "nº","/","n°","-",
    "0","1","2","3","4","5","6","7","8","9","10","sc",
  ];




  // getTokens receives an array with "strings" (several words per string)
  // It will identigy and count each of the words found
  // and returns an array with toen objects: {text: xxx, num: nnn}
  this.process = function(data) {

    _.each(data, function(d) {
      var key = d.CodigoExterno;
      var text = d.Nombre.toLowerCase();
      var tokens = text.match(/([a-zA-Zá-úÁ-Ú']+)/g);

      nodes[key] = d;

      if (!d.terms) {
        d.terms = {};
      }

      _.each(tokens, function(t) {
        if (isNaN(t) && excludedTerms.indexOf(t) == -1 && t.length > 2 ) {
          if (!terms[t]) {
            terms[t] = {text:t, num:0, nodes:{}}
          }

          terms[t].num = terms[t].num+1;
          terms[t].nodes[key] = true;

          d.terms[t] = true;
        }
      })


    })


    return this
  }

  this.terms = function () {
    var termArray = [];

    d3.keys(terms).forEach(function(t) {
      if ((terms[t].num>minCount)) {
        termArray.push(terms[t]);
      }
    })

    termArray = _.sortBy(termArray, function(d) {return -d.num});


    return _.first(termArray,maxNumber);
  }

  this.similarTerms = function(term) {
    var similar = [];

    var distance = term.length < 8 ? 1 : 2;

    if (term.length >2) {
      _.each(_.keys(terms), function(d) {
        if (d != term && new Levenshtein (d,term) <= distance) {
          similar.push(d);
        }
      });      
    }


    return similar;
  }

  this.similarNodes2 = function(nodeId) {
    var node = nodes[nodeId];

    return this.similarNodes(node);
  }

  this.similarNodes = function(node) {
    var similarTerms = [];
    var associatedNodesDict = {};
    var similarNodes = [];
    var selectedNodes = {};

    var graphNodes = [];
    var graphLinks = [];

    var myterms = _.keys(node.terms)
    
    var distance = 1;
    var newGraphNode;

    var mainNode = {
      type:'node',
      info: node
    }

    graphNodes.push(mainNode);
    selectedNodes[node.CodigoExterno] = newGraphNode;

    // For every term in my node
    _.each(myterms, function(term1) {

      var newTermNode = {
        type:'term',
        info: term1
      }

      graphNodes.push(newTermNode);
      graphLinks.push({source:mainNode, target:newTermNode});

      // Check if it matches any of the existing terms
      _.each(_.keys(terms), function(term2) {
        if (new Levenshtein (term1,term2) <= distance) {
          // It mathches .. create new GraphNodes for the initial term and the associated nodes
          _.each(_.keys(terms[term2].nodes), function(nodeId) {
             
            if (selectedNodes[nodeId]) {
              newGraphNode = selectedNodes[nodeId];
            } else {
              newGraphNode = {
                type:'node',
                info: nodes[nodeId]
              }
              selectedNodes[nodeId] = newGraphNode;
            }

            graphNodes.push(newGraphNode);
            graphLinks.push({source:newTermNode, target:newGraphNode});
          })
        }
      })

    });


    
    return {nodes:graphNodes, links:graphLinks};
  }
  
}]);


angular.module('chilecompraApp')
.factory("licitacionDataService", function($q, $http, _) {
  var licitacionData = {};

  // Máximum number of tag terms to be returnes
  var maxTagNumber = 500;

  // Minimum number of Tag frequency to be considered in Tags retreival
  var minTagFrequency = 1; 

  /*
  * licitaciones diccionario con el ID de la licitación como clave y el objeto correspondiente al elemento del listado de licitaciones para esa licitación
  * en el objeto de cada elemento se agrega el atributo tags, que es un diccionario con los tags asociados a dicho nodo.
  * { CodigoExterno: xxx,
  *   Nombre: ssss,
  *   ...
  *   tags: {}  
  *
  * }
  */
  licitacionData.licitaciones = {};

  // tags dictionary with all tags found in the list of active licitations
  // each dictionary valu is an object with the form
  // {  text: tag, // tag term/word
  //    num: num,  // number of occurrences of the tag
  //    nodes: {}  // dictionary with the nodes that are associated to this term
  // } 
  licitacionData.tags = {};

  licitacionData.dataActivas = null;

  // Terms not to be used in tag cloud
  var excludedTerms = [
    "2013","2014",
    "de","para","del","en","con","al",
    "la","el","los","un",
    "compra","adquisición","adquisicion","adq", "adq.",
    "y","a","e","i","o","u","x","ii",
    "nº","/","n°","-",
    "0","1","2","3","4","5","6","7","8","9","10","sc",
  ];




  /*
  * Obtiene el listado de licitaciones activas
  */
  licitacionData.getActivas = function() {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    if (licitacionData.dataActivas) {
      deferred.resolve(licitacionData.dataActivas);
    } else {
      $http.jsonp('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?estado=activas&ticket=615F615F-3B2E-458D-A6E6-C1AEAAE85CC7&callback=JSON_CALLBACK')
      //$http.get('./data/activasJSONP.js')
      .success(function(data, status, headers, config) {

          // filtra licitaciones con fecha invalida (¿cerrada?)
          licitacionData.dataActivas = _.filter(data.Listado, function(d){
            return d.FechaCierre != null;
          });

          console.log(data.Listado[0])

          _.each(licitacionData.dataActivas, function(d) {
            var fechaCierre = new Date(d.FechaCierre);
            var fechaActual = new Date();



            d.diasParaCierre = (fechaCierre.setHours(0,0,0,0)- fechaActual.setHours(0,0,0,0))/(1000*60*60*24);
            d.diasParaCierre = d.diasParaCierre > 0 ? d.diasParaCierre : 0;

            if (d.diasParaCierre < 1) {
              d.categoriaCierre = '01dia'
            } else if (d.diasParaCierre < 7) {
              d.categoriaCierre = '07dias'
            } else if (d.diasParaCierre < 30) {
              d.categoriaCierre = '30dias'
            } else {
              d.categoriaCierre = 'sobre30dias'
            }



          });

          deferred.resolve(licitacionData.dataActivas);
      })
      .error(function(data, status, headers, config) {
          deferred.reject(status);
          // called asynchronously if an error occurs
          // or server returns response with an error status.
      });

    }

    return deferred.promise;
  }


  /*
  * Obtiene el listado de tags (terminos) asociados a las licitaciones activas
  */
  licitacionData.getAllTags = function() {
    var deferred = $q.defer();


    licitacionData.getActivas()
    .then(function(data) {
      if (_.keys(licitacionData.tags).length == 0) {
        // Recorre cada elemento del listado de licitaciones activas
        _.each(licitacionData.dataActivas, function(d) {
          var key  = d.CodigoExterno;
          var text = d.Nombre.toLowerCase();
          var tokens = text.match(/([a-zA-Zá-úÁ-Ú']+)/g);

          licitacionData.licitaciones[key] = d;

          if (!d.terms) {
            d.terms = {};
          }

          _.each(tokens, function(t) {
            // No considerar como tags a números, términos enlista de "excluidos", ni términos con menos de 3 caracteres
            if (isNaN(t) && excludedTerms.indexOf(t) == -1 && t.length > 2 ) {
              if (!licitacionData.tags[t]) {
                licitacionData.tags[t] = {text:t, num:0, nodes:{}}
              }

              // En casos excepcionales el tag corresponde a una palabra reservada (Ej. constructor) predefinido para licitacionData.tags. Es necesario forzar la creación del objeto licitacionData.tags[t]
              if (!licitacionData.tags[t].nodes) {
                console.log("EXCEPTION",t, key);
                licitacionData.tags[t] = {text:t, num:0, nodes:{}}
              }

              licitacionData.tags[t].num = licitacionData.tags[t].num+1;
                            licitacionData.tags[t].nodes[key] = true;

              d.terms[t] = true;
            }
          })
        });

      } 

      var termArray = [];

      d3.keys(licitacionData.tags).forEach(function(t) {
        if ((licitacionData.tags[t].num>minTagFrequency)) {
          termArray.push(licitacionData.tags[t]);
        }
      })

      termArray = _.sortBy(termArray, function(d) {return -d.num});


      deferred.resolve(_.first(termArray,maxTagNumber));

    })  
    
    return deferred.promise;
  }



 /*
  * Obtiene el registro de una licitación específica
  */
  licitacionData.getLicitacion = function(licitacionId) {
    // Use promise to deliver the async result
    var deferred = $q.defer();

    $http.jsonp('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?codigo='+licitacionId+'&ticket=615F615F-3B2E-458D-A6E6-C1AEAAE85CC7&callback=JSON_CALLBACK').
      success(function(data, status, headers, config) {
          if (data.Listado) {
            deferred.resolve(data.Listado[0]);
          } else {
            deferred.reject();
          }
          // this callback will be called asynchronously
          // when the response is available
      }).
      error(function(data, status, headers, config) {
          deferred.reject(status);
          // called asynchronously if an error occurs
          // or server returns response with an error status.
      });

    return deferred.promise;
  }

  licitacionData.similarNodes2 = function(nodeId) {
    var deferred = $q.defer();


    licitacionData.getAllTags()
    .then(function(tags) {
      var node = licitacionData.licitaciones[nodeId];
      deferred.resolve(licitacionData.similarNodes(node)); 
    })

    return deferred.promise;
  }

  licitacionData.similarNodes = function(node) {
    var similarTerms = [];
    var associatedNodesDict = {};
    var similarNodes = [];
    var selectedNodes = {};

    var graphNodes = [];
    var graphLinks = [];

    var myterms = _.keys(node.terms)
    
    var distance = 1;
    var newGraphNode;

    var mainNode = {
      type:'node',
      info: node
    }

    graphNodes.push(mainNode);
    selectedNodes[node.CodigoExterno] = mainNode;

    // For every term in my node
    _.each(myterms, function(term1) {

      var newTermNode = {
        type:'term',
        info: term1
      }

      graphNodes.push(newTermNode);
      graphLinks.push({source:mainNode, target:newTermNode});

      // Check if it matches any of the existing terms
      _.each(_.keys(licitacionData.tags), function(term2) {
        if (new Levenshtein (term1,term2) <= distance) {
          // It mathches .. create new GraphNodes for the initial term and the associated nodes
          _.each(_.keys(licitacionData.tags[term2].nodes), function(nodeId) {
             
            if (selectedNodes[nodeId]) {
              newGraphNode = selectedNodes[nodeId];
            } else {
              newGraphNode = {
                type:'node',
                info: licitacionData.licitaciones[nodeId]
              }
              selectedNodes[nodeId] = newGraphNode;
            }

            if (nodeId !== node.CodigoExterno) {
              graphNodes.push(newGraphNode);  
            }

            graphLinks.push({source:newTermNode, target:newGraphNode});
          })
        }
      })

    });
    
    return {nodes:graphNodes, links:graphLinks};
  }

  return licitacionData

})


