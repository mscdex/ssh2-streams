var SSH2Stream = require('../lib/ssh');
var utils = require('../lib/utils');
var parseKey = utils.parseKey;
var genPubKey = utils.genPublicKey;

var basename = require('path').basename;
var inspect = require('util').inspect;
var assert_ = require('assert');
var inherits = require('util').inherits;
var TransformStream = require('stream').Transform;

var group = basename(__filename, '.js') + '/';
var t = -1;
var EMPTY_BUFFER = new Buffer(0);
var SERVER_KEY = require('fs').readFileSync(__dirname
                                            + '/fixtures/ssh_host_rsa_key');

function SimpleStream() {
  TransformStream.call(this);
  this.buffer = '';
}
inherits(SimpleStream, TransformStream);
SimpleStream.prototype._transform = function(chunk, encoding, cb) {
  this.buffer += chunk.toString('binary');
  cb(null, chunk);
};

var tests = [
  // client-side tests
  { run: function() {
      var algos = ['ssh-dss', 'ssh-rsa', 'ecdsa-sha2-nistp521'];
      var client = new SSH2Stream({
        algorithms: {
          serverHostKey: algos
        }
      });
      var clientBufStream = new SimpleStream();
      var clientReady = false;
      var server = new SSH2Stream({
        server: true,
        hostKeys: { 'ssh-rsa': makeServerKey(SERVER_KEY) }
      });
      var serverBufStream = new SimpleStream();
      var serverReady = false;

      function onNEWKEYS() {
        if (this === client) {
          assert(!clientReady, 'Already received client NEWKEYS event');
          clientReady = true;
        } else {
          assert(!serverReady, 'Already received server NEWKEYS event');
          serverReady = true;
        }
        if (clientReady && serverReady) {
          var traffic = clientBufStream.buffer;
          var algoList = algos.join(',');
          var re = new RegExp('\x00\x00\x00'
                              + hexByte(algoList.length)
                              + algoList);
          assert(re.test(traffic), 'Unexpected client algorithms');

          traffic = serverBufStream.buffer;
          assert(/\x00\x00\x00\x07ssh-rsa/.test(traffic),
                 'Unexpected server algorithms');

          next();
        }
      }

      client.on('NEWKEYS', onNEWKEYS);
      server.on('NEWKEYS', onNEWKEYS);

      client.pipe(clientBufStream)
            .pipe(server)
            .pipe(serverBufStream)
            .pipe(client);
    },
    what: 'Custom algorithms'
  },
  // server-side tests
  { run: function() {
      var stream = new SSH2Stream({
        server: true,
        hostKeys: { 'ssh-rsa': makeServerKey(SERVER_KEY) }
      });
      var result;
      var expected;

      var key = new Buffer('o hai mark');
      var keyLen = key.length;
      expected = Buffer.concat([
        new Buffer([
          0x3C,
          0x00, 0x00, 0x00, 0x07,
          0x73, 0x73, 0x68, 0x2D, 0x72, 0x73, 0x61,
          (keyLen >>> 24) & 0xFF, (keyLen >>> 16) & 0xFF, (keyLen >>> 8) & 0xFF,
            keyLen & 0xFF
        ]),
        key
      ]);

      skipIdent(stream);
      stream.authPKOK('ssh-rsa', key);
      result = readData(stream);
      assertDeepEqual(result, expected);

      next();
    },
    what: 'authPKOK'
  },
];

function makeServerKey(raw) {
  var privateKey = parseKey(raw);
  return {
    privateKey: privateKey,
    publicKey: genPubKey(privateKey)
  };
}

function hexByte(n) {
  return String.fromCharCode(n);
}

function skipIdent(stream) {
  var buf = EMPTY_BUFFER;
  var b;
  var i = 0;
  while ((b = stream.read()) !== null) {
    buf = Buffer.concat([buf, b]);
    for (; i < buf.length; ++i) {
      if (buf[i] === 10) {
        if ((i + 1) < buf.length)
          stream.unshift(buf.slice(i + 1));
        return;
      }
    }
  }
  throw new Error('Expected ident string');
}

function readData(stream) {
  var buf = EMPTY_BUFFER;
  var b;
  while ((b = stream.read()) !== null)
    buf = Buffer.concat([buf, b]);
  for (var i = 0, newbuf = EMPTY_BUFFER; i < buf.length;) {
    var len = buf.readUInt32BE(i, true),
        plen = buf[i += 4];
    ++i;
    newbuf = Buffer.concat([newbuf, buf.slice(i, i + (len - plen - 1))]);
    i += (len - 1);
  }
  return newbuf;
}

function assertDeepEqual(actual, expected, msg) {
  msg || (msg = 'output mismatch');
  msg += ':\nActual:\n'
         + inspect(actual)
         + '\nExpected:\n'
         + inspect(expected);
  assert_.deepEqual(actual, expected, makeMsg(tests[t].what, msg));
}
function assert(expression, msg) {
  msg || (msg = 'failed assertion');
  assert_(expression, makeMsg(tests[t].what, msg));
}



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
  assert_(t === tests.length,
          makeMsg('_exit',
                  'Only finished ' + t + '/' + tests.length + ' tests'));
});

next();
