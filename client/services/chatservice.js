
app.factory('chatService', ['$rootScope', function($rootScope){
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
	    			callback.apply(chatConnection, args);
	  			}
    		});
			});
		}
	}
}]);
