'use-strict';

/**
 * Personal website of Tania Hernández Fariñas
 * 
 */

/**
 * Main application declaration & configuration
 */
angular.module('thf-app',
				[ 
				  //dependencies
				  'ngSanitize',				// Sanitize module
				  'ngRoute',				// routing module
				  'ngResource',				// Resources module
				  'mgcrea.ngStrap.helpers.dimensions',
				  'mgcrea.ngStrap.affix',
				  'mgcrea.ngStrap.scrollspy'
				  
				])

/**
 * Configuration
 * 
 */

.config(
		[
			'$httpProvider', '$locationProvider',
			function($httpProvider, $locationProvider) {
				
				// use the HTML5 History API
		        $locationProvider.html5Mode({ enabled: true, requireBase: false });
				
			} ])


.run(
		['$rootScope', '$location',
		function($rootScope, $location) {

			
		} ])
		

/** =========================================================================
 *  Services
 * ==========================================================================
 */	

/**
 * Publications Service
 */				
.service('PublicationService',
		['$q', '$http',
		 function($q, $http){
		
			var service = {	
				
				/**
				 * Get the list of items for a given type
				 * 
				 * @param type
				 * @returns
				 */
				listItems: function(type){

					var deferred = $q.defer();
					
					$http.get('resources/publications/'+type+'.json')
					.success (function(data){
						
						var publications = {};
						
						for(i=0;i<data.length;i++){
							var item = i+1;
							var itemId = "Item-"+item;
							
							var publication = data[i];
							publication["id"] = itemId;
							
							publications[itemId] = publication;
						
						}

						deferred.resolve(publications);
					})
					.error(function(error){
						deferred.reject();
					});
					
					return deferred.promise;
				},
				
				/**
				 * List articles
				 * 
				 * @returns
				 */
				listArticles: function(){
					return service.listItems("articles");
				},
				
				/**
				 * List chapters
				 * 
				 * @returns
				 */
				listChapters: function(){
					return service.listItems("chapters");
				}
			}
			
			return service;
			
		}])
		
/**
 * Citation Service
 */				
.service('CitationService',
		['$q', '$http',
		 function($q, $http){
		
			var service = {	
				
			    cslEngine: undefined,
                
			    /**
			     * Init citation engine
			     * 
			     * @param citations
			     * 
			     */
			     initCSLSystem: function(citations){
			    	
			    	// Initialize a system object, which contains two methods needed by the
			    	// engine.
			    	citeprocSys = {
			    	    // Given a language tag in RFC-4646 form, this method retrieves the
			    	    // locale definition file.  This method must return a valid *serialized*
			    	    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
			    	    // processor will fail on a native XML object or buffer).
                        // @note CSL.Engine has no way to load locale asynchronously
			    	    retrieveLocale: function (lang){
			    	        var xhr = new XMLHttpRequest();
			    	        xhr.open('GET', 'resources/citeproc/locales/' + lang + '.xml', false);
			    	        xhr.send(null);
			    	        return xhr.responseText;
			    	    },

			    	    // Given an identifier, this retrieves one citation item.  This method
			    	    // must return a valid CSL-JSON object.
			    	    retrieveItem: function(id){
			    	        return citations[id];
			    	    }
			    	};
			    	
			    	return citeprocSys;
			    },

                /**
                 * Get CSL template using an XML HTTP Request
                 * @param styleID
                 */
                getCSLTemplate: function (styleID) {
                    var xhr = new XMLHttpRequest(),
                        when = {},
                        onload = function() {
                          if (xhr.status === 200) {
                            when.ready.call(undefined, xhr.responseText);
                          }
                        },
                        onerror = function() {
                          console.info('Cannot get CSL Resource');
                        };
                    xhr.open('GET', 'resources/citeproc/csl/' + styleID + '.csl', true);
                    xhr.onload = onload;
                    xhr.onerror = onerror;
                    xhr.send(null);

                    return {
                      when: function(obj) { when.ready = obj.ready; }
                    };
                },
                
			    /**
			     * 
			     * Given the identifier of a CSL style, this function instantiates a CSL.Engine
				 * object that can render citations in that style.
				 */
				initCSLProcessor: function (citeprocSys, styleID, doWithCSL) {
					 
                    var this_ = this;
                     
				    // Get the CSL style as a serialized string of XML             
                    this.getCSLTemplate(styleID).when({
                        ready: function(response){
                             var styleAsText = response;
                             // Instantiate and return the engine
                             this_.cslEngine = new CSL.Engine(citeprocSys, styleAsText);
                             
                             doWithCSL();
                        }
                    });
				 },
                 
                 /**
                  * Get CSL Processor
                  */
                 getCSLProcessor: function() {
                    return this.cslEngine;
                 }

			}
			
			return service;
			
		}])
		

/** =========================================================================
 * 	Controllers
 * ==========================================================================
 */		
	
/**
 * Main application controllers
 * 
 */
.controller(
		'MainCtrl',
		[ '$scope', '$anchorScroll', 'PublicationService','CitationService',
		function($scope, $anchorScroll, PublicationService, CitationService) {
			
			var currentYear = new Date().getFullYear();
			
			
			$scope.scrolltoHref = function (id){
		        // set the location.hash to the id of
		        // the element you wish to scroll to.
		        $location.hash(id);
		        // call $anchorScroll()
		        $anchorScroll();
		    };
			
			/**
			 * Function to render a set of publication in target DOM element
			 * 
			 * @param publications
			 * @param element
			 */
			$scope.render = function(publications, element){
			
				var csl = CitationService.initCSLSystem(publications);
				var bibDiv = document.getElementById(element);
				CitationService.initCSLProcessor(csl, bibDiv.getAttribute('data-csl'), function(){
                    
                    var citeproc = CitationService.getCSLProcessor();
                 
                    var itemIDs = [];
                    for (var key in publications) {
                        var publication = publications[key];
                        //if(angular.isDefined(publication["URL"])){
                            itemIDs.push(key);
                        //}
                    }
                    citeproc.updateItems(itemIDs, true);
                    var bibResult = citeproc.makeBibliography();
                    bibResult = bibResult[1].join('\n');
                    bibResult = bibResult.replace(/â€“/g, '–');
                    //highlights
                    bibResult = bibResult.replace(/Hernández Fariñas, T./g, "<b>Hernández Fariñas, T.</b>");
                    bibResult = bibResult.replace(/Hernández Fariñas, T./g, "<b>Hernández Fariñas, T.</b>");
                    bibResult = bibResult.replace(/Fariñas, T.H./g, "<b>Fariñas, T.H.</b>");
                    
                    for(var key in publications){
                        var publication = publications[key];
                        if(angular.isDefined(publication["URL"])){
                            var title = (element == "articles")? publication["title"] : publication["container-title"];
                            var link = "<a href=\""+publication["URL"]+"\" target=\"_blank\">"+title+"</a>";
                            var parsedTitle = title.replace('<span class="nocase">','').replace('</span>','');
                            bibResult = bibResult.replace(parsedTitle, link);
                        }
                    }
                    
                    bibDiv.innerHTML = bibResult;
                    
                });
			}
			
			/**
			 * Resolve articles
			 */
			PublicationService.listArticles().then(function(data){			
				$scope.render(data, "articles");
			});
			
			/**
			 * Resolve chapters
			 */
			PublicationService.listChapters().then(function(data){
				$scope.render(data, "chapters");
			})

			
		} ]);
				