#!/usr/bin/env node
'use strict';

const StripeServer = require('./lib/stripeServer');
const stripeServer = new StripeServer();

stripeServer.boot();
