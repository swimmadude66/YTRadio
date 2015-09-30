app.factory('chatService', ['socketFactory', function(socketFactory){

	var chatIo = io.connect('/chat');

	var chatConnection = socketFactory({
		ioSocket: chatIo
	});

	return chatConnection;

}]);
