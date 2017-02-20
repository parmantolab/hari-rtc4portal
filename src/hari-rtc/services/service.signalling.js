angular.module('hariRtc.services').factory('signaling', function (socketFactory, env) {

	if(!env.signalingEndpoint){
		env.signalingEndpoint = 'https://irest.pitt.edu:8080/';
	}
    var socket = io.connect(env.signalingEndpoint, {secure: true});
    
    var socketFactory = socketFactory({
      ioSocket: socket
    });

    return socketFactory;
  });