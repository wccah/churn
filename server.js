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

var Schema = mongoose.Schema;

var CardSchema = new Schema({
    name: String,
    deadline: Date,
    reward: Number,
    rewardUnit: String,
    minSpend: Number,

    balance: Number
});

var BalanceSchema = new Schema({
    cardid: { type: Schema.Types.ObjectId, required:true, Ref: 'Card' },
    asOf: Date,
    amount: Number
});

var CardModel    = mongoose.model('Card', CardSchema);
var BalanceModel = mongoose.model('Balance', BalanceSchema);

var combo = function(req) {
    var rv = req.params || {};

    for(var x in req.body) {
        rv[x] = req.body[x];
    }

    return rv;
};

var queryModel = function(req,res, model, pop) {
    var p = combo(req);

    var f = model.find(p);
    if(pop) {
        f = f.populate(pop);
    }
    f.exec(function (err, items) {
        if (!err) {
            if(pop){
                console.log(items);
            }
            res.send(items);
        } else {
            res.send(err);
        }
    });
};

var doSave = function(res, c, msg, saveFn) {
    c.save(function(err) {
        if(err) {
            console.log('save err', err);
            res.send(500, err);
        } else {
            console.log('save success ', msg, c);

            if (saveFn) {
                saveFn(res, c._doc);
            } else {
                res.send(200, msg);
            }
        }
    });
};

var saveModel = function(req,res, model, saveFn) {
    var p = combo(req);

    if(p._id) {
        console.log('update');
        model.findById(p._id, function(err, item) {
            if(err) {
                res.send(500, err);
            } else if (!item) {
                console.log('attempting to save to an item that does not exist');
                res.send(500, 'item not found');
            } else {
                for (var x in p) {
                    item[x] = p[x];
                }
                doSave(res, item, 'update', saveFn);
            }
        });
    } else {
        var c = new model(p);
        doSave(res, c, 'create', saveFn);
    }
};

var delModel = function(req,res, model) {
    model.findByIdAndRemove(req.params._id, function(err) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(200,'deleted');
        }
    });
};

var resty = function(str, model, popOrSaveFn) {
    console.log('resty ', str);

    var pop;
    var saveFn;

    if ( typeof popOrSaveFn === 'string') {
        pop = popOrSaveFn;
    } else {
        saveFn = popOrSaveFn;
    }

    app.get('/api/' + str, function(req,res) {
        console.log('GET /api/' + str);
        queryModel(req, res, model, pop);
    });
    // TODO: refactor POST with PUT+PATCH
    app.post('/api/' + str, function(req,res) {
        console.log('POST /api/' + str);
        saveModel(req, res, model, saveFn);
    });

    app.put('/api/' + str + '/:_id', function(req, res ) {
        console.log('PUT /api/' + str + '/:_id');
        model.findByIdAndUpdate(req.params._id, req.body, function(err, ))
    });

    app.delete('/api/' + str + '/:_id', function(req,res) {
        console.log('DELETE /api/' + str + '/' + req.params._id);
        delModel(req, res, model);
    });
};

resty('cards', CardModel);
resty('cards/:cardid/balances', BalanceModel, function(res, bal) {
    CardModel.findByIdAndUpdate(bal.cardid, {balance:bal.amount}, function(err, card) {
        if(err) {
            res.send(500, err);
        } else {
            res.send(200, 'saved');
        }
    });
});

var addr = {
    port: process.env.PORT || 3000,
    address: process.env.IP || "0.0.0.0"
};

app.listen(addr.port, addr.address, function() {
    console.log("Chat server listening at", addr.address + ":" + addr.port);
});
