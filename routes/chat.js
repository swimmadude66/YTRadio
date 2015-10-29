var fs = require('fs');
var userSocketIdMap = {}; // dictionary of username:socketId
var socketIdUserMap = {}; // dictionary of socketId:username

var recentMessages = [];

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
    socketIdUserMap[socket.id] = null;

    socket.emit('motd', 'Welcome to Lifeboat');

    // update/send userList when guest joins (on socket connection and before user join)
    updateUserList();

    // join the chatroom
    socket.on('join', function(username){
      if(!(username in userSocketIdMap)){
        userSocketIdMap[username] = [];
        socket.broadcast.emit('user_join', username);
        console.log(username + ' joined chat!');
      }
      // add to maps
      userSocketIdMap[username].push(socket.id);
      socketIdUserMap[socket.id] = username;
      // send userList to the user who joined
      updateUserList();
      recentMessages.forEach(function(rnode){
        socket.emit('messageFromServer', rnode);
      });
    });

    // send a message
    socket.on('messageToServer', function(message){
      var chatPayload = {
        sender: socketIdUserMap[socket.id],
        timestamp: new Date(),
        message: message
      };
      chatManager.emit('messageFromServer', chatPayload);
      //add message to recent list
      recentMessages.push(chatPayload);
      if(recentMessages.length > 10){
        recentMessages.shift();
      }
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
    });

    socket.on('leave', function(){
      if(socketIdUserMap[socket.id]){
        var username = socketIdUserMap[socket.id];
        var socks = userSocketIdMap[username];
        var i = socks.indexOf(socket.id);
        if(i>-1){
          socks.splice(i,1);
        }
        if(socks.length<1){
          socket.broadcast.emit('user_left', username);
          console.log(username + ' left chat.');
          delete userSocketIdMap[username];
        }
      }
      socketIdUserMap[socket.id] = null;
      updateUserList();
    });

    socket.on('disconnect', function(){
      if(socketIdUserMap[socket.id]){
        var username = socketIdUserMap[socket.id];
        var socks = userSocketIdMap[username];
        var i = socks.indexOf(socket.id);
        if(i>-1){
          socks.splice(i,1);
        }
        if(socks.length<1){
          socket.broadcast.emit('user_left', username);
          console.log(username + ' left chat.');
          delete userSocketIdMap[username];
        }
      }
      delete socketIdUserMap[socket.id];
      updateUserList();
    });
  });
}
