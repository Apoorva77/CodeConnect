// Lambda function related to Dynamo db:-


// 1)CreateItem-

    //  Code -

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB({region: 'us-west-2'});

exports.handler = async (event) => {
    console.log(event);
    const project_id = Math.floor(1000 + Math.random() * 9000).toString();
    const project_name = event.project_name;
    const deadline = event.deadline;
    const level = event.level;
    const project_description = event.project_description;
    const techstack = event.techstack;
    
    console.log(project_id);
    console.log(project_name);

    const params = {
        TableName: 'project-metadata',
        Item: {
            'project_id': { 'S': project_id },
            'project_name': { 'S': project_name },
            'deadline': { 'S': deadline },
            'level': { 'S': level },
            'project_description': { 'S': project_description },
            'techstack': { 'S': techstack }
        }
    };

    
        await dynamoDb.putItem(params).promise();
        return {project_id:project_id.toString()};

    };








// 2)getProjectDetailsFromDb(used in step function to get recent inserted record) ➖
// Code ➖

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB({ region: 'us-west-2' });

exports.handler = async (event) => {
 
  const project_id = event.project_id || "6352";

  const params = {
    TableName: 'project-metadata',
    FilterExpression: '#l = :project_id',
    ExpressionAttributeNames: {
      '#l': 'project_id'
    },
    ExpressionAttributeValues: {
      ':project_id': { S: project_id }
    }
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    const projects = data.Items;

    const formattedProjects = projects.map(project => {
      return {
        project_name: project.project_name.S,
        techstack: project.techstack.S,
        level: project.level.S,
        project_id: project.project_id.S,
        deadline: project.deadline.S
      };
    });
  console.log(formattedProjects)
  const finalFormattedObject = formattedProjects[0];
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: finalFormattedObject
    };
    return finalFormattedObject;
  } catch (err) {
    console.log(err);
    const errorResponse = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify('Error fetching projects')
    };
    return errorResponse;
  }
};








// 3) getDataFromDynamoDb (based on filter):-

// Code:-

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB({ region: 'us-west-2' });

exports.handler = async (event) => {
  const techstack = event.techstack;
  const level = event.level;
  const project_id = event.project_id;

  const params = {
    TableName: 'project-metadata',
    FilterExpression: 'techstack = :techstack AND #l = :level AND project_id = :project_id',
    ExpressionAttributeNames: {
      '#l': 'level'
    },
    ExpressionAttributeValues: {
      ':techstack': { S: techstack },
      ':level': { S: level },
      ':project_id': { S: project_id }
    }
  };

  try {
    const data = await dynamoDb.scan(params).promise();
    const projects = data.Items;
    let formattedData = '[';
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const formattedProject = {};
      for (const key of Object.keys(project)) {
        formattedProject[key] = project[key].S || project[key].N || project[key].BOOL;
      }
      const jsonString = JSON.stringify(formattedProject);
      const formattedJsonString = jsonString.replace(/\\|"/g, '');
      formattedData += formattedJsonString;
      if (i !== projects.length - 1) {
        formattedData += ',';
      }
    }
    formattedData += ']';

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: formattedData
    };
    return response;
  } catch (err) {
    console.log(err);
    const errorResponse = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify('Error fetching projects')
    };
    return errorResponse;
  }
};










// 4)getAllProjects:-

// Code:-

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB( {region: 'us-west-2'});

exports.handler = async (event) => {
  try {
    const scanParams = {
      TableName: 'project-metadata',
    };
    const scanResult = await dynamodb.scan(scanParams).promise();

    const tableData = scanResult.Items.map((item) => {
      const rowData = {};
      for (const key of Object.keys(item)) {
        rowData[key] = item[key].S || item[key].N || item[key].BOOL;
      }
      return rowData;
    });
   let formattedData = '[';
    for (let i = 0; i < tableData.length; i++) {
      const jsonString = JSON.stringify(tableData[i]);
      const formattedJsonString = jsonString.replace(/\\|"/g, '');
      formattedData += formattedJsonString;
      if (i !== tableData.length - 1) {
        formattedData += ',';
      }
    }
    formattedData += ']';
    
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: formattedData
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Error retrieving data from DynamoDB',
    };
  }
};




// 5)SqsAndSns:-

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({region: 'us-west-2'});
const sns = new AWS.SNS({region: 'us-west-2'});

exports.handler = async (event) => {
  try {
    // Send a message to SQS queue
    const sqsParams = {
      MessageBody: JSON.stringify(event),
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/903040424166/project-queue'
    };
    await sqs.sendMessage(sqsParams).promise();

    // Publish a notification to SNS topic
    const snsParams = {
      Message: `New project enrollment:
        Project Name: ${event.project_name}
        Techstack: ${event.techstack}
        Level: ${event.level}
        Project ID: ${event.project_id}
        Deadline: ${event.deadline}`,
      TopicArn: 'arn:aws:sns:us-west-2:903040424166:project-notifications'
    };
    await sns.publish(snsParams).promise();
    
    // Purge the SQS queue
    const purgeParams = {
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/903040424166/project-queue'
    };
    await sqs.purgeQueue(purgeParams).promise();

    // Return a success message
    return 'SQS message sent and SNS notification published successfully.';
  } catch (err) {
    console.error(err);
    return 'Error: ' + err.message;
  }
};




// 6)VerifyUser:-

const AWS = require('aws-sdk');

exports.handler = async (event) => {
  // Extract the user's ID from the request, e.g., from query parameters
  const { userId } = event.queryStringParameters ;


  const cognito = new AWS.CognitoIdentityServiceProvider();

  // Set the parameters to check user verification status
  const params = {
    UserPoolId: 'us-west-2_Iu7EB9yDh',
    Username: userId
  };

  try {
    // Check if the user is verified in Cognito
    const user = await cognito.adminGetUser(params).promise();

    // Extract the 'UserStatus' attribute from the user data
    const userStatus = user?.UserStatus;
    

    if (userStatus === 'CONFIRMED') {
      // User is verified
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User is verified.' })
      };
    } else {
      // User is not verified
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'User is not verified.' })
      };
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' })
    };
  }
};



// 7)fileStoreInS3

const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  // Set the region for S3
  AWS.config.update({ region: 'us-west-2' });
  
  // Create an S3 instance
  const s3 = new AWS.S3();
  
  try {
    // Get the name of the PDF file from the event
    const fileName = event.fileName;
    const techstack = event.techstack;
    
    // Retrieve the list of existing S3 buckets
    const bucketList = await s3.listBuckets().promise();
    
    // Check if the file name matches any existing bucket names
    const matchingBucket = bucketList.Buckets.find(bucket => bucket.Name === techstack);
    
    if (matchingBucket) {
      // Upload the PDF file to the matching bucket
      await s3.upload({
        Bucket: matchingBucket.Name,
        Key: fileName,
        Body: event.fileName
      }).promise();
      
      console.log(`PDF file "${fileName}" uploaded to existing bucket "${matchingBucket.Name}".`);
    } else {
      // Create a new bucket using the file name with a timestamp appended
      const timestamp = Date.now();
      const newBucketName = `${fileName}-${timestamp}`;
      await s3.createBucket({ Bucket: newBucketName }).promise();
      
      // Upload the PDF file to the new bucket
      await s3.upload({
        Bucket: newBucketName,
        Key: fileName,
        Body: event.fileName
      }).promise();
      
      console.log(`PDF file "${fileName}" uploaded to new bucket "${newBucketName}".`);
    }
    
    return 'Success';
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};




