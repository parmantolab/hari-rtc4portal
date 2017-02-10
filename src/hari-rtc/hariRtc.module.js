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
          'hariRtc.config',
          'hariRtc.directives',
          'hariRtc.services'
      ]);

})(angular);
