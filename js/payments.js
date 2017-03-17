const _ = require("lodash");
const async = require("async");
const rp = require("request-promise");
const wallet = require("blockchain-wallet-service");
const firebase = require("./firebase");
const Port = require("./port");

const walletPassword = process.env.WALLET_PASSWORD;
const walletMerchant = process.env.WALLET_MERCHANT;
const walletHost = "127.0.0.1";

var payments = (request, context, done) => {
    var customerId = request.body.customer.id;
    var amount = request.body.transfer.amount;
    var recipientAddress = request.body.transfer.to;
    async.waterfall([
            async.asyncify(() => {
                var port = new Port();
                return port.free().then(port => {
                    return {walletPort: port}
                })
            }),
            async.asyncify($ => {
                return wallet.start({port: $.walletPort, bind: walletHost}).then(() => $);
            }),
            async.asyncify($ => {
                return firebase.firebase().then(database => _.merge($, {database: database}));
            }),
            async.asyncify($ => {
                var ref = $.database.ref(`/wallets/${customerId}`);
                return ref.once('value').then(snapshot => {
                    var wallet = snapshot.val();
                    if (!wallet) {
                        throw `Customer (${customerId}) does not have a wallet.`
                    } else {
                        return _.merge($, {address: wallet.wallet.address})
                    }
                })
            }),
            async.asyncify($ => {
                var walletPort = $.walletPort;
                var senderAddress = $.address;
                var endpoint = `http://${walletHost}:${walletPort}/merchant/${walletMerchant}/payment?password=${walletPassword}&from=${senderAddress}&to=${recipientAddress}&amount=${amount}`;
                console.log(`Sending BTC to ${customerId} by hitting ${endpoint}`);
                return rp({uri: endpoint, json: true})
                    .then(response => _.merge($, {
                        OK: "OK"
                    }))
                    .catch(e => {
                        throw `Unable to send BTC (${e})`
                    });
            })
        ],
        done
    );
};

module.exports = payments;