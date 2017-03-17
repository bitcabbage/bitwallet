"use strict";

const portfinder = require("portfinder");

class Port {

    constructor() {
        portfinder.basePort = 3000;
    }

    free() {
        return portfinder.getPortPromise();
    }
}

module.exports = Port;
