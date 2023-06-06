Description: Lambda function to get a transaction
Written by: Apoorva Prabhu Renjal
Modified by: Apoorva Prabhu Renjal
Written on: 12-05-2023
Output:"[{\"userid\": 1, \"transacttype\": \"CASH\", \"transactid\": \"20\", \"transactamt\": \"1000\", \"transactdate\": \"2023-01-08\", \"stats\": \"COMPLETED\"}, 
	{\"userid\": 2, \"transacttype\": \"UPI\", \"transactid\": \"pQiG3i3IaP\", \"transactamt\": \"2797\", \"transactdate\": \"2023-06-06\", \"stats\": \"COMPLETED\"}]"


import pymysql 
import boto3
import json 
from datetime import date, datetime

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)


# Create a Secrets Manager client 
secretsmanager = boto3.client('secretsmanager', region_name='us-east-1') 
def lambda_handler(event, context): 
    # Get the secret value from Secrets Manager 
    secret_name = 'sm' 
    response = secretsmanager.get_secret_value(SecretId=secret_name) 
    # Parse the JSON string in the response 
    secret = json.loads(response['SecretString']) 
    # Retrieve the username and password from the secret 
    username = secret['username'] 
    password =  secret['password']
    
    # Use the username and password to connect to the database 
    endpoint='transact.cs45bcvsf5tx.us-east-1.rds.amazonaws.com' 
    database_name='transact'
    connection =pymysql.connect(host=endpoint, user=username, password=password, db=database_name) 
    cursor =connection.cursor()  
    cursor.execute('SELECT * from transactions') 
    rows = cursor.fetchall() 
    result = []
    column_names = [desc[0] for desc in cursor.description]
    for row in rows:                # Get all the transaction details 
        row_dict = {}
        for i, value in enumerate(row):
            row_dict[column_names[i]] = value
        result.append(row_dict)
    
    return { 
    	'statusCode': 200,  
    	'body': json.dumps(result, cls=CustomJSONEncoder) 
    }