import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

export class MiddyStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const helloLambdaNodeJsMiddy = new NodejsFunction(this, 'helloLambdaNodeJsMiddy', {
            entry: (join(__dirname, '..', 'services', 'node-lambda', 'handler.ts')),
            handler: 'handler'
        });

        // Function URL
        const fnurl = helloLambdaNodeJsMiddy.addFunctionUrl({
            authType: FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*']
            }
        });

        new LogGroup(this, 'MyLogGroup', {
            logGroupName: "/aws/lambda/" + helloLambdaNodeJsMiddy.functionName,
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY
        })

        new CfnOutput(this, 'FunctionURLCommand', {
            value: `curl ${fnurl.url}`
        });
    }

}