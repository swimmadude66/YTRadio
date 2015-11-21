var usertosocket = {};
var sockettouser = {};

module.exports = {
	connect: function(socketid){
    sockettouser[socketid] = null;
		return sockettouser;
	},
  disconnect: function(socketid){
    if(sockettouser[socketid]){
      var user = sockettouser[socketid];
      var socks = usertosocket[user.Username];
      var i = socks.indexOf(socketid);
      if(i>-1){
        socks.splice(i,1);
      }
      var last = false;
      if(socks.length<1){
        last = true;
        delete usertosocket[user.Username];
      }
    }
    delete sockettouser[socketid];
    return last;
  },
  join: function(socketid, user){
    if(!(user.Username in usertosocket)){
      usertosocket[user.Username] = [];
    }
    usertosocket[user.Username].push(socketid);
    sockettouser[socketid] = user;
		return sockettouser;
	},
  leave:function(socketid){
    if(sockettouser[socketid]){
      var username = sockettouser[socketid].Username || null;
      var socks = usertosocket[username];
      var i = socks.indexOf(socketid);
      if(i>-1){
        socks.splice(i,1);
      }
      var last=false;
      if(socks.length<1){
        last = true;
        delete usertosocket[username];
      }
    }
    sockettouser[socketid] = null;
    return last;
  },
  getsockets: function(username){
    if(!username){
      return sockettouser;
    }
    if(username in usertosocket){
      return usertosocket[username];
    }
    else{
      return [];
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
