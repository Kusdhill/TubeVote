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
               self.vue.session_created = true;
            }
            );
        }
    };

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
            session_created: false
        },
        methods: {
            host_view: self.host_view,
            new_session: self.new_session
        }

    });


    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

