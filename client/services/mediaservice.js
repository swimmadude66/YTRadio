app.factory('mediaService', ['$rootScope', 'socketFactory', function($rootScope, socketFactory) {

	var mediaIo = io.connect(document.location.origin + '/media');

	var mediaConnection = socketFactory({
		ioSocket: mediaIo
	});

	return mediaConnection;

}]);
