module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            build: {
                tsconfig: true,
                "outDir": "./dist/scripts"
            },
            buildTest: {
                tsconfig: true,
                "outDir": "./test/scripts",
                src: ["./scripts/**/*.tests.ts"]
            },
            options: {
                fast: 'never'
            }
        },
        exec: {
            package_dev: {
                command: "tfx extension create --root dist --manifest-globs vss-extension.json --overrides-file configs/dev.json",
                stdout: true,
                stderr: true
            },
            package_release: {
                command: "tfx extension create --root dist --manifest-globs vss-extension.json --overrides-file configs/release.json",
                stdout: true,
                stderr: true
            },
            publish_dev: {
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --root dist --manifest-globs vss-extension.json --overrides-file configs/dev.json",
                stdout: true,
                stderr: true
            },
            publish_release: {
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --root dist --manifest-globs vss-extension.json --overrides-file configs/release.json",
                stdout: true,
                stderr: true
            }
        },
        copy: {
            scripts: {
                files: [{
                    expand: true, 
                    flatten: true, 
                    src: ["node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js"], 
                    dest: "dist/scripts",
                    filter: "isFile" 
                },
                {
                    expand: true, 
                    flatten: false, 
                    src: ["styles/**", "img/**", "*.html", "vss-extension.json", "*.md"], 
                    dest: "dist"
                }]
            }
        },
        
        clean: ["scripts/**/*.js", "*.vsix", "dist", "test"],

        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ["PhantomJS"]
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask("build", ["ts:build", "copy:scripts"]);

    grunt.registerTask("test", ["ts:buildTest", "karma:unit"]);

    grunt.registerTask("package-dev", ["build", "exec:package_dev"]);
    grunt.registerTask("package-release", ["build", "exec:package_release"]);
    grunt.registerTask("publish-dev", ["package-dev", "exec:publish_dev"]);        
    grunt.registerTask("publish-release", ["package-release", "exec:publish_release"]);        
    
    grunt.registerTask("default", ["package-dev"]);
};