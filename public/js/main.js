var app = angular.module('audioVideo', []);

(function () {
    'use strict';

    angular
        .module('audioVideo')
        .controller('MainCtrl', MainCtrl);

    MainCtrl.inject = ['$scope'];

    function MainCtrl($scope) {
        var vm = this;

        $scope.isRoomCreated = false;
        $scope.remoteUserList = [];
        $scope.local = {};
        $scope.local.showScreenContainer = true;
        $scope.local.isShowVolume = true;

        // create our webrtc connection
        // grab the room from the URL
        $scope.roomName = location.search && location.search.split('?')[1];

        // create our webrtc connection
        $scope.webrtc = new SimpleWebRTC({
            localVideoEl: 'localVideo', // the id/element dom element that will hold "our" video
            remoteVideosEl: '', // the id/element dom element that will hold remote videos
            autoRequestMedia: true, // immediately ask for camera access
            debug: false,
            detectSpeakingEvents: true,
            autoAdjustMic: false
        });

        // when it's ready, join if we got a room from the URL
        $scope.webrtc.on('readyToCall', function () {
            if ($scope.roomName) $scope.webrtc.joinRoom($scope.roomName);
        });

        // we got access to the camera
        $scope.webrtc.on('localStream', function (stream) {
            $scope.$evalAsync(function () {
                $scope.local.isShowVolume = true;
            });
        });

        // we did not get access to the camera
        $scope.webrtc.on('localMediaError', function (err) { });

        // local screen obtained
        $scope.webrtc.on('localScreenAdded', function (video) {
            $scope.$evalAsync(function () {
                $scope.local.video = video;
                $scope.local.showScreenContainer = true;
            });
        });

        // local screen removed
        $scope.webrtc.on('localScreenRemoved', function (video) {
            $scope.$evalAsync(function () {
                $scope.local.video = null;
                $scope.local.showScreenContainer = false;
            });
        });

        // a peer video has been added
        $scope.webrtc.on('videoAdded', function (video, peer) {
            $scope.$evalAsync(function () {

                $scope.remoteUserList = $scope.remoteUserList || [];
                var idx, domid = $scope.webrtc.getDomId(peer);
                $scope.user = {};

                var temp = {
                    id: $scope.webrtc.getDomId(peer),
                    peer: peer,
                    video: video
                };


                idx = $scope.remoteUserList.indexOfAssoc(domid, 'id');
                if (idx !== undefined) {
                    $scope.user = $scope.remoteUserList[idx];
                } else {
                    $scope.remoteUserList.push(temp);
                    var tempidx = $scope.remoteUserList.length - 1;
                    $scope.user = $scope.remoteUserList[tempidx];
                }

                // show the ice connection state
                if (peer && peer.pc) {

                    peer.pc.on('iceConnectionStateChange', function (event) {
                        switch (peer.pc.iceConnectionState) {
                            case 'checking':
                                $scope.user.connstate = 'Connecting to peer...';
                                break;
                            case 'connected':
                            case 'completed': // on caller side
                                $scope.user.isShowVolume = true;
                                $scope.user.connstate = 'Connection established.';
                                break;
                            case 'disconnected':
                                $scope.user.connstate = 'Disconnected.';
                                break;
                            case 'failed':
                                $scope.user.connstate = 'Connection failed.';
                                break;
                            case 'closed':
                                $scope.user.connstate = 'Connection closed.';
                                break;
                        }
                    });
                }
            });
        });

        // a peer was removed
        $scope.webrtc.on('videoRemoved', function (video, peer) {
            $scope.$evalAsync(function () {
                var domid = $scope.webrtc.getDomId(peer);
                var idx = $scope.remoteUserList.indexOfAssoc(domid, 'id');
                if (idx !== undefined)
                    $scope.remoteUserList.splice(idx, 1);
            });
        });

        // local volume has changed
        $scope.webrtc.on('volumeChange', function (volume, treshold) {
            $scope.$evalAsync(function () {
                if (volume < -45) volume = -45; // -45 to -20 is
                if (volume > -20) volume = -20; // a good range
                $scope.local.volume = volume;
            });
        });

        // remote volume has changed
        $scope.webrtc.on('remoteVolumeChange', function (peer, volume) {
            $scope.$evalAsync(function () {
                var domid = $scope.webrtc.getDomId(peer);
                var idx = $scope.remoteUserList.indexOfAssoc(domid, 'id');
                if (idx !== undefined) {
                    if (volume < -45) volume = -45; // -45 to -20 is
                    if (volume > -20) volume = -20; // a good range
                    $scope.remoteUserList[idx].volume = volume;
                }
            });
        });


        // local p2p/ice failure
        $scope.webrtc.on('iceFailed', function (peer) {
            $scope.$evalAsync(function () {
                var domid = $scope.webrtc.getDomId(peer);
                var idx = $scope.remoteUserList.indexOfAssoc(domid, 'id');

                if (idx !== undefined) {
                    $scope.remoteUserList[idx].connstate = 'Connection failed.';
                }
            });
        });

        // remote p2p/ice failure
        $scope.webrtc.on('connectivityError', function (peer) {
            $scope.$evalAsync(function () {
                var domid = $scope.webrtc.getDomId(peer);
                var idx = $scope.remoteUserList.indexOfAssoc(domid, 'id');

                if (idx !== undefined) {
                    $scope.remoteUserList[idx].connstate = 'Connection failed.';
                }
            });
        });

        // Since we use this twice we put it here
        $scope.setRoom = function (name) {
            name = $scope.roomName || name;
            $scope.isRoomCreated = true;
            $scope.joinUrl = 'Link to join: ' + location.href;
        }

        if ($scope.roomName) {
            $scope.setRoom();
        }

        $scope.createRoom = function () {
            var val = $scope.roomName.toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
            $scope.webrtc.createRoom(val, function (err, name) {
                console.log(' create room cb', arguments);

                var newUrl = location.pathname + '?' + name;
                if (!err) {
                    history.replaceState({ foo: 'bar' }, null, newUrl);
                    $scope.$evalAsync(function () {
                        $scope.setRoom();
                    });
                } else {
                    console.log(err);
                }
            });
            return false;
        };
    }
})();



(function () {
    'use strict';

    angular.module('audioVideo')
        .directive('streamVideo', streamVideo);

    function streamVideo() {
        return {
            link: link,
            restrict: 'EA',
            scope: {
                video: '='
            }
        };
        function link(scope, element, attrs) {
            element.append(scope.video);
        }
    }
})();

Array.prototype.indexOfAssoc = function (value, key) {

    if (!key && key !== 0) {
        throw "Please provide a key to find index of.";
    }

    var i;
    for (i = 0; i < this.length; i++) {

        //   typecheck([{ arg: this[i], expected: 'object' }], 'bulk');

        if (this[i][key] === value) {
            return i;
        }
    }
};
