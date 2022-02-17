import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export class MiddyStack extends Stack {

    private api = new RestApi(this, 'MiddyApi');

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const helloLambdaNodeJsMiddy = new NodejsFunction(this, 'helloLambdaNodeJsMiddy', {
            entry: (join(__dirname, '..', 'services', 'node-lambda', 'handler.ts')),
            handler: 'handler'
        });

        // Hello Api lambda integration:
        const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJsMiddy)
        const helloLambdaResource = this.api.root.addResource('hello')
        helloLambdaResource.addMethod('GET', helloLambdaIntegration)
    }

}