import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

import * as path from "path";

export class ApiGwLambdaDynamodbRestApiStack extends cdk.Stack {
  public api: apigateway.LambdaRestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "productsTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      writeCapacity: 2,
      readCapacity: 2,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiHandler = new NodejsFunction(this, "apiLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "..", "src", "lambda", "api.ts"),
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_DAY,
      bundling: {
        minify: true,
      },
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });
    productsTable.grantReadWriteData(apiHandler);

    this.api = new apigateway.LambdaRestApi(this, "productApi", {
      handler: apiHandler,
      proxy: false,
    });

    const v1 = this.api.root.addResource("v1");

    const products = v1.addResource("products");
    products.addMethod("GET");
    products.addMethod("POST");

    const product = products.addResource("{product}");
    product.addMethod("GET");
    product.addMethod("DELETE");
  }
}
