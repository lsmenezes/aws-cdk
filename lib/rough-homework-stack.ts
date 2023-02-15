import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';


export class RoughHomeworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create users table
    const dynamoUsersTable = new Table(this, 'users', {
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      },
      tableName: 'users',
      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // Create Lambda function a for each lamba script
    const helloLambda = new lambda.Function(this, 'HelloLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('src/lambas/api'),
      handler: 'home.handler'
    });


    const createUserLambda = new lambda.Function(this, 'createUserLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('src/lambas/api/user/create'),
      handler: 'index.handler'
    });

    console.log("createUserLambda",createUserLambda)
    // Grant the Lambda function read access to the DynamoDB table
    dynamoUsersTable.grantReadWriteData(createUserLambda);

    // Integrate the Lambda functions with the API Gateway resource 
    const helloLambdaIntegration = new apigateway.LambdaIntegration(helloLambda);
    const createUserLambdaIntegration = new apigateway.LambdaIntegration(createUserLambda);

    // Create an API Gateway resource and setup routes for each operation
    const api = new apigateway.RestApi(this, 'itemsApi', {
      restApiName: 'Items Service'
    });

    api.root.addMethod('GET',helloLambdaIntegration);    
    const userEndpoint = api.root.addResource('user_teste')
    userEndpoint.addMethod('POST',createUserLambdaIntegration,{
      authorizationType: apigateway.AuthorizationType.NONE
    })
    addCorsOptions(userEndpoint)

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