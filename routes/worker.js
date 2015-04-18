var AWS = require('aws-sdk'),
	util = require('util');
// configure AWS
AWS.config.update({
    'region': 'us-east-1',
    'accessKeyId': 'AKIAJITEJ3RQWZ4AKUKQ',
    'secretAccessKey': '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'
});

var sqs = new AWS.SQS();

var params = {
	QueueUrl: 'https://sqs.us-east-1.amazonaws.com/937582816189/tweets', /* required */
	MaxNumberOfMessages: 1,
	MessageAttributeNames: [
	  'tweetID'
	],
	VisibilityTimeout: 0,
	WaitTimeSeconds: 0
};
sqs.receiveMessage(params, function(err, data) {
	if (err) console.log(err, err.stack); // an error occurred
	else     console.log(data);           // successful response
});