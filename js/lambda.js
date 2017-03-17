"use strict";

exports.handler = (event, context, done) => {

    context.callbackWaitsForEmptyEventLoop = false;

    var body = JSON.parse(event.body);
    var uri = event.path;

    var request = {
        body: body,
        path: uri
    };
    console.log(request);

    var app;
    if (uri === "/wallets") {
        app = require("./wallets");
    }
    if (uri === "/payments") {
        app = require("./payments");
    }

    app(request, context,
        (failure, success) => {
            if (failure) {
                console.error(failure);
            }
            done(
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
        });

};