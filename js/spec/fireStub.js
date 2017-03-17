class Firestub {

    constructor() {
        this.stubRefs = new Map();
    }

    firebase() {
        return new Promise((resolve, reject) => {
            resolve(new Database(this.stubRefs));
        });
    }

    returns(path, value) {
        this.stubRefs.set(path, value);
    }

}

class Database {

    constructor(stubRefs) {
        this.stubRefs = stubRefs;
    }

    ref(path) {
        var value = this.stubRefs.get(path);
        return new Ref(value);
    }

}


class Ref {
    constructor(value) {
        this.value = value;
    }

    once(event) {
        return new Promise((resolve, reject) => {
            resolve(new Snapshot(this.value));
        })
    }

    set(value) {
        return new Promise((resolve, reject) => {
            resolve(void(0));
        });
    }
}

class Snapshot {
    constructor(value) {
        this.value = value;
    }

    val() {
        return this.value;
    }

}

module.exports = Firestub;