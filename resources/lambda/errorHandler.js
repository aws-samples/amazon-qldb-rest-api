const parseErrorMessage = (error) => {
    let msg = error.message || error.toString();

    if(msg.includes('Requested record does not exist') || //getValue
       msg.includes('Requested records do not exist') || //getValues
       msg.includes('Could not get metadata') || //getMetadata
       msg.includes('Could not verify the metadata') || //verifyMetadata
       msg.includes('Could not get document revision') || //getDocumentRevisionByMetadata
       msg.includes('Could not get history') //getHistory
      ) {
        msg = `Client Error: ${msg}`;
    }
    return new Error(msg);
}

module.exports = parseErrorMessage;