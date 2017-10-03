#!/usr/bin/env node
'use strict';

const fs = require('fs');
const child_process = require('child_process');

const pidFile = '/tmp/mock-stripe-server.pid';

const args = process.argv.slice(2);
const options = require('minimist')(args);
options.pidFile = pidFile;

if (options._.includes('start')) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === 'start') {
      args.splice(i, 1);
      break;
    }
  }
  const spawn = child_process.spawn(process.argv[1], args, {
    argv0: process.argv[0],
    cwd: __dirname,
    detached: true,
    stdio: 'ignore'
  });
  spawn.unref();
  process.exit(0);
} else if (options._.includes('stop')) {
  try {
    const pid = parseInt(fs.readFileSync(pidFile).toString());
    console.log(`Killing mock-stripe-server (pid:${ pid })...`);
    process.kill(pid, 'SIGINT');
  } catch (error) {
    // no complaint
  }
} else {
  let config;
  options.pidFile = pidFile;

  options.config = options.config || options.c;
  options.store = options.store || options.s;

  if (options.config && fs.existsSync(options.config)) {
    console.log(`Loading config file ${ options.config }...`);
    try {
      config = JSON.parse(fs.readFileSync(options.config));
    } catch (error) {
      console.log('Failed to load config file: ', error.message);
    }
  }

  const StripeServer = require('./lib/stripeServer');
  const stripeServer = new StripeServer(options, config);

  stripeServer.boot();
}
