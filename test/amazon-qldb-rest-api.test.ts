// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as AmazonQldbRestApi from '../lib/amazon-qldb-rest-api-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AmazonQldbRestApi.AmazonQldbRestApiStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::QLDB::Ledger', {});
});
