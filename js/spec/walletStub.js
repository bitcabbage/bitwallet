const jsonServer = require('json-server');
const app = jsonServer.create();
const middlewares = jsonServer.defaults();

class Wallet {

    constructor(routings) {
        this.router = jsonServer.router(routings);
    }

    start(opts) {
        this.server = new Promise((resolve, reject) => {
            app.use(middlewares);
            app.use(this.router);
            var server = app.listen(opts.port, opts.bind, () => {
                console.log(`Wallet stub is up & running on port ${opts.port}`);
                resolve(server);
            });
        });
        return this.server;
    }

    kill() {
        if (this.server) {
            this.server.then(server => server.close());
        }
    }

}

module.exports = Wallet;
