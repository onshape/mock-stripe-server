'use strict';

function Errors() {
  const self = this;

  self.sendError = function({
    type, code, param, detail, statusCode = 400, message, req, res, next
  }) {
    const response = {
      error: {
        type: type,
        code: code || null,
        param: param || null,
        message: message,
        detail: detail || null,
        statusCode: statusCode,
        decline_code: null,
        charge: null,
        requestId: req.requestId
      }
    };

    console.log('ERROR [%s/%s]: %s', statusCode, type, message);
    console.json(response);

    //res.sendRaw(statusCode, JSON.stringify(response, null, 2));
    res.send(statusCode, response);
    next(false);
  };

  self.apiError = function(options) {
    options.type = 'api_error';
    return self.sendError(options);
  };

  self.authenticationError = function(options) {
    options.type = 'authentication_error';
    return self.sendError(options);
  };

  self.cardError = function(options) {
    options.type = 'card_error';
    return self.sendError(options);
  };

  self.invalidRequestError = function(options) {
    options.type = 'invalid_request_error';
    return self.sendError(options);
  };

  return self;
}

module.exports = function(stripe) {
  return new Errors(stripe);
};
