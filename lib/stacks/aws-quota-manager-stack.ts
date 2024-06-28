import { Stack } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions/lib/email';
import { Construct } from 'constructs';
import { createIAMRole, createLambdaFunction, createRestApi } from '../stack-utils';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { MyStackProps } from '../types';
import { ApiKey } from 'aws-cdk-lib/aws-apigateway';

export class AwsQuotaManagerStack extends Stack {
  private readonly apiKey: ApiKey;
  private readonly layer: LayerVersion;

  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    var role = createIAMRole(this, {
      roleName: `Role-${props.stage}`,
      resources: [ '*' ],
      actions: props.iAMActions,
      tags: props.tags
    });

    // SNS Topic for alerts
    const alertTopic = new Topic(this, 'QuotaAlertsTopic');
    alertTopic.addSubscription(new EmailSubscription('pranavbisariya29@gamil.com'));

    props.functions.forEach((lambdaFunction) => {
      const lambda = createLambdaFunction(
          this,
          {
              name: `${props.stage}-${lambdaFunction.name}`,
              code: lambdaFunction.code,
              handler: lambdaFunction.handler,
              role: role,
              environmentVariables: {
                ALERT_TOPIC_ARN: alertTopic.topicArn
              },
              runtime: lambdaFunction.runtime,
              tags: props.tags,
              layer: this.layer
          }
      );

      if (lambdaFunction.usagePlan) {
          createRestApi(this, props, lambdaFunction, this.apiKey, lambda, lambdaFunction.usagePlan);            
      }
    });
  }
}
