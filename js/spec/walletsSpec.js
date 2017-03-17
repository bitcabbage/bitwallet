const faker = require('faker');
const rewire = require("rewire");
const endpoint = rewire("../wallets.js");
const Wallet = require("./walletStub.js");
const Firestub = require("./fireStub.js");

describe("wallet lambda", () => {

    const customerId = faker.random.uuid();
    const existingAddress = faker.finance.bitcoinAddress();
    const newAddress = faker.finance.bitcoinAddress();

    var wallet;
    var walletRoutings = {
        new_address: {
            address: newAddress
        }
    };
    var firebase;
    var lambdaCallback;
    var lambdaRequest = {
        body: {
            customer: {
                id: customerId
            }
        }
    };

    beforeEach(() => {
        firebase = new Firestub();
        wallet = new Wallet(walletRoutings);
        endpoint.__set__("firebase", firebase);
        endpoint.__set__("wallet", wallet);
    });

    describe("when a customer has a wallet", () => {
        beforeEach(done => {
            firebase.returns(`/wallets/${customerId}`, {
                wallet: {
                    address: existingAddress
                }
            });

            lambdaCallback = runLambdaAndWaitUntil(done);
        });
        it("should return the existing wallet address", () => {
            expect(lambdaCallback).toHaveBeenCalledWith(null, {wallet: {address: existingAddress}})
        })
    });


    describe("when a customer has no wallet", () => {
        beforeEach(done => {
            lambdaCallback = runLambdaAndWaitUntil(done);
        });

        it("should return a new wallet address", () => {
            expect(lambdaCallback).toHaveBeenCalledWith(null, {wallet: {address: newAddress}})
        })
    });

    afterEach(() => {
        wallet.kill();
    });

    var runLambdaAndWaitUntil = (done) => {
        lambdaCallback = lambdaCallbackSpy(done);
        endpoint(lambdaRequest, {}, lambdaCallback);
        return lambdaCallback;
    };

    var lambdaCallbackSpy = (done) => {
        return jasmine.createSpy('lambdaCallback').and.callFake(done);
    };

});