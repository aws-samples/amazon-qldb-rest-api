// Make error messages more meaningful without modifying dependency
const parseErrorMessage = (error) => {
    let msg = error.message || error.toString();

    if(msg.includes('We should retrieve not more then 32 keys at a time')) 
        msg = 'Client Error: Maximum number of keys (32) exceeded';
    
    if(msg.includes('Unable to find document with Key')) {
        const keysMissing = msg.split('[QLDBKVS.getValue] Requested record does not exist: Couldn\'t get object By Key Attribute: Error: [QLDBHelper.getByKeyAttribute] Unable to find document with Key:');

        msg = `Client Error: Unable to find document with specified key: ${keysMissing[1]}`;
    }

    if(msg.includes('Unable to find documents with Keys')) {
        const keysMissing = msg.split('[QLDBKVS.getValues] Requested record does not exist: Couldn\'t getByKeyAttributes: Error: [QLDBHelper.getByKeyAttributes] Unable to find documents with Keys:');

        msg = `Client Error: Unable to find documents with specified keys: ${keysMissing[1]}`;
    }

    return new Error(msg);
}

module.exports = parseErrorMessage;