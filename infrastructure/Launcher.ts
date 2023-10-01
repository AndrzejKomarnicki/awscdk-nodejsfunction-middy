import { App } from 'aws-cdk-lib'
import { MiddyStack } from "./stacks/MiddyStack";
import { PersistenceStack } from "./stacks/PersistenceStack";

const app = new App()
// Create the persistence stack for the idempotency table with DynamoDB
const persistenceStack = new PersistenceStack(app, 'PersistenceStack')

new MiddyStack(app, 'Middy-Serverless', {
    idempotencyTable: persistenceStack.idempotencyTable,
    stackName: 'MiddyServerless'
})