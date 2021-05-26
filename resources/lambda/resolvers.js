async function getValue(qldbKVSDriver, key) {
    const data = await qldbKVSDriver.getValue(key);
    return {
        value: data
    };
}

async function setValue(qldbKVSDriver, key, value) {
    const data = await qldbKVSDriver.setValue(key, value);
    return {
        response: data
    };
}

async function setValues(qldbKVSDriver, keyArray, valueArray) {
    const data = await qldbKVSDriver.setValues(keyArray, valueArray);
    return {
        response: data
    };
}

module.exports.getValue = getValue;
module.exports.setValue = setValue;
module.exports.setValues = setValues;