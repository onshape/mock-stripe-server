'use strict';

const crypto = require('crypto');

//////////////////////////////

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSHA1Hex(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).digest('hex');
}

const colors = {
  'black': 30,
  'red': 31,
  'green': 32,
  'yellow': 33,
  'blue': 34,
  'magenta': 35,
  'cyan': 36,
  'white': 37,

  'gray': 90,
  'grey': 90,
  'bright red': 91,
  'bright green': 92,
  'bright yellow': 93,
  'bright blue': 94,
  'bright magenta': 95,
  'bright cyan': 96,
  'bright white': 97
};

function colorize(name, string) {
  if (global && global.flags && global.flags.noColor) {
    return string;
  }

  const color = colors[name] || colors.gray;
  return '\u001b[' + color + 'm' + string + '\u001b[0m';
}

/**
 * Pretty print a JSON object to the console, if printNonEnumerables
 * is set then loops through all properties on an object and print them.
 * @param {Object} json : the JSON object
 * @param {boolean} printNonEnumerables : print non enumerable properties
 */

console.json = function(json, printNonEnumerables) {
  return prettyPrint(json, {
    all: printNonEnumerables,
    print: true
  });
};

/**
 * Pretty Print any value with colorization.
 * @param {*} object : any object or value
 * @param {{
 *           all : boolean|undefined,
 *           print : boolean|undefined }} options
 */
function prettyPrint(object, {
  all = false, print = true
} = {}) {
  function indent(depth) {
    return ('  ').repeat(depth + 1);
  }

  function prettyPrinter(value, depth, overrideColor) {
    let line = indent(depth);
    if (typeof value === 'string') {
      line += colorize(overrideColor || 'green', '"' + value + '"');
    } else if (typeof value === 'number') {
      line += colorize(overrideColor || 'yellow', value);
    } else if (typeof value === 'boolean') {
      line += colorize(overrideColor || 'cyan', value);
    } else if (value === undefined || value === null) {
      line += colorize(overrideColor || 'magenta', value);
    } else if (value instanceof Date || value instanceof RegExp ||
               typeof value === 'function') {
      line += colorize('blue', value.toString());
    } else if (Array.isArray(value)) {
      line += '[';
      if (value.length) {
        line += '\n';
      }

      depth++;
      for (let i = 0; i < value.length; i++) {
        const comma = (i < value.length - 1) ? ',' : '';
        line += prettyPrinter(value[i], depth) + comma + '\n';
      }
      depth--;
      line += indent(depth) + ']';
    } else if (typeof value === 'object') {
      line += '{';
      let keys = Object.getOwnPropertyNames(value);
      if (keys.length) {
        line += '\n';
      }

      const enumerables = {};
      keys = keys.filter(function(key) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        enumerables[key] = descriptor.enumerable;
        return (descriptor.enumerable === true || all === true);
      });

      depth++;
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const comma = (j < keys.length - 1) ? ',' : '';
        const keyColor = enumerables[key] ? 'gray' : 'red';
        line += prettyPrinter(key, depth, keyColor) + ': ';
        line += prettyPrinter(value[key], depth) + comma + '\n';
      }
      depth--;
      line += indent(depth) + '}';
    } else {
      line += colorize('bright red', value.toString());
    }

    return line.replace(/:\s+/g, ': ').
      replace(/([{[])\s+([}\]])/g, '$1$2');
  }

  const output = prettyPrinter(object, 0);

  if (print !== false) {
    console.log(output);
  }
  return output;
}

//////////////////////////////

function getDefaultAddress() {
  return {
    address: '1 Alewife Center',
    city: 'Cambridge',
    zip: '02140',
    state: 'MA',
    country: 'USA'
  };
}

function getDefaultCreditCard() {
  return {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: new Date().getFullYear() + 2,
    cvc: '123',
    address_line1: '1 Alewife Center',
    address_line2: 'Suite 130',
    address_city: 'Cambridge',
    address_state: 'MA',
    address_zip: '02140',
    address_country: 'US'
  };
}

//////////////////////////////

module.exports = {
  getDefaultAddress: getDefaultAddress,
  getDefaultCreditCard: getDefaultCreditCard,
  getSHA1Hex: getSHA1Hex,
  prettyPrint: prettyPrint,
  rand: rand
};
