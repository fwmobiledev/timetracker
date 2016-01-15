var uuid = require('node-uuid');
var ipcR = require("electron").ipcRenderer;

myApp.controller('timesheetCtrl', ['timesheet','OfflineStorage','$scope',  function(timesheet, OfflineStorage, $scope) {
    var syncData = false;
    $scope.newToggleEntry = {};
    $scope.showManualForm = false;

    $scope.userObject =  OfflineStorage.getDocs('user');
    if($scope.userObject.length) {
        $scope.uid = $scope.userObject[0].id;
    }

    /* Helper Function to sync data to online */
    $scope.syncData = function(TimesheetData) {
        timesheet.syncTimesheets(TimesheetData).success(function (response) {
            OfflineStorage.truncateDb('timesheet');
            $scope.timeEntries = [];
            angular.forEach(response, function (timeEntry, key) {
                timeEntry.uuid = uuid.v4();
                timeEntry.status = 1;
                OfflineStorage.addDoc(timeEntry, 'timesheet');
                $scope.timeEntries.push(timeEntry);
            });
        }).error(function (e) {
            $scope.timeEntries = OfflineStorage.getDocs('timesheet');
            /* Load offline Data on error */
        });
    };

    /* Load TimeEnteries From Offline and Sync Data to Online */
    var timeEntries = OfflineStorage.getDocs('timesheet', 'all');

    if(timeEntries.length) {
        angular.forEach(timeEntries, function(data, key) {
            if(!data.status) {
                syncData = true;
            }
        });

        if(syncData) {
            $scope.syncData(timeEntries); /* Sync data to online for status 0 */
        }
    }


    /* Load timeEntries Form Online */
    if(!syncData) {
        timesheet.getTimesheet($scope.uid).success(function (data) {
            OfflineStorage.truncateDb('timesheet');
            $scope.timeEntries = [];
            angular.forEach(data, function (timeEntry, key) {
                timeEntry.uuid = uuid.v4();
                timeEntry.status = 1;
                OfflineStorage.addDoc(timeEntry, 'timesheet');
                $scope.timeEntries.push(timeEntry);

                /* Add entry */
            });

        }).error(function (e) {
            $scope.timeEntries = OfflineStorage.getDocs('timesheet');
            /* Load offline Data on error */
        });
    }

    /* Group by date and sort by */
    $scope.$watch('timeEntries', function(value) {
        var output = [];
        angular.forEach(value, function(data, key) {
            value[key].date = getFormattedTime(parseInt(data.start_time), true);
            value[key].dateTime = parseInt(data.start_time);
            if(data.total_time) {
                //value[key].timeInSeconds = toSeconds(data.total_time.toString());
                value[key].timeInSeconds = parseFloat(data.total_time);
            }
        });

        $scope.sortedTimeEntries = groupBy(value, 'date');

        $scope.sortedTimeEntries.sort(function(a, b){
            return b.dateTime - a.dateTime;
        });

        /* Total Duration */
        angular.forEach($scope.sortedTimeEntries, function(data1, tkey) {
            var total_duration = 0;
            angular.forEach(data1.data, function(timesheet, ttkey) {
                if(timesheet.timeInSeconds) {
                    total_duration += timesheet.timeInSeconds;
                }
            });

            //$scope.sortedTimeEntries[tkey].totalDuration = toHHMMSS(total_duration);
            $scope.sortedTimeEntries[tkey].totalDuration = total_duration.toFixed(2);

            /* Sort time entries descending order */
            data1.data.sort(function(a, b){
                return b.start_time-a.start_time;  //sort by date ascending
            });

        });


    }, true);

    /**========== TIMESHEET FORM STARTS ==================**/

    $scope.addManualTimesheetFormSubmit =false;
    var currentDate = new Date().getTime();
    $scope.newToggleEntry.start_time_format = getFormattedTime(currentDate);
    $scope.newToggleEntry.end_time_format = getFormattedTime(currentDate);
    $scope.timerRunning = false;

    $scope.resetToggleEntryVar = function() {
        delete $scope.newToggleEntry.uuid;
        delete $scope.newToggleEntry.project;
        delete $scope.newToggleEntry.tagArr;
        delete $scope.newToggleEntry.estimates;
        delete $scope.fwToggle.estimates;
        delete $scope.newToggleEntry.desc;
    };

    $scope.clearFields = function() {
        $scope.resetToggleEntryVar();
        $scope.showForm = false;
        $scope.$broadcast('timer-reset');
        $scope.timerRunning = false;
        $scope.addManualTimesheetFormSubmit =false;
    };

    $scope.openCreateNew = function() {
        $scope.showForm = true;
        $scope.showFormIsOpened = true;
        $scope.showManualFormIsOpened = false;
        $scope.checkForAlreadyEnteredData();
        $scope.$broadcast('addManualTimesheetFormSubmit', {addManualTimesheetFormSubmit: false});
    };

    $scope.openEditTimeEntryPopup = function(uuid) {
        $scope.showManualForm = true;
        $scope.showManualFormIsOpened = true;
        $scope.showFormIsOpened = false;
        $scope.$broadcast('updateTimeEntry', {uuid: uuid});
    };

    $scope.openManualEntry = function() {
        $scope.showManualForm = true;
        $scope.showManualFormIsOpened = true;
        $scope.showFormIsOpened = false;
        $scope.clearFields();
        $scope.$broadcast('updateTimeSheetVariable', {newToggleEntry: $scope.newToggleEntry});
        $scope.$broadcast('addManualTimesheetFormSubmit', {addManualTimesheetFormSubmit: false});
    };

    $scope.checkForAlreadyEnteredData = function() {
        if (!$scope.addDetailFormFilled) {
            $scope.resetToggleEntryVar();
            $scope.$broadcast('updateTimeSheetVariable', {newToggleEntry: $scope.newToggleEntry});
        } else {
            $scope.$broadcast('updateTimeSheetVariable', {newToggleEntry: $scope.newToggleEntry});
        }
    };

    $scope.$on('saveNewlyCreatedTimesheetData', function (event, args) {
        if(args.timesheet.desc != undefined && args.timesheet.desc) {
            $scope.newToggleEntry.desc = args.timesheet.desc;
        }if(args.timesheet.project != undefined && args.timesheet.project) {
            $scope.newToggleEntry.project = args.timesheet.project;
        }if(args.timesheet.estimates != undefined && args.timesheet.estimates) {
            $scope.newToggleEntry.estimates = args.timesheet.estimates;
        }if(args.timesheet.tagArr != undefined && args.timesheet.tagArr) {
            $scope.newToggleEntry.tagArr = args.timesheet.tagArr;
        }
        //$scope.addManualTimesheetForm = angular.copy(args.addManualTimesheetForm);

        $scope.addDetailFormFilled = true;
    });

    $scope.$on('updateTimeEntriesListing', function (event, args) {
       $scope.timeEntries = args.timeEntries;
    });


    /* Start Timer on click */
    $scope.startTimer = function (){
        var currentDate = new Date().getTime();
        $scope.$broadcast('timer-start');
        $scope.timerRunning = true;
        $scope.newToggleEntry.start_time = currentDate;
        $scope.newToggleEntry.end_time = currentDate;
        $scope.newToggleEntry.start_time_format = getFormattedTime(currentDate);
        $scope.newToggleEntry.end_time_format = getFormattedTime(currentDate);
        $scope.showForm = false;
    };

    /* Stop Timer on click */
    $scope.stopTimer = function (addManualTimesheetForm){
        $scope.checkForAlreadyEnteredData();
        var addTimesheetForm = addManualTimesheetForm;
        if(addTimesheetForm.$valid) {
            $scope.newToggleEntry.end_time = new Date().getTime();
            //$scope.newToggleEntry.end_time = 1451371251000;
            $scope.newToggleEntry.end_time_format = getFormattedTime($scope.newToggleEntry.end_time);
            $scope.$broadcast('timer-stop');
            $scope.timerRunning = false;
            $scope.showForm = false;
            $scope.clearFields();
            $scope.$broadcast('addManualTimesheetFormSubmit', {addManualTimesheetFormSubmit: false});
        }else {
            $scope.$broadcast('addManualTimesheetFormSubmit', {addManualTimesheetFormSubmit: true});
            $scope.showForm = true;
            $scope.showFormIsOpened = true;
            $scope.showManualFormIsOpened = false;
        }
    };

    $scope.$on('timer-stopped', function (event, data){
        var startTime = $scope.newToggleEntry.start_time; //convert string date to Date object
        var endTime = $scope.newToggleEntry.end_time;
        var diff = endTime-startTime;
        $scope.newToggleEntry.total_time = millisToTime(diff);
        $scope.newToggleEntry.total_time = $scope.newToggleEntry.total_time.toFixed(2);
        $scope.$broadcast('saveTimesheetOnTimerStopped', {total_time: $scope.newToggleEntry.total_time,startTime: startTime, endTime:endTime });

    });

    ipcR.on('get_timer_status', function(event, arg) {
        if($scope.timerRunning == false) {
            ipcR.send('start_idle_timer', $scope.timerRunning);
        }
    });

    $scope.$on('closePopup', function (event, args) {
        if($scope.showForm) {
            $scope.showForm = false;
            $scope.addManualTimesheetFormSubmit = false;
        }
        if($scope.showManualForm) {
            $scope.showManualForm = false;
        }

    });


}]);


