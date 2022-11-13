import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as repository from "./repository";
import { ApiHandler, Product } from "./types";

const listProducts: ApiHandler = async (event, context) => {
  const products = await repository.listProducts();
  return {
    statusCode: 200,
    body: products,
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
  await repository.createProduct(product);
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
        error: "Internal server error",
      },
    };
  }
  const product = await repository.getProduct(event.pathParameters.product);
  return product === null
    ? {
        statusCode: 404,
        body: {},
      }
    : {
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
        error: "Internal server error",
      },
    };
  }
  await repository.deleteProduct(event.pathParameters.product);
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
