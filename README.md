# TweetMap
The map clusters tweets as to show where people are tweeting the most, according to the sample tweets got from the streaming API.
* Records the tweet ID, time, and other relevant elements into a DB (SQL or NoSQL)
* After the tweet is recorded in the DB send a message to the Queue for Asynchronous processing on the text of the tweet
* Presents the Tweet in a map that is being updated in Near Real Time (Consider evaluating WebSockets, or Server Side Events for your implementation)
* The map clusters tweets as to show where is people tweeting the most, according to the sample tweets you get from the streaming API.
* Define a worker pool that will pick up messages from the queue to process. These workers should each run on a separate pool thread.
* Make a call to the sentiment API off your preference (e.g. Alchemy). This can return a positive or negative sentiment evaluation for the text of the submitted Tweet.
* As soon as the tweet is processed send a notification -using SNS- to an HTTP endpoint that will update the UI with the new information about the Tweet.
* Using this information your application should display the Tweet clusters and the overall sentiment.