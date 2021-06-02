const { QLDBKVS } = require('amazon-qldb-kvs-nodejs');
const parseErrorMessage = require('./errorHandler');
const util = require('util');

const LEDGER_NAME = process.env.LEDGER_NAME || 'keyvaluestore';
const TABLE_NAME = process.env.TABLE_NAME || 'keyvaluedata';

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
            case "getValue":
                if (payload.length == 1) {
                    res = await qldbKVS.getValue(payload[0]);
                } else {
                    res = await qldbKVS.getValues(payload);
                }
                break;

            case "setValue":
                if (payload.length == 1) {
                    res = await qldbKVS.setValue(payload[0].key, payload[0].value);
                } else {
                    const keyArray = payload.map( p => { return p.key });
                    if (checkForDuplicateKeys(keyArray) == true) {
                        throw new Error(`Client Error: Duplicate keys detected`);
                    }
                    const valueArray = payload.map ( p => { return p.value });
                    res = await qldbKVS.setValues(keyArray, valueArray);
                }
                break;
            
            case "getMetadataByKey":
                res = await qldbKVS.getMetadata(payload);
                break;

            case "getMetadataByDoc":
                res = await qldbKVS.getMetadataByDocIdAndTxId(payload.docId, payload.txId);
                break;
            
            case "verifyMetadata":
                await qldbKVS.verifyMetadata(payload);
                res = { result: 'valid' };
                break;
            
            case "getHistory":
                res = await qldbKVS.getHistory(payload);
                break;

            default:
                throw new Error(`Server Error: Operation ${ops} is not supported.`);
        }

        console.log(util.inspect(res, {depth: 3}));
        return res;

    } catch (error) {
        const msg = parseErrorMessage(error);
        console.log(msg);
        throw msg;
    }
}

module.exports.main = main;