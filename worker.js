var sentiment = require('sentiment');
var AWS = require('aws-sdk'),
	awsCredentialsPath = './credential.json',
	util = require('util');
// configure AWS
AWS.config.loadFromPath(awsCredentialsPath);
// db
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var dbserver = '54.201.53.120';
var dbport = 27017;
var db;

var sqs = new AWS.SQS();


// init db
var dbClient = new MongoClient(new Server(dbserver, dbport));
dbClient.open(function(err, client) {
	if(err) {
		console.log(err);
	} else {
		db = client.db('TweetMap');
		if(!db.collection('tweets')) {
			db.createCollection('tweets', function(err, col) {
				if(err) {
					console.log('Creating collection failed');
				} else {
					console.log('Collection \'tweets\' created');
				}
			});
		}
	}
});


// get message from queue
var params = {
	QueueUrl: 'https://sqs.us-east-1.amazonaws.com/937582816189/tweets', 
	MaxNumberOfMessages: 1,
	MessageAttributeNames: [
	  'tweetID'
	],
	VisibilityTimeout: 20,
	WaitTimeSeconds: 20
};
setInterval(function (){
	sqs.receiveMessage(params, function(err, data) {
		if (err) console.log(err, err.track);  // an error occurred
		else{ // got a message from queue
			if (data.Messages == undefined ){
				return;
			}
			// sentiment analysis
			var comparative = sentiment(data.Messages[0].Body).comparative;
			// update sentiment in db
			var item = {
				_id: new ObjectID(data.Messages[0].MessageAttributes.tweetID.StringValue)
			};
			var update = {
				$set:{
					sentiment: comparative
				}
			};
			db.collection('tweets').update(item, update, false, function(err, result) {
				if(err) {
					console.log('Updating doc failed');
				}
				else{// Updated 
					// delete message from queue
					console.log(result);
					var paramsD = {
						QueueUrl: 'https://sqs.us-east-1.amazonaws.com/937582816189/tweets',
						ReceiptHandle: data.Messages[0].ReceiptHandle
					};

					sqs.deleteMessage(paramsD, function (err, data){
						if (err) console.log(err, err.stack);
						else	console.log(data);
					});
				}
			});
		}              
	});
},
1000);

