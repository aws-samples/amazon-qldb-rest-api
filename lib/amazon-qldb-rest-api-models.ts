// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  JsonSchemaVersion,
  JsonSchemaType,
  ModelOptions,
} from 'aws-cdk-lib/aws-apigateway';

const SetValueModel: ModelOptions = {
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
        key: {
          type: JsonSchemaType.STRING,
        },
        value: {
          type: JsonSchemaType.OBJECT,
          additionalProperties: false,
          required: ['date', 'billTo', 'paymentStatus', 'quantity', 'carInfo'],
          properties: {
            date: {
              type: JsonSchemaType.STRING,
            },
            billTo: {
              type: JsonSchemaType.STRING,
            },
            paymentStatus: {
              type: JsonSchemaType.STRING,
              enum: ['PENDING', 'TRANSFERRED', 'CONFIRMED'],
            },
            quantity: {
              type: JsonSchemaType.INTEGER,
            },
            carInfo: {
              type: JsonSchemaType.OBJECT,
              additionalProperties: false,
              required: ['model', 'make', 'year', 'unitPrice'],
              properties: {
                model: {
                  type: JsonSchemaType.STRING,
                },
                make: {
                  type: JsonSchemaType.STRING,
                },
                year: {
                  type: JsonSchemaType.INTEGER,
                },
                unitPrice: {
                  type: JsonSchemaType.NUMBER,
                },
              },
            },
          },
        },
      },
    },
  },
};

const VerifyLedgerMetadataModel: ModelOptions = {
  contentType: 'application/json',
  modelName: 'verifyLedgerMetadataModel',
  schema: {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'verifyLedgerMetadataModel',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['BlockAddress', 'DocumentId', 'RevisionHash', 'LedgerDigest'],
    properties: {
      LedgerName: { type: JsonSchemaType.STRING },
      TableName: { type: JsonSchemaType.STRING },
      BlockAddress: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['IonText'],
        properties: {
          IonText: { type: JsonSchemaType.STRING },
        },
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
        },
      },
      LedgerDigest: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['Digest', 'DigestTipAddress'],
        properties: {
          Digest: { type: JsonSchemaType.STRING },
          DigestTipAddress: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            required: ['IonText'],
            properties: {
              IonText: { type: JsonSchemaType.STRING },
            },
          },
        },
      },
    },
  },
};

const GetRevisionByMetadataModel: ModelOptions = {
  contentType: 'application/json',
  modelName: 'GetRevisionByMetadataModel',
  schema: {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'GetRevisionByMetadataModel',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['BlockAddress', 'DocumentId', 'LedgerDigest'],
    properties: {
      LedgerName: { type: JsonSchemaType.STRING },
      TableName: { type: JsonSchemaType.STRING },
      BlockAddress: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['IonText'],
        properties: {
          IonText: { type: JsonSchemaType.STRING },
        },
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
        },
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
            },
          },
        },
      },
    },
  },
};

const VerifyDocumentRevisionHashModel: ModelOptions = {
  contentType: 'application/json',
  modelName: 'verifyDocumentRevisionHashModel',
  schema: {
    schema: JsonSchemaVersion.DRAFT4,
    title: 'verifyDocumentRevisionHashModel',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['hash', 'data', 'metadata'],
    properties: {
      blockAddress: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['strandId', 'sequenceNo'],
        properties: {
          strandId: { type: JsonSchemaType.STRING },
          sequenceNo: { type: JsonSchemaType.INTEGER },
        },
      },
      hash: {
        type: JsonSchemaType.STRING,
      },
      data: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['_k', 'date', 'billTo', 'paymentStatus', 'quantity', 'carInfo'],
        properties: {
          _k: { type: JsonSchemaType.STRING },
          date: {
            type: JsonSchemaType.STRING,
          },
          billTo: {
            type: JsonSchemaType.STRING,
          },
          paymentStatus: {
            type: JsonSchemaType.STRING,
            enum: ['PENDING', 'TRANSFERRED', 'CONFIRMED'],
          },
          quantity: {
            type: JsonSchemaType.INTEGER,
          },
          carInfo: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            required: ['model', 'make', 'year', 'unitPrice'],
            properties: {
              model: {
                type: JsonSchemaType.STRING,
              },
              make: {
                type: JsonSchemaType.STRING,
              },
              year: {
                type: JsonSchemaType.INTEGER,
              },
              unitPrice: {
                type: JsonSchemaType.NUMBER,
              },
            },
          },
        },
      },
      metadata: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ['id', 'version', 'txTime', 'txId'],
        properties: {
          id: { type: JsonSchemaType.STRING },
          version: { type: JsonSchemaType.INTEGER },
          txTime: { type: JsonSchemaType.STRING },
          txId: { type: JsonSchemaType.STRING },
        },
      },
    },
  },
};

export {
  SetValueModel,
  VerifyLedgerMetadataModel,
  GetRevisionByMetadataModel,
  VerifyDocumentRevisionHashModel,
};
