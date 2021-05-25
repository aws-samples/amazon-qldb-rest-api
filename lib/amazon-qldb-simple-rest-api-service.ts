import * as core from '@aws-cdk/core';
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as qldb from "@aws-cdk/aws-qldb";
import * as iam from '@aws-cdk/aws-iam';

const LEDGER_NAME = process.env.LEDGER_NAME ? process.env.LEDGER_NAME : "keyvaluestore";
const TABLE_NAME = process.env.TABLE_NAME ? process.env.TABLE_NAME : "keyvaluedata";
const AWS_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
const AWS_REGION = process.env.CDK_DEFAULT_REGION;

export class AmazonQldbSimpleRestApiService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const ledgerQLDB = new qldb.CfnLedger(this, 'qldb-ledger-kvs', {
      name: LEDGER_NAME,
      permissionsMode:"ALLOW_ALL",
      deletionProtection: false,
      tags: [{
        key:"QLDBRESTAPI",
        value: "QLDBLEDGER"
      }]
    })
    
    const handler = new lambda.Function(this, "qldb-lambda-kvs", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/lambda"),
      handler: "index.main",
      environment: {
        LEDGER_NAME: ledgerQLDB.ref,
        TABLE_NAME: TABLE_NAME
      }
    });
    
    handler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:qldb:${AWS_REGION}:${AWS_ACCOUNT}:ledger/${ledgerQLDB.ref}`],
      actions: ["qldb:ExecuteStatement",
                "qldb:GetBlock",
                "qldb:ListLedgers",
                "qldb:GetRevision",
                "qldb:DescribeLedger",
                "qldb:SendCommand",
                "qldb:GetDigest"]
    }));
    
    const api = new apigateway.RestApi(this, "qldb-rest-api-kvs", {
      restApiName: "Amazon QLDB simple key value store Service",
      description: "This service exposes a simple key-value store interace API for Amazon QLDB through REST pattern."
    });

    const getValueIntegration = new apigateway.LambdaIntegration(handler);
    const setValueIntegration = new apigateway.LambdaIntegration(handler);

    // GET: https://apigw.com/2934923649
    // POST: https://apigw.com/2934923649 {"someValypropo": "value"}
    const key = api.root.addResource('{key}');
    key.addMethod("GET", getValueIntegration); // GET value by key/
    key.addMethod("POST", setValueIntegration); // POST value with key (create or update)/
    
  }

    private newMethod(): string {
        return ", ";
    }
}
