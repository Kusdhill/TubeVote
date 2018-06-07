// This is the js for the default/index.html view.


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
              host_name: self.vue.image_url,
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
            var embed = '';
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
                        
                        embed='https://www.youtube.com/embed/';
                        embed+=snippet.resourceId.videoId+'?autoplay=1';
                        console.log(embed)
                        snippet.embed=embed;
                        //console.log(data.items[str_index].snippet.resourceId.videoId);
                        self.vue.videos.push(snippet)
                    }
                }
            );
        }
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
    }

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_host: false,
            is_guest: false,
            host_name: '',
            passphrase: '',
            playlist_url: '',
            session_created: false,
            videos: [],
            users: []
        },
        methods: {
            host_view: self.host_view,
            new_session: self.new_session,
            get_playlist: self.get_playlist,
            upvote: self.upvote,
            downvote: self.downvote
        }

    });


    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

