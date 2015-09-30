app.factory('mediaService', ['$rootScope', 'socketFactory', function($rootScope, socketFactory) {

	var mediaIo = io.connect('http://127.0.0.1:3000/media');

	var mediaConnection = socketFactory({
		ioSocket: mediaIo
	});

	return mediaConnection;

}]);
