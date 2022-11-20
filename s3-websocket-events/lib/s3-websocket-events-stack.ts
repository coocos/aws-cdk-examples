import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CfnOutput } from "aws-cdk-lib";

export class S3WebsocketEventsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionsTable = new dynamodb.Table(this, "ConnectionsTable", {
      partitionKey: {
        name: "Type",
        type: dynamodb.AttributeType.STRING,
      },
      writeCapacity: 1,
      readCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const websocketHandler = new NodejsFunction(this, "ConnectHandler", {
      entry: path.join(__dirname, "..", "src", "websocket.ts"),
      bundling: {
        minify: true,
      },
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
    });
    connectionsTable.grantReadWriteData(websocketHandler);

    const api = new apigwv2.WebSocketApi(this, "WebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          websocketHandler
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          websocketHandler
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DefaultIntegration",
          websocketHandler
        ),
      },
    });
    const devStage = new apigwv2.WebSocketStage(this, "WebSocketApiDevStage", {
      stageName: "dev",
      webSocketApi: api,
      autoDeploy: true,
    });

    new CfnOutput(this, "WebsocketApiUrl", {
      value: devStage.url,
    });

    new CfnOutput(this, "WebSocketApiCallbackUrl", {
      value: devStage.callbackUrl,
    });
  }
}
