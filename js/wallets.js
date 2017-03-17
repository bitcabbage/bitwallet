const _ = require("lodash");
const async = require("async");
const rp = require("request-promise");
const wallet = require("blockchain-wallet-service");
const firebase = require("./firebase");
const Port = require("./port");

const walletPassword = process.env.WALLET_PASSWORD;
const walletMerchant = process.env.WALLET_MERCHANT;
const walletHost = "127.0.0.1";

var wallets = (request, context, done) => {
    var customerId = request.body.customer.id;
    async.waterfall([
            async.asyncify(() => {
                var port = new Port();
                return port.free().then(port => {
                    return {walletPort: port}
                })
            }),
            async.asyncify($ => {
                return wallet.start({port: $.walletPort, bind: '127.0.0.1'}).then(() => $);
            }),
            async.asyncify($ => {
                return firebase.firebase().then(database => _.merge($, {database: database}));
            }),
            async.asyncify($ => {
                var ref = $.database.ref(`/wallets/${customerId}`);
                return ref.once('value').then(snapshot => {
                    var account = snapshot.val();
                    if (account) {
                        return _.merge($, {address: account.wallet.address})
                    } else {
                        return $;
                    }
                })
            }),
            async.asyncify($ => {
                if ($.address) {
                    console.log(`Wallet address exists for ${customerId}`);
                    return $;
                } else {
                    var walletPort = $.walletPort;
                    var endpoint = `http://${walletHost}:${walletPort}/merchant/${walletMerchant}/new_address?password=${walletPassword}&label=${customerId}`;
                    console.log(`Generating wallet address for ${customerId} by hitting ${endpoint}`);
                    return rp({uri: endpoint, json: true}).then(response =>_.merge($, {
                        isNewAddress: true,
                        address: response.address
                    }));
                }
            }),
            async.asyncify($ => {
                var wallet = {wallet: {address: $.address}};
                if ($.isNewAddress) {
                    var newRef = $.database.ref(`/wallets/${customerId}`);
                    return newRef.set(wallet).then(() => wallet);
                } else {
                    return wallet;
                }
            })
        ],
        done
    );
};

module.exports = wallets;