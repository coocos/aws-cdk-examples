import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { z } from "zod";

export const Product = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
});

export type Product = z.infer<typeof Product>;

export type ApiHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<{
  statusCode: number;
  body: any;
}>;
