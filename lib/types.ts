import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StackProps } from 'aws-cdk-lib';
import { Period } from 'aws-cdk-lib/aws-apigateway/lib/usage-plan';
import { Role } from 'aws-cdk-lib/aws-iam';

export interface StackInfo {
    readonly stage: string;
    readonly stackName: string;
    readonly region: string;
    readonly cors?: CorsConfig;
    readonly tags: { [key: string]: string };
    readonly functions: LambdaFunctionInfo[];
    readonly iAMActions: string[];
    readonly layer?: LambdaLayerProps;
}

export interface LambdaFunctionInfo {
    readonly name: string;
    readonly handler: string;
    readonly runtime: Runtime;
    readonly environmentVariables?: { [key: string]: string };
    readonly method: string;
    readonly code: string;
    readonly path: string;
    readonly usagePlan?: UsagePlanInfo;
}

export interface UsagePlanInfo {
    throttle: {
        rateLimit: number,
        burstLimit: number,
    },
    quota: {
        limit: number
        period: Period
    }
}

export interface MyStackProps extends StackProps {
    readonly stage: string;
    readonly tags: { [key: string]: string };
    readonly cors?: CorsConfig;
    readonly layer?: LambdaLayerProps;
    readonly functions: LambdaFunctionInfo[];
    readonly iAMActions: string[];
}

export interface CorsConfig {
    readonly allowOrigins: string[];
    readonly allowMethods: string[];
    readonly allowHeaders: string[];
}

export interface IAMRoleProps {
    readonly roleName: string;
    readonly actions: string[];
    readonly resources: string[];
    readonly tags: { [key: string]: string }
}

export interface LambdaFunctionProps {
    readonly name: string;
    readonly code: string;
    readonly handler: string;
    readonly role: Role;
    readonly environmentVariables?: { [key: string]: string };
    readonly runtime: Runtime;
    readonly tags?: { [key: string]: string };
    readonly layer?: LayerVersion;
}

export interface LambdaLayerProps {
    readonly stage: string;
    readonly compatibleRuntimes: Runtime[];
    readonly code: string;
}