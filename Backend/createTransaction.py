Description: Lambda function to create a transaction
Written by: Apoorva Prabhu Renjal
Modified by: Apoorva Prabhu Renjal
Written on: 12-05-2023
Output: 'Transaction created successfully'


import pymysql
import boto3
import json
from datetime import date, datetime
import random
import string

# Create a Secrets Manager client
secretsmanager = boto3.client('secretsmanager', region_name='us-east-1')


def generate_random_string(length):
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

def lambda_handler(event, context):
 # Get the secret value from Secrets Manager
    secret_name = 'sm'
    response = secretsmanager.get_secret_value(SecretId=secret_name)

# Parse the JSON string in the response
    secret = json.loads(response['SecretString'])

    username = secret['username']
    password = secret['password']

 # Use the username and password to connect to the database
    endpoint = 'transact.cs45bcvsf5tx.us-east-1.rds.amazonaws.com'
    database_name = 'transact'
    connection = pymysql.connect(host=endpoint, user=username, password=password, db=database_name)
    cursor = connection.cursor()

    print(event)

    user_id = event['user_id']
    transacttype = event['transacttype']
    transactid = generate_random_string(10)
    transactamt = random.randint(1000,3000)
    transactdate = date.today()
    stats = event['stats']

 # Insert the values into the transactions table
    insert_query = "INSERT INTO transactions VALUES (%s, %s, %s, %s, %s, %s)"
    cursor.execute(insert_query, (user_id, transacttype, transactid, transactamt, transactdate, stats))
    
    connection.commit()
    
    return {
     'statusCode': 200,
     'body': json.dumps('Transaction created successfully')
    }