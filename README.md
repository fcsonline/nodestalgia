Nodestalgia
===

### Description
Nodestalgia is a [Logstalgia](http://code.google.com/p/logstalgia/) port with Node.js, Canvas and WebSockets.

### Requirements
Nodejs and npm installed, refer to https://github.com/joyent/node/wiki/Installation

Modules express and socket.io installed:

    npm install express socket.io

### Setup
    git clone git@github.com:fcsonline/nodestalgia.git
    cd nodestalgia

### Running

    node app.js
or

    node app.js path/to/file
    node app.js path/to/file1 path/to/file2 *

By default Nodestalgia follows /var/log/apache2/access.log

Access:
    http://remote_host:8081

