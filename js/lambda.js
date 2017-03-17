"use strict";

exports.handler = (event, context, lambdaCallback) => {

    var done = (failure, success) => {
        lambdaCallback(null, {
            statusCode: success ? 200 : 501,
            headers: {"Access-Control-Allow-Origin": "*"},
            body: success ? JSON.stringify(success) : JSON.stringify(failure)
        });
    };

    context.callbackWaitsForEmptyEventLoop = false;


    var body = JSON.parse(event.body);
    var uri = event.path;

    var request = {
        body: body,
        path: uri
    };

    if (uri === "/wallets") {
        require("./wallets")(request, context, done);
    } else if (uri === "/payments") {
        require("./payments")(request, context, done);
    } else {
        done({message: `Invalid API endpoint (${uri})`});
    }

};