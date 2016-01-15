/**
 * Created by komal on 29/12/15.
 */
var uuid = require('node-uuid');

myApp.controller('timesheetManualCtrl', ['timesheet','OfflineStorage','$scope','$location', '$route', function(timesheet, OfflineStorage, $scope, $location,$route) {

    $scope.timesheet = {};

    $scope.$on('updateTimeSheetVariable', function (event, args) {
        $scope.timesheet = angular.copy(args.newToggleEntry);
    });

    $scope.$on('updateTimeEntry', function (event, args) {
        var uuid = args.uuid;

        var timeEntry = OfflineStorage.getSingleTimeEntry(uuid);
        console.log(uuid);
        $scope.timesheet.desc = timeEntry[0].desc;

        $scope.timesheet.project = {};
        $scope.timesheet.project.name = timeEntry[0].project;
        $scope.timesheet.project.id = timeEntry[0].project_id;

        $scope.timesheet.estimates = {};
        $scope.fwToggle.estimates = {};
        if (timeEntry[0].estimate_id != undefined && timeEntry[0].estimate_id.length) {
            angular.forEach($scope.fwToggle.projectArr, function (project, key) {
                if (project.id == $scope.timesheet.project.id) {
                    $scope.fwToggle.estimates = project.estimates;
                    angular.forEach(project.estimates, function (estimate, ekey) {
                        if (estimate.id == timeEntry[0].estimate_id) {
                            $scope.timesheet.estimates = estimate;
                        }
                    });
                }
            });
        }

        var savedTagsArr = timeEntry[0].tags.split(',');

        var tagsObj = OfflineStorage.getDocs('tags');
        var tagArr = (tagsObj.length) ? tagsObj : {};
        var temp = [];

        angular.forEach(savedTagsArr, function (tag, tkey) {
            angular.forEach(tagArr, function (tagDetail, key) {
                if (tag == tagDetail.id) {
                    var tagOption = {id: tagDetail.id, label: tagDetail.name};
                    temp.push(tagOption);
                }
            });
        });

        $scope.timesheet.tagArr = temp;
        $scope.timesheet.total_time = timeEntry[0].total_time;
        $scope.timesheet.uuid = timeEntry[0].uuid;
        $scope.timesheet.id = timeEntry[0].id;
        $scope.timesheet.edit = true;

    });

    $scope.saveTimesheetData = function(timesheet) {
        $scope.$emit('saveNewlyCreatedTimesheetData', { timesheet: timesheet });

        $scope.$emit('closePopup');
    };

    $scope.$on('saveTimesheetOnTimerStopped', function(event, args) {
        $scope.timesheet.start_time = args.startTime;
        $scope.timesheet.end_time = args.endTime;
        $scope.timesheet.total_time = args.total_time;
        console.log("INSIDE SAVE", $scope.timesheet.total_time);
        $scope.saveTimesheetCallback();
    });

    $scope.closePopup = function() {
        $scope.$emit('closePopup');
    };

    /* Save timesheet on click */
    $scope.saveManualEntry = function (addManualTimesheetForm){
        //var formIsValid = $scope.validate_manual_fields(addManualTimesheetForm);
        if(addManualTimesheetForm.$valid) {
            $scope.timesheet.start_time = new Date().getTime();
            $scope.addManualTimesheetFormSubmit = false;
            $scope.saveTimesheetCallback();
        }else {
            $scope.addManualTimesheetFormSubmit = true;
        }
    };

    $scope.saveTimesheetCallback = function() {
        var response = {};
        response.desc = $scope.timesheet.desc;

        response.project = ($scope.timesheet.project && $scope.timesheet.project.name != undefined) ? $scope.timesheet.project.name : '';
        response.project_id = ($scope.timesheet.project && $scope.timesheet.project.id != undefined) ? $scope.timesheet.project.id : '';

        response.estimate_id = ($scope.timesheet.estimates!=undefined && $scope.timesheet.estimates.id != undefined) ? $scope.timesheet.estimates.id : '';
        response.total_time = $scope.timesheet.total_time;

        if($scope.timesheet.uuid !=undefined) {
            response.uuid = $scope.timesheet.uuid;
            response.id = $scope.timesheet.id;
        }else {
            response.uuid = uuid.v4();
        }

        var temp = [];
        angular.forEach($scope.timesheet.tagArr, function(value, tag) {
            if(value) {
                temp.push(value.id);
            }
        });

        response.tags = temp.join(',');

        response.start_time = $scope.timesheet.start_time;
        response.end_time = $scope.timesheet.start_time;

        if($scope.timesheet.end_time != undefined) {
            response.end_time = $scope.timesheet.end_time;
        }

        response.uid = $scope.uid;

        /* Send Data to server */
        timesheet.saveTimesheet(response).success(function (data) {
            data.status = 1;
            /* Remove entry from local db for edit and add entry again */
            if($scope.timesheet.uuid !=undefined ){
                OfflineStorage.removeTimeEntry(response.id).then(function () {
                    OfflineStorage.addDoc(data, 'timesheet').then(function (offlineDbData) {
                        $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                        $scope.closePopup();
                        $route.reload();
                    });
                });
            }else {
                OfflineStorage.addDoc(data, 'timesheet').then(function (offlineDbData) {
                    $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                    $scope.closePopup();
                    $route.reload();
                });
            }
        }).error(function (data) { /* For OFFline */
            response.status = 0;
            if($scope.timesheet.uuid !=undefined) { /* For UPDATING ENTRY */
                OfflineStorage.removeTimeEntryByUUID($scope.timesheet.uuid).then(function () {
                    OfflineStorage.addDoc(response, 'timesheet').then(function (offlineDbData) {
                        $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                        $scope.closePopup();
                        $route.reload();
                    });
                });
            }else { /* For NEW ENTRY */
                OfflineStorage.addDoc(response, 'timesheet').then(function (offlineDbData) {
                    $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                    $scope.closePopup();
                    $route.reload();
                });
            }
        });
    };


    $scope.delete_entry = function(uuid) {
        if(confirm("Deleted Time Entries cannot be restored"))
        {
            var entryToDelete = OfflineStorage.getSingleTimeEntry(uuid);
            if(entryToDelete.id != undefined) {
                console.log(entryToDelete);
                /* Send Data to server */
                timesheet.removeTimesheet(id).success(function (data) {
                    OfflineStorage.removeTimeEntry(id).then(function () {
                        $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                        $scope.closePopup();
                        $route.reload();
                    });
                }).error(function (data) {
                    /* Update deleted flag to 1
                     OfflineStorage.updateTimesheetStatus(id, 'updateRemove').then(function (offlineDbData) {
                     $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                     });*/
                });
            }else {
                OfflineStorage.updateTimesheetStatus(uuid, 'updateRemove').then(function (offlineDbData) {
                    $scope.timeEntries = OfflineStorage.getDocs('timesheet');
                    $scope.closePopup();
                    $route.reload();
                });
            }
        }
        else
        {
            return false;
        }

    };


}]);