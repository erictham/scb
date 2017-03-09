'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var bump = require('gulp-bump');
var gutil = require('gulp-util');
var exec = require('child_process').exec;
var environment = gutil.env.type || 'dev';
var merge = require('merge-stream');
var historyApiFallback = require('connect-history-api-fallback');
var browserSync = require('browser-sync');
var proxyMiddleware = require('http-proxy-middleware');
var reload = browserSync.reload;

// Watch files for changes & reload
gulp.task('serve', function () {
  var tasProxy = proxyMiddleware('/apps/TAService', {target: 'http://localhost:10030'});
  var synapseProxy = proxyMiddleware('/synapse', {target: 'http://amers1.cps.cp.icp2.mpp.ime.reuters.com'});
  var udfProxy = proxyMiddleware('/Apps/UDF', {target: 'http://localhost:10030'});
  var priceChartProxy = proxyMiddleware('/industry/api/pricechart', {target: 'http://localhost:10030'});
  var tracsProxy = proxyMiddleware('/Apps/chart-service', {target: 'http://localhost:10030'});
  var adcProxy = proxyMiddleware('/datacloud', {target: 'http://localhost:10030/'});
  var udipProxy = proxyMiddleware('/Apps/UdipApi', {target: 'http://localhost:10030/'});

  browserSync({
    port: 4900,
    notify: false,
    logPrefix: 'dbsreuters',
    /*snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },*/
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.'],
      middleware: [  tasProxy, synapseProxy, udfProxy, priceChartProxy, tracsProxy, adcProxy, udipProxy, historyApiFallback() ],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch(['./*.html'], reload);
  gulp.watch(['./css/*.css'], reload);
  gulp.watch(['./scripts/*.js'], reload);
});