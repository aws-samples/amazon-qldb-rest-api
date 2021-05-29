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

`./devops/build-lambda.sh`

2. Bootstrap account with CDK resources

`./devops/cdk-bootstrap-to.sh 451823959762 ap-southeast-1`

3. Deploy all to the account of choice

`./devops/cdk-deploy-to.sh 451823959762 ap-southeast-1`

4. Clean up

`./devops/cdk-clean-from.sh 451823959762 ap-southeast-1`


## Testing

### E2E Automated Test

Install dependencies

```bash
npm ci
```

Set API endpoint URL in line 1 of [test/e2e.test.ts](test/e2e.test.ts)

**Note: Still trying to figure out how to inject environment variable to Jest**

```js
//Insert the API Gateway Endpoint URL
const APIGW_ENDPOINT= process.env.APIGW_ENDPOINT || 'https://1yqzhex0t1.execute-api.ap-southeast-1.amazonaws.com/prod';
```

Run test

```bash
npm test
```

### Manual Testing Example

```bash
ENDPOINT=https://31pycb0sy6.execute-api.ap-southeast-1.amazonaws.com/prod

curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"key": "INVOICE194","value": {"date": "2021-05-22","billTo": "ABC Car Dealer Pte Ltd","carInfo": {"model": "Honda","make": "Jazz","year": 2021,"unitPrice": 89000},"quantity": 10}},{"key": "INVOICE114","value": {"date": "2021-05-22","billTo": "XYZ Car Dealer Pte Ltd","carInfo": {"model": "Honda","make": "Brio","year": 2019,"unitPrice": 50000},"quantity": 14}}]' \
   $ENDPOINT

curl $ENDPOINT/?keys=TEST10001,TEST10012
```