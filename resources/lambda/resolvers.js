async function getValue(qldbKVSDriver, key) {
    const data = await qldbKVSDriver.getValue(key);
    return data;
}

async function getValues(qldbKVSDriver, keyArray) {
    const data = await qldbKVSDriver.getValues(keyArray);
    return data;
}

async function setValue(qldbKVSDriver, key, value) {
    const data = await qldbKVSDriver.setValue(key, value);
    return data;
}

async function setValues(qldbKVSDriver, keyArray, valueArray) {
    const data = await qldbKVSDriver.setValues(keyArray, valueArray);
    return data;
}

const getMetadataByKey = async (qldbKVSDriver, key) => {
    const data = await qldbKVSDriver.getMetadata(key);
    return data;
}

const getMetadataByDoc = async (qldbKVSDriver, docId, txId) => {
    const data = await qldbKVSDriver.getMetadataByDocIdAndTxId(docId, txId);
    return data;
}

const verifyMetadata = async (qldbKVSDriver, metadata) => {
    const isValid = await qldbKVSDriver.verifyMetadata(metadata);
    if (isValid) {
        return {
            result: "valid"
        }
    } else {
        return {
            result: "not valid"
        }
    }
}

module.exports.getValue = getValue;
module.exports.getValues = getValues;
module.exports.setValue = setValue;
module.exports.setValues = setValues;

module.exports.getMetadataByKey = getMetadataByKey;

module.exports.getMetadataByDoc = getMetadataByDoc;

module.exports.verifyMetadata = verifyMetadata;