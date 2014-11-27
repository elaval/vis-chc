
"use strict";
/* jshint undef: true, unused: true */
/* global angular */


/**
 * @ngdoc directive
 * @name tide-angular.directive:tdWordCloud
 * @requires underscore._
 * @requires d3service.d3
 * @requires $window
 * @requires toolTip
 * @element div
 * 
 * @param {array} tdData Array with strings (words or phrases) from which the cloud terms will be identified
 * @param {function=} tdClickHandler Function called when clicking on top of a word (passed the word as first argument)
 * @param {int=} maxNumber Maximum number of terms (sorted from most to least frequent) to be used as input to the visualization (defaults to 1000)
 * @param {int=} nimCount Minumum frequency of a term to be considered in the visualization (defaults to 0)
 * @param {array} tdExclude Array with terms to be excluded form the visualization (Ex: ["a", "1", "of", ...])
 
 * @description
 *
 * Generates a word cloud (Tag Cloud) with the width of the original div and height being 3/4 of the width
 * if a word is clicked, a "clickHandler" function is called
 *
 */
angular.module("tide-angular")
.directive("tdForces",["$compile","_", "d3", "toolTip", "$window",function ($compile,_, d3, tooltip, $window) {
 return {
  restrict: "A",
      //transclude: false,
      //template: "<div style='background-color:red' ng-transclude></div>",
      scope: {
        nodes: "=tdNodes",        
        links: "=tdLinks",
        clickHandler : "=?tdClickHandler",
      },
      
      link: function (scope, element, attrs) {

        var margin = {};
        margin.left = scope.options && scope.options.margin && scope.options.margin.left ? scope.options.margin.left : 0;
        margin.right = 0;
        margin.top = 0;
        margin.bottom = 0;

        var width = element.width()-margin.left-margin.right;
        var height = width*0.75;

        var svgMainContainer = d3.select(element[0])
          .append("svg")
          .attr("width", width+margin.left+margin.right)
          .attr("height", height+margin.top+margin.bottom)

        var svgContainer = svgMainContainer
          .append("g")
          //.attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
 
        var color = d3.scale.category20();

        var resizeSvg = function() {
          width = element.width()-margin.left-margin.right;
          height = width*0.75;
          svgMainContainer.attr("width",element.width())
          svgMainContainer.attr("height",height+margin.top+margin.bottom)
          //svgContainer.attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
          render(scope.nodes, scope.links);
        }

        // Define dataPoints tooltip generator
        var dataPointTooltip = tooltip();
        if (scope.tooltipMessage) {
          dataPointTooltip.message(scope.tooltipMessage);
        } else {
          dataPointTooltip.message(function(d) {
            var msg = "";
            if (d.type == 'node') {
              msg = "Nombre" + " : " + d.info["Nombre"];
              msg += "<br>" + "Estado" +  " : " + d.info["CodigoEstado"];
              msg += "<br>" + "Código" +  " : " + d.info["CodigoExterno"];
            } else {
              msg = "Término" + " : " + d.info;
            }

            return  msg;
          });
        }

        var render = function(nodes,links) {
          if (nodes && nodes.length > 0 && width > 0) {
            var force = d3.layout.force()
              .size([width, height]);

            force
                .nodes(nodes)
                .links(links)
                .start();

            var link = svgContainer.selectAll(".link")
                .data(links)
              .enter().append("line")
                .attr("class", "link")
                .style("stroke-width", function(d) { return Math.sqrt(d.value); });

            var node = svgContainer.selectAll(".node")
                .data(nodes)
              .enter()
                .append("circle")
                .attr("class", "node")
                .attr("r", function(d,i) { 
                  return i == 0 ? 10 : 5; 
                })
                .attr("text", function(d,i) { 
                  return  d.info; 
                })
                .style("fill", function(d,i) { 
                  return i == 0 ? 'red' : color(d.type); 
                })
                .on("mouseenter", function(d) {
                  dataPointTooltip.show(d);
                })
                .on("mouseleave", function() {
                  dataPointTooltip.hide();
                })
                .call(force.drag);

           var label = svgContainer.selectAll(".label")
                .data(_.filter(nodes, function(d) {return d.type=='term'}))
              .enter()
                .append("g")
                .attr("class", "label")

            label
              .append("rect")
              .attr("class" ,"labelbg")

            label
              .append("text")
              .text(function(d) {return d.info})
              .attr("text-anchor", "middle")
              .each(function(d) {
                d.width = this.getBBox().width;
              });

            label.select(".labelbg")
              .attr("width", function(d) {
                return d.width+4
              })
              .attr("height", 20)
              .attr("x", function(d) {
                return -(d.width+4)/2
              })
              .attr("y", function(d) {
                return -12
              })
              .attr("rx", function(d) {
                return 5
              })
              .attr("ry", function(d) {
                return 5
              })
              .attr("fill", "white")
              .attr("opacity", 0.8)



/*
            var label = svgContainer.selectAll(".label")
                .data(_.filter(nodes, function(d) {return d.type=='term'}))
              .enter()
                .append("text")
                .attr("class", "label")
                .text(function(d) {return d.info})
                .attr("text-anchor", "middle")
                */
           var mainNodeLabel = svgContainer.selectAll(".mainNode")
                .data(_.first(nodes,1))
              .enter()
                .append("g")
                .attr("class", "mainNode")

            mainNodeLabel
              .append("rect")
              .attr("class" ,"mainNodelabelbg")

            mainNodeLabel
              .append("text")
              .text(function(d) {return d.info.CodigoExterno})
              .attr("text-anchor", "middle")
              .each(function(d) {
                d.width = this.getBBox().width;
              });


            mainNodeLabel.select(".mainNodelabelbg")
              .attr("width", function(d) {
                return d.width+4
              })
              .attr("height", 20)
              .attr("x", function(d) {
                return -(d.width+4)/2
              })
              .attr("y", function(d) {
                return -14
              })
              .attr("rx", function(d) {
                return 5
              })
              .attr("ry", function(d) {
                return 5
              })
              .attr("fill", "salmon")
              .attr("opacity", 0.8)


            force.on("tick", function(e) {
              link.attr("x1", function(d) { return d.source.x; })
                  .attr("y1", function(d) { return d.source.y; })
                  .attr("x2", function(d) { return d.target.x; })
                  .attr("y2", function(d) { return d.target.y; });

              node.attr("cx", function(d) { return d.x; })
                  .attr("cy", function(d) { return d.y; });

              /*label.attr("x", function(d) { return d.x; })
                  .attr("y", function(d) { return d.y; });
                  */

              label
                .attr("transform", function(d) {
                  return "translate(" + d.x + "," + (d.y-10) + ")"
                })

              mainNodeLabel
                .attr("transform", function(d) {
                  return "translate(" + d.x + "," + (d.y-15) + ")"
                })

              if (e.alpha < 0.04) {force.stop()}

            });

          }
         
        };

        scope.$watch("nodes", function () {
          render(scope.nodes, scope.links);
        });    

        scope.$watch("links", function () {
          render(scope.nodes, scope.links);
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

