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
          'ionic',
          'app.config',
          'hariRtc.config',
          'hariRtc.directives',
          'hariRtc.services'
      ]);

})(angular);

angular.module('hariRtc').run(["$state", "signaling", "hariModal", function ($state, signaling, hariModal) {
  signaling.on('messageReceived', function (name, message) {
    switch (message.type) {
      case 'call': //called by other party
        hariModal.show('views/call.html', 'CallCtrl', { isCalling: false, contactName: name  });
        break;
    }
  });
}])
angular.module("hariRtc").run(["$templateCache", function($templateCache) {$templateCache.put("views/call.html","<ion-content on-scroll=\"updateVideoPosition()\" on-scroll-complete=\"updateVideoPosition()\">\n    <div class=\"calling-container\" ng-if=\"isCalling && !callInProgress\">\n      <p>Calling to <span class=\"balanced\">{{ contactName }}</span>...</p>\n\n      <button class=\"button button-assertive\" ng-click=\"ignore()\">\n        Nevermind\n      </button>\n    </div>\n\n    <div class=\"calling-container\" ng-if=\"!isCalling && !callInProgress\">\n      <p><span class=\"balanced\">{{ contactName }}</span> is calling you</p>\n\n      <button class=\"button button-positive\" ng-click=\"answer()\">\n        Answer\n      </button>\n\n      <button class=\"button button-assertive\" ng-click=\"ignore()\">\n        Ignore\n      </button>\n    </div>\n\n    <div class=\"calling-container\" ng-if=\"callInProgress\">\n      <p>\n        Call in progress...\n      </p>\n\n      <button class=\"button button-assertive\" ng-click=\"end()\">\n        End\n      </button>\n    </div>\n\n    <video-view></video-view>\n\n  </ion-content>");}]);
angular.module('hariRtc')
.controller('CallCtrl', ["$scope", "$state", "$rootScope", "$timeout", "$ionicModal", "signaling", "ContactsService", "parameters",function ($scope, $state, $rootScope, $timeout, $ionicModal, signaling, ContactsService, parameters) {

    console.log("parameter "+JSON.stringify(parameters));

    var duplicateMessages = [];

    $scope.callInProgress = false;

    $scope.isCalling = parameters.isCalling;
    $scope.contactName = parameters.contactName;

    $scope.allContacts = ContactsService.onlineUsers;
    $scope.contacts = {};
    $scope.hideFromContactList = [$scope.contactName];
    $scope.muted = false;

    $ionicModal.fromTemplateUrl('templates/select_contact.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.selectContactModal = modal;
    });

    //ring! well actually beep
    navigator.notification.beep(1);
    window.ringingIntervalId = setInterval(navigator.notification.beep, 2500, 1);

    function call(isInitiator, contactName) {
      console.log(new Date().toString() + ': calling to ' + contactName + ', isInitiator: ' + isInitiator);
      clearInterval(window.ringingIntervalId);

      var config = { 
        isInitiator: isInitiator,
        turn: {
          //host: 'turn:ec2-54-68-238-149.us-west-2.compute.amazonaws.com:3478',
          host: 'stun:stun.l.google.com:19302',
          username: 'test',
          password: 'test'
        },
        streams: {
          audio: true,
          video: true
        }
      };

      var session = new cordova.plugins.phonertc.Session(config);
      
      session.on('sendMessage', function (data) { 
        signaling.emit('sendMessage', contactName, { 
          type: 'phonertc_handshake',
          data: JSON.stringify(data)
        });
      });

      session.on('answer', function () {
        console.log('Answered!');
      });

      session.on('disconnect', function () {
        if ($scope.contacts[contactName]) {
          delete $scope.contacts[contactName];
        }

        if (Object.keys($scope.contacts).length === 0) {
          signaling.emit('sendMessage', contactName, { type: 'ignore' });
          $scope.closeModal();
        }
      });

      session.call();

      $scope.contacts[contactName] = session; 
    }

    if ($scope.isCalling) {
      signaling.emit('sendMessage', parameters.contactName, { type: 'call' });
    }

    $scope.ignore = function () {
      clearInterval(window.ringingIntervalId);
      var contactNames = Object.keys($scope.contacts);
      if (contactNames.length > 0) { 
        $scope.contacts[contactNames[0]].disconnect();
      } else {
        signaling.emit('sendMessage', parameters.contactName, { type: 'ignore' });
        $scope.closeModal();
      }
      
    };

    $scope.end = function () {
      clearInterval(window.ringingIntervalId);
      Object.keys($scope.contacts).forEach(function (contact) {
        $scope.contacts[contact].close();
        delete $scope.contacts[contact];
      });
      $scope.closeModal();
    };

    $scope.answer = function () {
      if ($scope.callInProgress) { return; }

      $scope.callInProgress = true;
      $timeout($scope.updateVideoPosition, 1000);

      call(false, parameters.contactName);

      setTimeout(function () {
        console.log('sending answer');
        signaling.emit('sendMessage', parameters.contactName, { type: 'answer' });
      }, 1500);
    };

    $scope.updateVideoPosition = function () {
      $rootScope.$broadcast('videoView.updatePosition');
    };

    $scope.openSelectContactModal = function () {
      cordova.plugins.phonertc.hideVideoView();
      $scope.selectContactModal.show();
    };

    $scope.closeSelectContactModal = function () {
      cordova.plugins.phonertc.showVideoView();
      $scope.selectContactModal.hide();      
    };

    $scope.addContact = function (newContact) {
      $scope.hideFromContactList.push(newContact);
      signaling.emit('sendMessage', newContact, { type: 'call' });

      cordova.plugins.phonertc.showVideoView();
      $scope.selectContactModal.hide();
    };

    $scope.hideCurrentUsers = function () {
      return function (item) {
        return $scope.hideFromContactList.indexOf(item) === -1;
      };
    };

    $scope.toggleMute = function () {
      $scope.muted = !$scope.muted;

      Object.keys($scope.contacts).forEach(function (contact) {
        var session = $scope.contacts[contact];
        session.streams.audio = !$scope.muted;
        session.renegotiate();
      });
    };

    function onMessageReceive (name, message) {
      switch (message.type) {
        case 'answer':
          $scope.$apply(function () {
            $scope.callInProgress = true;
            $timeout($scope.updateVideoPosition, 1000);
          });

          var existingContacts = Object.keys($scope.contacts);
          if (existingContacts.length !== 0) {
            signaling.emit('sendMessage', name, {
              type: 'add_to_group',
              contacts: existingContacts,
              isInitiator: false
            });
          }

          call(true, name);
          break;

        case 'ignore':
          var len = Object.keys($scope.contacts).length;
          if (len > 0) { 
            if ($scope.contacts[name]) {
              $scope.contacts[name].close();
              delete $scope.contacts[name];
            }

            var i = $scope.hideFromContactList.indexOf(name);
            if (i > -1) {
              $scope.hideFromContactList.splice(i, 1);
            }

            if (Object.keys($scope.contacts).length === 0) {
              $scope.closeModal();
            }
          } else {
            $scope.closeModal();
          }

          break;

        case 'phonertc_handshake':
          if (duplicateMessages.indexOf(message.data) === -1) {
            $scope.contacts[name].receiveMessage(JSON.parse(message.data));
            duplicateMessages.push(message.data);
          }
          
          break;

        case 'add_to_group':
          message.contacts.forEach(function (contact) {
            $scope.hideFromContactList.push(contact);
            call(message.isInitiator, contact);

            if (!message.isInitiator) {
              $timeout(function () {
                signaling.emit('sendMessage', contact, { 
                  type: 'add_to_group',
                  contacts: [ContactsService.currentName],
                  isInitiator: true
                });
              }, 1500);
            }
          });

          break;
      } 
    }

    signaling.on('messageReceived', onMessageReceive);

    $scope.$on('$destroy', function() { 
      clearInterval(window.ringingIntervalId);
      signaling.removeListener('messageReceived', onMessageReceive);
    });
  }]);
