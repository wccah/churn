var path = require('path');
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

mongoose.connect('mongodb://churn:churn@localhost/churn');

app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.resolve(__dirname, 'app')));
//app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

var Schema = mongoose.Schema;

var CardSchema = new Schema({
    name: String,
    deadline: Date,
    reward: Number,
    rewardUnit: String,
    minSpend: Number,

    balances: [{type: Schema.Types.ObjectId, ref: 'Balance'}]
});

var BalanceSchema = new Schema({
    cardid: {type: Schema.Types.ObjectId, required:true},
    asOf: Date,
    amount: Number
});

var CardModel = mongoose.model('Card', CardSchema);
var BalanceModel = mongoose.model('Balance', BalanceSchema);

var queryModel = function(req,res, model, pop) {
    var f = model.find();
    if(pop) {
        console.log('pop', pop);
        f = f.populate(pop);
    }
    f.exec(function (err, items) {
        console.log('find ', err, items);
        if (!err) {
            return res.send(items);
        } else {
            res.send(err);
            console.log(err);
        }
    });
};

var saveModel = function(req,res, model){
    var doSave = function(c, msg) {
        c.save(function(err){
            if(err){
                console.log('save err', err);
                res.send(500, err);
            } else {
                console.log('save success');
                res.send(200, msg);
            }
        });
    };

    if(req.body._id) {
        console.log('update');
        model.findById(req.body._id, function(err,item){
            if(err){
                res.send(500,err);
            } else {
                for(var x in req.body){
                    item[x] = req.body[x];
                }
                doSave(item, 'update');
            }
        });
    } else {
        console.log('create');
        var c = new model(req.body);
        doSave(c, 'create');
    }
};

var delModel = function(req,res, model){
    model.findById(req.params._id, function(err, foundItem){
        console.log('found?');
        if (err) {
            res.send(500, err);
        } else {
            foundItem.remove(function(err, deadItem){
                if(err) {
                    res.send(500,err);
                } else {
                    model.findById(deadItem._id, function(err){
                        if(err) {
                            res.send(500,err);
                        } else {
                            res.send(200,'deleted');
                        }
                    });
                }
            });
        }
    });
};

var resty = function(str, model, pop) {
    app.get('/api/' + str, function(req,res) {
        console.log('GET /api/' + str);
        queryModel(req,res, model, pop);
    });

    app.post('/api/' + str, function(req,res) {
        console.log('POST /api/' + str);
        console.log('body: ', req.body);

        saveModel(req,res, model);
    });

    app.delete('/api/' + str + '/:_id', function(req,res) {
        console.log('DELETE /api/' + str + '/' + req.params._id);
        console.log('params: ', req.params);
        console.log('body: ', req.body);

        deleteModel(req,res, model);
    });
};

resty('cards', CardModel, 'balances');
resty('balances', BalanceModel);

var port = process.env.PORT || 3000;
var myip = process.env.IP || "0.0.0.0";

app.listen(port, myip, function(){
    var addr = { address: myip, port: port };
    console.log("Chat server listening at", addr.address + ":" + addr.port);
});
