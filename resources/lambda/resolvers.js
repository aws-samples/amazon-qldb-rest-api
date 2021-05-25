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

module.exports.getValue = getValue;
module.exports.setValue = setValue;