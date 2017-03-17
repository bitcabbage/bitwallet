"use strict";

var firebase = require("firebase");
var _ = require("lodash");

class Firebase {

    constructor() {
        this.firebasePromise = _.memoize(() => {
            var config = {
                apiKey: "AIzaSyAp86y1X4P7IbNY28ia9Ia0o8nbjtcIT3k",
                databaseURL: "https://bitcabbage-f82d4.firebaseio.com"
            };
            firebase.initializeApp(config);

            const email = process.env.FIREBASE_USER;
            const password = process.env.FIREBASE_PASSWORD;

            var credential = firebase.auth.EmailAuthProvider.credential(email, password);

            return firebase
                .auth()
                .signInWithCredential(credential)
                .then(() => firebase.database());
        });
    }


    firebase() {
        return this.firebasePromise();
    }

    shutdown() {
        return this.firebasePromise.then(firebase => firebase.delete());
    }
}

module.exports = new Firebase();