angular.module('hariRtc.directives').directive('videoView', ["$rootScope", "$timeout", function ($rootScope, $timeout) {
    return {
      restrict: 'E',
      template: '<div class="video-container"></div>',
      replace: true,
      link: function (scope, element, attrs) {
        function updatePosition() {
          cordova.plugins.phonertc.setVideoView({
            container: element[0],
            local: { 
              position: [240, 240],
              size: [50, 50]
            }
          });
        }

        $timeout(updatePosition, 500);
        $rootScope.$on('videoView.updatePosition', updatePosition);
      }
    }
  }]);
angular.module('hariRtc.services')
.factory('ContactsService', ["signaling", function (signaling) {
    var onlineUsers = [];

    signaling.on('online', function (name) {
      if (onlineUsers.indexOf(name) === -1) {
        onlineUsers.push(name);
      }
    });

    signaling.on('offline', function (name) {
      var index = onlineUsers.indexOf(name);
      if (index !== -1) {
        onlineUsers.splice(index, 1);
      }
    });

    return {
      onlineUsers: onlineUsers,
      setOnlineUsers: function (users, currentName) {
        this.currentName = currentName;
        
        onlineUsers.length = 0;
        users.forEach(function (user) {
          if (user !== currentName) {
            onlineUsers.push(user);
          }
        });
      }
    }
  }]);
