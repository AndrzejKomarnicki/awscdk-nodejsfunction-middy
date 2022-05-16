## What is awscdk-nodejsfunction-middy

This is a starter project for using AWS CDK v2 with the NodejsFunction construct and Middy middleware engine for AWS Lambda. It now comes equipped with the new Function URL feature for exposing your Lambdas to the internet without the need for Amazon API Gateway.

It is recommended you modify your Function URL authentication type (NONE or IAM) and CORS policy as needed:

```javascript
// Function URL - MiddyStack.ts
const fnurl = helloLambdaNodeJsMiddy.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
  },
});
```

You can also adjust your Node.js Lambda runtime config as necessary:

```javascript
// NodeJSFunction - MiddyStack.ts
const LambdaNodeJsMiddy = new NodejsFunction(this, 'LambdaNodeJsMiddy', {
  entry: join(__dirname, '..', 'services', 'node-lambda', 'index.ts'),
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_16_X,
  memorySize: 1024,
  timeout: Duration.seconds(5),
  bundling: {
    minify: true,
  },
});
```

## What is Middy

Middy (https://middy.js.org/) is a very simple middleware engine that allows you to simplify your AWS Lambda code when using Node.js.

If you have used web frameworks like Express, then you will be familiar with the concepts adopted in Middy and you will be able to get started very quickly.

A middleware engine allows you to focus on the strict business logic of your Lambda and then attach additional common elements like authentication, authorization, validation, serialization, etc. in a modular and reusable way by decorating the main business logic.

Currently the boilerplate handler only comes equipped with the following:

```javascript
const handler = middy(baseHandler)
  .use(jsonBodyParser()) // parses the request body when it's a JSON and converts it to an object
  .use(httpSecurityHeaders()) // applies best practice security headers to responses. It's a simplified port of HelmetJS.
  .use(httpErrorHandler()); // handles common http errors and returns proper responses
```

Feel free to attach more middlewares as needed, there are many to choose from:

https://middy.js.org/docs/category/middlewares

## +

AWS CDK v2 NodejsFunction construct:
https://docs.aws.amazon.com/cdk/api/v1/docs/aws-lambda-nodejs-readme.html

VSCode REST Client extension
https://marketplace.visualstudio.com/items?itemName=humao.rest-client
