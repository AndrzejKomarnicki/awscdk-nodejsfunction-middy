import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import httpSecurityHeaders from '@middy/http-security-headers'
import httpRouterHandler from '@middy/http-router'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'middy-example-api',
});

async function lambdaHandler(event: APIGatewayProxyEventV2, context: any): Promise<APIGatewayProxyResultV2> {
  // the returned response will be checked against the type `APIGatewayProxyResultV2`
  logger.info('This is a INFO log with some context');
  console.log('event 👉', event);
  return {
    statusCode: 200,
    body: JSON.stringify(`Hello from ${event.rawPath}`)
  }
}

// routes served by httpRouterHandler middleware, you can add more handlers for routes as needed
const routes = [
  {
    method: 'GET',
    path: '/user/{id}',
    handler: lambdaHandler
  },
  {
    method: 'GET',
    path: '/post/{id}',
    handler: lambdaHandler
  }
]


export const handler = middy(lambdaHandler)
  .use(jsonBodyParser())
  .use(httpSecurityHeaders())
  .use(httpErrorHandler())
  .use(injectLambdaContext(logger)) // Change to (logger, { logEvent: true }) to log the incoming event
  .handler(httpRouterHandler(routes))