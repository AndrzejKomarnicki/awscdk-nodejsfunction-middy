import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import httpSecurityHeaders from '@middy/http-security-headers'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

async function lambdaHandler (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  console.log('event 👉', event);
  // the returned response will be checked against the type `APIGatewayProxyResultV2`
  return {
    statusCode: 200,
    body: JSON.stringify(`Hello from ${event.rawPath}`)
  }
}

export const handler = middy(lambdaHandler)
  .use(jsonBodyParser())
  .use(httpSecurityHeaders())
  .use(httpErrorHandler())
