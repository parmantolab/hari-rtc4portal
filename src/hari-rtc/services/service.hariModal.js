
/*
 * hariModal (portal/semantic ui version)
 * (c) 2016 Wayan P
 * Based on angular-modal by Brian Ford
 */

'use strict';

angular
.module('hariRtc.services')
.factory('hariModal', ['$animate', '$compile', '$rootScope', '$controller', '$q', '$http', '$templateCache', modalFactoryFactory]);

function modalFactoryFactory($animate, $compile, $rootScope, $controller, $q, $http, $templateCache) {
  return function modalFactory (config) {
    if (!(!config.template ^ !config.templateUrl)) {
      throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
    }

    var template      = config.template,
        controller    = config.controller || null,
        controllerAs  = config.controllerAs,
        parameters    = config.parameters,
        container     = angular.element(config.container || document.body),
        element       = null,
        html,
        scope;

    if (config.template) {
      html = $q.when(config.template);
    } else {
      html = $http.get(config.templateUrl, {
        cache: $templateCache
      }).
      then(function (response) {
        return response.data;
      });
    }

    function activate () {
      return html.then(function (html) {
        if (!element) {
          attach(html, parameters);
        }
      });
    }


    function attach (html, locals) {
      element = angular.element(html);
      if (element.length === 0) {
        throw new Error('The template contains no elements; you need to wrap text nodes')
      }
      scope = $rootScope.$new();
      if (controller) {
        if (!locals) {
          locals = {};
        }
        locals.$scope = scope;
        var ctrl = $controller(controller, locals);
        if (controllerAs) {
          scope[controllerAs] = ctrl;
        }
        scope.closeMe = deactivate;
      } else if (locals) {
        for (var prop in locals) {
          scope[prop] = locals[prop];
        }
      }
      var modalEl = $compile(element)(scope);
      return modalEl.modal({
                    closable: false,
                    duration: 100,
                    blurring: true
                })
                .modal("show");
      //return $animate.enter(element, container);
    }

    function deactivate () {
      if (!element) {
        return $q.when();
      }
      return $animate.leave(element).then(function () {
        scope.$destroy();
        scope = null;
        element.remove();
        element = null;
      });
    }

    function active () {
      return !!element;
    }

    return {
      activate: activate,
      deactivate: deactivate,
      active: active
    };
  };
}