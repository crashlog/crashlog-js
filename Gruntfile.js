var MochaCloud;

require("colors");

MochaCloud = require("mocha-cloud");

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      options: {
        browser: true,
        eqeqeq: true,
        eqnull: true,
        curly: true,
        latedef: true,
        undef: true,
        forin: true,
        indent: 2,
        camelcase: true,
        trailing: true,
        quotmark: "double",
        newcap: true
      },
      dist: {
        files: {
          src: ["src/**/*.js"]
        }
      }
    },
    concat: {
      options: {
        process: true
      },
      dist: {
        src: ["src/crashlog.js"],
        dest: "dist/crashlog.js"
      }
    },
    uglify: {
      dist: {
        files: {
          "dist/crashlog.min.js": ["dist/crashlog.js"]
        }
      }
    },
    s3: {
      bucket: "cdn.crashlog.io",
      access: "public-read",
      gzip: true,
      upload: [
        {
          src: "dist/crashlog.js",
          dest: "crashlog-<%= pkg.version %>.js"
        }, {
          src: "dist/crashlog.min.js",
          dest: "crashlog-<%= pkg.version %>.min.js"
        }
      ]
    },
    bump: {
      options: {
        part: "patch"
      },
      files: ["package.json", "component.json"]
    },
    connect: {
      server: {
        options: {
          hostname: null,
          port: 8888
        }
      }
    },
    mochaCloud: {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      url: "http://localhost:8888/test/",
      browsers: [
        ["chrome", "", "Mac 10.8"],
        ["chrome", "", "Windows 2003"],
        ["firefox", "11", "Mac 10.6"],
        ["firefox", "11", "Windows 2003"],
        ["safari", "5", "Mac 10.6"],
        ["safari",  "6", "Mac 10.8"],
        ["iexplore", "6", "Windows 2003"],
        ["iexplore", "7", "Windows 2003"],
        ["iexplore", "8", "Windows 2003"],
        ["iexplore", "9", "Windows 2008"]
      ]
    },
    docco: {
      dist: {
        src: ["src/**/*.js"],
        dest: "docs/"
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-bumpx");
  grunt.loadNpmTasks("grunt-s3");
  grunt.loadNpmTasks("grunt-docco");
  grunt.registerTask("git-tag", "Tags a release in git", function() {
    var child, done, exec, releaseVersion;
    exec = require("child_process").exec;
    done = this.async();
    releaseVersion = grunt.template.process("<%= pkg.version %>");
    return child = exec("git ci -am \"v" + releaseVersion + "\" && git tag v" + releaseVersion, function(error, stdout, stderr) {
      if (error != null) {
        console.log("Error running git tag: " + error);
      }
      return done(!(error != null));
    });
  });
  grunt.registerTask("mocha-cloud", "Run mocha browser tests using mocha-cloud and Sauce Labs", function() {
    var b, cloud, done, options, _i, _len, _ref;
    done = this.async();
    options = grunt.config.get("mochaCloud");
    cloud = new MochaCloud("", options.username, options.accessKey);
    cloud.url(options.url);
    _ref = options.browsers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      b = _ref[_i];
      cloud.browser.apply(cloud, b);
    }
    cloud.on("start", function(browser) {
      return console.log("[" + browser.browserName + " " + browser.version + " " + browser.platform + "] Starting tests");
    });
    cloud.on("end", function(browser, res) {
      var f, _j, _len1, _ref1, _results;
      if (res.failures > 0) {
        console.log(("[" + browser.browserName + " " + browser.version + " " + browser.platform + "] " + res.failures + " test(s) failed:").red);
        _ref1 = res.failed;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          f = _ref1[_j];
          console.log(("-   " + f.fullTitle).red);
          _results.push(console.log(("    " + f.error.message).red));
        }
        return _results;
      } else {
        return console.log(("[" + browser.browserName + " " + browser.version + " " + browser.platform + "] All tests passed").green);
      }
    });
    return cloud.start(function(err, res) {
      if (err != null) {
        console.log(err);
      }
      return done(!(err != null) && res[0].failures === 0);
    });
  });
  grunt.registerTask("release", ["jshint", "concat", "uglify", "docco", "git-tag", "s3"]);
  grunt.registerTask("server", ["connect:server:keepalive"]);
  grunt.registerTask("test", ["connect", "mocha-cloud"]);
  return grunt.registerTask("default", ["jshint", "concat", "uglify", "docco"]);
};
