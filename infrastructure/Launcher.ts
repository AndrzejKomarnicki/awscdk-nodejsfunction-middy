import { MiddyStack } from './MiddyStack'
import { App } from 'aws-cdk-lib'

const app = new App()
new MiddyStack(app, 'Middy-Serverless', {
    stackName:'MiddyServerless'

})