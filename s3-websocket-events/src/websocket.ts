import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

import * as repository from "./repository";

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

export async function handler(
  event: APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContext>,
  context: Context
): Promise<APIGatewayProxyResultV2> {
  const { eventType, connectionId } = event.requestContext;
  if (!CONNECTIONS_TABLE) {
    return {
      body: "DynamoDB table name not set",
      statusCode: 500,
    };
  }
  if (!connectionId) {
    return {
      body: "connectionId missing from event",
      statusCode: 500,
    };
  }

  switch (eventType) {
    case "CONNECT": {
      await repository.addConnection(CONNECTIONS_TABLE, connectionId);
      break;
    }
    case "MESSAGE": {
      await repository.listConnections(CONNECTIONS_TABLE);
      break;
    }
    case "DISCONNECT": {
      await repository.dropConnection(CONNECTIONS_TABLE, connectionId);
      break;
    }
  }
  return {
    statusCode: 200,
  };
}
