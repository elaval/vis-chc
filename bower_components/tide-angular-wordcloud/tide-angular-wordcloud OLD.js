
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
.directive("tdWordCloud",["$compile","_", "d3", "toolTip", "$window",function ($compile,_, d3, tooltip, $window) {
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

