const { QLDBKVS } = require("amazon-qldb-kvs-nodejs");
const { getValue, setValue, setValues } = require("./resolvers");


const LEDGER_NAME = process.env.LEDGER_NAME ? process.env.LEDGER_NAME : "keyvaluestore";
const TABLE_NAME = process.env.TABLE_NAME ? process.env.TABLE_NAME : "keyvaluedata";

const qldbKVS = new QLDBKVS(LEDGER_NAME, TABLE_NAME);

const returnSuccess = (data) => {
    return {
        "statusCode": 200,
        "headers": {},
        "isBase64Encoded": false,
        "body": JSON.stringify(data)
    }
}

const returnFailure = (error) => {
    const body = error.stack || JSON.stringify(error, null, 2);
    return {
        "statusCode": 400,
        "headers": {},
        "isBase64Encoded": false,
        "body": JSON.stringify(body)
    }
}

const main = async (event, context) => {
    try {
        const ops = event.ops;
        const payload = event.payload;
        let res;

        switch (ops) {
            case "getValue":
                if (payload.length == 1) {
                    res = await getValue(qldbKVS, payload[0].key);
                } else {
                    res = {"msg": "not implemented"}
                }
                return returnSuccess(res);

            case "setValue":
                if (payload.length == 1) {
                    res = await setValue(qldbKVS, payload[0].key, payload[0].value);
                } else {
                    const keyArray = payload.map( p => { return p.key });
                    const valueArray = payload.map ( p => { return p.value });
                    res = await setValues(qldbKVS, keyArray, valueArray);
                }
                return returnSuccess(res);

            default:
                throw new Error(`Operation ${ops} is not supported.`);
        }
    } catch (error) {
        console.log(error);
        return returnFailure(error);
    }
}

module.exports.main = main;