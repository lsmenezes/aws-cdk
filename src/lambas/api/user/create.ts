import * as sdk from 'aws-sdk';

export const handler = async (event: any = {}, context: any = {},): Promise<any> => {
  
  const TABLE_NAME = process.env.ORDER_TABLE_NAME!;
  const documentClient = new sdk.DynamoDB.DocumentClient({ region: process.env.CDK_DEFAULT_REGION });
   
  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  
  const { body } = event;
  const { name, email, phone, birthday } = JSON.parse(body);
  const userId = context.awsRequestId; 
  
  const user = {
    userId,
    name,
    email,
    phone,
    birthday
  }

  const putParams = {
    TableName: TABLE_NAME,
    Item:  user
  };

  try {
      await documentClient.put(putParams).promise();
      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Data saved successfully.',
              user:user
          })
      };
  } catch (error) {
      return {
          statusCode: 500,
          body: JSON.stringify({
              message: 'Error saving data. '+error,
              user:user
          })
      };
  }
}
