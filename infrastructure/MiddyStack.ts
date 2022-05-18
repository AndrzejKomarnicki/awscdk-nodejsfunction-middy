import { CfnOutput, RemovalPolicy, Stack, StackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

export class MiddyStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const LambdaNodeJsMiddy = new NodejsFunction(this, 'LambdaNodeJsMiddy', {
            entry: (join(__dirname, '..', 'services', 'node-lambda', 'index.ts')),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_16_X,
            memorySize: 1024,
            timeout: Duration.seconds(30),
            
            bundling: {
              minify: true
            },
        });

        // Function URL
        const fnurl = LambdaNodeJsMiddy.addFunctionUrl({
            authType: FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [lambda.HttpMethod.ALL],
                allowedHeaders: ['Content-Type'],
                allowCredentials: true,

            }
        });

        new LogGroup(this, 'MyLogGroup', {
            logGroupName: "/aws/lambda/" + LambdaNodeJsMiddy.functionName,
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY
        })

        new CfnOutput(this, 'FunctionURLCommand', {
            value: `curl ${fnurl.url}`
        });
    }

}