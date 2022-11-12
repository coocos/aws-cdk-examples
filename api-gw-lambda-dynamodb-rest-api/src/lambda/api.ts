import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { env } from "process";
import { ApiHandler, Product } from "../types";

const listProducts: ApiHandler = async (event, context) => {
  const client = new DynamoDBClient({});
  const output = await client.send(
    new ScanCommand({
      TableName: env.TABLE_NAME,
    })
  );
  return {
    statusCode: 200,
    body:
      output.Items?.map((item) => ({
        id: item.id.S,
        type: item.type.S,
        name: item.name.S,
      })) || [],
  };
};

const createProduct: ApiHandler = async (event, context) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: {
        error: "Request body is missing",
      },
    };
  }
  const product = Product.parse({ ...JSON.parse(event.body), id: uuidv4() });
  const client = new DynamoDBClient({});
  const output = await client.send(
    new PutItemCommand({
      TableName: env.TABLE_NAME,
      Item: {
        id: { S: product.id },
        type: { S: product.type },
        name: { S: product.name },
      },
    })
  );
  return {
    statusCode: 201,
    body: product,
  };
};

const getProduct: ApiHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  if (!event.pathParameters?.product) {
    return {
      statusCode: 500,
      body: {
        error: "Something went wrong",
      },
    };
  }
  const client = new DynamoDBClient({});
  const productId = event.pathParameters.product;
  const output = await client.send(
    new QueryCommand({
      TableName: env.TABLE_NAME,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: productId },
      },
    })
  );
  if (!output.Items || output.Items.length === 0) {
    return {
      statusCode: 404,
      body: {},
    };
  }
  const product = Product.parse({
    id: output.Items[0].id.S,
    type: output.Items[0].type.S,
    name: output.Items[0].name.S,
  });
  return {
    statusCode: 200,
    body: product,
  };
};

const deleteProduct: ApiHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  if (!event.pathParameters?.product) {
    return {
      statusCode: 500,
      body: {
        error: "Something went wrong",
      },
    };
  }
  const client = new DynamoDBClient({});
  const productId = event.pathParameters.product;
  const output = await client.send(
    new DeleteItemCommand({
      TableName: env.TABLE_NAME,
      Key: {
        id: {
          S: productId,
        },
      },
    })
  );
  return {
    statusCode: 200,
    body: {},
  };
};

const handlers: Record<string, Record<string, ApiHandler>> = {
  "/v1/products": {
    GET: listProducts,
    POST: createProduct,
  },
  "/v1/products/{product}": {
    GET: getProduct,
    DELETE: deleteProduct,
  },
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { resourcePath: path, httpMethod: method } = event.requestContext;
  try {
    const { statusCode, body } = await handlers[path][method](event, context);
    return {
      statusCode,
      body: JSON.stringify(body),
    };
  } catch (err: any) {
    console.log("Failed to handle event", event, err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    };
  }
};
