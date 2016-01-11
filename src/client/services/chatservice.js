app.factory('chatService', ['socketFactory', function(socketFactory){

	var chatIo = io.connect(document.location.origin + '/chat');

	var chatConnection = socketFactory({
		ioSocket: chatIo
	});

	return chatConnection;

}]);
