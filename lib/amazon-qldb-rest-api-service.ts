// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as qldb from 'aws-cdk-lib/aws-qldb';
import * as iam from 'aws-cdk-lib/aws-iam';
import {
  LambdaIntegration,
  PassthroughBehavior,
  JsonSchemaVersion,
  JsonSchemaType,
  EndpointType,
  RequestValidator,
} from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';

import {
  SetValueModel,
  VerifyLedgerMetadataModel,
  GetRevisionByMetadataModel,
  VerifyDocumentRevisionHashModel,
} from './amazon-qldb-rest-api-models';

const LEDGER_NAME = process.env.LEDGER_NAME ? process.env.LEDGER_NAME : 'keyvaluestore';
const TABLE_NAME = process.env.TABLE_NAME ? process.env.TABLE_NAME : 'keyvaluedata';
const AWS_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
const AWS_REGION = process.env.CDK_DEFAULT_REGION;

export class AmazonQldbRestApiService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const ledgerQLDB = new qldb.CfnLedger(this, 'qldb-ledger-kvs', {
      name: LEDGER_NAME,
      permissionsMode: 'STANDARD',
      deletionProtection: false,
      tags: [{
        key: 'QLDBRESTAPI',
        value: 'QLDBLEDGER',
      }],
    });

    const backend = new lambda.Function(this, 'qldb-lambda-kvs', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/lambda'),
      handler: 'index.main',
      timeout: Duration.seconds(10),
      environment: {
        LEDGER_NAME: ledgerQLDB.ref,
        TABLE_NAME,
      },
    });

    backend.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:qldb:${AWS_REGION}:${AWS_ACCOUNT}:ledger/${ledgerQLDB.ref}`],
      actions: [
        'qldb:GetBlock',
        'qldb:ListLedgers',
        'qldb:GetRevision',
        'qldb:DescribeLedger',
        'qldb:SendCommand',
        'qldb:GetDigest',
      ],
    }));

    backend.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:qldb:${AWS_REGION}:${AWS_ACCOUNT}:ledger/${ledgerQLDB.ref}/table/*`],
      actions: [
        'qldb:PartiQLCreateTable',
        'qldb:PartiQLCreateIndex',
        'qldb:PartiQLInsert',
        'qldb:PartiQLUpdate',
        'qldb:PartiQLSelect',
        'qldb:PartiQLHistoryFunction',
      ],
    }));

    backend.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:qldb:${AWS_REGION}:${AWS_ACCOUNT}:ledger/${ledgerQLDB.ref}/information_schema/user_tables`],
      actions: [
        'qldb:PartiQLSelect',
      ],
    }));

    const api = new apigateway.RestApi(this, 'qldb-rest-api-kvs', {
      endpointTypes: [EndpointType.REGIONAL],
      deployOptions: {
        methodOptions: {
          '/*/*': { // This special path applies to all resource paths and all HTTP methods
            throttlingRateLimit: 10,
            throttlingBurstLimit: 50,
          },
        },
      },
      restApiName: 'Amazon QLDB key value store Service',
      description: 'This service exposes a key-value store interface API for Amazon QLDB through REST pattern.',
    });

    const { root } = api;

    const successResponseModel = api.addModel('SuccessResponseModel', {
      contentType: 'application/json',
      modelName: 'SuccessResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'SuccessResponseModel',
        type: JsonSchemaType.OBJECT,
      },
    });

    const errorResponseModel = api.addModel('ErrorResponseModel', {
      contentType: 'application/json',
      modelName: 'ErrorResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'ErrorResponseModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          message: { type: JsonSchemaType.STRING },
        },
      },
    });

    const IntegrationResponse200 = {
      statusCode: '200',
      responseTemplates: {},
      responseParameters: {
        'method.response.header.Content-Type': "'application/json'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'true'",
      },
    };

    const IntegrationResponse400 = {
      selectionPattern: '.*Client Error.*',
      statusCode: '400',
      responseTemplates: {
        'application/json': JSON.stringify({ message: "$util.escapeJavaScript($input.path('$.errorMessage'))" }),
      },
      responseParameters: {
        'method.response.header.Content-Type': "'application/json'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'true'",
      },
    };

    const IntegrationResponse500 = {
      selectionPattern: '(\n|.)+',
      statusCode: '500',
      responseTemplates: {
        'application/json': JSON.stringify({ message: "$util.escapeJavaScript($input.path('$.errorMessage'))" }),
      },
      responseParameters: {
        'method.response.header.Content-Type': "'application/json'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'true'",
      },
    };

    const methodResponse200 = {
      // Successful response from the integration
      statusCode: '200',
      // Define what parameters are allowed or not
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
      },
      // Validate the schema on the response
      responseModels: {
        'application/json': successResponseModel,
      },
    };

    const methodResponse400 = {
      statusCode: '400',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
      },
      responseModels: {
        'application/json': errorResponseModel,
      },
    };

    const methodResponse500 = {
      statusCode: '500',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
      },
      responseModels: {
        'application/json': errorResponseModel,
      },
    };

    // Cannot use requestValidationOptions more than once due to bug - https://github.com/aws/aws-cdk/issues/14684
    const validateBodyQueryStringAndHeader = new RequestValidator(this, 'validateBodyQueryStringAndHeader', {
      restApi: api,
      requestValidatorName: 'Validate body, query string parameters, and headers',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    const validateQueryStringAndHeader = new RequestValidator(this, 'validateQueryStringAndHeader', {
      restApi: api,
      requestValidatorName: 'Validate query string parameters and headers',
      validateRequestBody: false,
      validateRequestParameters: true,
    });

    // ## POST / - setValue - Create Single or Multiple Invoices ##
    const setValueModel = api.addModel('SetValueModel', SetValueModel);

    const setValueIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"setValue","payload":$input.json("$")}',
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500,
      ],
    });

    root.addMethod('POST', setValueIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true,
      },
      requestModels: {
        'application/json': setValueModel,
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF POST / - setValue - Create Single or Multiple Invoices ##

    // ## GET / - getValue - Get Single or Multiple Invoices ##
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
        'application/json': getValueRequestTemplate,
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    root.addMethod('GET', getValueIntegration, {
      requestParameters: {
        'method.request.querystring.keys': true,
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF GET / - getValue - Get Single or Multiple Invoices ##

    // ## GET /receipt-by-key - getMetadataByKey - Get Metadata by Key ##
    const getMetadataByKeyResource = api.root.addResource('receipt-by-key');

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
        'application/json': getMetadataByKeyRequestTemplate,
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    getMetadataByKeyResource.addMethod('GET', getMetadataByKeyIntegration, {
      requestParameters: {
        'method.request.querystring.key': true,
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF GET /receipt-by-key - getMetadataByKey - Get Metadata by Key ##

    // ## GET /receipt-by-doc - getMetadataByDoc - Get Metadata by documentId and TxId ##
    const getMetadataByDocResource = api.root.addResource('receipt-by-doc');

    const getMetadataByDocRequestTemplate = `
    #set($d = $util.escapeJavaScript($input.params("documentId")))
    #set($t = $util.escapeJavaScript($input.params("txId")))
    {
        "ops": "getMetadataByDoc",
        "payload": {
          "documentId": "$d",
          "txId": "$t"
        }
    }`;

    const getMetadataByDocIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getMetadataByDocRequestTemplate,
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    getMetadataByDocResource.addMethod('GET', getMetadataByDocIntegration, {
      requestParameters: {
        'method.request.querystring.documentId': true,
        'method.request.querystring.txId': true,
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF GET /receipt-by-doc - getMetadataByDoc - Get Metadata by documentId and TxId ##

    // ## POST /verify-receipt - verifyLedgerMetadata - Verify Receipt ##
    const verifyLedgerMetadataResource = api.root.addResource('verify-receipt');

    const verifyLedgerMetadataModel = api.addModel('verifyLedgerMetadataModel', VerifyLedgerMetadataModel);

    const verifyLedgerMetadataIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"verifyLedgerMetadata","payload":$input.json("$")}',
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    verifyLedgerMetadataResource.addMethod('POST', verifyLedgerMetadataIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true,
      },
      requestModels: {
        'application/json': verifyLedgerMetadataModel,
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF POST /verify-receipt - verifyLedgerMetadata - Verify Receipt ##

    // ## POST /retrieve-doc-revision - getRevisionByMetadata - Get Document Revision by Metadata ##
    const getRevisionByMetadataResource = api.root.addResource('retrieve-doc-revision');

    const getRevisionByMetadataModel = api.addModel('GetRevisionByMetadataModel', GetRevisionByMetadataModel);

    const getRevisionByMetadataIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"getDocumentRevisionByLedgerMetadata","payload":$input.json("$")}',
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    getRevisionByMetadataResource.addMethod('POST', getRevisionByMetadataIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true,
      },
      requestModels: {
        'application/json': getRevisionByMetadataModel,
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF /retrieve-doc-revision - getRevisionByMetadata - Get Document Revision by Metadata ##

    // ## GET /history - history - Get History for Invoice ##
    const getHistoryResource = api.root.addResource('history');

    const getHistoryRequestTemplate = `
    #set($k = $util.escapeJavaScript($input.params("key")))
    #set($f = $util.escapeJavaScript($input.params("from")))
    #set($t = $util.escapeJavaScript($input.params("to")))
    {
        "ops": "getHistory",
        "payload": {
          "key": "$k",
          "from": "$f",
          "to": "$t"
        }
    }`;

    const getHistoryIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': getHistoryRequestTemplate,
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    getHistoryResource.addMethod('GET', getHistoryIntegration, {
      requestParameters: {
        'method.request.querystring.key': true,
        'method.request.querystring.from': false,
        'method.request.querystring.to': false,
      },
      requestValidator: validateQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF GET /history - history - Get History for Invoice ##

    // ## POST /verify-doc-revision - verifyDocumentRevisionHash - Verify Doc Revision Hash ##
    const verifyDocumentRevisionHashResource = api.root.addResource('verify-doc-revision');

    const verifyDocumentRevisionHashModel = api.addModel('verifyDocumentRevisionHashModel',
      VerifyDocumentRevisionHashModel);

    const verifyDocumentRevisionHashIntegration = new LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {},
      allowTestInvoke: true,
      requestTemplates: {
        'application/json': '{"ops":"verifyDocumentRevisionHash","payload":$input.json("$")}',
      },
      passthroughBehavior: PassthroughBehavior.NEVER,
      integrationResponses: [
        IntegrationResponse200,
        IntegrationResponse400,
        IntegrationResponse500],
    });

    verifyDocumentRevisionHashResource.addMethod('POST', verifyDocumentRevisionHashIntegration, {
      requestParameters: {
        'method.request.header.Content-Type': true,
      },
      requestModels: {
        'application/json': verifyDocumentRevisionHashModel,
      },
      requestValidator: validateBodyQueryStringAndHeader,
      methodResponses: [methodResponse200, methodResponse400, methodResponse500],
    });
    // ## END OF POST /verify-doc-revision - verifyDocumentRevisionHash - Verify Doc Revision Hash ##
  }
}
