// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as qldbRestApiService from './amazon-qldb-rest-api-service';

export class AmazonQldbRestApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new qldbRestApiService.AmazonQldbRestApiService(this, 'AmazonQldbKVS');
  }
}
