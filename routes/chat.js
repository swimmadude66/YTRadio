module.exports = function(io){

  var chatManager = io.of('/chat');

  // connection event
  chatManager.on('connection', function(socket){
    console.log('Chat Client Connected :: ' + socket.id);
  });

  

}
