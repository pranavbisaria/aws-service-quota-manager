import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Cors, Period } from 'aws-cdk-lib/aws-apigateway';
import { StackInfo } from './types';
import { methods } from './constants';

export const STAGE_NAME: string = "dev-ops-ci";
export const REGION: string = "us-west-2";

export const QUOTA_MANAGER_STACK_INFO: StackInfo = {
    stage: STAGE_NAME,
    stackName: "QuotaManagerStack",
    region: REGION,
    tags: {
        Owner: "pranav",
        CostCentre: "1000",
        CreatedBy: "DevOpsCI"
    },
    
}

export const MAIN_STACK_INFO: StackInfo[] = [
    {
        stage: STAGE_NAME,
        stackName: "OpsStack",
        region: REGION,
        tags: {
            Owner: "pranav",
            CostCentre: "1000",
            CreatedBy: "DevOpsCI"
        },
        cors: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowHeaders: Cors.DEFAULT_HEADERS,
            allowMethods: Cors.ALL_METHODS
        },
        iAMActions: [
            "cloudformation:*",
            "cloudtrail:*",
            "tag:*",
            "apigateway:*",
            "lambda:*",
            "iam:*"
        ],
        functions: [
            {
                name: "auto-tag",
                handler: "index.handler",
                runtime: Runtime.NODEJS_20_X,
                environmentVariables: {
                    // key: "value" // Add environment variables here
                },
                method: methods.POST,
                code: "src/aws-auto-tagging",
                path: "auto-tag",
                usagePlan: { // For Write Requests
                    throttle: {
                        rateLimit: 1/60, // 1 request per minute
                        burstLimit: 1,
                    },
                    quota: {
                        limit: 100, // 100 requests per day
                        period: Period.DAY
                    },
                }
            },
            {
                name: "enable-xray",
                handler: "index.handler",
                runtime: Runtime.NODEJS_20_X,
                environmentVariables: {
                    // key: "value" // Add environment variables here
                },
                method: methods.POST,
                code: "src/enable-xray",
                path: "enable-xray",
                usagePlan: { // For Write Requests
                    throttle: {
                        rateLimit: 1/60, // 1 request per minute
                        burstLimit: 1,
                    },
                    quota: {
                        limit: 100, // 100 requests per day
                        period: Period.DAY
                    },
                }
            },
            {
                name: "track-resources",
                handler: "index.handler",
                runtime: Runtime.NODEJS_20_X,
                environmentVariables: {
                    // key: "value" // Add environment variables here
                },
                method: methods.POST,
                code: "src/resource-tracker-script",
                path: "track-resources",
                usagePlan: { // For Read Requests
                    throttle: {
                        rateLimit: 1, // 60 request per minute
                        burstLimit: 10,
                    },
                    quota: {
                        limit: 10000, // 10000 requests per day
                        period: Period.DAY
                    },
                }
            }
        ],
        layer: {
            stage: STAGE_NAME,
            compatibleRuntimes: [Runtime.NODEJS_20_X],
            code: "/operational-scripts"
        }
    }
]