const { QLDBKVS } = require("amazon-qldb-kvs-nodejs");
const { getValue, setValue } = require("./resolvers");


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
        const method = event.httpMethod;
        // Get name, if present
        const key = event.path.startsWith('/') ? event.path.substring(1) : event.path;

        switch (method) {
            case "GET":
                const bodyGet = await getValue(qldbKVS, key);
                return returnSuccess(bodyGet);
            case "POST":
                const value = JSON.parse(event.body);
                const bodyPost = await setValue(qldbKVS, key, value);
                return returnSuccess(bodyPost);
            default:
                throw new Error(`Method ${method} is not supported.`);
        }
    } catch (error) {
        console.log(error);
        return returnFailure(error);
    }
}

module.exports.main = main;