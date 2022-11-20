import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";

import { z } from "zod";

export async function addConnection(table: string, id: string) {
  const client = new DynamoDBClient({});
  await client.send(
    new PutItemCommand({
      TableName: table,
      Item: {
        Type: {
          S: "Connection",
        },
        Id: {
          S: id,
        },
      },
    })
  );
}

export async function dropConnection(table: string, id: string) {
  const client = new DynamoDBClient({});
  await client.send(
    new DeleteItemCommand({
      TableName: table,
      Key: {
        Type: {
          S: "Connection",
        },
      },
      ConditionExpression: "Id = :id",
      ExpressionAttributeValues: {
        ":id": {
          S: id,
        },
      },
    })
  );
}

const ConnectionItems = z
  .object({
    Id: z.object({
      S: z.string(),
    }),
  })
  .array();

export async function listConnections(table: string) {
  const client = new DynamoDBClient({});
  const response = await client.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "#type = :itemType",
      ExpressionAttributeValues: {
        ":itemType": {
          S: "Connection",
        },
      },
      ExpressionAttributeNames: {
        "#type": "Type",
      },
      ProjectionExpression: "Id",
    })
  );
  const items = ConnectionItems.parse(response.Items).map((item) => item.Id.S);
  console.log(items);
}
