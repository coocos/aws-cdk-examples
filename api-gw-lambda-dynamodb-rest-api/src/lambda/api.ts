import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

type ApiHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<{
  statusCode: number;
  response: any;
}>;

const productsListHandler: ApiHandler = async (event, context) => {
  // TODO: Read / write to DynamoDB based on method type
  return {
    statusCode: 200,
    response: [],
  };
};

const productsDetailHandler: ApiHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  // TODO: Read / write to DynamoDB based on method type
  return {
    statusCode: 200,
    response: {},
  };
};

const handlers: Record<string, ApiHandler> = {
  "/v1/products": productsListHandler,
  "/v1/products/{product}": productsDetailHandler,
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { resourcePath } = event.requestContext;
  try {
    const { statusCode: status, response } = await handlers[resourcePath](
      event,
      context
    );
    return {
      statusCode: status,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Something went wrong",
      }),
    };
  }
};
