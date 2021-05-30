// Make error messages more meaningful and less verbose without modifying qldb-lambda-kvs dependency
// TODO: Probably fix this in the dependency - this breaks supertest due to ' special character
const parseErrorMessage = (error) => {
    let msg = error.message || error.toString();

    /*
        Errors for getValue
    */
    if(msg.includes('We should retrieve not more then 32 keys at a time')) 
        msg = 'Client Error: Maximum number of keys (32) exceeded';
    
    if(msg.includes('Unable to find document with Key')) {
        const msgSplit = msg.split('[QLDBKVS.getValue] Requested record does not exist: Couldn\'t get object By Key Attribute: Error: [QLDBHelper.getByKeyAttribute] Unable to find document with Key:');

        msg = `Client Error: Unable to find document with specified key: ${msgSplit[1]}`;
    }

    if(msg.includes('Unable to find documents with Keys')) {
        const msgSplit = msg.split('[QLDBKVS.getValues] Requested record does not exist: Couldn\'t getByKeyAttributes: Error: [QLDBHelper.getByKeyAttributes] Unable to find documents with Keys:');

        msg = `Client Error: Unable to find documents with specified keys: ${msgSplit[1]}`;
    }

    /*
        Errors for getMetadata
    */
    if(msg.includes('Can\'t find block address and document id associated with \"_key\"')) {
        const msgSplit = msg.split('[QLDBKVS.getMetadata] Requested record does not exist: [GetRevision getDocumentLedgerMetadata] Can\'t find block address and document id associated with \"_key\" =');
        msg = `Client Error: Unable to find block address and document id associated with key: ${msgSplit[1]}`;
    }

    if(msg.includes('Can\'t find revision metadata for')) {
        const msgSplit = msg.split('[QLDBKVS.getMetadataByDocIdAndTxId] Requested record does not exist: [GetRevision getDocumentLedgerMetadataByDocIdAndTxId] Can\'t find revision metadata for');
        msg = `Client Error: Unable to find revision metadata for ${msgSplit[1]}`;
    }

    /*
        Errors for verifyMetadta
    */
    if(msg.includes('The provided block address is not valid')) {
        //[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] [GetRevision getRevision] InvalidParameterException: The provided block address is not valid 
        msg = `Client Error: The provided block address is not valid`;
    }

    if(msg.includes('The provided Document ID was not found in the block at the specified block address')) {
        ////[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] [GetRevision getRevision] InvalidParameterException: The provided Document ID was not found in the block at the specified block address
        msg = `Client Error: The provided Document ID was not found in the block at the specified block address`;
    }

    if(msg.includes('Revision hashes do not match')) {
        //[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] Error: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] Revision hashes do not match. Received from user: +eDWcp7uS8M6ScZm/Ayf1ZvhT5RNB4GZkooTJ9HVmDA=; Received from Ledger: +eDWcp7uS8M6ScZm/Ayf1ZvhT5RNB4GZkooTJ9HVmDw= 
        const msgSplit = msg.split('[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] Error: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData]');
        msg = `Client Error: ${msgSplit[1]}`;
    }

    if(msg.includes('Document revision is not verified')) {
        //[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] Error: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] Document revision is not verified. 
        msg = `Client Error: Document revision is not verified`;
    }

    if(msg.includes('The Strand ID of the provided block address is not valid')){
    //[QLDBKVS.verifyMetadata] Requested record does not exist: [VerifyDocumentMetadata verifyDocumentMetadataWithUserData] [GetRevision getRevision] InvalidParameterException: The Strand ID of the provided block address is not valid 
        msg = `Client Error: The Strand ID of the provided block address is not valid`;
    }

    /*
        Errors for getHistory
    */
    if(msg.includes('Unable to retrieve document ID')) {
        //[QLDBKVS.getHistory] Requested record does not exist: Error: [GetDocumentHistory.getDocumentRevisionByIdAndBlock] Error: [Util.getDocumentIds] Unable to retrieve document ID using A.
        const msgSplit = msg.split('[QLDBKVS.getHistory] Requested record does not exist: Error: [GetDocumentHistory.getDocumentRevisionByIdAndBlock] Error: [Util.getDocumentIds]');
        msg = `Client Error: ${msgSplit[1]}`;
    }

    return new Error(msg);
}

module.exports = parseErrorMessage;