tide-angular-wordcloud
======================

Angular directive to create a Word Cloud visualisation

Installation
-----------
Your html page should include the following scripts

<script src="(...)/angular.js"/></script>
<script src="(...)/tide-angular.js"/></script>
<script src="(...)/tide-angular-wordcloud"/></script>

Or using bower

bower install tide-angular-wordcloud


Funcionality

<div td-word-cloud td-data="your-data"></div>

td-data:  An array with srings containing the words that will be displayed. 
Example:

["This is the frist string", "A second string with new words", ...]