function getFormattedTime(unix_timestamp, date) {
    var d = new Date(unix_timestamp);
    var h = (d.getHours().toString().length == 1) ? ('0' + d.getHours() % 12 || 12) : d.getHours() % 12 || 12;
    var m = (d.getMinutes().toString().length == 1) ? ('0' + d.getMinutes()) : d.getMinutes();
    var s = (d.getSeconds().toString().length == 1) ? ('0' + d.getSeconds()) : d.getSeconds();

    if(date) {
        var monthNames = ["Jan", "Feb", "March", "April", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat","Sun"];

        var month = monthNames[d.getMonth()];
        var day = days[d.getDay()-1];
        var date = d.getDate();
        var time = day + "," + date+nth(date) + ' ' + month;
        return time;
    }else {
        var time = h + ':' + m + ':' + s;
        return time;
    }
}

function nth(d) {
    if(d>3 && d<21) return 'th';
    switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

function millisToTime(millis){
    var hours = Math.floor(millis / 36e5),
        mins = Math.floor((millis % 36e5) / 6e4),
        secs = Math.floor((millis % 6e4) / 1000);

    mins = mins/60;
    return total_time = hours+mins;
    //return hours+':'+mins+':'+secs;
}

function groupBy(arr, key) {
    var newArr = [],
        types = {},
        newItem, i, j, cur;
    for (i = 0, j = arr.length; i < j; i++) {
        cur = arr[i];
        if (!(cur[key] in types)) {
            types[cur[key]] = { date: cur[key], data: [] , totalDuration: 0, dateTime: cur['dateTime']};
            newArr.push(types[cur[key]]);
        }
        types[cur[key]].data.push(cur);
    }
    return newArr;
}


function doesConnectionExist() {
    var xhr = new XMLHttpRequest();
    var file = "http://192.168.7.130/dotahead_template_issues/auth/login";
    var randomNum = Math.round(Math.random() * 10000);

    xhr.open('HEAD', file + "?rand=" + randomNum, false);

    try {
        xhr.send();

        if (xhr.status >= 200 && xhr.status < 304) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}


function toSeconds( time ) {
    var parts = time.split(':');
    return (+parts[0]) * 60 * 60 + (+parts[1]) * 60 + (+parts[2]);
}

function toHHMMSS(sec) {
    var sec_num = parseInt(sec, 10); // don't forget the second parm
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;


    return time;
}
