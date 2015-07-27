'use strict';
/*jshint debug: true, node: true, browser: true */

var State = require('ampersand-state');
var AmpersandEvents = require('ampersand-events');
var assign = require('lodash.assign');
var bind = require('lodash.bind');


var CollectionState = State.extend({
  props: {
    start: {
      type: 'number',
      default: 0,
      required: true,
      test: function (val) {
        if (val < 0) {
          return 'start must be equal or greater than 0';
        }
      }
    },

    count: {
      type: 'number',
      default: 20,
      required: true,
      test: function (val) {
        if (val < 1) {
          return 'count must be greater than 0';
        }
      }
    },

    mode: {
      type: 'string',
      default: 'client',
      required: true,
      test: function (val) {
        if (val !== 'client' && val !== 'server') {
          return 'mode must be either "client" or "server"';
        }
      }
    },

    complete: {
      type: 'boolean'
    }
  },

  derived: {
    total: {
      deps: ['parent'],
      fn: function () {
        return this.parent._complete.models.length;
      }
    },

    pages: {
      deps: ['parent', 'count'],
      fn: function () {
        return Math.ceil(this.total / this.count);
      }
    },

    page: {
      deps: ['count', 'start'],
      fn: function () {
        return Math.floor(this.start / this.count);
      }
    },

    results: {
      deps: ['parent', 'mode', 'start', 'count'],
      fn: function () {
        if (!this.parent._complete.models || !this.parent._complete.models.length) {
          return [];
        }

        return this.parent._complete.models.slice(this.start, this.start + this.count);
      }
    }
  }
});


function BigCollection(models, options) {
  options = options || {};

  if (options.Collection) {
    this._collection = options.Collection;
  }
  else if (options.collection) {
    this._collection = options.collection.constructor;
  }
  else {
    throw new Error('A "Collection" or a "collection" option must be passed');
  }

  // models = models || [];

  this._complete = options.collection || new this._collection(models, {

  });
  this._complete.completeCollection = this;

  define(this);

  [
    'get',
    'set',
    'add',
    'remove',
    'reset',
    'at',
    'serialize',
    'sort',
    'toJSON'
  ].forEach(function (key) {
    this[key] = bind(this._complete[key], this._complete);
  }, this);


  this._partial = new this._collection(models);
  this._partial.completeCollection = this;

  this._state = options.State || CollectionState;
  this.state = new this._state({
    start: options.start || 0,
    count: options.count || 20,
    mode:  options.mode || 'client'
  }, {
    parent: this
  });

  this.listenTo(this._complete, 'all', function (evtName) {
    var proxiedName = 'complete:' + evtName.replace(':', '.');
    this.trigger(proxiedName);
    this.state.trigger('change:parent');
  });

  this.listenTo(this._partial, 'all', function (evtName) {
    var proxiedName = 'partial:' + evtName.replace(':', '.');
    this.trigger(proxiedName);
  });

  this.listenTo(this.state, 'all', function (evtName) {
    var proxiedName = 'state:' + evtName.replace(':', '.');
    this.trigger(proxiedName);
  });

  // `state.results` is actualized and a `change:results` event is triggered for
  // changes on the state `parent`, `mode`, `start` or `count` properties
  this.listenToAndRun(this.state, 'change:results', function () {
    this._partial.reset(this.state.results);
  });

  if (options.init !== false) this.initialize(options);
}

assign(BigCollection.prototype, AmpersandEvents, {
  initialize: function () {}
});


function define(obj) {
  var proxied = {};

  [
    'count',
    'start',
    'mode'
  ].forEach(function (name) {
    proxied[name] = {
      get: function () {
        return obj.state[name];
      },
      set: function (val) {
        obj.state[name] = val;
      }
    };
  });

  Object.defineProperties(obj, proxied);


  var readOnly = {};
  [
    'page',
    'pages',
    'total',
    'results'
  ].forEach(function (name) {
    readOnly[name] = {
      get: function () {
        return obj.state[name];
      }
    };
  });
  [
    'partial',
    'complete'
  ].forEach(function (name) {
    readOnly[name] = {
      get: function () {
        return obj['_' + name];
      }
    };
  });

  Object.defineProperties(obj, readOnly);
}

module.exports = BigCollection;
