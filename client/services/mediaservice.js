app.factory('mediaService', ['$rootScope', 'socketFactory', function($rootScope, socketFactory) {

	var mediaIo = io.connect('/media');

	var mediaConnection = socketFactory({
		ioSocket: mediaIo
	});

	return mediaConnection;

}]);
