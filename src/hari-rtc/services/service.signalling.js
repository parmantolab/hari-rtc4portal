angular.module('hariRtc.services').factory('signaling', function (socketFactory, ENV) {

	if(!ENV.signalingEndpoint){
		ENV.signalingEndpoint = 'https://irest.pitt.edu:8080/';
	}
    var socket = io.connect(ENV.signalingEndpoint, {secure: true});
    
    var socketFactory = socketFactory({
      ioSocket: socket
    });

    return socketFactory;
  });