var fs = require('fs');
var async = require('async');
var directory = require('../middleware/userdirectory.js');

var recentMessages = [];

module.exports = function(io){

  var chatManager = io.of('/chat');

  function updateUserList(){
    var userList = [];
    var anon_listeners = 0;
    async.each(Object.keys(directory.getsockets()), function(socket, cb){
      var username = (directory.getuser(socket)||{Username:null}).Username;
      if(username){
        if(userList.indexOf(username) === -1){
          userList.push(username);
          return cb();
        }
      }
      else{
        anon_listeners++;
        return cb();
      }
    }, function(err){
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
      io.sockets.emit('userList', userList);
    });
  }

  // connection event
  chatManager.on('connection', function(socket){
    // update/send userList when guest joins (on socket connection and before user join)
    directory.connect(socket.id);
    updateUserList();

    // join the chatroom
    socket.on('join', function(user){
      if(!(user.Username in directory.getusers())){
        socket.broadcast.emit('user_join', user.Username);
        console.log(user.Username + ' joined chat!');
      }
      // add to maps
      var oldsock = directory.join(socket.id, user);
      chatManager.to(oldsock).emit('session_expired');
      updateUserList();
      recentMessages.forEach(function(rnode){
        socket.emit('messageFromServer', rnode);
      });
    });

    // send a message
    socket.on('messageToServer', function(message){
      var chatPayload = {
        sender: directory.getuser(socket.id).Username,
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
        sender: directory.getuser(socket.id).Username,
        timestamp: new Date(),
        message: payload.message
      };
      if(directory.getsockets(payload.to)){
        chatManager.to(directory.getsockets(payload.to)).emit('private_message', privateMessage);
        console.log('Chat-PM: ', privateMessage.timestamp, privateMessage.sender, payload.to, privateMessage.message);
      }
    });

    socket.on('updateUserList', function(){
      updateUserList();
    });

    socket.on('leave', function(){
      var user = directory.leave(socket.id);
      if(user){
        if(!directory.getsockets(user.Username)){
          socket.broadcast.emit('user_left', user.Username);
          console.log(user.Username + ' left chat.');
        }
      }
      updateUserList();
    });

    socket.on('disconnect', function(){
      var user = directory.disconnect(socket.id);
      if(user){
        if(!directory.getsockets(user.Username)){
          socket.broadcast.emit('user_left', user.Username);
          console.log(user.Username + ' left chat.');
        }
      }
      updateUserList();
    });
  });
};
