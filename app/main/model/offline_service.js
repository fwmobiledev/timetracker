/**
 * Created by komal on 17/12/15.
 */

var ipc = require("electron").ipcRenderer,
    loki = require("lokijs"),
    path = require('path');
 fs = require('fs');

var userhome = require('userhome');
var homeAppDir = userhome() + "/." + "timesheet";
var dbFile = 'app.db';


//var offlineService = angular.module('offlineService', []);
console.log("DIRECTORY PATH", path.resolve(homeAppDir, "./app.db"));
myApp.service('OfflineStorage', ['$q', function($q) {
    this.db = new loki(path.resolve(homeAppDir, "./app.db"));
    this.timesheetCollection = null;
    this.projectCollection = null;
    this.tagCollection = null;
    this.collection = null;
    this.loaded = false;
    this.userCollection = null;

    this.init = function () {
        var d = $q.defer();

        this.reload()
            .then(function () {
                this.timesheetCollection = this.db.getCollection('timesheet');
                this.projectCollection = this.db.getCollection('projects');
                this.tagCollection = this.db.getCollection('tags');
                // this.loaded = true;

                d.resolve(this);
            }.bind(this))
            .catch(function (e) {
                // create collection
                this.db.addCollection('timesheet');
                this.db.addCollection('projects');
                this.db.addCollection('tags');
                this.db.addCollection('user');
                // save and create file
                this.db.saveDatabase();

                this.timesheetCollection = this.db.getCollection('timesheet');
                this.projectCollection = this.db.getCollection('projects');
                this.tagCollection = this.db.getCollection('tags');
                // this.loaded = true;

                d.resolve(this);
            }.bind(this));

        return d.promise;
    };
    this.reload = function() {
        var d = $q.defer();

        this.loaded = false;

        this.db.loadDatabase({}, function(e) {
            if(e) {
                d.reject(e);
            } else {
                this.loaded = true;
                d.resolve(this);
            }
        }.bind(this));

        return d.promise;
    };

    this.getCollection = function(collection) {
        //this.collection = this.db.getCollection('timesheet');
        this.collection = this.db.getCollection(collection);
        return this.collection;
    };

    this.isLoaded = function() {
        return this.loaded;
    };

    this.addDoc = function(data, collection) {
        var d = $q.defer();
        if(this.isLoaded() && this.getCollection(collection)) {
            data.deleted = 0;
            this.getCollection(collection).insert(data);
            this.db.saveDatabase();
            d.resolve(this.getCollection(collection));
        } else {
            d.reject(new Error('DB NOT READY'));
        }

        return d.promise;
    };

    this.truncateDb = function(collection) {
        //return function() {
            var d = $q.defer();

            if(this.isLoaded() && this.getCollection(collection)) {
                //this.getCollection(collection).data.removeAll();
                this.getCollection(collection).clear();
                this.db.saveDatabase();

                // we need to inform the insert view that the db content has changed
                ipc.send('reload-insert-view');

                d.resolve(true);
            } else {
                d.reject(new Error('DB NOT READY'));
            }

            return d.promise;
        //}.bind(this);
    };

    this.removeTimeEntry = function(id) {
        //return function() {
            var d = $q.defer();

            if(this.isLoaded() && this.getCollection('timesheet')) {
                var timesheetData = this.getCollection('timesheet').find({ id:  id});
                this.getCollection('timesheet').remove(timesheetData);
                this.db.saveDatabase();
                d.resolve(true);
            } else {
                d.reject(new Error('DB NOT READY'));
            }

            return d.promise;
        //}.bind(this);
    };

    this.removeTimeEntryByUUID = function(uuid) {
        //return function() {
            var d = $q.defer();

            if(this.isLoaded() && this.getCollection('timesheet')) {
                var timesheetData = this.getCollection('timesheet').find({ uuid:  uuid});
                this.getCollection('timesheet').remove(timesheetData);
                this.db.saveDatabase();
                d.resolve(true);
            } else {
                d.reject(new Error('DB NOT READY'));
            }

            return d.promise;
        //}.bind(this);
    };

    this.updateTimesheetStatus = function(uuid, op) {
        var d = $q.defer();
        if(this.isLoaded() && this.getCollection('timesheet')) {
            var timesheetData = this.getCollection('timesheet').find({ uuid:  uuid});
            if(timesheetData) {
                if (op && op == 'updateRemove') {
                    timesheetData[0].status = 0;
                    timesheetData[0].deleted = 1;
                } else {
                    timesheetData[0].status = 1;
                    timesheetData[0].deleted = 0;
                }

                this.getCollection('timesheet').update(timesheetData);
                this.db.saveDatabase();
                d.resolve(this.getCollection('timesheet'));
            }
        } else {
            d.reject(new Error('DB NOT READY'));
        }

        return d.promise;
    };

    this.getDocs = function(collection, op) {
        if(!op) {
            /*console.log("GETDOCS", collection);

            console.log("GET RESULT", this.getCollection(collection).data)*/
            return (this.getCollection(collection)) ? this.getCollection(collection).find({deleted: 0}) : null;
        }else {
            return (this.getCollection(collection)) ? this.getCollection(collection).data : null;
        }
    };

    this.getSingleTimeEntry = function(uuid) {
        return (this.getCollection("timesheet")) ? this.getCollection("timesheet").find({uuid: uuid}) : null;
    };

}]);
