var Twitter = require('twitter');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var dbserver = '54.201.53.120';
var dbport = 27017;
var db;

var AWS = require('aws-sdk'),
	awsCredentialsPath = './credential.json',
	util = require('util');
// configure AWS
AWS.config.loadFromPath(awsCredentialsPath);

var sqs = new AWS.SQS();

var stall = true
var twitterStream;

var crawler = function(io) {
	// init database
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

	// init twitter API
	function init_crawler() {
		var client = new Twitter({
			consumer_key: 's2jdpYFgULDDuWXNCOFD7LWB6',
			consumer_secret: 'vFlcuvJrLBQ40QgftwaBhzCCOkVf34OP8F1IsUrm6ze6TflL2i',
			access_token_key: '1064868938-Fxmllk5jTahy8SMCGsKYCr5sIoSeXI4WDW2c2uT',
			access_token_secret: 'JMi5ZMktviBaikakSvTMXb2k0Qd8JfYXWhWzZcEkzzJsu'
		});
		
		client.stream('statuses/sample', function(stream) {
			twitterStream = stream;
			stream.on('data', function(tweet) {
				// still receiving data
				stall = false
				// only record tweets with location info
				if(tweet.coordinates && tweet.coordinates.coordinates) {
					var item = {
						text: tweet.text,
						coordinates: tweet.coordinates.coordinates,
						created_at: new Date(tweet.created_at),
						sentiment: null
					};
					// store in database
					db.collection('tweets').insert(item, function(err, result) {
						if(err) {
							console.log('Inserting doc failed');
						}
						else{
							var params = {
								MessageBody: tweet.text, /* required */
								QueueUrl: 'https://sqs.us-east-1.amazonaws.com/937582816189/tweets', /* required */
								DelaySeconds: 0,
								MessageAttributes: {
								    tweetID: {
								      DataType: 'String', /* required */
								      StringValue: result[0]._id.toHexString()
								    }
								  }
							};
							sqs.sendMessage(params, function(err, data) {
								if (err) console.log(err, err.stack); // an error occurred
								else     console.log('sent!');           // successful response
							});
						}
					});
					// push to clients
					io.emit('data', item);
				}
			});

			stream.on('error', function(error) {
				console.log(error);
			});
		});
	}
	
	init_crawler();

	// remove old tweets, run every 24hrs
	setInterval(function() {
		// remove tweets 24hrs before
		var params = {
			created_at: {$lt: new Date(Date.now() - 24*60*60*1000)}
		};
		db.collection('tweets').remove(params, function(err, result) {
			if(err) {
				console.log('Removing old tweets failed');
			} else {
				console.log(result + ' old tweets removed');
			}
		});
	}, 24*60*60*1000);

	// check if no data received in 90 secs
	setInterval(function() {
		if(!stall) {
			stall = true;
			return;
		}
		twitterStream.destroy();
		setTimeout(function() {
			init_crawler();
		}, 90*1000);
	}, 90*1000);
};

module.exports = crawler;