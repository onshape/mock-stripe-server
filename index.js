#!/usr/bin/env node
'use strict';

const fs = require('fs');

let config;

const options = require('minimist')(process.argv.slice(2));

if (options.c) {
  console.log(`Loading config file ${ options.c }...`);
  try {
    config = JSON.parse(fs.readFileSync(options.c));
  } catch (error) {
    console.log('Failed to load config file: ', error);
  }
}

const StripeServer = require('./lib/stripeServer');
const stripeServer = new StripeServer(config);

stripeServer.boot();
