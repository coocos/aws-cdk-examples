import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

import * as path from "path";

export interface ProductRestApiProps {
  tableName: string;
}

export class ProductRestApi extends Construct {
  public lambda: any;

  constructor(scope: Construct, id: string, props: ProductRestApiProps) {
    super(scope, id);

    this.lambda = new NodejsFunction(this, "ApiLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, "..", "src", "api.ts"),
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_DAY,
      bundling: {
        minify: true,
      },
      environment: {
        TABLE_NAME: props.tableName,
      },
    });

    const api = new apigateway.LambdaRestApi(this, "ProductApiGateway", {
      handler: this.lambda,
      proxy: false,
    });

    const v1 = api.root.addResource("v1");
    const products = v1.addResource("products");
    products.addMethod("GET");
    products.addMethod("POST");
    const product = products.addResource("{product}");
    product.addMethod("GET");
    product.addMethod("DELETE");
  }
}
