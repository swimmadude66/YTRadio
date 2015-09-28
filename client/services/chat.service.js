/**
 * Chat Service
 * Note: this design was taken from: http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
 *    I don't quite understand the $rootScope logic, but going to go with it for now
 */
angular.module('YTRadio.Chat.service', [])

.factory('ChatServ', ['$rootScope', function($rootScope) {

	var chatConnection = io.connect().of('/chat');

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
			chatConnection.emit(event, data, callback){

				// updates templates
				var args = arguments;
				$rootScope.$apply(function () {
          			if (callback) {
            			callback.apply(socket, args);
          			}
        		});
			};
		}
	}
}]);