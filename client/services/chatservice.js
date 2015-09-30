app.factory('chatService', ['socketFactory', function(socketFactory){
	
	var loc = window.location;
	var chatIo = io.connect(loc.protocol + '//' + loc.host + '/chat');

	var chatConnection = socketFactory({
		ioSocket: chatIo
	});

	return chatConnection;

}]);
