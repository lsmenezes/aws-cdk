import * as sdk from 'aws-sdk';

export const handler = async (event: any = {}, context: any = {},): Promise<any> => {

    const TABLE_NAME = process.env.ORDER_TABLE_NAME!;
    const documentClient = new sdk.DynamoDB.DocumentClient({ region: process.env.CDK_DEFAULT_REGION });
    const date = new Date()
    const today = date.toISOString().split('T')[0].split('-')[1]+'-'+date.toISOString().split('T')[0].split('-')[2] //gambetinha pra pegar mes e dia de hoje. 
   
    const params = {
        FilterExpression: "contains(birthday,:birthday)",
        ExpressionAttributeValues: {":birthday": today},
        TableName: TABLE_NAME,
    };    

    try {
        const response = await documentClient.scan(params).promise();
        if (response.Items) {
            const recordPromises = response.Items.map(async (record: any) => {
                await SendEmail(record.name,record.email)
            })
            await Promise.all(recordPromises);
            return { statusCode: 200, body: JSON.stringify(response.Items) };
        } else {
            return { statusCode: 404 };
        }
    } catch (dbError) {
        return { statusCode: 500, body: JSON.stringify(dbError) };
    }

} 

export async function SendEmail(name: string, email: string){
    const ses = new sdk.SES({ region:  process.env.CDK_DEFAULT_REGION });
    const SOURCE_EMAIL  = process.env.SOURCE_EMAIL!

    const welcomeMessage = `Happy birthday ${name}!`;
    const sesParams = {
        Message: {
            Body: {
                Text: {
                    Data: welcomeMessage,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: `Happy birthday ${name}!`,
                Charset: 'UTF-8'
            }
        },
        Source: SOURCE_EMAIL,
        ReplyToAddresses: [SOURCE_EMAIL], 
        Destination: {
            ToAddresses: [email] 
        }
    };

    await ses.sendEmail(sesParams).promise();
}