#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ServerlessRestApiStack } from "../lib/serverlessRestApiStack";

const app = new cdk.App();

new ServerlessRestApiStack(app, "ServerlessRestApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
