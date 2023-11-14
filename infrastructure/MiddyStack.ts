import { CfnOutput, RemovalPolicy, Stack, StackProps, Duration, aws_codedeploy, Size } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { aws_wafv2 as wafv2 } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import * as cdk from 'aws-cdk-lib';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';


export class MiddyStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        // Create SSM parameter
        const parameter = new StringParameter(this, 'Parameter', {
            parameterName: `mySsmParameterName`,
            stringValue: 'mySsmParameterValue',
        });

        // Create Lambda Function
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

        // Grant Lambda read access to the SSM parameter
        parameter.grantRead(LambdaNodeJsMiddy);

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
            },
            invokeMode: lambda.InvokeMode.BUFFERED
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

        // Define WAF webACL with rules and defaults
        // For CLOUDFRONT, you must create your WAFv2 resources in the US East (N. Virginia) Region, us-east-1.
        const cfnWebACL = new wafv2.CfnWebACL(this, 'MyCDKWebAcl', {
            defaultAction: {
                allow: {}
            },
            scope: 'CLOUDFRONT',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'MetricForWebACLCDK',
                sampledRequestsEnabled: true,
            },
            name: 'MyCDKWebACL',
            rules: [{
                name: 'CRSRule',
                priority: 0,
                statement: {
                    managedRuleGroupStatement: {
                        name: 'AWSManagedRulesCommonRuleSet',
                        vendorName: 'AWS'
                    }
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: 'MetricForWebACLCDK-CRS',
                    sampledRequestsEnabled: true,
                },
                overrideAction: {
                    none: {}
                },
            }]
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
            },
            // associate webacl with cloudfront distribution
            webAclId: cfnWebACL.attrArn
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