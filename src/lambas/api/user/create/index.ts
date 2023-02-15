import * as AWS from 'aws-sdk';

import { v4 as uuidv4 } from 'uuid';

export const handler = async (event: any = {}): Promise<any> => {
  
  console.log("In the handler")

  const TABLE_NAME = 'users';
  const PRIMARY_KEY = 'userId';
  const dynamodb = new AWS.DynamoDB.DocumentClient();
    
  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }

  const user = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  user[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: user
  };


  try {
      console.log("params",params)
      await dynamodb.put(params).promise();
      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Data saved successfully.'
          })
      };
  } catch (error) {
      return {
          statusCode: 500,
          body: JSON.stringify({
              message: 'Error saving data. '+error,
          })
      };
  }
}
