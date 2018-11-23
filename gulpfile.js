const path = require("path");
const gulp = require('gulp');
const del = require("del");
const yargs = require("yargs");
const {exec, execSync} = require('child_process');
const sass = require('gulp-sass');
const tslint = require('gulp-tslint');
const inlinesource = require('gulp-inline-source');

const distFolder = 'dist';

gulp.task('clean', gulp.series(() => {
    return del([distFolder, "*.vsix"]);
}));

gulp.task('styles', gulp.series(() => {
    return gulp.src("styles/**/*scss")
        .pipe(sass())
        .pipe(gulp.dest(distFolder));
}));

gulp.task('tslint', gulp.series(() => {
    return gulp.src(["scripts/**/*ts", "scripts/**/*tsx"])
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report());
}));


gulp.task('copy-sdk', gulp.series(() => {
    return gulp.src(['node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js'])
        .pipe(gulp.dest(`${distFolder}`));
}));

gulp.task('copy-html', gulp.series(() => {
    return gulp.src("*.html")
        .pipe(inlinesource())
        .pipe(gulp.dest(distFolder));
}));

gulp.task('copy', gulp.series(
    gulp.parallel('styles', 'copy-sdk'),
    'copy-html')
);

gulp.task('webpack', gulp.series(async () => {``
    const option = yargs.argv.release ? "-p" : "-d";
    execSync(`node ./node_modules/webpack-cli/bin/cli.js ${option}`, {
        stdio: [null, process.stdout, process.stderr]
    });
}));

gulp.task('build', gulp.parallel('webpack', 'copy', 'tslint'));

gulp.task('package', gulp.series('clean', 'build', () => {
    const overrides = {}
    if (yargs.argv.release) {
        overrides.public = true;
    } else {
        const manifest = require('./vss-extension.json');
        overrides.name = manifest.name + ": Development Edition";
        overrides.id = manifest.id + "-dev";
    }
    const overridesArg = `--override "${JSON.stringify(overrides).replace(/"/g, '\\"')}"`;
    const manifestsArg = `--manifests vss-extension.json`;

    exec(`tfx extension create ${overridesArg} ${manifestsArg} --rev-version`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }

            console.log(stdout);
            console.log(stderr);
            
        });
}));

gulp.task('default', gulp.series('package'));
