var userSocketIdMap = {}; // dictionary of username:socketId
var socketIdUserMap = {}; // dictionary of socketId:username

module.exports = function(io){

  var chatManager = io.of('/chat');

  function updateUserList(){
    var userList = [];
    for(var username in userSocketIdMap){
        userList.push(username);
    }
    chatManager.emit('userList', userList);
  }

  // connection event
  chatManager.on('connection', function(socket){
    console.log('Chat Client Connected :: ' + socket.id);

    // join the chatroom
    socket.on('join', function(username){

      // add to maps
      userSocketIdMap[username] = socket.id;
      socketIdUserMap[socket.id] = username;

      // send join event
      socket.broadcast.emit('user_join', username);

      // send userList to the user who joined
      updateUserList();
      console.log(username + ' joined chat!');
    });

    // send a message
    socket.on('sent_message', function(message){

      var chatPayload = {
        sender: socketIdUserMap[socket.id],
        timestamp: new Date(),
        message: message
      };
      //socket.broadcast.emit('message', chatPayload);
      chatManager.emit('message', chatPayload);

      console.log('Chat: ', chatPayload.timestamp, chatPayload.sender, chatPayload.message);
    });

    // private message
    socket.on('privateMessage', function(payload){

      var privateMessage = {
        sender: socketIdUserMap[socket.id],
        timestamp: new Date(),
        message: payload.message
      };
      if(userSocketIdMap[payload.to]){
        chatManager.to(userSocketIdMap[payload.to]).emit('private_message', privateMessage);
        console.log('Chat-PM: ', privateMessage.timestamp, privateMessage.sender, payload.to, privateMessage.message);
      }
    });

    socket.on('updateUserList', function(){
      updateUserList();
      console.log(socketIdUserMap[socket.id] + 'requested the user list.');
    });

    socket.on('leave', function(){
      if(socketIdUserMap[socket.id]){
        var username = socketIdUserMap[socket.id];
        socket.broadcast.emit('userLeft', username);
        console.log(username + ' left chat.');
        console.log('Chat Client Disconnected :: ' + socket.id);

        delete userSocketIdMap[username];
        delete socketIdUserMap[socket.id];

        updateUserList();
      }
    });

    socket.on('disconnect', function(){
      // send user left event
      if(socketIdUserMap[socket.id]){
        var username = socketIdUserMap[socket.id];
        socket.broadcast.emit('userLeft', username);
        console.log(username + ' left chat.');
        console.log('Chat Client Disconnected :: ' + socket.id);

        delete userSocketIdMap[username];
        delete socketIdUserMap[socket.id];

        updateUserList();
      }
    });
  });
}
