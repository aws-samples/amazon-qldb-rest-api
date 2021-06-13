import * as core from '@aws-cdk/core';
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as qldb from "@aws-cdk/aws-qldb";
import * as iam from '@aws-cdk/aws-iam';
import { LambdaIntegration,PassthroughBehavior,JsonSchemaVersion, JsonSchemaType, EndpointType, RequestValidator } from '@aws-cdk/aws-apigateway';
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

    
    const root = api.root;

    const successResponseModel = api.addModel('SuccessResponseModel', {
      contentType: 'application/json',
      modelName: 'SuccessResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'SuccessResponseModel',
        type: JsonSchemaType.OBJECT
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

    const IntegrationResponse200 = {
      statusCode: "200",
      responseTemplates: {},
      responseParameters: {
        'method.response.header.Content-Type': "'application/json'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'true'"
      }
    };
    
    const IntegrationResponse400 = {
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
    };
    
    const IntegrationResponse500 = {
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
    };

    const methodResponse200 = {
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
        'application/json': successResponseModel
      }
    };

    const methodResponse400 = {
      statusCode: '400',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
      responseModels: {
        'application/json': errorResponseModel
      }
    }

    const methodResponse500 = {
      statusCode: '500',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
      responseModels: {
        'application/json': errorResponseModel
      }
    };

    // Cannot use requestValidationOptions more than once due to bug - https://github.com/aws/aws-cdk/issues/14684
    const validateBodyQueryStringAndHeader = new RequestValidator(this, 'validateBodyQueryStringAndHeader', {
      restApi: api, 
      requestValidatorName: 'Validate body, query string parameters, and headers',
      validateRequestBody: true,
      validateRequestParameters: true
    });

    const validateQueryStringAndHeader = new RequestValidator(this, 'validateQueryStringAndHeader', {
      restApi: api, 
      requestValidatorName: 'Validate query string parameters and headers',
      validateRequestBody: false,
      validateRequestParameters: true
    });
    
    // #### POST / - setValue - Create Single or Multiple Invoices ####
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
              required: ['date', 'billTo','paymentStatus','quantity','carInfo'],
              properties: {
                date: { type: JsonSchemaType.STRING },
                billTo: { type: JsonSchemaType.STRING },
                paymentStatus: {
                  type: JsonSchemaType.STRING,
                  enum: ['PENDING','TRANSFERRED','CONFIRMED']
                },
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

    const setValueIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"setValue","payload":$input.json("$")}'
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });
    
    root.addMethod('POST', setValueIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true
      },
      requestModels: {
        'application/json': setValueModel
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF POST / - setValue - Create Single or Multiple Invoices ####

    // #### GET / - getValue - Get Single or Multiple Invoices ####
    const getValueRequestTemplate = `
    #set($v = $util.escapeJavaScript($input.params("keys")))
    #set($valueArray = $v.split(","))
    {
       "ops": "getValue",
       "payload": [#foreach($item in $valueArray)
        "$item"#if($foreach.hasNext),#end
        #end
       ]
    }`;

    const getValueIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getValueRequestTemplate
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });   

    root.addMethod('GET', getValueIntegration, {
      requestParameters: {
        'method.request.querystring.keys': true
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF GET / - getValue - Get Single or Multiple Invoices ####

    // #### GET /metadata-by-key - getMetadataByKey - Get Metadata by Key ####
    const getMetadataByKeyResource = api.root.addResource('metadata-by-key');

    const getMetadataByKeyRequestTemplate = `
    #set($v = $util.escapeJavaScript($input.params("key")))
    {
        "ops": "getMetadataByKey",
        "payload": "$v"
    }`;

    const getMetadataByKeyIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getMetadataByKeyRequestTemplate
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });   

    getMetadataByKeyResource.addMethod('GET', getMetadataByKeyIntegration, {
      requestParameters: {
        'method.request.querystring.key': true
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF GET /metadata-by-key - getMetadataByKey - Get Metadata by Key ####

    // #### GET /metadata-by-doc - getMetadataByDoc - Get Metadata by DocId and TxId ####
    const getMetadataByDocResource = api.root.addResource('metadata-by-doc');

    const getMetadataByDocRequestTemplate = `
    #set($d = $util.escapeJavaScript($input.params("docId")))
    #set($t = $util.escapeJavaScript($input.params("txId")))
    {
        "ops": "getMetadataByDoc",
        "payload": {
          "docId": "$d",
          "txId": "$t"
        }
    }`;

    const getMetadataByDocIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getMetadataByDocRequestTemplate
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });   

    getMetadataByDocResource.addMethod('GET', getMetadataByDocIntegration, {
      requestParameters: {
        'method.request.querystring.docId': true,
        'method.request.querystring.txId': true
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF GET /metadata-by-doc - getMetadataByDoc - Get Metadata by DocId and TxId ####

    // #### POST /verify - verifyMetadata - Verify Metadata ####
    const verifyMetadataResource = api.root.addResource('verify');

    const verifyMetadataModel = api.addModel('VerifyMetadataModel', {
      contentType: 'application/json',
      modelName: 'VerifyMetadataModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'VerifyMetadataModel',  
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['BlockAddress', 'DocumentId', 'RevisionHash','LedgerDigest'],
        properties: {
            LedgerName: { type: JsonSchemaType.STRING },
            TableName: { type: JsonSchemaType.STRING },
            BlockAddress: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['IonText'],
              properties: {
                IonText: { type: JsonSchemaType.STRING },
              }
            },
            DocumentId: { 
              type: JsonSchemaType.STRING,
              minLength: 22,
              maxLength: 22, 
            },
            RevisionHash: { type: JsonSchemaType.STRING },
            Proof: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['IonText'],
              properties: {
                IonText: { type: JsonSchemaType.STRING },
              }
            },
            LedgerDigest: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['Digest','DigestTipAddress'],
              properties: {
                Digest: { type: JsonSchemaType.STRING },
                DigestTipAddress: {
                  type: JsonSchemaType.OBJECT,
                  additionalProperties: false,
                  required: ['IonText'],
                  properties: {
                    IonText: { type: JsonSchemaType.STRING },
                  }
                }
              }
            },
          }
      }
    });

    const verifyMetadataIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"verifyMetadata","payload":$input.json("$")}'
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });
    
    verifyMetadataResource.addMethod('POST', verifyMetadataIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true
      },
      requestModels: {
        'application/json': verifyMetadataModel
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF POST /verify - verifyMetadata - Verify Metadata ####

    // #### POST /revision - getRevisionByMetadata - Get Document Revision by Metadata ####
    const getRevisionByMetadataResource = api.root.addResource('revision');

    const getRevisionByMetadataModel = api.addModel('GetRevisionByMetadataModel', {
      contentType: 'application/json',
      modelName: 'GetRevisionByMetadataModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'GetRevisionByMetadataModel',  
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['BlockAddress', 'DocumentId','LedgerDigest'],
        properties: {
            LedgerName: { type: JsonSchemaType.STRING },
            TableName: { type: JsonSchemaType.STRING },
            BlockAddress: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['IonText'],
              properties: {
                IonText: { type: JsonSchemaType.STRING },
              }
            },
            DocumentId: { 
              type: JsonSchemaType.STRING,
              minLength: 22,
              maxLength: 22, 
            },
            RevisionHash: { type: JsonSchemaType.STRING },
            Proof: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['IonText'],
              properties: {
                IonText: { type: JsonSchemaType.STRING },
              }
            },
            LedgerDigest: { 
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['DigestTipAddress'],
              properties: {
                Digest: { type: JsonSchemaType.STRING },
                DigestTipAddress: {
                  type: JsonSchemaType.OBJECT,
                  additionalProperties: false,
                  required: ['IonText'],
                  properties: {
                    IonText: { type: JsonSchemaType.STRING },
                  }
                }
              }
            },
          }
      }
    });

    const getRevisionByMetadataIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"getDocumentRevisionByMetadata","payload":$input.json("$")}'
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });
    
    getRevisionByMetadataResource.addMethod('POST', getRevisionByMetadataIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true
      },
      requestModels: {
        'application/json': getRevisionByMetadataModel
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### END OF /revision - getRevisionByMetadata - Get Document Revision by Metadata ####

    // #### GET /history - history - Get History for Invoice ####
    const getHistoryResource = api.root.addResource('history');

    const getHistoryRequestTemplate = `
    #set($v = $util.escapeJavaScript($input.params("key")))
    {
        "ops": "getHistory",
        "payload": "$v"
    }`;

    const getHistoryIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getHistoryRequestTemplate
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [ IntegrationResponse200, IntegrationResponse400, IntegrationResponse500 ]
    });   

    getHistoryResource.addMethod('GET', getHistoryIntegration, {
      requestParameters: {
        'method.request.querystring.key': true
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [ methodResponse200, methodResponse400, methodResponse500]
    });
    // #### GET /history - history - Get History for Invoice ####
  }
}
