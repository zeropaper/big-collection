'use strict';
/*jshint node: true*/


var uses, utils, BigCollection;


if (typeof window !== 'undefined' && window.dependsOn) {
  uses = window.dependsOn;
  utils = uses('testUtils');
}
else if (typeof require === 'function') {
  uses = require;
  utils = uses('./utils');
  BigCollection = uses('./../index');
}


var expect = utils.expect;

var State = uses('ampersand-state');
var Collection = uses('ampersand-collection');


var FixtureState = State.extend({
  props: {
    thing: 'string'
  }
});

var FixturesCollection = Collection.extend({
  model: FixtureState,
  mainIndex: 'thing',
  // comparator: 'thing'
});


function makeFixture(count, Model) {
  var items = [];
  for (var i = 0; i < count; i++) {
    if (Model) {
      items.push(new Model({thing: 'thing'+ (i+1)}));
    }
    else {
      items.push({thing: 'thing'+ (i+1)});
    }
  }
  return items;
}


// describe.only('stuff', function () {
//   function Stuff() {

//   }

//   Stuff.prototype._store = 'TADA';

//   Stuff.prototype.normalProp = function () {};

//   Object.defineProperties(Stuff.prototype, {
//     setterOnly: {
//       // enumerable: true,
//       set: function (val) {
//         this._setterOnly = val;
//       }
//     },

//     getterOnly: {
//       // enumerable: true,
//       get: function () {
//         return this._store;
//       }
//     },

//     CONST: {
//       writable: false,
//       value: 'CONSTANT'
//     }
//   });

//   var inst = new Stuff();

//   it('setterOnly', function () {
//     expect(inst.normalProp).to.be.a('function');

//     expect(inst.setterOnly).to.be(undefined);

//     expect(inst._setterOnly).to.be(undefined);

//     expect(function () {
//       inst.setterOnly = 'pouet';
//     }).not.to.throwError();

//     expect(inst._setterOnly).to.be('pouet');
//   });

//   it('getterOnly', function () {
//     expect(function () {
//       inst.getterOnly = 'pouet';
//     }).to.throwError(/Cannot set property getterOnly/);

//     expect(inst.getterOnly).to.be('TADA');
//   });

//   it('CONST', function () {
//     expect(function () {
//       inst.CONST = 'pouet';
//     }).to.throwError(/Cannot assign to read only property/);

//     expect(inst.CONST).to.be('CONSTANT');
//   });

//   it('Object.keys()', function () {
//     console.info(Object.keys(inst));
//   });
// });


