import * as sdk from 'aws-sdk';

export const handler = async (event: any = {}, context: any = {},): Promise<any> => {
    const ses = new sdk.SES({ region:  process.env.CDK_DEFAULT_REGION });
    const SOURCE_EMAIL  = process.env.SOURCE_EMAIL!
    const recordPromises = event.Records.map(async (record: any) => {
        
        console.log('record',record.dynamodb.NewImage)

        const { name, email} = record.dynamodb.NewImage 
        
        const welcomeMessage = `
            Hello ${name.S}!
            Welcome to our system! 
            
        `;

        const sesParams = {
            Message: {
                Body: {
                    Text: {
                        Data: welcomeMessage,
                        Charset: 'UTF-8'
                    }
                },
                Subject: {
                    Data: 'Welcome Notification',
                    Charset: 'UTF-8'
                }
            },
            Source: SOURCE_EMAIL,
            ReplyToAddresses: [SOURCE_EMAIL], 
            Destination: {
                ToAddresses: [email.S] 
            }
        };

        await ses.sendEmail(sesParams).promise();
    });
    await Promise.all(recordPromises);
}
