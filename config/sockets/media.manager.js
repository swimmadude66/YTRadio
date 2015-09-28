/**
 * Media socket connection manager
 */
module.exports = function(io){

    // set chat namespace
    var mediaManager = io.of('/media');

    // connection event
    mediaManager.on('connection', function(socket){
      console.log('user connected!', socket);  
    });

    return mediaManager;
};