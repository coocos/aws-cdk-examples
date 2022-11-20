import * as path from "path";

import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
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

    const websocketHandler = new NodejsFunction(this, "WebSocketHandler", {
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

    const bucket = new s3.Bucket(this, "TargetBucket", {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const bucketHandler = new NodejsFunction(this, "BucketHandler", {
      entry: path.join(__dirname, "..", "src", "bucket.ts"),
      bundling: {
        minify: true,
      },
      environment: {
        API_ENDPOINT: devStage.callbackUrl,
        CONNECTIONS_TABLE: connectionsTable.tableName,
      },
      reservedConcurrentExecutions: 1,
    });
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(bucketHandler)
    );
    api.grantManageConnections(bucketHandler);
    connectionsTable.grantReadWriteData(bucketHandler);

    new CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });

    new CfnOutput(this, "WebsocketApiUrl", {
      value: devStage.url,
    });
  }
}
