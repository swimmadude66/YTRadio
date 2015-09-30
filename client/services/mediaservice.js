app.factory('mediaService', ['$rootScope', 'socketFactory', function($rootScope, socketFactory) {

	var loc = window.location;
	var mediaIo = io.connect(loc.protocol + '//' + loc.host + '/media');

	var mediaConnection = socketFactory({
		ioSocket: mediaIo
	});

	return mediaConnection;

}]);
