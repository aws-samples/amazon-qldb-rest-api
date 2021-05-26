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