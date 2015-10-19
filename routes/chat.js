var fs = require('fs');
var userSocketIdMap = {}; // dictionary of username:socketId
var socketIdUserMap = {}; // dictionary of socketId:username


module.exports = function(io){

  var chatManager = io.of('/chat');

  function updateUserList(){
    var userList = [];
    var anon_listeners = 0;
    for(var socket in socketIdUserMap){
      var username = socketIdUserMap[socket];
      if(username){
        if(userList.indexOf(username) === -1){
          userList.push(username);
        }
      }
      else{
        anon_listeners ++;
      }
    }
    if(anon_listeners > 0){
      var anon_string = anon_listeners + ' Anonymous guest';
      if(anon_listeners > 1){
        anon_string +='s';
      }
      if(userList.length > 0){
        anon_string = 'Plus ' + anon_string;
      }
      userList.push(anon_string);
    }
    io.emit('userList', userList);
  }

  // connection event
  chatManager.on('connection', function(socket){
    console.log('Chat Client Connected :: ' + socket.id);
    socketIdUserMap[socket.id] = false;

    socket.emit('motd', 'Welcome to Lifeboat');

    // update/send userList when guest joins (on socket connection and before user join)
    updateUserList();

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
    socket.on('messageToServer', function(message){

      var chatPayload = {
        sender: socketIdUserMap[socket.id],
        timestamp: new Date(),
        message: message
      };
      //socket.broadcast.emit('messageFromServer', chatPayload);
      chatManager.emit('messageFromServer', chatPayload);

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
        socket.broadcast.emit('user_left', username);
        console.log(username + ' left chat.');

        if(userSocketIdMap[username] === socket.id){
          delete userSocketIdMap[username];
        }
        socketIdUserMap[socket.id] = false;

        updateUserList();
      }
    });

    socket.on('disconnect', function(){
      if(socketIdUserMap[socket.id]){
        // if user
        var username = socketIdUserMap[socket.id];
        socket.broadcast.emit('user_left', username);
        console.log(username + ' left chat.');
        if(userSocketIdMap[username] === socket.id){
          delete userSocketIdMap[username]; // - delete from userSocketIdMap
        }
      }
      delete socketIdUserMap[socket.id]; // - delete from socketIdUserMap
      console.log('Chat Client Disconnected :: ' + socket.id);
      updateUserList();
    });
  });
}
