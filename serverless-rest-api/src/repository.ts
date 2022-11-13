import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { env } from "process";
import { Product } from "./types";

export async function listProducts(): Promise<Product[]> {
  const client = new DynamoDBClient({});
  const output = await client.send(
    new ScanCommand({
      TableName: env.TABLE_NAME,
    })
  );

  if (!output.Items || output.Items.length === 0) {
    return [];
  }
  return output.Items.map((item) =>
    Product.parse({
      id: item.id.S,
      type: item.type.S,
      name: item.name.S,
    })
  );
}

export async function createProduct(product: Product) {
  const client = new DynamoDBClient({});
  await client.send(
    new PutItemCommand({
      TableName: env.TABLE_NAME,
      Item: {
        id: { S: product.id },
        type: { S: product.type },
        name: { S: product.name },
      },
    })
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  const client = new DynamoDBClient({});
  const output = await client.send(
    new QueryCommand({
      TableName: env.TABLE_NAME,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: id },
      },
    })
  );
  if (!output.Items || output.Items.length === 0) {
    return null;
  }
  return Product.parse({
    id: output.Items[0].id.S,
    type: output.Items[0].type.S,
    name: output.Items[0].name.S,
  });
}

export async function deleteProduct(id: string) {
  const client = new DynamoDBClient({});
  await client.send(
    new DeleteItemCommand({
      TableName: env.TABLE_NAME,
      Key: {
        id: {
          S: id,
        },
      },
    })
  );
}
