/**
 * Created by pruthvi on 17/12/15.
 */

myApp
    .factory('userModel', ['$http','$cookies', '$cookieStore', '$window','$rootScope',
    function($http, $cookies, $cookieStore,$window, $rootScope){
        var userModel = {};
        /**
         * Check if the credentials are correct from server
         * and return the promise back to the controller
         *
         * @param  {array} loginData
         * @return {promise}
         */
        /**
         * Check if the credentials are correct from server
         * and return the promise back to the controller
         *
         * @param  {array} loginData
         * @return {promise}
         */
        userModel.doLogin = function (loginData) {
            return $http({
                headers: {
                    'Content-Type': 'application/json'
                },
                url: baseUrl + 'rest/auth',
                method: "POST",
                data: {
                    email: loginData.email,
                    password: loginData.password,
                    grant_type:GRANT_TYPE,
                    client_id:CLIENT_ID
                }
            }).success(function (response) {
                var cookievalue = JSON.stringify(response.data);
                $cookies.put('auth', cookievalue);
                return response.data;

            }).error(function (data, status, headers) {
                return {'message': 'Unknown error, Please try again later'};
            });
        }

        /**
         * Return whether the user is logged in or not
         * based on the cookie set during the login
         *
         * @return {boolean}
         */
        userModel.getAuthStatus = function () {
            var status = $cookies.get('auth');
            if (status) {
                return true;
            } else {
                return false;
            }
        };

        /**
         * Return the user object from the cookie
         * and convert from string to JSON
         *
         * @return {userObject}
         */
        userModel.getUserObject = function () {
            var user = angular.fromJson($cookies.get('auth'));
            return user;
        }

        /**
         * Close the session of the current user
         * and delete the cookie set for him
         *
         * @return boolean
         */
        userModel.doUserLogout = function () {
            $cookies.remove('auth');
        };

        return userModel;
    }]);
