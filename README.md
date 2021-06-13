# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## Devops

1. Build lambda

```bash
npm run build-lambda
```

2. Bootstrap account with CDK resources (need to be done only once)

```bash
npm run bootstrap 123456789012 ap-southeast-1
```

3. Deploy all to the account of choice

```bash
LEDGER_NAME=ledger1 TABLE_NAME=invoices npm run deploy-cdk 451823959762 ap-southeast-1
```

4. Clean up

```bash
npm run clean-cdk 451823959762 ap-southeast-1
```

## Testing

### E2E Automated Test

Install dependencies

```bash
npm ci
```

Run test

```bash
# Change the API Gateway Endpoint URL
APIGW_ENDPOINT=https://qq9mkwirmd.execute-api.ap-southeast-1.amazonaws.com/prod npm test
```

### Manual Testing Example

Set the endpoint

```bash
ENDPOINT=https://qq9mkwirmd.execute-api.ap-southeast-1.amazonaws.com/prod
```

Create two invoices, `INVOICE001` and `INVOICE002`

```bash
$ curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"key": "INVOICE001","value": {"date": "2021-05-22","billTo": "ABC Car Dealer Pte Ltd","paymentStatus": "PENDING","carInfo": {"model": "Honda","make": "Jazz","year": 2021,"unitPrice": 89000},"quantity": 10}},{"key": "INVOICE002","value": {"date": "2021-05-22","billTo": "XYZ Car Dealer Pte Ltd","paymentStatus": "PENDING","carInfo": {"model": "Honda","make": "Brio","year": 2019,"unitPrice": 50000},"quantity": 14}}]' \
   $ENDPOINT

# Take note of the `documentId` and `txId` that are returned in the response e.g.
[[{"documentId":"LNQETY3bjjRJRHUOlZITtI","txId":"2JimeUCJ4KQLODhzpy1vaY"}],[{"documentId":"1XoYwJzFoVZ4Gb8wMC5tOS","txId":"2JimeUCJ4KQLODhzpy1vaY"}]]
```

Retrieve the previously created invoices

```bash
$ curl ${ENDPOINT}/\?keys=INVOICE001,INVOICE002

# Example response
[{"date":"2021-05-22","billTo":"ABC Car Dealer Pte Ltd","paymentStatus": "PENDING","carInfo":{"model":"Honda","make":"Jazz","year":2021,"unitPrice":89000},"quantity":10},{"date":"2021-05-22","billTo":"XYZ Car Dealer Pte Ltd","paymentStatus": "PENDING","carInfo":{"model":"Honda","make":"Brio","year":2019,"unitPrice":50000},"quantity":14}]
```

Get invoice `INVOICE001`'s metadata by key or by `documentId` and `txId`

```bash
$ curl ${ENDPOINT}/metadata-by-key\?key=INVOICE001

$ curl ${ENDPOINT}/metadata-by-doc\?docId=LNQETY3bjjRJRHUOlZITtI\&txId=2JimeUCJ4KQLODhzpy1vaY

# Take note of the metadata for verification purpose
{"LedgerName":"keyvaluestore","TableName":"keyvaluedata","BlockAddress":{"IonText":"{strandId: \"Dp04YYoTPCZ4Tu0fgUas6b\", sequenceNo: 90}"},"DocumentId":"LNQETY3bjjRJRHUOlZITtI","RevisionHash":"tS+8aK9q4O8z6UpmUc/XMYhQYo/qy2YDHC+mxKWKgvo=","Proof":{"IonText":"[{{G1/kFcc0BTpQMPtjymwxdXIqLct4XiBSW1bbRrRfWJo=}},{{s50Ex4gcOgimMf84bHwPQz2bJ9Gb/vj3wiPgQHCDrBs=}},{{ZaWBmeIAbFQbx8Gvn1ctyXye6YXpvKhQ0Wp139f54t8=}},{{thpqVHO8pIaIOfHcQSg+Pr8Ov833+4fTiADA2fj3+70=}},{{oovDHkBCwSG+LboyWcWzVqy2xCLCUEZBKU2jqKoMdSE=}},{{hthSOsAjMKF0sMfynt9YTuwpuXwP0c6rAb5pg0p44IA=}},{{+vWznEGRlfu/Kc4Q5AylVSuylJSqMtvO+hUpijHVZ0g=}},{{xNTTjhOCAFHnLOTDTeH7bMUt6dlvUDSaBIHYcFOyY3w=}},{{u1hrObLyR020Wv5e6vOPLTFNjjw8Mkbf0BvTQmA96QI=}}]"},"LedgerDigest":{"Digest":"QDYY9bLz6v/PInJ6FrqPE0dalVYRealszt9DyyRDMA0=","DigestTipAddress":{"IonText":"{strandId:\"Dp04YYoTPCZ4Tu0fgUas6b\",sequenceNo:91}"}}}
```

