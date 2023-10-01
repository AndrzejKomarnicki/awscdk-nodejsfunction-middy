import { AttributeType, BillingMode, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'



export class PersistenceStack extends Stack {

    public readonly idempotencyTable: ITable

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.idempotencyTable = new Table(this, 'idempotencyTable', {
            tableName: 'idempotencyTable',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
            timeToLiveAttribute: 'expiration',
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }

}