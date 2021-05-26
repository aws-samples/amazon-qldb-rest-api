import * as core from '@aws-cdk/core';
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as qldb from "@aws-cdk/aws-qldb";
import * as iam from '@aws-cdk/aws-iam';
import { LambdaIntegration,PassthroughBehavior,JsonSchemaVersion, JsonSchemaType, EndpointType } from '@aws-cdk/aws-apigateway';
import { Duration } from '@aws-cdk/core';

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
    
    const backend = new lambda.Function(this, "qldb-lambda-kvs", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/lambda"),
      handler: "index.main",
      timeout: Duration.seconds(10), 
      environment: {
        LEDGER_NAME: ledgerQLDB.ref,
        TABLE_NAME: TABLE_NAME
      }
    });
    
    backend.addToRolePolicy(new iam.PolicyStatement({
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
      endpointTypes: [EndpointType.REGIONAL],
      restApiName: "Amazon QLDB simple key value store Service",
      description: "This service exposes a simple key-value store interace API for Amazon QLDB through REST pattern."
    });

    // POST / - setValue - Create Single or Multiple Invoices
    const root = api.root;
    const setValueIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"setValue","payload":$input.json("$")}'
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {},
          responseParameters: {
            'method.response.header.Content-Type': "'application/json'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'true'"
          }
        },
        {
          selectionPattern: '.*Client Error.*',
          statusCode: "400",
          responseTemplates: {
              'application/json': JSON.stringify({ message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
          },
          responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'true'"
          }
        },
        {
          selectionPattern: '(\n|.)+',
          statusCode: "500",
          responseTemplates: {
              'application/json': JSON.stringify({ message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
          },
          responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'true'"
          }
        }
      ]
    });

    const setValueModel = api.addModel('SetValueModel', {
      contentType: 'application/json',
      modelName: 'SetValueModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'SetValueModel',
        type: JsonSchemaType.ARRAY,
        minItems: 1,
        maxItems: 10,
        items: {
          type: JsonSchemaType.OBJECT,
          additionalProperties: false,
          required: ['key', 'value'],
          properties: {
            key: { type: JsonSchemaType.STRING },
            value: {
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['date', 'billTo','quantity','carInfo'],
              properties: {
                date: { type: JsonSchemaType.STRING },
                billTo: { type: JsonSchemaType.STRING },
                quantity: { type: JsonSchemaType.INTEGER },
                carInfo: { 
                  type: JsonSchemaType.OBJECT,
                  additionalProperties: false,
                  required: ['model', 'make','year','unitPrice'],
                  properties: {
                    model: { type: JsonSchemaType.STRING },
                    make: { type: JsonSchemaType.STRING },
                    year: { type: JsonSchemaType.INTEGER },
                    unitPrice: { type: JsonSchemaType.NUMBER },
                  } 
                },
              }
            }
          }
        }
      }
    });

    const setValueResponseModel = api.addModel('SetValueResponseModel', {
      contentType: 'application/json',
      modelName: 'SetValueResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'SetValueResponseModel',
        type: JsonSchemaType.ARRAY
      }
    });
    
    const errorResponseModel = api.addModel('ErrorResponseModel', {
      contentType: 'application/json',
      modelName: 'ErrorResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'ErrorResponseModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          message: { type: JsonSchemaType.STRING }
        }
      }
    });

    root.addMethod('POST', setValueIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true
      },
      requestModels: {
        'application/json': setValueModel
      },
      requestValidatorOptions: {
        requestValidatorName: 'validate body and parameters',
        validateRequestBody: true,
        validateRequestParameters: true
      },
      methodResponses: [
        {
          // Successful response from the integration
          statusCode: '200',
          // Define what parameters are allowed or not
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          },
          // Validate the schema on the response
          responseModels: {
            'application/json': setValueResponseModel
          }
        },
        {
          statusCode: '400',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          },
          responseModels: {
            'application/json': errorResponseModel
          }
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          },
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]
    });
  }
}
