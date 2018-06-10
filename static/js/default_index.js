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
        // Reads the file.
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
                self.vue.users.push(self.vue.host_name)
                self.get_playlist(self.vue.playlist_url);
                self.vue.session_created = true;
            }
            );
        }
    };


    self.get_session = function(event) {
        console.log("get_session")
        var guest_name = event.path[1].childNodes[2].value;
        var passphrase = event.path[1].childNodes[4].value;

        if(guest_name && passphrase) {
            self.vue.guest_name = guest_name;
            self.vue.passphrase = passphrase;

            $.getJSON(get_session_url,
            {
                passphrase: passphrase
            },
            function(data) {
                console.log(data.session)
                self.vue.session = data.session;
                self.vue.videos = data.session.videos;
                self.vue.video_time = data.session.video_time;
            });
        }
        self.vue.session_gotten = true;
        self.start_video();
        self.auto_refresh();
    };

    self.get_playlist = function(url) {
        console.log("getting playlist")
        console.log(url)
        var playlist_items_url = 'https://www.googleapis.com/youtube/v3/playlistItems';
        var playlist_id = '';
        
        if(!url.includes('&list')){
            alert("Please enter a valid playlist url");
            throw new Error("invalid playlist_url");
        }else{
            var split = url.split('&list=')
            playlist_id = split[1];
            var str_index = '';
            var video_id = '';
            console.log(playlist_id)

            $.getJSON(playlist_items_url,
                {
                    maxResults: '25',
                    part: 'snippet',
                    playlistId: playlist_id,
                    key: 'AIzaSyA81ZBi5oLSK3xEdPjPaX1XlttqfLBoSIg'
                },
                function(data) {
                    console.log("data")
                    console.log(data)
                    for (i = 0; i < data.items.length; i++) { 
                        str_index = i.toString();
                        snippet = data.items[str_index].snippet;
                        snippet.votes = 0;
                        
                        video_id = snippet.resourceId.videoId;
                        console.log(video_id)
                        snippet.video_id=video_id;
                        //console.log(data.items[str_index].snippet.resourceId.videoId);
                        self.vue.videos.push(snippet)
                    }
                    self.start_video();
                }
            );
        }
    }

    self.update_session = function() {
        console.log("update_session")
        self.vue.video_time = player.getCurrentTime()
        var test = []
        var lel=''
        for (i=0; i<self.vue.videos.length; i++){
            lel = JSON.stringify(self.vue.videos[i])
            test.push(lel)
            //JSON.stringify()
        }
        //console.log(test)



        $.post(update_session_url,
        {
          passphrase: self.vue.passphrase,
          videos: test,
          video_time: self.vue.video_time,
          paused: self.vue.paused
        },
        function(data) {
            //console.log(data)
            self.guest_update();
        }
        );
    }



    self.guest_update = function() {
        console.log("guest_update")
        $.getJSON(get_session_url,
            {
                passphrase: self.vue.passphrase
            },
            function(data) {
                //console.log(data.session)
                self.vue.session = data.session;
                self.vue.videos = data.session.videos;
                self.vue.video_time = data.session.video_time;
                self.vue.paused = data.session.paused;
            });

        if(self.vue.is_host){

            $.post(update_time_url,
            {
              passphrase: self.vue.passphrase,
              video_time: player.getCurrentTime()
            },
            function(data) {
                //console.log(data)
            }
            );

        }else{
            if(self.vue.paused){
                player.pauseVideo()
            }else{
                player.playVideo()
            }
        }
    }

    self.guest_vote = function() {
        console.log("guest_vote")

        var test = []
        var lel=''
        for (i=0; i<self.vue.videos.length; i++){
            lel = JSON.stringify(self.vue.videos[i])
            test.push(lel)
            //JSON.stringify()
        }


        $.post(update_session_url,
        {
          passphrase: self.vue.passphrase,
          videos: test,
          video_time: self.vue.video_time
        },
        function(data) {
            //console.log(data)
        }
        );

    }


    self.auto_refresh = function () {

        setInterval(
            self.guest_update, 2000
        )
    };

    self.start_video = function() {
        console.log("starting video")
        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        
        console.log("leaving start_video")
    }

    self.upvote = function(video) {
        for (i=0; i<self.vue.videos.length; i++){
            if(video.title===self.vue.videos[i].title){
                self.vue.videos[i].votes+=1;

                self.vue.videos.sort(function(a,b) {
                    return b.votes - a.votes
                })       
            }
        }
        console.log("upvote")
        if(self.vue.is_guest){
            console.log("is_guest")
            self.guest_vote();
        }
        if(self.vue.is_host){self.update_session()}
    }

    self.downvote = function(video) {
        for (i=0; i<self.vue.videos.length; i++){
            if(video.title===self.vue.videos[i].title){
                self.vue.videos[i].votes-=1;

                self.vue.videos.sort(function(a,b) {
                    return b.votes - a.votes
                })
            }
        }
        if(self.vue.is_guest){self.guest_vote()}
        if(self.vue.is_host){self.update_session()}
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
            users: [],
            video_time: '',
            paused: false
        },
        methods: {
            host_view: self.host_view,
            guest_view: self.guest_view,
            get_session: self.get_session,
            new_session: self.new_session,
            get_playlist: self.get_playlist,
            upvote: self.upvote,
            downvote: self.downvote,
            start_video: self.start_video,
            update_session: self.update_session
        }

    });


    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});



function onYouTubeIframeAPIReady() {
            console.log("iframe ready")
            player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: APP.vue._data.videos[0].video_id,
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
            console.log('lel')
            console.log(APP.auto_refresh)
            if(APP.vue._data.is_host){
                APP.auto_refresh()    
            }
            
        }

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    if(APP.vue._data.is_guest){
        var videos = APP.vue._data.videos;
        APP.guest_update();
        console.log(APP.vue._data.video_time)
        event.target.loadVideoById(videos[0].video_id, parseInt(APP.vue._data.video_time))
    }else{
        APP.update_session();
        event.target.playVideo();
    }
}

// when video ends
function onPlayerStateChange(event) {
    var videos = APP.vue._data.videos;
    if(APP.vue._data.is_host){  
        if(event.data === 0) {

            // remove finished video from videos
            var finished_video = event.target.getVideoData().video_id
            const index = videos.map(function(d) { return d.video_id; }).indexOf(finished_video);
            videos.splice(index,1);
            console.log(videos)
            APP.vue._data.videos = videos
            APP.update_session();
            // load the next video from videos
            player.loadVideoById(videos[0].video_id)
        }
        if(event.data === 2){
            console.log("paused")
            APP.vue._data.paused = true;
            APP.update_session();
        }
        if(event.data===1){
            APP.vue._data.paused = false;
            APP.update_session();
        }
    }else{
        if(event.data === 0){
            APP.guest_update();
            videos=APP.vue._data.videos;
            player.loadVideoById(videos[0].video_id, parseInt(APP.vue._data.video_time))
        }
    }
}
