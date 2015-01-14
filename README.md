Description
===========

SSH2 and SFTP(v3) client/server protocol streams for [node.js](http://nodejs.org/).


Requirements
============

* [node.js](http://nodejs.org/) -- v0.8.7 or newer


Install
=======

    npm install ssh2-streams


API
===

`require('ssh2').SSH2Stream` returns an **_SSH2Stream_** constructor.

`require('ssh2').SFTPStream` returns an **_SFTPStream_** constructor.

`require('ssh2').utils` returns an _object_ of useful utility functions.

`require('ssh2').constants` returns an _object_ containing useful SSH protocol constants.


SSH2Stream events
-----------------

**Client/Server events**

* **header**(< _object_ >headerInfo) - Emitted when the protocol header is seen. `headerInfo` contains:

    * **greeting** - _string_ - (Client-only) An optional greeting message presented by the server.

    * **identRaw** - _string_ - The raw identification string sent by the remote party.

    * **versions** - _object_ - Contains various information parsed from `identRaw`:

        * **protocol** - _string_ - The protocol version (always `1.99` or `2.0`) supported by the remote party.

        * **software** - _string_ - The software name used by the remote party.

    * **comments** - _string_ - Any additional text that comes after the software name.

* **GLOBAL_REQUEST**(< _string_ >reqName, < _boolean_ >wantReply, < _mixed_ >reqData)

* **CHANNEL_DATA:\<channel\>**(< _Buffer_ >data)

* **CHANNEL_EXTENDED_DATA:\<channel\>**(< _integer_ >type, < _Buffer_ >data)

* **CHANNEL_WINDOW_ADJUST:\<channel\>**(< _integer_ >bytesToAdd)

* **CHANNEL_SUCCESS:\<channel\>**()

* **CHANNEL_FAILURE:\<channel\>**()

* **CHANNEL_EOF:\<channel\>**()

* **CHANNEL_CLOSE:\<channel\>**()

* **CHANNEL_OPEN_CONFIRMATION:\<channel\>**(< _object_ >channelInfo) - `channelInfo` contains:

    * **recipient** - _integer_ - The local channel number.

    * **sender** - _integer_ - The remote party's channel number.

    * **window** - _integer_ - The initial window size for the channel.

    * **packetSize** - _integer_ - The maximum packet size for the channel.

* **CHANNEL_OPEN_FAILURE:\<channel\>**(< _object_ >failInfo) - `failInfo` contains:

    * **recipient** - _integer_ - The local channel number.

    * **reasonCode** - _integer_ - The reason code of the failure.

    * **reason** - _string_ - A text representation of the `reasonCode`.

    * **description** - _string_ - An optional description of the failure.

* **DISCONNECT**(< _string_ >reason, < _integer_ >reasonCode, < _string_ >description)

* **DEBUG**(< _string_ >message)

* **NEWKEYS**()

* **REQUEST_SUCCESS**([< _Buffer_ >resData])

* **REQUEST_FAILURE**()



**Client-only events**

* **fingerprint**(< _Buffer_ >hostKey, < _function_ >callback) - This event allows you to (synchronously) verify a host's key. If `callback` is called with any value other than `undefined` or `true`, a disconnection will occur. The default behavior is to auto-allow any host key.

* **SERVICE_ACCEPT**(< _string_ >serviceName)

* **USERAUTH_PASSWD_CHANGEREQ**(< _string_ >message)

* **USERAUTH_INFO_REQUEST**(< _string_ >name, < _string_ >instructions, < _string_ >lang[, < _array_ >prompts])

* **USERAUTH_PK_OK**()

* **USERAUTH_SUCCESS**()

* **USERAUTH_FAILURE**(< _array_ >methodsContinue, < _boolean_ >partialSuccess)

* **USERAUTH_BANNER**(< _string_ >message)

* **CHANNEL_OPEN**(< _object_ >channelInfo) - `channelInfo` contains:

    * **type** - _string_ - The channel type (e.g. `x11`, `forwarded-tcpip`).

    * **sender** - _integer_ - The remote party's channel number.

    * **window** - _integer_ - The initial window size for the channel.

    * **packetSize** - _integer_ - The maximum packet size for the channel.

    * **data** - _object_ - The properties available depend on `type`:

        * `x11`:

            * **srcIP** - _string_ - Source IP address of X11 connection request.

            * **srcPort** - _string_ - Source port of X11 connection request.

        * `forwarded-tcpip`:

            * **srcIP** - _string_ - Source IP address of incoming connection.

            * **srcPort** - _string_ - Source port of incoming connection.

            * **destIP** - _string_ - Destination IP address of incoming connection.

            * **destPort** - _string_ - Destination port of incoming connection.

        * `forwarded-streamlocal@openssh.com`:

            * **socketPath** - _string_ - Source socket path of incoming connection.

        * `auth-agent@openssh.com` has no extra data.

* **CHANNEL_REQUEST:\<channel\>**(< _object_ >reqInfo) - `reqInfo` properties depend on `reqInfo.request`:

    * `exit-status`:

        * **code** - _integer_ - The exit status code of the remote process.

    * `exit-signal`:

        * **signal** - _string_ - The signal name.

        * **coredump** - _boolean_ - Was the exit the result of a core dump?

        * **description** - _string_ - An optional error message.



**Server-only events**

* **SERVICE_REQUEST**(< _string_ >serviceName)

* **USERAUTH_REQUEST**(< _string_ >username, < _string_ >serviceName, < _string_ >authMethod, < _mixed_ >authMethodData) - `authMethodData` depends on `authMethod`:

    * For `password`, it's a _string_ containing the password.

    * For `publickey`, it's an _object_ containing:

        * **keyAlgo** - _string_ - The public key algorithm.

        * **key** - _Buffer_ - The public key data.

        * **signature** - _mixed_ - If set, it is a _Buffer_ containing the signature to be verified.

        * **blob** - _mixed_ - If set, it is a _Buffer_ containing the data to sign. The resulting signature is what is compared to `signature`.

    * For `hostbased`, it's an _object_ including the properties from `publickey` but also:

        * **localHostname** - _string_ - The client's hostname to be verified.

        * **localUsername** - _string_ - The client's (local) username to be verified.

* **USERAUTH_INFO_RESPONSE**([< _array_ >responses])
        
* **GLOBAL_REQUEST**(< _string_ >reqName, < _boolean_ >wantReply, < _mixed_ >reqData) - `reqData` depends on `reqName`:

    * For `tcpip-forward`/`cancel-tcpip-forward`, it's an _object_ containing:

        * **bindAddr** - _string_ - The IP address to start/stop binding to.

        * **bindPort** - _string_ - The port to start/stop binding to.

    * For `streamlocal-forward@openssh.com`/`cancel-streamlocal-forward@openssh.com`, it's an _object_ containing:

        * **socketPath** - _string_ - The socket path to start/stop listening on.

    * For `no-more-sessions@openssh.com`, there is no `reqData`.

    * For any other requests, it's a _Buffer_ containing raw request-specific data *if* there is any extra data.

* **CHANNEL_OPEN**(< _object_ >channelInfo) - `channelInfo` contains:

    * **type** - _string_ - The channel type (e.g. `session`, `direct-tcpip`).

    * **sender** - _integer_ - The remote party's channel number.

    * **window** - _integer_ - The initial window size for the channel.

    * **packetSize** - _integer_ - The maximum packet size for the channel.

    * **data** - _object_ - The properties available depend on `type`:

        * `direct-tcpip`:

            * **srcIP** - _string_ - Source IP address of outgoing connection.

            * **srcPort** - _string_ - Source port of outgoing connection.

            * **destIP** - _string_ - Destination IP address of outgoing connection.

            * **destPort** - _string_ - Destination port of outgoing connection.

        * `direct-streamlocal@openssh.com`:

            * **socketPath** - _string_ - Destination socket path of outgoing connection.

        * `session` has no extra data.

* **CHANNEL_REQUEST:\<channel\>**(< _object_ >reqInfo) - `reqInfo` properties depend on `reqInfo.request`:

    * `pty-req`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

        * **term** - _string_ - The terminal type name.

        * **cols** - _integer_ - The number of columns.

        * **rows** - _integer_ - The number of rows.

        * **width** - _integer_ - The width in pixels.

        * **height** - _integer_ - The height in pixels.

        * **modes** - _object_ - The terminal modes.

    * `window-change`:

        * **cols** - _integer_ - The number of columns.

        * **rows** - _integer_ - The number of rows.

        * **width** - _integer_ - The width in pixels.

        * **height** - _integer_ - The height in pixels.

    * `x11-req`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

        * **single** - _boolean_ - Whether only a single X11 connection should be allowed.

        * **protocol** - _string_ - The X11 authentication protocol to be used.

        * **cookie** - _string_ - The hex-encoded X11 authentication cookie.

        * **screen** - _integer_ - The screen number for incoming X11 connections.

    * `env`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

        * **key** - _string_ - The environment variable name.

        * **val** - _string_ - The environment variable value.

    * `shell`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

    * `exec`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

        * **command** - _string_ - The command to be executed.

    * `subsystem`:

        * **wantReply** - _boolean_ - The client is requesting a response to this request.

        * **subsystem** - _string_ - The name of the subsystem.

    * `signal`:

        * **signal** - _string_ - The signal name (prefixed with `SIG`).

    * `xon-xoff`:

        * **clientControl** - _boolean_ - Client can/can't perform flow control (control-S/control-Q processing).

    * `auth-agent-req@openssh.com` has no `reqInfo`.

SSH2Stream properties
---------------------

* **bytesSent** - _integer_ - The number of bytes sent since the last keying. This metric can be useful in determining when to call `rekey()`.

* **bytesReceived** - _integer_ - The number of bytes received since the last keying. This metric can be useful in determining when to call `rekey()`.


SSH2Stream methods
------------------

* **(constructor)**(< _object_ >config) - Creates and returns a new SSH2Stream instance. SSH2Stream instances are Duplex streams. `config` can contain:

    * **server** - _boolean_ - Set to `true` to create an instance in server mode. **Default:** `false`

    * **privateKey** - _mixed_ - If in server mode, a _Buffer_ or _string_ that contains the **required** host private key (OpenSSH format). **Default:** (none)

    * **passphrase** - _string_ - For an encrypted host private key, this is the passphrase used to decrypt it. **Default:** (none)

    * **banner** - _string_ - If in server mode, an optional message to send to the user immediately upon connection, before the handshake. **Default:** (none)

    * **ident** - _string_ - A custom software name/version identifier. **Default:** `'ssh2js' + moduleVersion + 'srv'` (server mode) `'ssh2js' + moduleVersion` (client mode)

    * **maxPacketSize** - _string_ - This is the maximum packet size that will be accepted. It should be 35000 bytes or larger to be compatible with other SSH2 implementations. **Default:** `35000`

    * **highWaterMark** - _integer_ - This is the `highWaterMark` to use for the stream. **Default:** `32 * 1024`

    * **debug** - _function_ - Set this to a function that receives a single string argument to get detailed (local) debug information. **Default:** (none)



**Client/Server methods**

* **ping**() - _boolean_ - Writes a dummy GLOBAL_REQUEST packet (specifically "keepalive@openssh.com") that requests a reply. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **disconnect**([< _integer_ >reasonCode]) - _boolean_ - Writes a disconnect packet and closes the stream. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **rekey**() - _boolean_ - Starts the re-keying process. Incoming/Outgoing packets are buffered until the re-keying process has finished. Returns `false` to indicate that no more packets should be written until the `NEWKEYS` event is seen.

* **requestSuccess**([< _Buffer_ >data]) - _boolean_ - Writes a request success packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **requestFailure**() - _boolean_ - Writes a request failure packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelSuccess**() - _boolean_ - Writes a channel success packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelFailure**() - _boolean_ - Writes a channel failure packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelEOF**(< _integer_ >channel) - _boolean_ - Writes a channel EOF packet for the given `channel`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelClose**(< _integer_ >channel) - _boolean_ - Writes a channel close packet for the given `channel`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelWindowAdjust**(< _integer_ >channel, < _integer_ >amount) - _boolean_ - Writes a channel window adjust packet for the given `channel` where `amount` is the number of bytes to add to the channel window. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelData**(< _integer_ >channel, < _mixed_ >data) - _boolean_ - Writes a channel data packet for the given `channel` where `data` is a _Buffer_ or _string_. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelExtData**(< _integer_ >channel, < _mixed_ >data, < _integer_ >type) - _boolean_ - Writes a channel extended data packet for the given `channel` where `data is a _Buffer_ or _string_. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelOpenConfirm**(< _integer_ >remoteChannel, < _integer_ >localChannel, < _integer_ >initWindow, < _integer_ >maxPacket) - _boolean_ - Writes a channel open confirmation packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **channelOpenFail**(< _integer_ >remoteChannel, < _integer_ >reasonCode[, < _string_ >description]) - _boolean_ - Writes a channel open failure packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.



**Client-only methods**

* **service**(< _string_ >serviceName) - _boolean_ - Writes a service request packet for `serviceName`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **tcpipForward**(< _string_ >bindAddr, < _integer_ >bindPort[, < _boolean_ >wantReply]) - _boolean_ - Writes a tcpip forward global request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **cancelTcpipForward**(< _string_ >bindAddr, < _integer_ >bindPort[, < _boolean_ >wantReply]) - _boolean_ - Writes a cancel tcpip forward global request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authPassword**(< _string_ >username, < _string_ >password) - _boolean_ - Writes a password userauth request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authPK**(< _string_ >username, < _object_ >pubKey[, < _function_ >cbSign]) - _boolean_ - Writes a publickey userauth request packet. `pubKey` is the object returned from using `utils.parseKey()` on a private or public key. If `cbSign` is not present, a pubkey check userauth packet is written. Otherwise `cbSign` is called with `(blob, callback)`, where `blob` is the data to sign with the private key and the resulting signature _Buffer_ is passed to `callback` as the first argument. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authHostbased**(< _string_ >username, < _object_ >pubKey, < _string_ >localHostname, < _string_ >localUsername, < _function_ >cbSign) - _boolean_ - Writes a hostbased userauth request packet. `pubKey` is the object returned from using `utils.parseKey()` on a private or public key. `cbSign` is called with `(blob, callback)`, where `blob` is the data to sign with the private key and the resulting signature _Buffer_ is passed to `callback` as the first argument. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authKeyboard**(< _string_ >username) - _boolean_ - Writes a keyboard-interactive userauth request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authNone**(< _string_ >username) - _boolean_ - Writes a "none" userauth request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authInfoRes**(< _array_ >responses) - _boolean_ - Writes a userauth info response packet. `responses` is an _array_ of zero or more strings corresponding to responses to prompts previously sent by the server. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **directTcpip**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket, < _object_ >config) - _boolean_ - Writes a direct tcpip channel open packet. `config` must contain `srcIP`, `srcPort`, `dstIP`, and `dstPort`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **session**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket) - _boolean_ - Writes a session channel open packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_agentForward**(< _integer_ >channel[, < _boolean_ >wantReply]) - _boolean_ - Writes an `auth-agent-req@openssh.com` channel request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **windowChange**(< _integer_ >channel, < _integer_ >rows, < _integer_ >cols, < _integer_ >height, < _integer_ >width) - _boolean_ - Writes a window change channel request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **pty**(< _integer_ >channel, < _integer_ >rows, < _integer_ >cols, < _integer_ >height, < _integer_ >width, < _string_ >terminalType, < _mixed_ >terminalModes[, < _boolean_ >wantReply]) - _boolean_ - Writes a pty channel request packet. If `terminalType` is falsey, `vt100` is used. `terminalModes` can be the raw bytes, an _object_ of the terminal modes to set, or a falsey value for no modes. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **env**(< _integer_ >channel, < _string_ >key, < _mixed_ >value[, < _boolean_ >wantReply]) - _boolean_ - Writes an env channel request packet. `value` can be a _string_ or _Buffer_. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **shell**(< _integer_ >channel[, < _boolean_ >wantReply]) - _boolean_ - Writes a shell channel request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **exec**(< _integer_ >channel, < _string_ >command[, < _boolean_ >wantReply]) - _boolean_ - Writes an exec channel request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **signal**(< _integer_ >channel, < _string_ >signalName) - _boolean_ - Writes a signal channel request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **x11Forward**(< _integer_ >channel, < _object_ >config[, < _boolean_ >wantReply]) - _boolean_ - Writes an X11 forward channel request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `config` can contain:

    * **single** - _boolean_ - `true` if only a single connection should be forwarded.

    * **protocol** - _string_ - The name of the X11 authentication method used (e.g. `MIT-MAGIC-COOKIE-1`).

    * **cookie** - _string_ - The X11 authentication cookie encoded in hexadecimal.

    * **screen** - _integer_ - The screen number to forward X11 connections for.

* **subsystem**(< _integer_ >channel, < _string_ >name[, < _boolean_ >wantReply]) - _boolean_ - Writes a subsystem channel request packet. `name` is the name of the subsystem (e.g. `sftp` or `netconf`). `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_noMoreSessions**([< _boolean_ >wantReply]) - _boolean_ - Writes a no-more-sessions@openssh.com request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_streamLocalForward**(< _string_ >socketPath[, < _boolean_ >wantReply]) - _boolean_ - Writes a streamlocal-forward@openssh.com request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_cancelStreamLocalForward**(< _string_ >socketPath[, < _boolean_ >wantReply]) - _boolean_ - Writes a cancel-streamlocal-forward@openssh.com request packet. `wantReply` defaults to `true`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_directStreamLocal**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket, < _object_ >config) - _boolean_ - Writes a direct-streamlocal@openssh.com channel open packet. `config` must contain `socketPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic.



**Server-only methods**

* **serviceAccept**(< _string_ >serviceName) - _boolean_ - Writes a service accept packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authFailure**([< _array_ >authMethods[, < _boolean_ >partialSuccess]]) - _boolean_ - Writes a userauth failure packet. `authMethods` is an _array_ of authentication methods that can continue. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authSuccess**() - _boolean_ - Writes a userauth success packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authPKOK**(< _string_ >keyAlgorithm, < _Buffer_ >keyData) - _boolean_ - Writes a userauth PK OK packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **authInfoReq**(< _string_ >name, < _string_ >instructions, < _array_ >prompts) - _boolean_ - Writes a userauth info request packet. `prompts` is an array of `{ prompt: 'Prompt text', echo: true }` objects (`prompt` being the prompt text and `echo` indicating whether the client's response to the prompt should be echoed to their display). Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **forwardedTcpip**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket, < _object_ >info) - _boolean_ - Writes a forwarded tcpip channel open packet. `info` must contain `boundAddr`, `boundPort`, `remoteAddr`, and `remotePort`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **x11**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket, < _object_ >info) - _boolean_ - Writes an X11 channel open packet. `info` must contain `originAddr` and `originPort`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **openssh_forwardedStreamLocal**(< _integer_ >channel, < _integer_ >initWindow, < _integer_ >maxPacket, < _object_ >info) - _boolean_ - Writes an forwarded-streamlocal@openssh.com channel open packet. `info` must contain `socketPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **exitStatus**(< _integer_ >channel, < _integer_ >exitCode) - _boolean_ - Writes an exit status channel request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **exitSignal**(< _integer_ >channel, < _string_ >signalName, < _boolean_ >coreDumped, < _string_ >errorMessage) - _boolean_ - Writes an exit signal channel request packet. Returns `false` if you should wait for the `drain` event before sending any more traffic.



SFTP events
-----------

**Client/Server events**

* **ready**() - Emitted after initial protocol version check has passed.

**Server-only events**

* **OPEN**(< _integer_ >reqID, < _string_ >filename, < _integer_ >flags, < _ATTRS_>attrs)

* **READ**(< _integer_ >reqID, < _Buffer_ >handle, < _integer_ >offset, < _integer_ >length)

* **WRITE**(< _integer_ >reqID, < _Buffer_ >handle, < _integer_ >offset, < _Buffer_ >data)

* **FSTAT**(< _integer_ >reqID, < _Buffer_ >handle)

* **FSETSTAT**(< _integer_ >reqID, < _Buffer_ >handle, < _ATTRS_ >attrs)

* **CLOSE**(< _integer_ >reqID, < _Buffer_ >handle)

* **OPENDIR**(< _integer_ >reqID, < _string_ >path)

* **READDIR**(< _integer_ >reqID, < _Buffer_ >handle)

* **LSTAT**(< _integer_ >reqID, < _string_ >path)

* **STAT**(< _integer_ >reqID, < _string_ >path)

* **REMOVE**(< _integer_ >reqID, < _string_ >path)

* **RMDIR**(< _integer_ >reqID, < _string_ >path)

* **REALPATH**(< _integer_ >reqID, < _string_ >path)

* **READLINK**(< _integer_ >reqID, < _string_ >path)

* **SETSTAT**(< _integer_ >reqID, < _string_ >path, < _ATTRS_ >attrs)

* **MKDIR**(< _integer_ >reqID, < _string_ >path, < _ATTRS_ >attrs)

* **RENAME**(< _integer_ >reqID, < _string_ >oldPath, < _string_ >newPath)

* **SYMLINK**(< _integer_ >reqID, < _string_ >linkPath, < _string_ >targetPath)

SFTP static constants
---------------------

* **SFTPStream.STATUS_CODE** - _object_ - Contains the various status codes (for use especially with `status()`):

  * `OK`

  * `EOF`

  * `NO_SUCH_FILE`

  * `PERMISSION_DENIED`

  * `FAILURE`

  * `BAD_MESSAGE`

  * `OP_UNSUPPORTED`

* **SFTPStream.OPEN_MODE** - _object_ - Contains the various open file flags:

  * `READ`

  * `WRITE`

  * `APPEND`

  * `CREAT`

  * `TRUNC`

  * `EXCL`

SFTP methods
------------

* **(constructor)**(< _object_ >config[, < _string_ >remoteIdentRaw]) - Creates and returns a new SFTPStream instance. SFTPStream instances are Duplex streams. `remoteIdentRaw` can be the raw SSH identification string of the remote party. This is used to change internal behavior based on particular SFTP implementations. `config` can contain:

    * **server** - _boolean_ - Set to `true` to create an instance in server mode. **Default:** `false`

    * **highWaterMark** - _integer_ - This is the `highWaterMark` to use for the stream. **Default:** `32 * 1024`

    * **debug** - _function_ - Set this to a function that receives a single string argument to get detailed (local) debug information. **Default:** (none)



**Client-only methods**

* **fastGet**(< _string_ >remotePath, < _string_ >localPath[, < _object_ >options], < _function_ >callback) - _(void)_ - Downloads a file at `remotePath` to `localPath` using parallel reads for faster throughput. `options` can have the following properties:

    * concurrency - _integer_ - Number of concurrent reads **Default:** `25`

    * chunkSize - _integer_ - Size of each read in bytes **Default:** `32768`

    * step - _function_(< _integer_ >total_transferred, < _integer_ >chunk, < _integer_ >total) - Called every time a part of a file was transferred

    `callback` has 1 parameter: < _Error_ >err.

* **fastPut**(< _string_ >localPath, < _string_ >remotePath[, < _object_ >options], < _function_ >callback) - _(void)_ - Uploads a file from `localPath` to `remotePath` using parallel reads for faster throughput. `options` can have the following properties:

    * concurrency - _integer_ - Number of concurrent reads **Default:** `25`

    * chunkSize - _integer_ - Size of each read in bytes **Default:** `32768`

    * step - _function_(< _integer_ >total_transferred, < _integer_ >chunk, < _integer_ >total) - Called every time a part of a file was transferred

    `callback` has 1 parameter: < _Error_ >err.

* **createReadStream**(< _string_ >path[, < _object_ >options]) - _ReadStream_ - Returns a new readable stream for `path`. `options` has the following defaults:

    ```javascript
    { flags: 'r',
      encoding: null,
      handle: null,
      mode: 0666,
      autoClose: true
    }
    ```

    `options` can include `start` and `end` values to read a range of bytes from the file instead of the entire file. Both `start` and `end` are inclusive and start at 0. The `encoding` can be `'utf8'`, `'ascii'`, or `'base64'`.

    If `autoClose` is false, then the file handle won't be closed, even if there's an error. It is your responsiblity to close it and make sure there's no file handle leak. If `autoClose` is set to true (default behavior), on `error` or `end` the file handle will be closed automatically.

    An example to read the last 10 bytes of a file which is 100 bytes long:

    ```javascript
    sftp.createReadStream('sample.txt', {start: 90, end: 99});
    ```

* **createWriteStream**(< _string_ >path[, < _object_ >options]) - _WriteStream_ - Returns a new writable stream for `path`. `options` has the following defaults:

    ```javascript
    { flags: 'w',
      encoding: null,
      mode: 0666 }
    ```

    `options` may also include a `start` option to allow writing data at some position past the beginning of the file. Modifying a file rather than replacing it may require a flags mode of 'r+' rather than the default mode 'w'.

    If 'autoClose' is set to false and you pipe to this stream, this stream will not automatically close after there is no more data upstream -- allowing future pipes and/or manual writes.

* **open**(< _string_ >filename, < _string_ >mode, [< _ATTRS_ >attributes, ]< _function_ >callback) - _boolean_ - Opens a file `filename` for `mode` with optional `attributes`. `mode` is any of the modes supported by fs.open (except sync mode). Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _Buffer_ >handle.

* **close**(< _Buffer_ >handle, < _function_ >callback) - _boolean_ - Closes the resource associated with `handle` given by open() or opendir(). Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **readData**(< _Buffer_ >handle, < _Buffer_ >buffer, < _integer_ >offset, < _integer_ >length, < _integer_ >position, < _function_ >callback) - _boolean_ - Reads `length` bytes from the resource associated with `handle` starting at `position` and stores the bytes in `buffer` starting at `offset`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 4 parameters: < _Error_ >err, < _integer_ >bytesRead, < _Buffer_ >buffer (offset adjusted), < _integer_ >position.

* **writeData**(< _Buffer_ >handle, < _Buffer_ >buffer, < _integer_ >offset, < _integer_ >length, < _integer_ >position, < _function_ >callback) - _boolean_ - Writes `length` bytes from `buffer` starting at `offset` to the resource associated with `handle` starting at `position`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **fstat**(< _Buffer_ >handle, < _function_ >callback) - _boolean_ - Retrieves attributes for the resource associated with `handle`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _Stats_ >stats.

* **fsetstat**(< _Buffer_ >handle, < _ATTRS_ >attributes, < _function_ >callback) - _boolean_ - Sets the attributes defined in `attributes` for the resource associated with `handle`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **futimes**(< _Buffer_ >handle, < _mixed_ >atime, < _mixed_ >mtime, < _function_ >callback) - _boolean_ - Sets the access time and modified time for the resource associated with `handle`. `atime` and `mtime` can be Date instances or UNIX timestamps. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **fchown**(< _Buffer_ >handle, < _integer_ >uid, < _integer_ >gid, < _function_ >callback) - _boolean_ - Sets the owner for the resource associated with `handle`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **fchmod**(< _Buffer_ >handle, < _mixed_ >mode, < _function_ >callback) - _boolean_ - Sets the mode for the resource associated with `handle`. `mode` can be an integer or a string containing an octal number. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **opendir**(< _string_ >path, < _function_ >callback) - _boolean_ - Opens a directory `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _Buffer_ >handle.

* **readdir**(< _mixed_ >location, < _function_ >callback) - _boolean_ - Retrieves a directory listing. `location` can either be a _Buffer_ containing a valid directory handle from opendir() or a _string_ containing the path to a directory. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _mixed_ >list. `list` is an _Array_ of `{ filename: 'foo', longname: '....', attrs: {...} }` style objects (attrs is of type _ATTR_). If `location` is a directory handle, this function may need to be called multiple times until `list` is boolean false, which indicates that no more directory entries are available for that directory handle.

* **unlink**(< _string_ >path, < _function_ >callback) - _boolean_ - Removes the file/symlink at `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **rename**(< _string_ >srcPath, < _string_ >destPath, < _function_ >callback) - _boolean_ - Renames/moves `srcPath` to `destPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **mkdir**(< _string_ >path, [< _ATTRS_ >attributes, ]< _function_ >callback) - _boolean_ - Creates a new directory `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **rmdir**(< _string_ >path, < _function_ >callback) - _boolean_ - Removes the directory at `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **stat**(< _string_ >path, < _function_ >callback) - _boolean_ - Retrieves attributes for `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameter: < _Error_ >err, < _Stats_ >stats.

* **lstat**(< _string_ >path, < _function_ >callback) - _boolean_ - Retrieves attributes for `path`. If `path` is a symlink, the link itself is stat'ed instead of the resource it refers to. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _Stats_ >stats.

* **setstat**(< _string_ >path, < _ATTRS_ >attributes, < _function_ >callback) - _boolean_ - Sets the attributes defined in `attributes` for `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **utimes**(< _string_ >path, < _mixed_ >atime, < _mixed_ >mtime, < _function_ >callback) - _boolean_ - Sets the access time and modified time for `path`. `atime` and `mtime` can be Date instances or UNIX timestamps. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **chown**(< _string_ >path, < _integer_ >uid, < _integer_ >gid, < _function_ >callback) - _boolean_ - Sets the owner for `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **chmod**(< _string_ >path, < _mixed_ >mode, < _function_ >callback) - _boolean_ - Sets the mode for `path`. `mode` can be an integer or a string containing an octal number. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **readlink**(< _string_ >path, < _function_ >callback) - _boolean_ - Retrieves the target for a symlink at `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _string_ >target.

* **symlink**(< _string_ >targetPath, < _string_ >linkPath, < _function_ >callback) - _boolean_ - Creates a symlink at `linkPath` to `targetPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **realpath**(< _string_ >path, < _function_ >callback) - _boolean_ - Resolves `path` to an absolute path. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _string_ >absPath.

* **ext_openssh_rename**(< _string_ >srcPath, < _string_ >destPath, < _function_ >callback) - _boolean_ - **OpenSSH extension** Performs POSIX rename(3) from `srcPath` to `destPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **ext_openssh_statvfs**(< _string_ >path, < _function_ >callback) - _boolean_ - **OpenSSH extension** Performs POSIX statvfs(2) on `path`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _object_ >fsInfo. `fsInfo` contains the information as found in the [statvfs struct](http://linux.die.net/man/2/statvfs).

* **ext_openssh_fstatvfs**(< _Buffer_ >handle, < _function_ >callback) - _boolean_ - **OpenSSH extension** Performs POSIX fstatvfs(2) on open handle `handle`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 2 parameters: < _Error_ >err, < _object_ >fsInfo. `fsInfo` contains the information as found in the [statvfs struct](http://linux.die.net/man/2/statvfs).

* **ext_openssh_hardlink**(< _string_ >targetPath, < _string_ >linkPath, < _function_ >callback) - _boolean_ - **OpenSSH extension** Performs POSIX link(2) to create a hard link to `targetPath` at `linkPath`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.

* **ext_openssh_fsync**(< _Buffer_ >handle, < _function_ >callback) - _boolean_ - **OpenSSH extension** Performs POSIX fsync(3) on the open handle `handle`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `callback` has 1 parameter: < _Error_ >err.


**Server-only methods**

* **status**(< _integer_ >reqID, < _integer_ >statusCode[, < _string_ >message]) - _boolean_ - Sends a status response for the request identified by `id`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **handle**(< _integer_ >reqID, < _Buffer_ >handle) - _boolean_ - Sends a handle response for the request identified by `id`. `handle` must be less than 256 bytes. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **data**(< _integer_ >reqID, < _mixed_ >data[, < _string_ >encoding]) - _boolean_ - Sends a data response for the request identified by `id`. `data` can be a _Buffer_ or _string_. If `data` is a string, `encoding` is the encoding of `data`. Returns `false` if you should wait for the `drain` event before sending any more traffic.

* **name**(< _integer_ >reqID, < _array_ >names) - _boolean_ - Sends a name response for the request identified by `id`. Returns `false` if you should wait for the `drain` event before sending any more traffic. `names` must be an _array_ of _object_ where each _object_ can contain:

    * **filename** - _string_ - The entry's name.

    * **longname** - _string_ - This is the `ls -l`-style format for the entry (e.g. `-rwxr--r--  1 bar   bar       718 Dec  8  2009 foo`)

    * **attrs** - _ATTRS_ - This is an optional _ATTRS_ object that contains requested/available attributes for the entry.

* **attrs**(< _integer_ >reqID, < _ATTRS_ >attrs) - _boolean_ - Sends an attrs response for the request identified by `id`. `attrs` contains the requested/available attributes.



Utility methods
---------------

* **parseKey**(< _mixed_ >keyData) - _object_ - Parses a private/public key in OpenSSH and RFC4716 formats.

* **decryptKey**(< _object_ >privKeyInfo, < _string_ >passphrase) - _(void)_ - Takes a private key parsed with `parseKey()` and decrypts it with `passphrase`. The decrypted key data overwrites the original encrypted copy.

* **genPublicKey**(< _object_ >privKeyInfo) - _object_ - Takes a private key parsed with `parseKey()` and generates the associated public key and returns the public key information in the same format as `parseKey()`.


ATTRS
-----

An object with the following valid properties:

* **mode** - _integer_ - Mode/permissions for the resource.

* **uid** - _integer_ - User ID of the resource.

* **gid** - _integer_ - Group ID of the resource.

* **size** - _integer_ - Resource size in bytes.

* **atime** - _integer_ - UNIX timestamp of the access time of the resource.

* **mtime** - _integer_ - UNIX timestamp of the modified time of the resource.

When supplying an ATTRS object to one of the SFTP methods:

* `atime` and `mtime` can be either a Date instance or a UNIX timestamp.

* `mode` can either be an integer or a string containing an octal number.


Stats
-----

An object with the same attributes as an ATTRS object with the addition of the following methods:

* `stats.isDirectory()`

* `stats.isFile()`

* `stats.isBlockDevice()`

* `stats.isCharacterDevice()`

* `stats.isSymbolicLink()`

* `stats.isFIFO()`

* `stats.isSocket()`
