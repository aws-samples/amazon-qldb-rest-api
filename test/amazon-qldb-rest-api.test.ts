// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AmazonQldbRestApi from '../lib/amazon-qldb-rest-api-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AmazonQldbRestApi.AmazonQldbRestApiStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(matchTemplate({
    Resources: {},
  }, MatchStyle.EXACT));
});
