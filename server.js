var restify = require('restify');  
var restMongoose = require('restify-mongoose');
var mongoose = require('mongoose/');
var config = require('./config');
console.log(config.creds.mongoose_auth);
var db = mongoose.connect(config.creds.mongoose_auth);
var Schema = mongoose.Schema;

/*
var mongodbServer = restify.createServer({
    formatters: {
        'application/json': function(req, res, body){
            if(req.params.callback){
                var callbackFunctionName = req.params.callback.replace(/[^A-Za-z0-9_\.]/g, '');
                return callbackFunctionName + "(" + JSON.stringify(body) + ");";
            } else {
                return JSON.stringify(body);
            }
        },
        'text/html': function(req, res, body){
            return body;
        }
    }
});
*/

var server = restify.createServer({
    name: 'restify.mongoose.examples.notes',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

//mongodbServer.use(restify.bodyParser());

var CardSchema = new Schema({
	name: String,
	deadline: Date,
	reward: Number,
	rewardUnit: String,
	minSpend: Number
});

var Card = mongoose.model('Card', CardSchema);

var cardRM = restMongoose(Card);

server.get('/api/cards', cardRM.query());
server.get('/api/card/:id', cardRM.detail());
server.put('/api/card', cardRM.insert());
server.patch('/ap/card/:id', cardRM.update());
server.del('/api/card/:id', cardRM.remove());

var port = process.env.port || 8080;
server.listen(port, function() {
	console.log('listening ', port);
});

