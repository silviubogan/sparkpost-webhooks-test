// TODO: Complete the values of the following 3 variables to make the script
// work.
// This is the default port to which the server listens if the PORT environment
// variable is not set.
var defaultPort = 3000;
// These are the user name and password used by the SparkPost request to
// authenticate to this server. They are set in the webhook settings in the
// SparkPost dashboard.
var basicAuth = {
    name: 'test_username',
    pass: 'test_password'
};


// START OF THE SCRIPT:
var util = require('util'), // for debugging
    http = require('http'),
    auth = require('basic-auth');

var port = process.env.PORT || defaultPort;

var messages = {
    '200': 'OK',
    '400': 'Bad Request',
    '401': 'Unauthorized'
};

function log(m) {
    console.log(new Date().toString() + ' | ' + m);
}

function send(res, code, extendedMessage) {
    var message = messages[code.toString()];
    if (extendedMessage) {
        message += ' - ' + extendedMessage;
    }

    res.writeHead(code, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
        httpCode: code,
        message: message
    }));
    log(code + ' - ' + message);
}

var server = http.createServer(function (req, res) {
    if (req.headers.accept !== 'application/json' ||
            req.headers['content-type'] !== 'application/json') {
        send(res, 400);
        process.exit();
    }

    var webhookAuth = auth(req);
    if (!webhookAuth || webhookAuth.name !== basicAuth.name ||
            webhookAuth.pass !== basicAuth.pass) {
        send(res, 401);
        process.exit();
    }

    var buffer = '';
    req.on('data', function (chunk) {
        buffer += chunk;
    });
    req.on('end', function () {
        var result;
        try {
            result = JSON.parse(buffer);
        } catch (ex) {
            send(res, 400, 'bad JSON');
            process.exit();
        }

        send(res, 200);
        console.log(util.inspect(result, {
            colors: true,
            depth: null
        }));
        process.exit();
    });
});

server.listen(port, function (e) { // handler for the 'listening' event
    log('SparkPost webhooks server listening on port ' + port + '.');
});
server.on('error', function (e) {
    if (e.code === 'EADDRINUSE') {
        log('Port ' + port + ' in use, please try again with another port.');
    }
});
