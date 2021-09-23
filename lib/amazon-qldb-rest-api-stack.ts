// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as qldbRestApiService from './amazon-qldb-rest-api-service';

export class AmazonQldbRestApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new qldbRestApiService.AmazonQldbRestApiService(this, 'AmazonQldbKVS');
  }
}
