"use strict";

exports.handler = (event, context, lambdaCallback) => {

    var done = (failure, success) => {
        console.log(`Failure: ${failure} / ${failure ? true : false}`);
        console.log(`Success: ${success} / ${success ? true : false}`);
        lambdaCallback(
            failure ? {
                statusCode: 501,
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

    if (uri === "/wallets") {
        require("./wallets")(request, context, done);
    } else if (uri === "/payments") {
        require("./payments")(request, context, done);
    } else {
        done({message: `Not a valid API endpoint (${uri})`});
    }

};