#!/usr/bin/env node
'use strict';

const fs = require('fs');

let config;

if (process.argv[2]) {
  console.log(`Loading config file ${ process.argv[2] }...`);
  try {
    config = JSON.parse(fs.readFileSync(process.argv[2]));
  } catch (error) {
    console.log('Failed to load config file: ', error);
  }
}

const StripeServer = require('./lib/stripeServer');
const stripeServer = new StripeServer(config);

stripeServer.boot();
