import * as cdk from '@aws-cdk/core';
import * as qldb_rest_api_service from './amazon-qldb-simple-rest-api-service';

export class AmazonQldbSimpleRestApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    new qldb_rest_api_service.AmazonQldbSimpleRestApiService(this, 'AmazonQldbKVS');
    
  }
}

