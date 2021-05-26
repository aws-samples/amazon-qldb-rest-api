const { QLDBKVS } = require("amazon-qldb-kvs-nodejs");
const { getValue, setValue, setValues } = require("./resolvers");
const util = require('util');

const LEDGER_NAME = process.env.LEDGER_NAME ? process.env.LEDGER_NAME : "keyvaluestore";
const TABLE_NAME = process.env.TABLE_NAME ? process.env.TABLE_NAME : "keyvaluedata";

const qldbKVS = new QLDBKVS(LEDGER_NAME, TABLE_NAME);

const checkForDuplicateKeys = (array) => {
    return new Set(array).size !== array.length
}

const main = async (event, context) => {
    try {
        const ops = event.ops;
        const payload = event.payload;
        let res;

        switch (ops) {
            // case "getValue":
            //     if (payload.length == 1) {
            //         res = await getValue(qldbKVS, payload[0].key);
            //     } else {
            //         res = {"msg": "not implemented"}
            //     }
            //     return returnSuccess(res);

            case "setValue":
                if (payload.length == 1) {
                    res = await setValue(qldbKVS, payload[0].key, payload[0].value);
                } else {
                    const keyArray = payload.map( p => { return p.key });
                    if (checkForDuplicateKeys(keyArray) == true) {
                        throw new Error(`Client Error: Duplicate keys detected`);
                    }
                    const valueArray = payload.map ( p => { return p.value });
                    res = await setValues(qldbKVS, keyArray, valueArray);
                }
                console.log(util.inspect(res, {depth: 3}));
                return res.response;

            default:
                throw new Error(`Server Error: Operation ${ops} is not supported.`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.main = main;