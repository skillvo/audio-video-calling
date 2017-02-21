var app = angular.module('plunker', []);

app.controller('MainCtrl', function ($scope) {
    $scope.name = 'World';
    $scope.isRoomCreated = false;
    // create our webrtc connection
    // grab the room from the URL
    $scope.roomName = location.search && location.search.split('?')[1];

    // create our webrtc connection
    $scope.webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false
    });

    // when it's ready, join if we got a room from the URL
    $scope.webrtc.on('readyToCall', function () {
        // you can name it anything
        if ($scope.roomName) $scope.webrtc.joinRoom($scope.roomName);
    });

    $scope.showVolume = function (el, volume) {
        if (!el) return;
        if (volume < -45) volume = -45; // -45 to -20 is
        if (volume > -20) volume = -20; // a good range
        el.value = volume;
    }

    // we got access to the camera
    $scope.webrtc.on('localStream', function (stream) {
        $scope.localVolume = true;
    });
    // we did not get access to the camera
    $scope.webrtc.on('localMediaError', function (err) { });

    // local screen obtained
    $scope.webrtc.on('localScreenAdded', function (video) {
        video.onclick = function () {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
        };
        document.getElementById('localScreenContainer').appendChild(video);
        $scope.localScreenContainer = true;
    });
    // local screen removed
    $scope.webrtc.on('localScreenRemoved', function (video) {
        document.getElementById('localScreenContainer').removeChild(video);
        $scope.localScreenContainer = false;
    });

    // a peer video has been added
    $scope.webrtc.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (!remotes) return;
        var container = document.createElement('div');
        container.className = 'videoContainer';
        container.id = 'container_' + $scope.webrtc.getDomId(peer);
        container.appendChild(video);

        // suppress contextmenu
        video.oncontextmenu = function () {
            return false;
        };

        // resize the video on click
        video.onclick = function () {
            container.style.width = video.videoWidth + 'px';
            container.style.height = video.videoHeight + 'px';
        };

        // show the remote volume
        var vol = document.createElement('meter');
        vol.id = 'volume_' + peer.id;
        vol.className = 'volume';
        vol.min = -45;
        vol.max = -20;
        vol.low = -40;
        vol.high = -25;
        container.appendChild(vol);

        // show the ice connection state
        if (peer && peer.pc) {
            var connstate = document.createElement('div');
            connstate.className = 'connectionstate';
            container.appendChild(connstate);
            peer.pc.on('iceConnectionStateChange', function (event) {
                switch (peer.pc.iceConnectionState) {
                    case 'checking':
                        connstate.innerText = 'Connecting to peer...';
                        break;
                    case 'connected':
                    case 'completed': // on caller side
                        $(vol).show();
                        connstate.innerText = 'Connection established.';
                        break;
                    case 'disconnected':
                        connstate.innerText = 'Disconnected.';
                        break;
                    case 'failed':
                        connstate.innerText = 'Connection failed.';
                        break;
                    case 'closed':
                        connstate.innerText = 'Connection closed.';
                        break;
                }
            });
        }
        remotes.appendChild(container);
    });
    // a peer was removed
    $scope.webrtc.on('videoRemoved', function (video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + $scope.webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });

    // local volume has changed
    $scope.webrtc.on('volumeChange', function (volume, treshold) {
        $scope.showVolume(document.getElementById('localVolume'), volume);
    });
    // remote volume has changed
    $scope.webrtc.on('remoteVolumeChange', function (peer, volume) {
        $scope.showVolume(document.getElementById('volume_' + peer.id), volume);
    });

    // local p2p/ice failure
    $scope.webrtc.on('iceFailed', function (peer) {
        var connstate = document.querySelector('#container_' + $scope.webrtc.getDomId(peer) + ' .connectionstate');
        console.log('local fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            fileinput.disabled = 'disabled';
        }
    });

    // remote p2p/ice failure
    $scope.webrtc.on('connectivityError', function (peer) {
        var connstate = document.querySelector('#container_' + $scope.webrtc.getDomId(peer) + ' .connectionstate');
        console.log('remote fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            fileinput.disabled = 'disabled';
        }
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
        console.log($scope.roomName);
        var val = $scope.roomName.toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
        $scope.webrtc.createRoom(val, function (err, name) {
            console.log(' create room cb', arguments);

            var newUrl = location.pathname + '?' + name;
            if (!err) {
                history.replaceState({ foo: 'bar' }, null, newUrl);
                $scope.setRoom();
            } else {
                console.log(err);
            }
        });
        return false;
    };

});
