
"use strict";
/* jshint undef: true, unused: true */
/* global angular */

/**
 * @ngdoc overview
 * @name tide-angular
 * @description
 * Data visualization tools from TIDE SA
 *
 */
tideElements.directive("tdChcChart",["$compile","_", "d3", "toolTip", "$window",function ($compile,_, d3, tooltip, $window) {
 return {
  restrict: "A",
      //transclude: false,
      //template: "<div style='background-color:red' ng-transclude></div>",
      scope: {
        data: "=tdData",
        colorLegend: "=?tdColorLegend",
        tooltipMessage: "=?tdTooltipMessage",
        searchItem : "=?tdSearch",
        similarTerms : "=?tdSimilarTerms",
        nSelected : "=?tdNumSelected",
        selected : "=?tdSelected",
        clickHandler : "=?tdClickHandler",
        dontDisplay : "=?tdDontDisplay"
      },
      
      link: function (scope, element, attrs) {

        var margin = {};
        margin.left = scope.options && scope.options.margin && scope.options.margin.left ? scope.options.margin.left : 5;
        margin.right = 5;
        margin.top = 5;
        margin.bottom = 5;

        var width = element.width()-margin.left-margin.right;
        var height = scope.height ? scope.height : 300;
 
        if (!scope.similarTerms) {
          scope.similarTerms = [];
        }

        var RADIUS = 4;
        var COL_WIDTH = 2*RADIUS+2;
        var MAX_COLS = Math.floor(width / COL_WIDTH);

        var colorScale = d3.scale.category10();

        // Define dataPoints tooltip generator
        var dataPointTooltip = tooltip();
        if (scope.tooltipMessage) {
          dataPointTooltip.message(scope.tooltipMessage);
        } else {
          dataPointTooltip.message(function(d) {
            var msg = "Nombre" + " : " + d["Nombre"];
            msg += "<br>" + "Estado" +  " : " + d["CodigoEstado"];
            msg += "<br>" + "Código" +  " : " + d["CodigoExterno"];

            return  msg;
          });
        }

        var svgMainContainer = d3.select(element[0])
          .append("svg")
          .attr("width", width+margin.left+margin.right)
          .attr("height", height+margin.top+margin.bottom)

        var svgContainer = svgMainContainer
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
        var resizeSvg = function() {
          width = element.width()-margin.left-margin.right;
          svgMainContainer.attr("width",element.width())
        }

        var render = function(data) {
          if (data && !scope.dontDisplay) {

            if (scope.searchItem) {
              var searchItem = scope.searchItem.toLowerCase();
              data = _.filter(data, function(d) {
                var found;
                found = d['Nombre'].toLowerCase().indexOf(searchItem) > -1;
                if (!found) {
                  _.each(scope.similarTerms, function(d2) {
                    found = found || (d['Nombre'].toLowerCase().indexOf(d2) > -1);
                  })
                }
                return found;
              })
            } 

            scope.nSelected = data.length;

            var colorCategories = _.keys(_.groupBy(data, function(d) {return d["CodigoEstado"]})).sort();
            colorCategories = _.sortBy(colorCategories, function(d) {return +d});

            colorScale.domain(colorCategories);

            // Color legend data to be shared through the scope
            scope.colorLegend = [];
            var groupsByColor = _.groupBy(data, function(d) {return d["CodigoEstado"]});

            _.each(colorCategories, function(d) {
              scope.colorLegend.push({key:d, color:colorScale(d), n:groupsByColor[d].length});
            })

            data = _.sortBy(data, function(d) {return d.CodigoEstado})

            // Update SVG height according to data length
            var rows = Math.ceil(data.length/MAX_COLS)
            height = rows * COL_WIDTH;
            svgMainContainer.attr("height", height+margin.top+margin.bottom)


            var circles = svgContainer.selectAll("circle")
            .data(data, function(d) {return d["CodigoExterno"];});

            circles.exit()
              .transition()
              .attr("r",0)
              .attr("cx",0)
              .attr("cy",0)
              .remove();

            circles.enter()
              .append("circle")
              .attr("cx",0)
              .attr("cy",0)
              .attr("r", function(d) {
                return RADIUS
              })   
              .attr("fill", function(d) {
                return colorScale(d["CodigoEstado"])
              })           
              .attr("opacity", 0.8)
              .on("click", function(d) {
                scope.clickHandler(d);

                // Select the node - save in the scope 
                scope.$apply(function(){
                  scope.selected = d;
                });
              })              
              .on("mouseenter", function(d) {
                dataPointTooltip.show(d);
              })
              .on("mouseleave", function() {
                dataPointTooltip.hide();
              });

            // Recalculate MAX_COLS in case of chaneg in width
            MAX_COLS = Math.floor(width / COL_WIDTH);

            circles
            .transition()
            .duration(1000)
            .attr("cx", function(d,i) {
                var col = i % MAX_COLS;
                return col*COL_WIDTH;
              })
              .attr("cy", function(d,i) {
                var row = Math.floor(i/MAX_COLS);
                return row*COL_WIDTH;
              })
            .attr("fill", function(d) {
                return colorScale(d["CodigoEstado"])
              })           

          } //end if

          
        };

        scope.$watch("data", function () {
          render(scope.data);
        });      

        scope.$watch("searchItem", function () {
          render(scope.data);
        });      

        scope.$watch("similarTerms", function () {
          render(scope.data);
        });      

        scope.$watch("dontDisplay", function () {
          render(scope.data);
        });      

        scope.getElementDimensions = function () {
          return { 'h': element.height(), 'w': element.width() };
        };

        scope.$watch(scope.getElementDimensions, function (newValue, oldValue) {
          resizeSvg();
          render(scope.data);
        }, true);

        angular.element($window).bind('resize', function () {
          scope.$apply();
        });
 
      }
      
      
    };
  }]);