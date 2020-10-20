var browserify = require("browserify");
const gulp = require("gulp");
const uglify = require("gulp-uglify");
const del = require("del");
const ts = require("gulp-typescript");
const source = require("vinyl-source-stream");
const zip = require("gulp-zip");
const { dest } = require("gulp");

const paths = {
	sources: ["src/*"],
	ts: ["src/*.ts"],
	static: ["src/*.html", "src/*.css", "src/manifest.json", "src/*.png"],
	styles: ["src/*.scss"],
	intermediate: "build/tmp",
	output: "build",
};

function clean() {
	return del(["build/*"]);
}

function transpile() {
	return gulp
		.src(paths.ts)
		.pipe(ts({ noImplicitAny: true }))
		.pipe(gulp.dest(paths.intermediate));
}

function bundleBackground() {
	return browserify({ entries: [paths.intermediate + "/background.js"] })
		.bundle()
		.pipe(source("background.js"))
		.pipe(gulp.dest(paths.intermediate));
}

function bundleContent() {
	return browserify({ entries: [paths.intermediate + "/content.js"] })
		.bundle()
		.pipe(source("content.js"))
		.pipe(gulp.dest(paths.intermediate));
}

function bundlePopup() {
	return browserify({ entries: [paths.intermediate + "/popup.js"] })
		.bundle()
		.pipe(source("popup.js"))
		.pipe(gulp.dest(paths.intermediate));
}

function outputScripts() {
	return gulp.src(paths.intermediate + "/*.js").pipe(gulp.dest(paths.output));
}

function minify() {
	return gulp
		.src(paths.intermediate + "/*.js")
		.pipe(uglify())
		.pipe(gulp.dest(paths.output));
}

function cleanTmp() {
	return del([paths.intermediate + "/"]);
}

function copyStaticAssets() {
	return gulp.src(paths.static).pipe(gulp.dest(paths.output));
}

function compressArtifacts() {
	return gulp
		.src(paths.output + "/**")
		.pipe(zip("release.zip"))
		.pipe(dest(paths.output));
}

// Not all tasks need to use streams.
// A gulpfile is another node program
// and you can use all packages available on npm.
gulp.task("clean", clean);
gulp.task("build", gulp.series("clean", transpile, bundleBackground, bundleContent, bundlePopup, outputScripts, cleanTmp, copyStaticAssets));
gulp.task("watch", () => gulp.watch(paths.sources, gulp.series(["build"])));
gulp.task("minify", gulp.series("clean", transpile, bundleBackground, bundleContent, bundlePopup, minify, cleanTmp, copyStaticAssets));
gulp.task("pack", gulp.series("clean", transpile, bundleBackground, bundleContent, bundlePopup, minify, cleanTmp, copyStaticAssets, compressArtifacts));

// The default task (called when you run `gulp` from CLI).
gulp.task("default", gulp.series(["build", "watch"]));
