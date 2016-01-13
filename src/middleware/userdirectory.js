var usertosocket = {};
var sockettouser = {};

module.exports = {
	connect: function(socketid){
    sockettouser[socketid] = null;
		return sockettouser;
	},
  disconnect: function(socketid){
		var user = null;
    if(sockettouser[socketid]){
      user = sockettouser[socketid];
      delete usertosocket[user.Username];
		}
    delete sockettouser[socketid];
    return user;
  },
  join: function(socketid, user){
		var oldsock = null;
    if(user.Username in usertosocket){
      oldsock = usertosocket[user.Username];
    }
    usertosocket[user.Username]=socketid;
    sockettouser[socketid] = user;
		return oldsock;
	},
  leave:function(socketid){
		var user = null;
    if(sockettouser[socketid]){
      user = sockettouser[socketid];
      delete usertosocket[user.Username];
    }
    sockettouser[socketid] = null;
    return user;
  },
  getsockets: function(username){
    if(!username){
      return sockettouser;
    }
    if(username in usertosocket){
      return usertosocket[username];
    }
    else{
      return null;
    }
  },
  getuser: function(socketid){
    if(socketid in sockettouser){
      return sockettouser[socketid];
    }
    else{
      return null;
    }
  },
  getusers: function(){
    return usertosocket;
  }
};
