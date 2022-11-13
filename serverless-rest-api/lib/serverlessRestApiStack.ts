import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

import { ProductRestApi } from "./productRestApi";

export class ServerlessRestApiStack extends cdk.Stack {
  public api: apigateway.LambdaRestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      writeCapacity: 2,
      readCapacity: 2,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new ProductRestApi(this, "ProductApi", {
      tableName: productsTable.tableName,
    });
    productsTable.grantReadWriteData(api.lambda);
  }
}
