import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import httpSecurityHeaders from '@middy/http-security-headers'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger'

const logger = new Logger({
  logLevel: 'WARN',
  serviceName: 'middy-example-api',
});

async function lambdaHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // the returned response will be checked against the type `APIGatewayProxyResultV2`
  logger.info('This is a WARN log with some context');
  console.log('event 👉', event);
  return {
    statusCode: 200,
    body: JSON.stringify(`Hello from ${event.rawPath}`)
  }
}

export const handler = middy(lambdaHandler)
  .use(jsonBodyParser())
  .use(httpSecurityHeaders())
  .use(httpErrorHandler())
  .use(injectLambdaContext(logger));