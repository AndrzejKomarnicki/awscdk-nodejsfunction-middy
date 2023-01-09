import { CfnOutput, RemovalPolicy, Stack, StackProps, Duration, aws_codedeploy, Size } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

import * as cdk from 'aws-cdk-lib';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';


export class MiddyStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const LambdaNodeJsMiddy = new NodejsFunction(this, 'LambdaNodeJsMiddy', {
            entry: (join(__dirname, '..', 'services', 'node-lambda', 'index.ts')),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_18_X,
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

        // Create the cloudfront response header policy. 
        // Sets the CORS rules to allow all methods and all origins. Restict as needed. 
        const cfResponseHeadersPolicy = new cloudFront.ResponseHeadersPolicy(this, 'cfResponseHeadersPolicy',
            {
                responseHeadersPolicyName: 'lambdaFurlCloudFrontPolicy',
                corsBehavior: {
                    accessControlAllowCredentials: false,
                    accessControlAllowHeaders: ['*'],
                    accessControlAllowMethods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
                    accessControlAllowOrigins: ['*'],
                    accessControlExposeHeaders: ['*'],
                    accessControlMaxAge: Duration.seconds(600),
                    originOverride: true
                }
            });

        // CloudFront Distribution
        // Set the origin as the lambda function url created in previous steps
        const lambdaFurlCfd = new cloudFront.Distribution(this, 'lambdaFurlCloudfrontDist', {
            defaultBehavior: {
                origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", fnurl.url))),
                allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.ALLOW_ALL,
                originRequestPolicy: cloudFront.OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
                responseHeadersPolicy: cfResponseHeadersPolicy,
                cachedMethods: cloudFront.CachedMethods.CACHE_GET_HEAD_OPTIONS
            }
        });


        // Log Group for Function
        new LogGroup(this, 'MyLogGroup', {
            logGroupName: "/aws/lambda/" + LambdaNodeJsMiddy.functionName,
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY
        })

        new CfnOutput(this, 'FunctionURLCommand', {
            value: `curl ${fnurl.url}`,
            description: "Function URL",
            exportName: 'lambdaFurl'
        });

        new CfnOutput(this, 'cloudFrontURL', {
            value: lambdaFurlCfd.distributionDomainName,
            description: 'CloudFront URL for Distribution',
            exportName: 'cloudFrontURL',
        });
    }

}