app.factory('rootService', ['socketFactory', function(socketFactory){

	var conn = io.connect();

	var socketConnection = socketFactory({
		ioSocket: conn
	});

	return socketConnection;

}]);
