import * as sdk from 'aws-sdk';

export const handler = async (event: any = {}, context: any = {},): Promise<any> => {

    console.log('netrou no lambda')
    const TABLE_NAME = process.env.ORDER_TABLE_NAME!;
    console.log('TABLE_NAME',TABLE_NAME)
    const documentClient = new sdk.DynamoDB.DocumentClient({ region: process.env.CDK_DEFAULT_REGION });
    console.log('documentClient',documentClient)
    const date = new Date()
    console.log('date',date)
    // const today = date.toISOString().split('T')[0].toString
    const today = date.toISOString().split('T')[0].split('-')[1]+'-'+date.toISOString().split('T')[0].split('-')[2]
    console.log('today',today)
    const params = {
        // Specify which items in the results are returned.
        //FilterExpression: "contains(#birthday,:birthday)",
        
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        //ExpressionAttributeValues: {":birthday": {S: today}},

        // Set the projection expression, which are the attributes that you want.
        ProjectionExpression: "name, email",
        TableName: TABLE_NAME,
    };    
    console.log('params',params)

    documentClient.scan(params, function (err, data) {
        if (err) {
            console.log("Error", err);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Error',
                    err:err
                })
            }
        } else {
            console.log("Success", data);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Error',
                    data:data
                })
            }
        //   data.Items!.forEach(function (element, index, array) {
        //     console.log(
        //         "LSMDEBUG",
        //         element.name.S + " (" + element.email.S + ")"
        //     );
        //   });
        }
      });

}   