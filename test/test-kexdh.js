var SSH2Stream = require('../lib/ssh');
var MESSAGE = require('../lib/constants').MESSAGE;

var basename = require('path').basename,
    inspect = require('util').inspect,
    assert = require('assert'),
    path = require('path'),
    fs = require('fs');

var t = -1,
    group = path.basename(__filename, '.js') + '/',
    SERVER_KEY = fs.readFileSync(__dirname + '/fixtures/ssh_host_rsa_key');

function multi_kexdh_init() {
  function run() {
    var what = 'MULTI_KEXDH_INIT: ';

    var server = new SSH2Stream({
      server: true,
      privateKey: SERVER_KEY
    }), client = new SSH2Stream();

    function tryDone() {
      next();
    }
    //Removed 'KEXDH_REPLY' listeners as it causes client to send
    //NEWKEYS which changes server's state.
    client.removeAllListeners('KEXDH_REPLY');
    //Removed 'NEWKEYS' listeners as server sends 'NEWKEYS' after receiving
    //'KEXDH_INIT' which causes errors on client if 'NEWKEYS' is processed
    //without processing 'KEXDH_REPLY'
    client.removeAllListeners('NEWKEYS');
    //Added 'KEXDH_REPLY' which violates protocol and re-sends 'KEXDH_INIT'
    //packet
    client.on('KEXDH_REPLY', function (info) {
      var state = client._state,
          outstate = state.outgoing,
          buf = new Buffer(1 + 4 + outstate.pubkey.length);
      buf[0] = MESSAGE.KEXDH_INIT;
      buf.writeUInt32BE(outstate.pubkey.length, 1, true);
      outstate.pubkey.copy(buf, 5);
      client._send(buf, undefined, true);
    });
    client.on('error', function (err) {
      assert.equal('PROTOCOL_ERROR', err.message,
        makeMsg(what, 'Expected Error: PROTOCOL_ERROR Got Error: ' +
          err.message));
      tryDone();
    });
    client.pipe(server).pipe(client);
  }
  return { run: run };
}

var tests = [
  multi_kexdh_init()
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
