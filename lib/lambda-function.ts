// lib/lambda-function.ts

import { APIGatewayEvent, Context, Callback, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayEvent, context: Context, callback: Callback): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello AWS witnesses'
        })
    };
}
