/**
 * Chat socket connection manager
 */
module.exports = function(io){

    // set chat namespace
    var chatManager = io.of('/chat');

    // connection event
    chatManager.on('connection', function(socket){
      console.log('user connected!', socket);  
    });

    return chatManager;
};