import middy from '@middy/core'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'

const baseHandler = async (event: any, context: any) => {
    console.log('Got an event:');
    console.log(event);
    const response = { result: 'success', message: 'message processed successfully'}
    return {
        statusCode: 200,
        body: JSON.stringify(response)
    }
}

const handler = middy(baseHandler)
   .use(jsonBodyParser())
   .use(httpErrorHandler())

export { handler }