#!/usr/bin/env node

// Node.js Playstation 3 / DS3 Controller for CNC.js

// Original version by Austin St. Aubin <austinsaintaubin@gmail.com> [2017]
// Major rework by Chris Midgley <chris@koose.com> [2020]

// USAGE EXAMPLE: ./cncjs-pendant-ps3 -p "/dev/ttyUSB0"
// SEE ALL OPTIONS: ./cncjs-pendant-ps3 -h


// MIT License
//
// Copyright (c) 2017 Austin St. Aubin
// Copyright (c) 2020 Chris Midgley
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var program = require('commander');
var serialport = require('serialport');
var inquirer = require('inquirer');
var pkg = require('./package.json');
var serverMain = require('./src/pendant');

var options = {};

program
	.version(pkg.version)
	.usage('-p <port> [options]')
	.option('-l, --list', 'list available ports then exit')
	.option('-p, --port <port>', 'path or name of serial port')
	.option('-b, --baudrate <baudrate>', 'baud rate', 115200)
	.option('-t, --controller-type <type>', 'controller type: Grbl|Smoothie|TinyG|Marlin', 'Grbl')
    .option('-s, --secret <secret>', 'the secret key stored in the ~/.cncrc file')
	.option('--socket-address <address>', 'socket address or hostname', 'localhost')
	.option('--socket-port <port>', 'socket port', 8000)
    .option('--access-token-lifetime <lifetime>', 'access token lifetime in seconds or a time span string', '30d')
    .option('--clone', 'use when you have a clone ps3 controller and are getting write errors')
    .option('--license', 'view the MIT license agreement')
    .option('-v, --verbose', 'display verbose (debugging) messages')
    .option('-f, --fake-socket', 'use a fake socket server and display cncjs messages to console instead');
program.parse(process.argv);

var options = {
    list: program.list,
    secret: program.secret,
    port: program.port,
    baudrate: program.baudrate,
    socketAddress: program.socketAddress,
    socketPort: program.socketPort,
    controllerType: program.controllerType,
    accessTokenLifetime: program.accessTokenLifetime,
    clone: program.clone,
    license: program.license,
    verbose: program.verbose,
    fakeSocket: program.fakeSocket
};

if (options.license) {
        console.log("MIT License\
\
        Copyright (c) 2017 Austin St. Aubin\
        Copyright (c) 2020 Chris Midgley\
\
        Permission is hereby granted, free of charge, to any person obtaining a copy\
        of this software and associated documentation files (the \"Software\"), to deal\
        in the Software without restriction, including without limitation the rights\
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\
        copies of the Software, and to permit persons to whom the Software is\
        furnished to do so, subject to the following conditions:\
\
        The above copyright notice and this permission notice shall be included in all\
        copies or substantial portions of the Software.\
\
        THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\
        SOFTWARE.");
        return;
}

if (options.list) {
    console.log('Available serial ports:');
	serialport.list(function(err, ports) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		ports.forEach(function(port) {
			console.log(port.comName);
		});
	});
	return;
}

var createServer = function(options) {
    serverMain(options, function(err, socket) {});
};

if (options.port || options.fakeSocket) {
    createServer(options);
    return;
}

serialport.list(function(err, ports) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    const choices = ports.map(function(port) {
        return port.comName;
    });

    console.log('For list of available options, use --help\n');

    inquirer.prompt([{
        type: 'list',
        name: 'port',
        message: 'Specify which port you want to use?',
        choices: choices
    }]).then(function(answers) {
        options.port = answers.port;

        createServer(options);
    });
});
