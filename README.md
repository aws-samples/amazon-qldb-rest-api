# QLDB API

Amazon Quantum Ledger Database (Amazon QLDB) is a fully managed ledger database service that is handy for keeping your data immutable and maintain cryptographically verifiable transaction log. It is useful in use cases when you need to track data that needs to be audited such as financial transactions or invoice data. In this code sample, we will introduce a simple way to use the key audit features with the help of Amazon QLDB through an easy-to-use REST API.  

## Deploying and interacting with the application

### Pre-requisites

To deploy and test the REST APIs, you will need to fullfill the following pre-requisites:

* Install [NodeJS](https://nodejs.org/en/download/) version 12 or above
* [Configure](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) AWS CLI to interact with AWS account of your choice
* Install [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)
* [jq](https://stedolan.github.io/jq/) installed

### Deploy the application resources

Clone the code and browse into the directory:

```bash
git clone https://github.com/aws-samples/qldb-api
cd qldb-api
```

Download Lambda function dependencies:

```bash
npm run build-lambda
```

Bootstrap account with CDK resources (Note: you will need to only do this once):

```bash
npm run bootstrap-cdk <account name> <region name>

# Example:
npm run bootstrap-cdk 123456789012 ap-southeast-1
```

Deploy resources to account. You can set LEDGER_NAME and TABLE_NAME to any value you want:

```bash
LEDGER_NAME=<ledger_name> TABLE_NAME=<table_name> npm run deploy-cdk <account name> <region name>

# Example:
LEDGER_NAME=ledger1 TABLE_NAME=invoices npm run deploy-cdk 123456789012 ap-southeast-1
```

When prompted `Do you wish to deploy these changes (y/n)?`, input **y**. Take note of the output, which is the REST API endpoint URL. You will use this URL to interact with the application. Assign this URL to an environment variable:

```bash
export APIGW_ENDPOINT=https://<unique-id>.execute-api.<region name>.amazonaws.com/prod

# Example:
export APIGW_ENDPOINT=https://c94rwv4we4.execute-api.ap-southeast-1.amazonaws.com/prod
```

### Interacting with the application

Now that you have deployed the resources, you can start to interact with the application. You will act as both the car manufacturer and the car dealer.

The first step is for the car manufacturer to issue an invoice to the car dealer, **ABC Car Dealer Pte Ltd**. `paymentStatus` is set to `PENDING`

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"key": "INV01","value": {"date": "2021-05-22","billTo": "ABC Car Dealer Pte Ltd","paymentStatus":"PENDING","carInfo": {"model": "Honda","make": "Jazz","year": 2021,"unitPrice": 89000},"quantity": 10}}]' \
   $ENDPOINT
```

Save the `documentId` (Document ID) and `txId` (Transaction ID) returned. For example,

```json
{"documentId":"G3Oi84WQpSA3ppyitpjObh","txId":"HgXB2kkD0LDL2o7OIIKSXo"}
```

In the example above, the `documentId` is **G3Oi84WQpSA3ppyitpjObh**. Using both the `documentId` and `txId`, the car manufacturer retrieve the receipt for the invoice:

```bash
curl ${ENDPOINT}/receipt-by-doc\?documentId=<insert documentId>\&txId=<insert txId> | jq

