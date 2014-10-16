
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
              data = _.filter(data, function(d) {return d['Nombre'].toLowerCase().indexOf(searchItem) > -1;})
            } 

            scope.nSelected = data.length;

/*
            scope.$apply(function(){
              scope.nSelected = data.length;
            });
*/

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

 

            /*
            .attr("cx", function(d) {
              return d.x;
            })
            .attr("cy", function(d) {
              return d.y;
            })
            .attr("r", function(d) {
              return  scope.selected && (d[scope.idAttribute] == scope.selected[scope.idAttribute]) ? 2*d.r : d.r
            })
            .attr("stroke-width", function(d) {
              return scope.selected && (d[scope.idAttribute] == scope.selected[scope.idAttribute])? 2 : 1;
            })

            .attr("stroke", function(d) { return d3.rgb(colorScale(d[scope.colorAttribute])).darker(2); })
            .each("end", function() {
              scope.drawing = false;
              scope.$apply();
            })    
            */   



          } //end if

          
        };

        scope.$watch("data", function () {
          render(scope.data);
        });      

        scope.$watch("searchItem", function () {
          render(scope.data);
        });      

        scope.$watch("dontDisplay", function () {
          render(scope.data);
        });      

        scope.getElementDimensions = function () {
          return { 'h': element.height(), 'w': element.width() };
        };

        scope.$watch(scope.getElementDimensions, function (newValue, oldValue) {
          console.log(newValue);
          resizeSvg();
          render(scope.data);
        }, true);

        angular.element($window).bind('resize', function () {
          scope.$apply();
        });
 
      }
      
      
    };
  }]);


tideElements.directive("tdWordCloud",["$compile","_", "d3", "toolTip", "$window",function ($compile,_, d3, tooltip, $window) {
 return {
  restrict: "A",
      //transclude: false,
      //template: "<div style='background-color:red' ng-transclude></div>",
      scope: {
        data: "=tdData",
        clickHandler : "=?tdClickHandler",
        maxNumber : "=?tdMaxNumber",
        minCount : "=?tdMinCount",
        excluded : "=?tdExcluded"
      },
      
      link: function (scope, element, attrs) {

        scope.minCount = scope.minCount ? scope.minCount : 0;
        scope.maxNumber = scope.maxNumber ? scope.maxNumber : 1000;
        scope.excluded = scope.excluded ? scope.excluded : [];

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
          .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
 
        var resizeSvg = function() {
          width = element.width()-margin.left-margin.right;
          height = width*0.75;
          svgMainContainer.attr("width",element.width())
          svgMainContainer.attr("height",height+margin.top+margin.bottom)
          svgContainer.attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
        }

        // Scale for font sizes
        var fontSizeScale = d3.scale.log()
          .range([8,48]);

        var fill = d3.scale.category20();

        var words = [];

        // getTokens receives an array with "strings" (several words per string)
        // It will identigy and count each of the words found
        // and returns an array with toen objects: {text: xxx, num: nnn}
        var getTokens = function(data) {
          var words = {}, // Auxiliary object used to identify & count words
            returnTokens = []; // Array with each individual token and its number of occurrences

          data.forEach(function(d) {
            var tokens = d.match(/\S+/g)

            tokens.forEach(function(t) {
              var token = t.toLowerCase();
              if (words[token]) {
                words[token] = words[token]+1;
              } else {
                words[token] = 1;
              }
            })
          })

          d3.keys(words).forEach(function(t) {
            if ((words[t]>scope.minCount) && (scope.excluded.indexOf(t) == -1) && (t.length >2)) {
              returnTokens.push({text:t, num:words[t]});
            }
          })

          returnTokens = _.sortBy(returnTokens, function(d) {return -d.num});

          return _.first(returnTokens,scope.maxNumber);

        }

        var render = function(data) {
          if (data) {
            var tokens = getTokens(data);
            var progressiveWords = [];

            fontSizeScale
            .domain(d3.extent(tokens, function(d) {return d.num}))
            
            var drawWord = function(word) {
              progressiveWords.push(word);
 
              var tags = svgContainer.selectAll("text")
                  .data(progressiveWords, function(d) {return d.text})

              tags.enter()
                .append("text")
                .text(function(d) { return d.text; })
                .style("font-size", function(d) { return d.size + "px"; })
                .style("font-family", "Impact")
                .attr("text-anchor", "middle")
                .on("click", function(d) {
                  scope.clickHandler(d);
                }) 

              tags.exit()
                .remove();


              tags
              .transition()
              .style("fill", function(d, i) { return fill(i); })
              .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })

            }

            var drawAll = function(words) {              
              var tags = svgContainer.selectAll("text")
                  .data(words, function(d) {return d.text})

              tags.enter()
                .append("text")
                .text(function(d) { return d.text; })
                .style("font-size", function(d) { return d.size + "px"; })
                .style("font-family", "Impact")
                .attr("text-anchor", "middle")

              tags.exit()
                .remove();

              tags
              .on("click", function(d) {
                    scope.clickHandler(d);
              })    
              .transition()
              .style("fill", function(d, i) { return fill(i); })
              .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })         

            }

            d3.layout.cloud().size([width, height])
                .words(tokens)
                .padding(5)
                .timeInterval(10)
                //.rotate(function() { return ~~(Math.random() * 2) * 90; })
                .rotate(function(d) { return ~~(Math.random() * 5) * 30 - 60; })
                .font("Impact")
                .fontSize(function(d) { return fontSizeScale(d.num); })
                .on("end", drawAll)
                .on("word", drawWord)
                .start();

          }          
        };

        scope.$watch("data", function () {
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

