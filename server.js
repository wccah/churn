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
            res.send(200, 'deleted');
        }
    });
};

var resty = function(str, model) {
    console.log('resty ', str);

    app.get('/api/' + str + '/:_id', function(req, res) {
        console.log('GET /api/' + str + '/:_id');
        console.log(req.params);
        model.findById(req.params._id, function(err, item) {
            if (err) {
                res.send(500, err);
            } else if (!item) {
                res.send(404, 'item not found by id');
            } else {
                res.send(200, item);
            }
        });
    });

    app.get('/api/' + str, function(req, res) {
        console.log('GET /api/' + str + ' (ALL)');
        model.find().exec(function(err, items) {
           if (err) {
               res.send(500, err);
           } else {
               res.send(200, items);
           }
        });
    });

    app.post('/api/' + str, function(req, res) {
        console.log('POST /api/' + str);
        if (typeof req.body._id !== 'undefined') {
            res.send(500, {
                msg: "invalid id for POST",
                id: req.body._id
            });
        } else {
            var newModel = new model(req.body);
            newModel.save(function (err, newModel2, count) {
                if (err) {
                    res.send(500, err);
                } else if (count !== 1) {
                    res.send(500, {
                        msg: "no record updated",
                        count: count
                    });
                } else {
                    res.set({ location: '/api/' + str + '/' + newModel2._id });
                    res.send(200, 'created');
                }
            });
        }
    });

    app.patch('/api/' + str + '/:_id', function(req, res ) {
        console.log('PATCH /api/' + str + '/:_id');
        var b = req.body;
        b._id = req.params._id;
        model.findByIdAndUpdate(req.params._id, b, function(err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200, 'updated');
            }
        });
    });

    app.delete('/api/' + str + '/:_id', function(req,res) {
        console.log('DELETE /api/' + str + '/' + req.params._id);
        model.findByIdAndRemove(req.params._id, function(err) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200, 'deleted');
            }
        });
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
