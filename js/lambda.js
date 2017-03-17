"use strict";

exports.handler = (event, context, lambdaCallback) => {
    var done = (failure, success) => {
        lambdaCallback(
            failure ? {
                statusCode: 500,
                headers: {"Access-Control-Allow-Origin": "*"},
                body: JSON.stringify(failure)
            } : null,
            success ? {
                statusCode: 200,
                headers: {"Access-Control-Allow-Origin": "*"},
                body: JSON.stringify(success)
            } : null);
    };

    context.callbackWaitsForEmptyEventLoop = false;

    var body = JSON.parse(event.body);
    var uri = event.path;

    var request = {
        body: body,
        path: uri
    };

    var app;
    if (uri === "/wallets") {
        app = require("./wallets");
    } else if (uri === "/payments") {
        app = require("./payments");
    } else {
        done({message: `Not a valid API endpoint (${uri})`});
    }

    app(request, context, done);
};