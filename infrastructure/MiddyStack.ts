import { CfnOutput, RemovalPolicy, Stack, StackProps, Duration, aws_codedeploy, Size } from 'aws-cdk-lib'
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
            timeout: Duration.minutes(5),
            reservedConcurrentExecutions: 60,
            ephemeralStorageSize: Size.gibibytes(0.5),

            bundling: {
              minify: true
            },
        });

        // used to make sure each CDK synthesis produces a different Version
        const version = LambdaNodeJsMiddy.currentVersion;
        const alias = new lambda.Alias(this, 'LambdaAlias', {
        aliasName: 'Prod',
         version,
        });

        // CodeDeploy deployment group and deployment config
        new aws_codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
        alias,
        deploymentConfig: aws_codedeploy.LambdaDeploymentConfig.ALL_AT_ONCE,
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

        // Log Group for Function
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