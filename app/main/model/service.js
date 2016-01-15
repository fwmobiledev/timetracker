/**
 * Created by komal on 16/12/15.
 */

//var myService = angular.module('myService', []);
myApp.service('timesheet', ['$http', '$rootScope', function ($http, $rootScope) {

    //var baseUrl = "http://localhost/timesheet/public/";

    this.getTimesheet = function (uid) {
        return $http({
            headers: {
                'Content-Type': 'application/json'
            },
            url: baseUrl + 'rest/get-timeentries-by-uid',
            method: "POST",
            data: {uid:uid}
        });

        //return $http.get(baseUrl + 'get-timeentries-by-uid');
    };

    this.getProjects = function () {
        return $http.get(baseUrl + 'rest/projects');
    };

    this.getTags = function () {
        return $http.get(baseUrl + 'rest/tags');
    };

    this.saveTimesheet = function (timesheetData) {

        var url = baseUrl + 'rest/timesheet/save';
        var method = "POST";
        return $http({
            headers: {
                'Content-Type': 'application/json'
            },
            url: url,
            method: method,
            data: timesheetData
        })
    };

    this.removeTimesheet = function (id) {

        var url = baseUrl + 'rest/timesheet/delete';
        var method = "POST";
        return $http({
            headers: {
                'Content-Type': 'application/json'
            },
            url: url,
            method: method,
            data: {id:id}
        })
    };

    this.syncTimesheets = function (timesheetData) {
        return $http({
            headers: {
                'Content-Type': 'application/json'
            },
            url: baseUrl + 'rest/timesheet/sync-timesheets',
            method: "POST",
            data: timesheetData
        })
    };
}]);