describe('BigCollection', function () {
  var instance;
  var fixtureModels = makeFixture(400);

  describe('instanciation', function () {
    describe('options', function () {
      it('needs a "Collection" or a "collection"', function () {
        expect(function () {
          new BigCollection([], {});
        }).to.throwError();
      });



      describe('options.Collection', function () {
        it('can be passed', function () {
          expect(function () {
            instance = new BigCollection([], {
              Collection: FixturesCollection
            });
          }).not.to.throwError(utils.error('Collection passed'));

          expect(instance._complete.mainIndex).to.be('thing');

          expect(instance._partial.mainIndex).to.be('thing');
        });
      });



      describe('options.collection', function () {
        it('can be passed', function () {
          expect(function () {
            instance = new BigCollection([], {
              collection: new FixturesCollection([])
            });
          }).not.to.throwError(utils.error('collection passed'));

          expect(instance._complete.mainIndex).to.be('thing');

          expect(instance._partial.mainIndex).to.be('thing');
        });
      });
    });
  });


  describe('.state', function () {
    var state;
    before(function () {
      instance = new BigCollection([], {
        collection: new FixturesCollection(fixtureModels)
      });
      state = instance.state;
    });


    describe('.mode', function () {
      it('is set to "client" by default', function () {
        expect(state.mode).to.be('client');
      });


      it('can only be set to "server" or "client"', function () {
        expect(function () {
          state.mode = 'server';
        }).not.to.throwError(utils.error('set state mode to "server"'));

        expect(function () {
          state.mode = 'client';
        }).not.to.throwError(utils.error('set state mode to "client"'));

        expect(function () {
          state.mode = 'motherlover';
        }).to.throwError();
      });
    });


    describe('.start', function () {
      var events = {};
      var listener = utils.collectEvents(events);

      before(function () {
        instance = new BigCollection([], {
          collection: new FixturesCollection(fixtureModels)
        });
        state = instance.state;
        instance.on('all', listener);
      });

      after(function () {
        // console.info('events', events);
        instance.off('all', listener);
      });


      it('is set to 0 by default', function () {
        expect(state.start).to.be(0);
      });


      it('actualizes the ._partial collection when changed', function () {
        state.start = 5;

        expect(events['partial:reset'].length).to.be(1);

        var first = instance._partial.at(0);
        expect(first).not.to.be(undefined);

        expect(first.thing).to.be('thing6');
      });

      it('actualizes the .page property when changed', function () {
        state.start = 20;

        expect(state.page).to.be(1);

        state.start = 60;

        expect(state.page).to.be(3);

        state.start = 65;

        expect(state.page).to.be(3);

        state.start = 68;

        expect(state.page).to.be(3);
      });
    });


    describe('.count', function () {
      var events = {};
      var listener = utils.collectEvents(events);

      before(function () {
        instance = new BigCollection([], {
          collection: new FixturesCollection(fixtureModels)
        });
        state = instance.state;
        instance.on('all', listener);
      });

      after(function () {
        // console.info('events', events);
        instance.off('all', listener);
      });


      it('is set to 20 by default', function () {
        expect(state.count).to.be(20);
      });


      it('actualizes the ._partial collection when changed', function () {
        expect(instance._partial.length).to.be(20);

        state.count = 10;
        expect(events['partial:reset'].length).to.be(1);

        expect(instance._partial.length).to.be(10);
      });


      it('actualizes the .page and .pages properties when changed', function () {
        state.count = 20;
        state.start = 20;

        expect(state.page).to.be(1);
        expect(state.pages).to.be(20);

        state.count = 10;

        expect(state.page).to.be(2);
        expect(state.pages).to.be(40);
      });
    });


    describe('.total', function () {

    });


    describe('.page', function () {

    });


    describe('.pages', function () {

    });
  });


  describe('.complete', function () {
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
    });

    it('is were the whole set of models is stored', function () {
      expect(instance.complete.models.length).to.be(400);
    });
  });


  describe('.partial', function () {
    var state;

    describe('.models', function () {
      var events = {};
      var listener = utils.collectEvents(events);

      before(function () {
        instance = new BigCollection(fixtureModels, {
          Collection: FixturesCollection
        });
        state = instance.state;
        instance.on('all', listener);
      });

      after(function () {
        // console.info('events', events);
        instance.off('all', listener);
      });

      it('is were the subset of models is stored', function () {
        expect(instance.partial.models).to.be.an('array');

        expect(instance.partial.models.length).to.be(20);
      });

      it('changes when the state "count" property changes', function () {
        state.count = 25;

        expect(instance.partial.models.length).to.be(25);
      });

      it('changes when the state "start" property changes', function () {
        state.start = 25;

        expect(instance.partial.models).not.to.be(undefined);
        expect(instance.partial.models).not.to.be(undefined);
        expect(instance.partial.models[0]).not.to.be(undefined);
        expect(instance.partial.models[0].thing).to.be('thing26');
        expect(instance.partial.models.length).to.be(25);
      });
    });
  });


  describe('.get()', function () {
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
    });

    it('returns a model from the complete collection', function () {
      expect(instance.get).to.be.a('function');

      var model = instance.get('thing238');
      expect(model).not.to.be(undefined);
      expect(model.thing).to.be('thing238');
    });
  });


  describe('.reset()', function () {
    var events = {};
    var listener = utils.collectEvents(events);
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
      instance.on('all', listener);
    });

    after(function () {
      instance.off('all', listener);
    });

    it('can be used to reset the models of the complete collection', function () {
      expect(instance.reset).to.be.a('function');

      instance.reset(makeFixture(10));
      expect(instance._complete.length).to.be(10);
      expect(instance._partial.length).to.be(10);
    });
  });


  describe('.add()', function () {

  });


  describe('.remove()', function () {
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
    });

    it('removes a model from the complete collection', function () {
      expect(instance.remove).to.be.a('function');
    });
  });


  describe('.set()', function () {
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
    });

    it('updates some models of the complete collection', function () {
      expect(instance.set).to.be.a('function');
    });
  });


  describe('.sort()', function () {
    before(function () {
      instance = new BigCollection(fixtureModels, {
        Collection: FixturesCollection
      });
    });

    it('sorts the models from the complete collection', function () {
      expect(instance.sort).to.be.a('function');
    });
  });


  xdescribe('extension', function () {
    var Extended;
    it('can be done using the .extend() method', function () {
      expect(function () {
        Extended = BigCollection.extend({
          model: FixtureState,
        });
      }).not.to.throwError(utils.error('extending'));

      expect(Extended.prototype.model).to.be(FixtureState);
    });
  });
});
