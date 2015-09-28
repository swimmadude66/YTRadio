/**
 * Media Service
 * Note: this design was taken from: http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
 *    I don't quite understand the $rootScope.apply logic, but going to go with it for now
 */
angular.module('YTRadio.Media.service', [])

.factory('MediaServ', ['$rootScope', function($rootScope) {

	// setup media connection and namespace
	var mediaConnection = io.connect('http://192.168.33.10:3000/media');

	return {

		on: function(event, callback){
			mediaConnection.on(event, function(){

				// updates templates
				var args = arguments;
				$rootScope.$apply(function(){
					callback.apply(mediaConnection, args);
				});
			});
		},
		emit: function(event, data, callback) {
			mediaConnection.emit(event, data, function(){

				// updates templates
				var args = arguments;
				$rootScope.$apply(function () {
          			if (callback) {
            			callback.apply(socket, args);
          			}
        		});
			});
		}
	}
}]);