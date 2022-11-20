import { Context, S3CreateEvent } from "aws-lambda";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

import * as repository from "./repository";

const API_ENDPOINT = process.env.API_ENDPOINT;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

export async function handler(event: S3CreateEvent, context: Context) {
  if (!CONNECTIONS_TABLE) {
    console.log("DynamoDB table name is not set");
    return;
  }
  if (!API_ENDPOINT) {
    console.log("API Gateway management endpoint is not set");
    return;
  }
  const createdObjects = event.Records.map((record) => ({
    bucket: record.s3.bucket.name,
    object: record.s3.object.key,
  }));

  const apiClient = new ApiGatewayManagementApiClient({
    endpoint: API_ENDPOINT,
  });
  for (let connection of await repository.listConnections(CONNECTIONS_TABLE)) {
    await apiClient.send(
      new PostToConnectionCommand({
        ConnectionId: connection,
        Data: Buffer.from(JSON.stringify(createdObjects)),
      })
    );
  }
}
