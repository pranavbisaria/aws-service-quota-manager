import { Stack, CfnOutput } from 'aws-cdk-lib';
import { ApiKey } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { MyStackProps } from '../types';
import { createIAMRole, createLambdaFunction, createLambdaLayer, createRestApi } from '../stack-utils';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

export class EmendoStack extends Stack {
    private readonly apiKey: ApiKey;
    private readonly layer: LayerVersion;

    constructor(scope: Construct, id: string, props: MyStackProps) {
        super(scope, id, props);

        var role = createIAMRole(this, {
            roleName: `Role-${props.stage}`,
            resources: [ '*' ],
            actions: props.iAMActions,
            tags: props.tags
        })

        if (props.layer) {
            this.layer = createLambdaLayer(this, props.layer);
        }

        // only creates api key if any props.functions has usagePlan defined
        if (props.functions.some((lambdaFunction) => lambdaFunction.usagePlan)) {
            this.apiKey = new ApiKey(this, `ApiKey-${props.stage}`);
        }

        props.functions.forEach((lambdaFunction) => {
            const lambda = createLambdaFunction(
                this,
                {
                    name: `${props.stage}-${lambdaFunction.name}`,
                    code: lambdaFunction.code,
                    handler: lambdaFunction.handler,
                    role: role,
                    environmentVariables: lambdaFunction.environmentVariables,
                    runtime: lambdaFunction.runtime,
                    tags: props.tags,
                    layer: this.layer
                }
            );

            if (lambdaFunction.usagePlan) {
                createRestApi(this, props, lambdaFunction, this.apiKey, lambda, lambdaFunction.usagePlan);            
            }
        });

        if (this.apiKey) {
            new CfnOutput(this, 'API Key ID', {
                value: this.apiKey.keyId,
            });
        }        
    }
}