# Example:
curl ${ENDPOINT}/receipt-by-doc\?documentId=G3Oi84WQpSA3ppyitpjObh\&txId=HgXB2kkD0LDL2o7OIIKSXo | jq
```

Save the receipt returned. For example,

```json
{
  "LedgerName": "ledger1",
  "TableName": "invoices",
  "BlockAddress": {
    "IonText": "{strandId: \"1HqUNaR8u8s13eFiSzGZl9\", sequenceNo: 19}"
  },
  "DocumentId": "G3Oi84WQpSA3ppyitpjObh",
  "RevisionHash": "fTbev2Z6saXsywdS482tVs8JKUYfNGvBt+Cz0lqd+0U=",
  "Proof": {
    "IonText": "[{{qd5t27vMQBuXQjdhZypPnEu7ICTDtfTQRryKAvcluP8=}},{{oXFA3/VqV8DQfPC8dIoe7dM2WVhuxpB73EsV2V51Wy0=}},{{nIaxKownoP6zJN3+5Gef5VwrpM583rmTiE79wuHEEYQ=}},{{nIaxKownoP6zJN3+5Gef5VwrpM583rmTiE79wuHEEYQ=}},{{vjnkE8bFo8J30Ar8LB16AbGR5xlv+CW7KOqfLrUWmWE=}},{{3isPiImi7c4BNMDnj4hpFamvBkhMw1GjkajPEDnkiwc=}},{{yZIwm4fT19arvuY2QQgUAM/1sBB59bI1XXj1BYPVS+Y=}},{{Tc3apBD1JIJKZ1df2y4vA/nwgNcGb4xnF79QrZd1l64=}},{{TG+jc76rFM22OZZzvLYCTMrCtcMXPOQEt6Ti4vO9nTw=}}]"
  },
  "LedgerDigest": {
    "Digest": "XzGkk+RaYgbdLqhGyza6uVo6nal2oG9WrJixfYWsYqc=",
    "DigestTipAddress": {
      "IonText": "{strandId:\"1HqUNaR8u8s13eFiSzGZl9\",sequenceNo:35}"
    }
  }
}
```

The car manufacturer sends both the invoice and the receipt to the car dealer over email or any other medium. Upon receival of the information, the car dealer verifies the receipt to make sure the invoice was not modified during transfer:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '<Insert receipt>' \
  ${ENDPOINT}/verify

# Example:
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"LedgerName":"ledger1","TableName":"invoices","BlockAddress":{"IonText":"{strandId: \"1HqUNaR8u8s13eFiSzGZl9\", sequenceNo: 19}"},"DocumentId":"G3Oi84WQpSA3ppyitpjObh","RevisionHash":"fTbev2Z6saXsywdS482tVs8JKUYfNGvBt+Cz0lqd+0U=","Proof":{"IonText":"[{{qd5t27vMQBuXQjdhZypPnEu7ICTDtfTQRryKAvcluP8=}},{{oXFA3/VqV8DQfPC8dIoe7dM2WVhuxpB73EsV2V51Wy0=}},{{nIaxKownoP6zJN3+5Gef5VwrpM583rmTiE79wuHEEYQ=}},{{nIaxKownoP6zJN3+5Gef5VwrpM583rmTiE79wuHEEYQ=}},{{vjnkE8bFo8J30Ar8LB16AbGR5xlv+CW7KOqfLrUWmWE=}},{{Tc3apBD1JIJKZ1df2y4vA/nwgNcGb4xnF79QrZd1l64=}}]"},"LedgerDigest":{"Digest":"BcMsBi4tAfS+R0Sots1wSjACP2LkdrzUDfxUVAhCS58=","DigestTipAddress":{"IonText":"{strandId:\"1HqUNaR8u8s13eFiSzGZl9\",sequenceNo:19}"}}}' \
  ${ENDPOINT}/verify
```

The response should be:

```json
{"result":"valid"}
```

Now that the car dealer is assured that the invoice is correct, the car dealer performs bank transfer and updates the `paymentStatus` to `TRANSFERRED`:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"key": "INV01","value": {"date": "2021-05-22","billTo": "ABC Car Dealer Pte Ltd","paymentStatus":"TRANSFERRED","carInfo": {"model": "Honda","make": "Jazz","year": 2021,"unitPrice": 89000},"quantity": 10}}]' \
   $ENDPOINT
```

Observe the `documentId` and `txId` returned. The `documentId` should not change while the `txId` changes. For example,

```json
{"documentId":"G3Oi84WQpSA3ppyitpjObh","txId":" L288OT1Gep19gXYpxSdTx3"}
```

The car dealer sends the `documentId` and `txId` to the car manufacturer. The car manufacturer retrieves the history for the invoice:

```bash
curl ${ENDPOINT}/history\?key=INV01 | jq
```

The response should be similar to the following:

```json
[
  {
    "blockAddress": {
      "strandId": "1HqUNaR8u8s13eFiSzGZl9",
      "sequenceNo": 19
    },
    "hash": "fTbev2Z6saXsywdS482tVs8JKUYfNGvBt+Cz0lqd+0U=",
    "data": {
      "_key": "INV01",
      "_val": "{\"date\":\"2021-05-22\",\"billTo\":\"ABC Car Dealer Pte Ltd\",\"paymentStatus\":\"PENDING\",\"carInfo\":{\"model\":\"Honda\",\"make\":\"Jazz\",\"year\":2021,\"unitPrice\":89000},\"quantity\":10}"
    },
    "metadata": {
      "id": "G3Oi84WQpSA3ppyitpjObh",
      "version": 0,
      "txTime": "2021-06-13T07:31:02.230Z",
      "txId": "HgXB2kkD0LDL2o7OIIKSXo"
    }
  },
  {
    "blockAddress": {
      "strandId": "1HqUNaR8u8s13eFiSzGZl9",
      "sequenceNo": 25
    },
    "hash": "b1UedL09zgDf4+ArLClSow6vP3RwgSh45RSk/Bd3ah4=",
    "data": {
      "_key": "INV01",
      "_val": "{\"date\":\"2021-05-22\",\"billTo\":\"ABC Car Dealer Pte Ltd\",\"paymentStatus\":\"TRANSFERRED\",\"carInfo\":{\"model\":\"Honda\",\"make\":\"Jazz\",\"year\":2021,\"unitPrice\":89000},\"quantity\":10}"
    },
    "metadata": {
      "id": "G3Oi84WQpSA3ppyitpjObh",
      "version": 1,
      "txTime": "2021-06-13T07:58:32.913Z",
      "txId": "L288OT1Gep19gXYpxSdTx3"
    }
  }
]
```

Observe that there two transactions for the `documentId` **G3Oi84WQpSA3ppyitpjObh**. Note that `documentId` can be found in `metadata.id` field. The first record is in `sequenceNo` 19 with `txId` **HgXB2kkD0LDL2o7OIIKSXo**. Remember that this transaction occurred when the car manufacturer issues the invoice. The second record is in `sequenceNo` 25 with `txId` **L288OT1Gep19gXYpxSdTx3**, which occurs when the car dealer updates the record after he transferred to the car manufacturer. Amazon QLDB has a built-in immutable journal that stores an accurate and sequenced entry of every data change.  The journal is append-only, meaning that data can only be added to a journal and it cannot be overwritten or deleted.

Based on the retrieved history information, the car manufacturer finds the correct version by matching the `documentId` and `txId` provided by the car dealer to make sure the right version of invoice was used as a reference for the payment. The car manufacturer observes that the transaction with `txId` **L288OT1Gep19gXYpxSdTx3** has the correct information and updates the `paymentStatus` of the invoice to `CONFIRMED`:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"key": "INV01","value": {"date": "2021-05-22","billTo": "ABC Car Dealer Pte Ltd","paymentStatus":"CONFIRMED","carInfo": {"model": "Honda","make": "Jazz","year": 2021,"unitPrice": 89000},"quantity": 10}}]' \
   $ENDPOINT
```

