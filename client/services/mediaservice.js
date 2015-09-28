app.factory('mediaService', ['$rootScope', function($rootScope) {

	// setup media connection and namespace
	var mediaConnection = io.connect('http://127.0.0.1:3000/media');

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
      			callback.apply(mediaConnection, args);
    			}
    		});
			});
		}
	}
}]);