Verify `INVOICE001`'s metadata

```bash
$ curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"LedgerName":"keyvaluestore","TableName":"keyvaluedata","BlockAddress":{"IonText":"{strandId: \"Dp04YYoTPCZ4Tu0fgUas6b\", sequenceNo: 90}"},"DocumentId":"LNQETY3bjjRJRHUOlZITtI","RevisionHash":"tS+8aK9q4O8z6UpmUc/XMYhQYo/qy2YDHC+mxKWKgvo=","Proof":{"IonText":"[{{G1/kFcc0BTpQMPtjymwxdXIqLct4XiBSW1bbRrRfWJo=}},{{s50Ex4gcOgimMf84bHwPQz2bJ9Gb/vj3wiPgQHCDrBs=}},{{ZaWBmeIAbFQbx8Gvn1ctyXye6YXpvKhQ0Wp139f54t8=}},{{thpqVHO8pIaIOfHcQSg+Pr8Ov833+4fTiADA2fj3+70=}},{{oovDHkBCwSG+LboyWcWzVqy2xCLCUEZBKU2jqKoMdSE=}},{{hthSOsAjMKF0sMfynt9YTuwpuXwP0c6rAb5pg0p44IA=}},{{+vWznEGRlfu/Kc4Q5AylVSuylJSqMtvO+hUpijHVZ0g=}},{{xNTTjhOCAFHnLOTDTeH7bMUt6dlvUDSaBIHYcFOyY3w=}},{{u1hrObLyR020Wv5e6vOPLTFNjjw8Mkbf0BvTQmA96QI=}}]"},"LedgerDigest":{"Digest":"QDYY9bLz6v/PInJ6FrqPE0dalVYRealszt9DyyRDMA0=","DigestTipAddress":{"IonText":"{strandId:\"Dp04YYoTPCZ4Tu0fgUas6b\",sequenceNo:91}"}}}' \
  ${ENDPOINT}/verify

# Example response
{"result":"valid"}
```

View `INVOICE001`'s history

```bash
$ curl ${ENDPOINT}/history\?keys=INVOICE001

# Example response
[{"blockAddress":{"strandId":"Dp04YYoTPCZ4Tu0fgUas6b","sequenceNo":90},"hash":"tS+8aK9q4O8z6UpmUc/XMYhQYo/qy2YDHC+mxKWKgvo=","data":{"_key":"INVOICE001","_val":"{\"date\":\"2021-05-22\",\"billTo\":\"ABC Car Dealer Pte Ltd\",\"paymentStatus\": \"PENDING\",\"carInfo\":{\"model\":\"Honda\",\"make\":\"Jazz\",\"year\":2021,\"unitPrice\":89000},\"quantity\":10}"},"metadata":{"id":"LNQETY3bjjRJRHUOlZITtI","version":0,"txTime":"2021-05-31T06:44:11.435Z","txId":"2JimeUCJ4KQLODhzpy1vaY"}}]
```
