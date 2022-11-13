# Serverless REST API using API Gateway + Lambda + DynamoDB

This is a simple example of using CDK to create a serverless REST API:

![Architecture diagram](./docs/diagram.png)

Infrastructure is defined in [/lib](./lib) and the API logic can be found in [/src/api.ts](./src/api.ts).

## Running the example

Execute `cdk deploy` to deploy the stack. Once the stack is deployed, CDK will output the URL for the API.
