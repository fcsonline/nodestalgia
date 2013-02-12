Nodestalgia
===

### Description
Nodestalgia is a [Logstalgia](http://code.google.com/p/logstalgia/) port with Node.js, Canvas and WebSockets.

### Requirements
Nodejs and npm installed, refer to `https://github.com/joyent/node/wiki/Installation`

## Installation

    $ npm install nodestalgia -g

### Running

    $ nodestalgia
or

    $ nodestalgia path/to/file
    $ nodestalgia path/to/file1 path/to/file2 *
    $ nodestalgia [options] path/to/file

By default Nodestalgia follows `/var/log/apache2/access.log`, but also works with:

* Apache default access log
* Nginx default access log
* Node.js and Express.js with default [Connect logger profile](http://www.senchalabs.org/connect/logger.html)

Access:
    http://remote_host:8081

### Keyboard shortcuts
* `space` pause
* `+` increase the request speed
* `-` decrease the request speed

![](http://fcsonline.github.com/nodestalgia/images/screenshot2.png)

