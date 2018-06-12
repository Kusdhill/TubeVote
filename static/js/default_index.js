// This is the js for the default/index.html view.
var player;

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};


    // functions go here
    self.host_view = function() {
        console.log("host_view, is_host is true")
        self.vue.is_host = true;
    };

    self.guest_view = function() {
        console.log("guest_view, is_guest is true")
        self.vue.is_guest = true;
    };

    self.new_session = function (event) {
        var host_name = event.path[1].childNodes[2].value;
        var passphrase = event.path[1].childNodes[4].value;
        var playlist_url = event.path[1].childNodes[6].value;

        if (host_name && passphrase && playlist_url) {
            self.vue.host_name = host_name;
            self.vue.passphrase = passphrase;
            self.vue.playlist_url = playlist_url;

            $.post(new_session_url,
            {
              host_name: self.vue.host_name,
              passphrase: self.vue.passphrase,
              playlist_url: self.vue.playlist_url
            },
            function(data) {
                console.log("new session created")
                self.get_playlist(self.vue.playlist_url);
                self.vue.session_created = true;
            }
            );
        }
    };

    // logs in guest and calls get_update(), start_video(), and initiates auto_refresh
    self.login_guest = function(event) {
        console.log("login_guest")
        var guest_name = event.path[1].childNodes[2].value;
        var passphrase = event.path[1].childNodes[4].value;

        if(guest_name && passphrase) {
            self.vue.passphrase = passphrase
            self.vue.guest_name = guest_name
            self.get_update();
        }
    };

    // gets playlist from youtube API, populates videos[] with playist information for each video
    self.get_playlist = function(url) {
        console.log("getting playlist")
        var playlist_items_url = 'https://www.googleapis.com/youtube/v3/playlistItems';
        var playlist_id = '';
        
        // checks that entered URL is a link to a playlist
        if(!url.includes('&list')){
            alert("Please enter a valid playlist url");
            throw new Error("invalid playlist_url");
        }else{
            var split = url.split('&list=')
            playlist_id = split[1];
            var str_index = '';
            var video_id = '';

            $.getJSON(playlist_items_url,
                {
                    maxResults: '25',
                    part: 'snippet',
                    playlistId: playlist_id,
                    key: 'AIzaSyA81ZBi5oLSK3xEdPjPaX1XlttqfLBoSIg'
                },
                function(data) {
                    for (i = 0; i < data.items.length; i++) { 
                        str_index = i.toString();
                        snippet = data.items[str_index].snippet;
                        snippet.votes = 0;
                        
                        video_id = snippet.resourceId.videoId;
                        snippet.video_id=video_id;
                        self.vue.videos.push(snippet)
                    }
                    self.start_video();
                }
            );
        }
    }

    // puts an updated session state in the database
    self.put_update = function() {
        console.log("put_update")
        if(self.vue.is_host && player) {
            self.vue.video_time = player.getCurrentTime()
            self.vue.playing = player.getVideoData().video_id
        }
        var videos_str = []
        var string_vid=''
        for (i=0; i<self.vue.videos.length; i++){
            string_vid = JSON.stringify(self.vue.videos[i])
            videos_str.push(string_vid)
        }

        $.post(put_update_url,
        {
          passphrase: self.vue.passphrase,
          videos: videos_str,
          video_time: self.vue.video_time,
          paused: self.vue.paused,
          playing: self.vue.playing
        },
        function(data) {
            self.get_update();
        }
        );
    }


    // gets an updated session state
    self.get_update = function() {
        console.log("get_update")
        $.getJSON(get_update_url,
            {
                passphrase: self.vue.passphrase
            },
            function(data) {
                //console.log(data.session)
                self.vue.session = data.session;
                self.vue.videos = data.session.videos;
                self.vue.video_time = data.session.video_time;
                self.vue.playing = data.session.playing;

                // guest first time login, start video after update got
                if(self.vue.is_guest && !self.vue.session_gotten){
                    self.vue.session_gotten = true;
                    self.start_video();
                    self.auto_refresh();
                }

                if(self.vue.is_guest && self.vue.paused && !data.session.paused && player){
                    player.playVideo();
                }
                self.vue.paused = data.session.paused;
            });
        if(self.vue.is_guest && self.vue.paused && player){
            player.pauseVideo();
        }
    }

    // posts time
    self.update_time = function() {
        var time = 0;
        if(player) time = player.getCurrentTime()
        $.post(update_time_url,
        {
          passphrase: self.vue.passphrase,
          video_time: time
        },
        function(data) {

        }
        );
    }

    // auto_refresh, calls get_update() every 2 seconds
    self.auto_refresh = function () {
        setInterval(
            self.get_update, 2000
        )
    };

    // calls update_time() every 2 seconds
    self.auto_time = function () {
        setInterval(
                self.update_time, 2000
            )
    }

    // YouTube IFrame Player API
    // https://developers.google.com/youtube/iframe_api_reference
    self.start_video = function() {
        console.log("starting video")
        // This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        console.log("leaving start_video")
    }

    // Records an upvote to the appropriate video, calls put_update()
    self.upvote = function(video) {
        console.log("upvote")

        // sorts the list after an upvote. Video ID with most votes is in 0th index of videos[]
        for (i=0; i<self.vue.videos.length; i++){
            if(video.title===self.vue.videos[i].title){
                self.vue.videos[i].votes+=1;

                self.vue.videos.sort(function(a,b) {
                    return b.votes - a.votes
                })       
            }
        }
        self.put_update();
    }

    // Records a downvote to the appropriate video, calls put_update()
    self.downvote = function(video) {
        for (i=0; i<self.vue.videos.length; i++){
            if(video.title===self.vue.videos[i].title){
                self.vue.videos[i].votes-=1;

                self.vue.videos.sort(function(a,b) {
                    return b.votes - a.votes
                })
            }
        }
        self.put_update();
    }

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_host: false,
            is_guest: false,
            session_gotten: false,
            session: [],
            host_name: '',
            guest_name: '',
            passphrase: '',
            playlist_url: '',
            session_created: false,
            videos: [],
            video_time: '',
            paused: false,
            playing: ''
        },
        methods: {
            host_view: self.host_view,
            guest_view: self.guest_view,
            login_guest: self.login_guest,
            new_session: self.new_session,
            get_playlist: self.get_playlist,
            upvote: self.upvote,
            downvote: self.downvote,
            start_video: self.start_video,
            put_update: self.put_update
        }

    });


    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});


// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
            console.log("iframe ready")
            APP.get_update();
            player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: APP.vue._data.videos[0].video_id,
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            },
            playerVars: { 
                'controls': 1,
                'showinfo': 0
            }
          });
            if(APP.vue._data.is_host){
                APP.auto_refresh();
                APP.auto_time();    
            }
            
        }

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
    if(APP.vue._data.is_guest){
        var data = APP.vue._data
        APP.get_update();
        event.target.loadVideoById(data.playing, parseInt(data.video_time))
    }else{
        APP.put_update();
        event.target.playVideo();
    }
}

// When video state changes
function onPlayerStateChange(event) {
    var videos = APP.vue._data.videos;
    if(APP.vue._data.is_host){  
        // When video ends
        if(event.data === 0) {

            // remove finished video from videos
            var finished_video = event.target.getVideoData().video_id
            const index = videos.map(function(d) { return d.video_id; }).indexOf(finished_video);
            videos.splice(index,1);
            APP.vue._data.videos = videos
            // load the next video from videos
            player.loadVideoById(videos[0].video_id)
            APP.put_update();
        }
        // When video is paused
        if(event.data === 2){
            console.log("paused")
            APP.vue._data.paused = true;
            APP.put_update();
        }
        // When video is playing
        if(event.data===1){
            APP.vue._data.paused = false;
            APP.put_update();
        }
    }else{
        if(event.data === 0){
            APP.get_update();
            videos=APP.vue._data.videos;
            player.loadVideoById(APP.vue._data.playing, parseInt(APP.vue._data.video_time))
        }
    }
}
