app.factory('rootService', ['socketFactory', function(socketFactory){

	var conn = io.connect(document.location.origin + '/');

	var socketConnection = socketFactory({
		ioSocket: conn
	});

	return socketConnection;

}]);
