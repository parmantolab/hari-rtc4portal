(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('hariRtc.config', [])
      .value('hariRtc.config', {
          debug: true
      });

  // Modules
  angular.module('hariRtc.directives', []);
  angular.module('hariRtc.services', []);
  angular.module('hariRtc',
      [
          'btford.socket-io',
          'app.config',
          'hariRtc.config',
          'hariRtc.directives',
          'hariRtc.services'
      ]);

})(angular);

angular.module('hariRtc').run(["signaling", "hariModal", function (signaling, hariModal) {
  signaling.on('messageReceived', function (name, message) {
    switch (message.type) {
      case 'call': //called by other party
        var params = {parameters: {isCalling : false, contactName: name}};
        hariModal({templateUrl: 'views/call.html', 
                        controller: 'CallCtrl', 
                        parameters : params
                    }).activate();
        break;
    }
  });
}])