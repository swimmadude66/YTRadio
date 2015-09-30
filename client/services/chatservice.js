app.factory('chatService', ['socketFactory', function(socketFactory){
	
	var chatIo = io.connect('http://127.0.0.1:3000/chat');

	var chatConnection = socketFactory({
		ioSocket: chatIo
	});

	return chatConnection;

}]);
