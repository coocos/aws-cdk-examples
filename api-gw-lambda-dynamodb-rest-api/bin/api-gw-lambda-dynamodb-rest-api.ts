#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiGwLambdaDynamodbRestApiStack } from "../lib/api-gw-lambda-dynamodb-rest-api-stack";

const app = new cdk.App();

new ApiGwLambdaDynamodbRestApiStack(app, "ApiGwLambdaDynamodbRestApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