As expected, a new `txId` is generated for the same `documentId`

```json
{"documentId":"G3Oi84WQpSA3ppyitpjObh","txId":"KWBzGMEvU1VFRRsmrnT2NT"}
```

The car manufacturer also retrieves the receipt for the returned `documentId` and `txId`

```bash
curl ${ENDPOINT}/receipt-by-doc\?documentId=G3Oi84WQpSA3ppyitpjObh\&txId=KWBzGMEvU1VFRRsmrnT2NT | jq
```

Save the receipt returned. For example:

```json
{
  "LedgerName": "ledger1",
  "TableName": "invoices",
  "BlockAddress": {
    "IonText": "{strandId: \"1HqUNaR8u8s13eFiSzGZl9\", sequenceNo: 30}"
  },
  "DocumentId": "G3Oi84WQpSA3ppyitpjObh",
  "RevisionHash": "bgtd2XpnyBCmhc66wg2r/i/U2SHzrfa208rwDfM/HzE=",
  "Proof": {
    "IonText": "[{{v6woPDrnRjYg6bMW6+vT36eXavCdVBx2e8aG/Ua9fbM=}},{{s1/PHajiHv6GmA4mSbTOeGtTEAJDCJUd91hSy4Oi3sE=}},{{y/2Wb/J2016T7usgwUkjPGB5JxlwVN5tj7y1ZgRplac=}},{{7V6SplzMrFDRw6wVSfYjNl91r967AZV+YpCRzfMJm30=}},{{yWFoW31up1dPg+wcTx6NPNJ0Um4zVwO33Jqzp2HbKQw=}},{{HRdXzY5Y5hlpRCfUO2vub/BtD38oL7elmihMib5Qf08=}},{{vRa8AvPIddArNf+B9XO5bhFwRcvY5Z5WgCYC2BhYl5Y=}},{{Tc3apBD1JIJKZ1df2y4vA/nwgNcGb4xnF79QrZd1l64=}},{{XaA8oBHt014ZT4lGNbR4Lf+saUqaWpCuqqz5u4E21zg=}}]"
  },
  "LedgerDigest": {
    "Digest": "8oallXTxlJNyg1YTuzSdxCGvyfaFomTOBGTT/pLZ09c=",
    "DigestTipAddress": {
      "IonText": "{strandId:\"1HqUNaR8u8s13eFiSzGZl9\",sequenceNo:38}"
    }
  }
}
```

The car manufacturer sends the final version of the invoice with the receipt to the car dealer. Lastly, the car dealer retrieves the whole history of the invoice and validates the latest version of the invoice with the receipt. Now it's your turn to attempt to perform these operations by yourself based on the examples given in the previous steps!!

### Clean up

To remove the application:

```bash
npm run clean-cdk <account name> <region name>

# Example:
npm run clean-cdk 123456789012 ap-southeast-1
```

## End-to-End Automated Test

To run automated test, ensure that the application is deployed successfully by referring to [Deploy the application resources](#deploy-the-application-resources) section

Install dependencies

```bash
npm ci
```

Run test

```bash
APIGW_ENDPOINT=https://<unique-id>.execute-api.<region name>.amazonaws.com/prod npm test

# Example:
APIGW_ENDPOINT=https://c94rwv4we4.execute-api.ap-southeast-1.amazonaws.com/prod npm test
```
