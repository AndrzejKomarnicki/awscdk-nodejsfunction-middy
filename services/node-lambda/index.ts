import middy from '@middy/core'
import ssm from '@middy/ssm'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpErrorHandler from '@middy/http-error-handler'
import httpSecurityHeaders from '@middy/http-security-headers'
import httpRouterHandler from '@middy/http-router'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'middy-example-api',
});

async function getHandler(event: APIGatewayProxyEventV2, context: any): Promise<APIGatewayProxyResultV2> {
  // the returned response will be checked against the type `APIGatewayProxyResultV2`
  // logger.info('This is a INFO log with some context');

  // Access SSM Parameter value from context
  const ssmparamvalue = context.MYPARAMETER
  console.log(ssmparamvalue);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'GET event submitted successfully', get: event.pathParameters }),
  }
}

async function postHandler(event: APIGatewayProxyEventV2, context: any): Promise<APIGatewayProxyResultV2> {
  // the returned response will be checked against the type `APIGatewayProxyResultV2`
  // logger.info('This is a INFO log with some context');

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'POST event submitted successfully', post: event.body }),
  }
}

// routes served by httpRouterHandler middleware
// you can add more nested handlers for routes (method and path) as needed
const routes = [
  {
    method: 'GET',
    path: '/user/{id}',
    handler: getHandler
  },
  {
    method: 'POST',
    path: '/user',
    handler: postHandler
  }
]


export const handler = middy()
  .use(
    ssm({
      fetchData: {
        MYPARAMETER: 'mySsmParameterName', // single value
      },
      setToContext: true,
      cacheExpiry: 15 * 60 * 1000,
    })
  )
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(jsonBodyParser())
  .use(httpSecurityHeaders())
  .use(httpErrorHandler())
  .use(injectLambdaContext(logger, { logEvent: true })) // Change to {logEvent: false} to not log the incoming event
  .handler(httpRouterHandler(routes))

