/**
 * Chat Service
 * Note: this design was taken from: http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
 *    I don't quite understand the $rootScope logic, but going to go with it for now
 */
angular.module('YTRadio.Chat.service', [])

.factory('ChatServ', ['$rootScope', function($rootScope) {

	// setup chat connection and namespace
	var chatConnection = io.connect('http://127.0.0.1:3000/chat');

	return {

		on: function(event, callback){
			chatConnection.on(event, function(){

				// updates templates
				var args = arguments;
				$rootScope.$apply(function(){
					callback.apply(chatConnection, args);
				});
			});
		},
		emit: function(event, data, callback) {
			chatConnection.emit(event, data, function(){

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