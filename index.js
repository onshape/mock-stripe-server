#!/usr/bin/env node
'use strict';

const fs = require('fs');

const args = process.argv.slice(2);
const options = require('minimist')(args);
let config;

options.config = options.config || options.c || './config.json';
options.store = options.store || options.s;

if (!options.store && options.config && fs.existsSync(options.config)) {
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
