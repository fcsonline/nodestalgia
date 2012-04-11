Nodestalgia
===

### Description
Nodestalgia is a [Logstalgia](http://code.google.com/p/logstalgia/) port with Node.js, Canvas and WebSockets.

### Requirements
Nodejs and npm installed, refer to `https://github.com/joyent/node/wiki/Installation`

### Setup
    git clone git@github.com:fcsonline/nodestalgia.git
    cd nodestalgia
    npm install -d

### Running

    ./node app.js
or

    ./node app.js path/to/file
    ./node app.js path/to/file1 path/to/file2 *
    ./node app.js [options] path/to/file

By default Nodestalgia follows `/var/log/apache2/access.log`

Access:
    http://remote_host:8081

### Keyboard shortcuts
* `space` pause
* `+` increase the request speed
* `-` decrease the request speed

![](http://fcsonline.github.com/nodestalgia/images/screenshot2.png)

