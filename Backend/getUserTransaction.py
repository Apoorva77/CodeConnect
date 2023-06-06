Description: Lambda function to get a particular transaction
Written by: Apoorva Prabhu Renjal
Modified by: Apoorva Prabhu Renjal
Written on: 14-05-2023
Output: "[{\"userid\": 2, \"transacttype\": \"UPI\", \"transactid\": \"pQiG3i3IaP\", \"transactamt\": \"2797\", \"transactdate\": \"2023-06-06\", \"stats\": \"COMPLETED\"}]"

import boto3
import json
import pymysql
from datetime import date, datetime

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)

def get_secret(secret_name):
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    
    if 'SecretString' in response:
        secret = response['SecretString']
        return json.loads(secret)
    else:
        decoded_binary_secret = base64.b64decode(response['SecretBinary'])
        return json.loads(decoded_binary_secret)
        
result= []

def fetch_transaction_details(user_id):
    # Fetch the secret containing the RDS connection details
    secret_name = 'sm' 
    secret = get_secret(secret_name)

    # Extract the RDS connection details from the secret
    rds_host = secret['host']
    username = secret['username']
    password = secret['password']
    db_name = secret['dbname']

    # Connect to the RDS database
    connection = pymysql.connect(host=rds_host, user=username, password=password, database=db_name)

    try:
        # Execute a SQL query to fetch the transaction details for the given user
        with connection.cursor() as cursor:
            sql_query = "SELECT * FROM transactions WHERE userid = %s"
            cursor.execute(sql_query, (user_id,))
            transaction_details = cursor.fetchall()
            column_names = [desc[0] for desc in cursor.description]
            for row in transaction_details:    #Retrieve the transaction details along with the attribute names
                row_dict = {}
                for i, value in enumerate(row):
                    row_dict[column_names[i]] = value
                result.append(row_dict)
        return result
        #print(transaction_details)
        
        
    finally:
    # Close the database connection
        connection.close()

def lambda_handler(event, context):
    user_id= event['user_id']
    fetch_transaction = fetch_transaction_details(user_id)
    #return json.dumps(r, cls=CustomJSONEncoder)
    return{
        'stausCode':200,
        'Body': json.dumps(fetch_transaction, cls=CustomJSONEncoder)
    }