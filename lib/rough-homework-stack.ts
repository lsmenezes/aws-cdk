import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';


export class RoughHomeworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // To DO: Setup .env file
    const env = {
      CDK_DEFAULT_REGION:"us-east-1",
      SOURCE_EMAIL:"leonardomenezes.pro@gmail.com"
    }

    //sending email permissions 
     // The code that defines your stack goes here
    const role = new Role(this, "snsLambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });
    ///Attaching ses access to policy
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ses:SendEmail", "ses:SendRawEmail", "logs:*"],
      resources: ["*"],
    });
    //granting IAM permissions to role
    role.addToPolicy(policy);

    // Create users table
    const dynamoUsersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId',type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      pointInTimeRecovery: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Create Lambda function a for each lamba script
    const helloLambda = new lambda.Function(this, 'HelloLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('src/lambas/api'),
      handler: 'home.handler'
    });

    const createUserLambda = new lambda.Function(this, 'createUserLambda', {
      code: lambda.Code.fromAsset('src/lambas/api/user'),
      handler: 'create.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        ORDER_TABLE_NAME: dynamoUsersTable.tableName,
        CDK_DEFAULT_REGION: env.CDK_DEFAULT_REGION
      },
    });

    const welcomeUserLambda = new lambda.Function(this, 'welcomeUserLambda', {
      code: lambda.Code.fromAsset('src/lambas/notifications'),
      handler: 'welcomeUser.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        ORDER_TABLE_NAME: dynamoUsersTable.tableName,
        CDK_DEFAULT_REGION: env.CDK_DEFAULT_REGION
      },
      role: role
    });

    const happyBirthdayLambda = new lambda.Function(this, 'happyBirthdayLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('src/lambas/notifications'),
      handler: 'happyBirthday.handler',
      environment: {
        ORDER_TABLE_NAME: dynamoUsersTable.tableName,
        CDK_DEFAULT_REGION: env.CDK_DEFAULT_REGION,
        SOURCE_EMAIL: env.SOURCE_EMAIL
      },
      role: role
    });

    // Grant the Lambda function read access to the DynamoDB table
    dynamoUsersTable.grantReadWriteData(createUserLambda);
    dynamoUsersTable.grantReadWriteData(welcomeUserLambda);
    dynamoUsersTable.grantReadWriteData(happyBirthdayLambda);

    //add insert tiger on dynamoUsersTable
    welcomeUserLambda.addEventSource(new DynamoEventSource(dynamoUsersTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 1
    }));    
    
    // Integrate the Lambda functions with the API Gateway resource 
    const helloLambdaIntegration = new apigateway.LambdaIntegration(helloLambda);
    const createUserLambdaIntegration = new apigateway.LambdaIntegration(createUserLambda);
    const happyBirthdayIntegration = new apigateway.LambdaIntegration(happyBirthdayLambda);

    // Create an API Gateway resource and setup routes for each operation
    const api = new apigateway.RestApi(this, 'itemsApi', {
      restApiName: 'Items Service'
    });

    api.root.addMethod('GET',helloLambdaIntegration);    
    const userEndpoint = api.root.addResource('user')
    userEndpoint.addMethod('POST',createUserLambdaIntegration,{
      authorizationType: apigateway.AuthorizationType.NONE
    })
    addCorsOptions(userEndpoint)
    const birthdayEndpoint = api.root.addResource('birthday')
    birthdayEndpoint.addMethod('GET',happyBirthdayIntegration,{
      authorizationType: apigateway.AuthorizationType.NONE
    })
    addCorsOptions(birthdayEndpoint)
    

  }

}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}