var utils = require('../lib/utils');

var path = require('path'),
    inspect = require('util').inspect,
    assert = require('assert');

var t = -1,
    group = path.basename(__filename, '.js') + '/';

var tests = [
  { run: function() {
      var what = this.what,
          r;

      assert.strictEqual(r = utils.readInt(new Buffer([0,0,0]), 0),
                         false,
                         makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readInt - without stream callback - failure #1'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.strictEqual(r = utils.readInt(new Buffer([]), 0),
                         false,
                         makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readInt - without stream callback - failure #2'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.strictEqual(r = utils.readInt(new Buffer([0,0,0,5]), 0),
                         5,
                         makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readInt - without stream callback - success'
  },
  { run: function() {
      var what = this.what,
          callback = function() {},
          stream = {
            _cleanup: function(cb) {
              cleanupCalled = true;
              assert(cb === callback, makeMsg(what, 'Wrong callback'))
            }
          },
          cleanupCalled = false,
          r;

      assert.strictEqual(r = utils.readInt(new Buffer([]), 0, stream, callback),
                         false,
                         makeMsg(what, 'Wrong result: ' + r));
      assert(cleanupCalled, makeMsg(what, 'Cleanup not called'));
      next();
    },
    what: 'readInt - with stream callback'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.strictEqual(r = utils.readString(new Buffer([0,0,0]), 0),
                         false,
                         makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readString - without stream callback - bad length #1'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.strictEqual(r = utils.readString(new Buffer([]), 0),
                         false,
                         makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readString - without stream callback - bad length #2'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.deepEqual(r = utils.readString(new Buffer([0,0,0,1,5]), 0),
                       new Buffer([5]),
                       makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readString - without stream callback - success'
  },
  { run: function() {
      var what = this.what,
          r;

      assert.deepEqual(r = utils.readString(new Buffer([0,0,0,1,33]), 0, 'ascii'),
                       '!',
                       makeMsg(what, 'Wrong result: ' + r));
      next();
    },
    what: 'readString - without stream callback - encoding'
  },
  { run: function() {
      var what = this.what,
          callback = function() {},
          stream = {
            _cleanup: function(cb) {
              cleanupCalled = true;
              assert(cb === callback, makeMsg(what, 'Wrong callback'))
            }
          },
          cleanupCalled = false,
          r;

      assert.deepEqual(r = utils.readString(new Buffer([0,0,0,1]),
                                            0,
                                            stream,
                                            callback),
                       false,
                       makeMsg(what, 'Wrong result: ' + r));
      assert(cleanupCalled, makeMsg(what, 'Cleanup not called'));
      next();
    },
    what: 'readString - with stream callback - no encoding'
  },
  { run: function() {
      var what = this.what,
          callback = function() {},
          stream = {
            _cleanup: function(cb) {
              cleanupCalled = true;
              assert(cb === callback, makeMsg(what, 'Wrong callback'))
            }
          },
          cleanupCalled = false,
          r;

      assert.deepEqual(r = utils.readString(new Buffer([0,0,0,1]),
                                            0,
                                            'ascii',
                                            stream,
                                            callback),
                       false,
                       makeMsg(what, 'Wrong result: ' + r));
      assert(cleanupCalled, makeMsg(what, 'Cleanup not called'));
      next();
    },
    what: 'readString - with stream callback - encoding'
  },
];

function next() {
  if (Array.isArray(process._events.exit))
    process._events.exit = process._events.exit[1];
  if (++t === tests.length)
    return;

  var v = tests[t];
  v.run.call(v);
}

function makeMsg(what, msg) {
  return '[' + group + what + ']: ' + msg;
}

process.once('exit', function() {
  assert(t === tests.length,
         makeMsg('_exit',
                 'Only finished ' + t + '/' + tests.length + ' tests'));
});

next();
