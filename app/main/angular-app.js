var myApp = angular.module('MainWindow', [
    'timer',
    'ngRoute',
    'ngCookies',
    'oi.select'
]);

myApp.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
            templateUrl: './main/views/login.html',
            controller: 'userCtrl'
        });

        $routeProvider.when('/timesheet', {
            templateUrl: './main/views/timesheet_form.html',
            controller: 'timesheetCtrl'
        });

        $routeProvider.when('/timesheet/add', {
            templateUrl: './main/views/timesheet_add_manual_form.html',
            controller: 'timesheetManualCtrl'
        });
        $routeProvider.otherwise( { redirectTo: "/timesheet" });
}]);