angular
.module('hariRtc.services')
.factory("hariModal", ["$ionicModal", "$rootScope", "$q", "$injector", "$controller", function($ionicModal, $rootScope, $q, $injector, $controller) {

    return {
        show: show
    }

    function show(templateUrl, controller, parameters) {
        // Grab the injector and create a new scope
        var deferred = $q.defer(),
            ctrlInstance,
            modalScope = $rootScope.$new(),
            thisScopeId = modalScope.$id;

        $ionicModal.fromTemplateUrl(templateUrl, {
            scope: modalScope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            modalScope.modal = modal;

            modalScope.openModal = function () {
                modalScope.modal.show();
            };
            modalScope.closeModal = function (result) {
                deferred.resolve(result);
                modalScope.modal.hide();
            };
            modalScope.$on('modal.hidden', function (thisModal) {
                if (thisModal.currentScope) {
                    var modalScopeId = thisModal.currentScope.$id;
                    if (thisScopeId === modalScopeId) {
                        deferred.resolve(null);
                        _cleanup(thisModal.currentScope);
                    }
                }
            });

            // Invoke the controller
            var locals = { '$scope': modalScope, 'parameters': parameters };
            var ctrlEval = _evalController(controller);
            ctrlInstance = $controller(controller, locals);
            if (ctrlEval.isControllerAs) {
                ctrlInstance.openModal = modalScope.openModal;
                ctrlInstance.closeModal = modalScope.closeModal;
            }

            modalScope.modal.show();

        }, function (err) {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    function _cleanup(scope) {
        scope.$destroy();
        if (scope.modal) {
            scope.modal.remove();
        }
    }

    function _evalController(ctrlName) {
        var result = {
            isControllerAs: false,
            controllerName: '',
            propName: ''
        };
        var fragments = (ctrlName || '').trim().split(/\s+/);
        result.isControllerAs = fragments.length === 3 && (fragments[1] || '').toLowerCase() === 'as';
        if (result.isControllerAs) {
            result.controllerName = fragments[0];
            result.propName = fragments[2];
        } else {
            result.controllerName = ctrlName;
        }

        return result;
    }


}]) // end
angular.module('hariRtc.services').factory('signaling', ["socketFactory", "env",function (socketFactory, env) {

	if(!env.signalingEndpoint){
		env.signalingEndpoint = 'https://irest.pitt.edu:8080/';
	}
    var socket = io.connect(env.signalingEndpoint, {secure: true});
    
    var socketFactory = socketFactory({
      ioSocket: socket
    });

    return socketFactory;
  }]);