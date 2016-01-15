myApp.controller('MainCtrl', ['$scope','OfflineStorage','timesheet', '$rootScope','$location', function($scope,OfflineStorage,timesheet, $rootScope, $location) {

    /*Methods*/
    angular.extend($scope, {
        userObject: { email:'', password:'' },
        timeEntries: [],
        projects: {},
        fwToggle: {},
        uid: 0,
        user: {loggedInUser:false, data:[]}

    });

    $scope.init = function() {
        /* Load Projects */
        if(!$scope.fwToggle.projectArr.length) {
            timesheet.getProjects().success(function(data) {
                $scope.fwToggle.projectArr = data;
                angular.forEach($scope.fwToggle.projectArr, function (project, key) {
                    OfflineStorage.addDoc(project, 'projects'); /* ADD Projects */
                });
            });
        }

        /* Load Tags */
        if(!$scope.fwToggle.tagArr.length) {
            timesheet.getTags().success(function(data) {
                $scope.fwToggle.tagArr = data;
                angular.forEach($scope.fwToggle.tagArr, function (tag, key) {
                    OfflineStorage.addDoc(tag, 'tags'); /* ADD Projects */
                });
               /* console.log("INSIDE TAG", data);
                OfflineStorage.addDoc(data, 'tags');  *//*Update status of entry */
            });
        }
    };

    /* Load Offline Database */
    OfflineStorage
        .init()
        .then(function (db) {
            $scope.fwToggle.projectArr = db.getDocs('projects');
            var tagsObj = db.getDocs('tags');
            //$scope.fwToggle.tagArr = (tagsObj.length) ? tagsObj : {};
            var tagArr = (tagsObj.length) ? tagsObj : {};
            $scope.fwToggle.tagArr = [];
            angular.forEach(tagArr, function(data, key) {
                var tagData = {
                    id: data.id,
                    label: data.name
                };

                $scope.fwToggle.tagArr.push(tagData);
            });


            console.log("Tags", $scope.fwToggle.tagArr);
            $scope.init();

            $scope.userObject =  OfflineStorage.getDocs('user');
            if($scope.userObject && $scope.userObject[0] && $scope.userObject[0].id)
            {
                $scope.user.data = $scope.userObject[0];
                $location.path('/timesheet');
                $scope.user.loggedInUser = true;
            }

            OfflineStorage
                .reload()
                .then(function () {
                    $scope.timeEntries =  db.getDocs('timesheet');
                    $scope.userObject =  OfflineStorage.getDocs('user');
                });
        });

}]);