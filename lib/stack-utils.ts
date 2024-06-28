import { Duration, Tags } from 'aws-cdk-lib';
import { Code, Function, FunctionProps, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi, ApiKeySourceType, ApiKey, UsagePlan } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { MyStackProps, IAMRoleProps, LambdaFunctionInfo, LambdaFunctionProps, LambdaLayerProps, UsagePlanInfo } from './types';
import { MyStackProps, IAMRoleProps, LambdaFunctionInfo, LambdaFunctionProps, LambdaLayerProps, UsagePlanInfo } from './types';

export function createLambdaFunction(
    scope: Construct,
    props: LambdaFunctionProps
): Function {
    const lambdaFunction = new Function(
        scope,
        `Lambda-${props.name}`,
        {
            runtime: props.runtime,
            code: Code.fromAsset(props.code),
            handler: props.handler,
            role: props.role,
            timeout: Duration.seconds(600), // Timeout set to 10 minutes
            layers: props.layer ? [props.layer] : undefined
        }
    );

    if (props.tags) {
        for (var key in props.tags) {
            Tags.of(lambdaFunction).add(key, props.tags[key]);
        }
    }

    if (props.environmentVariables) {
        for (var key in props.environmentVariables) {
            lambdaFunction.addEnvironment(key, props.environmentVariables[key]);
        }
    }
    return lambdaFunction;
}

export function createLambdaLayer(scope: Construct, props: LambdaLayerProps): LayerVersion {
    const layer = new LayerVersion(scope, `Layer-${props.stage}`, {
        compatibleRuntimes: props.compatibleRuntimes,
        code: Code.fromAsset(props.code),
        description: `Lambda Layer for operational scripts`,
    });

    return layer;
}

export function createRestApi(
    scope: Construct,
    props: MyStackProps,
    lambdaFunction: LambdaFunctionInfo,
    apiKey: ApiKey,
    lambda: Function,
    usagePlan: UsagePlanInfo

): RestApi {
    const api = new RestApi(scope, `API-${props.stage}-${lambdaFunction.name}`, {
        restApiName: lambdaFunction.name,
        defaultCorsPreflightOptions: props.cors,
        description: 'My Function API',
        apiKeySourceType: ApiKeySourceType.HEADER,
    });

    const uPlan = new UsagePlan(scope, `UsagePlan-${props.stage}-${lambdaFunction.name}`, {
        name: 'Usage Plan',
        apiStages: [
            {
            api,
            stage: api.deploymentStage,
            },
        ],
        throttle: usagePlan.throttle,
        quota: usagePlan.quota
    });

    uPlan.addApiKey(apiKey);


    const apiResource = api.root.addResource(lambdaFunction.path);
    apiResource.addMethod(lambdaFunction.method, new LambdaIntegration(lambda), {
        apiKeyRequired: true
    });

    return api;
}

export function createIAMRole (scope: Construct, props: IAMRoleProps): Role {
    const managedPolicies = [
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambdaExecute"),
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLambdaInsightsExecutionRolePolicy"),
    ];

    const iamRole: Role = new Role(
        scope,
        props.roleName,
        {
            roleName: props.roleName,
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: managedPolicies
        },
    );

    if (props.actions && props.actions.length > 0) {
        iamRole.addToPolicy(
            new PolicyStatement(
                {
                    effect: Effect.ALLOW,
                    actions: props.actions,
                    resources: props.resources,
                },
            ),
        );
    }

    if (props.tags) {
        for (var key in props.tags) {
            Tags.of(iamRole).add(key, props.tags[key]);
        }
    }
    
    return iamRole;
}