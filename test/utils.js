'use strict';
/*jshint browser: true*/

(function (global) {
  var utils = global.testUtils = global.testUtils || {};

  utils.error = function error(ns) {
    return function (err) {
      console.warn(ns, err.stack);
    };
  };

  function args2arr(args) {
    return Array.prototype.slice.apply(args);
  }
  utils.collectEvents = function (bucket, log) {
    return function (evtName) {
      evtName = evtName || '--init--';
      if (log) console.info(log === true ? 'utils.collectEvents' : log, evtName);
      bucket[evtName] = bucket[evtName] || [];
      var args = args2arr(arguments);
      args.shift();
      bucket[evtName].push(args);
    };
  };

  utils.expect = require('expect.js');

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
    // return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  var container = document.createElement('div');
  container.className = 'test-container';

  utils.addToBody = function addToBody(el) {
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }
    console.info('add to body');
    container.innerHTML = '';
    container.appendChild(el);
  };
})(typeof window !== 'undefined' ? window : global);
