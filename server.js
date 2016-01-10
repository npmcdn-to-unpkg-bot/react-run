//load variables
require('dotenv').load({silent: true});

var app      = require('koa')(),
    router   = require('koa-router')(),
    serve    = require('koa-static'),
    webpack  = require("webpack"),
    co       = require('co'),
    mongoose = require('mongoose'),
    views    = require('koa-views');

//store our models
var models;
//babel transformer
var babel = require("babel-core");
//id generator
var shortid = require('shortid');

// Send static files
app.use(serve('./public'));

// Use html
app.use(views("./views", {map: {html: 'swig'}}));

router.get('/', function *( next ) {

    //generate guid
    var id = shortid.generate();
    var newBin = new models.bin({id: id});

    var result = yield newBin.save();
    var newRevision = new models.binRevision({
        createdAt: new Date(),
        hash: "r_" + shortid.generate(),
        text: "",
        "_bin": result._id
    });

    yield newRevision.save();

    //temporary redirect
    this.redirect('/' + id);
    this.status = 302;

    //yield next;

});

router.get('/:bin', function *( next ) {

    var result = yield models.bin
        .findOne({'id': this.params.bin});

    //redirect to 404 if no bin
    if ( !result ) {
        this.status = 404;
        yield this.render('not_found', {});
        return;
    }

    var latestRevision = yield models.binRevision.findOne({"_bin": result._id});

    if ( !latestRevision ) {
        latestRevision = new models.binRevision({
            createdAt: new Date(),
            hash: "r_" + shortid.generate(),
            text: "",
            "_bin": result._id
        });
        yield latestRevision.save();
    }

    //temporary redirect
    this.redirect('/' + result.id + "/" + latestRevision.hash);
    this.status = 302;

    // yield next;

});

router.get('/:bin/:revision', function *( next ) {

    var bin = yield models.bin
        .findOne({'id': this.params.bin});

    //redirect to 404 if no bin
    if ( !bin ) {
        this.status = 404;
        yield this.render('not_found', {});
        return;
    }

    var binRevision = yield models.binRevision
        .findOne({'hash': this.params.revision});

    var otherRevisions = yield models.binRevision
        .find({'_bin': bin._id}).select({'hash': 1, 'createdAt': 1});

    //redirect to 404 if no bin
    if ( !binRevision ) {
        this.status = 404;
        yield this.render('not_found', {});
        return;
    }

    yield this.render('index', {code: binRevision.text, otherRevisions: otherRevisions});
});

//router
app
    .use(router.routes())
    .use(router.allowedMethods());

// This must come after last app.use()
var server = require('http').Server(app.callback()),
    io     = require('socket.io')(server);

io.on('connection', co.wrap(function *( socket ) {

    socket.on('code save', co.wrap(function *( data ) {
        try {
            if ( data.revision && data.bin && data.code ) {
                //saving
                var bin = yield models.bin.findOne({'id': data.bin});

                //find the code to the current revision
                var binRevision = yield models.binRevision
                    .findOne({'hash': data.revision});

                //don't resave the same code
                if ( binRevision.text === data.code ) {
                    return;
                }

                //create a new revision
                var newRevision = new models.binRevision({
                    hash: "r_" + shortid.generate(),
                    text: data.code,
                    createdAt: new Date(),
                    "_bin": bin._id
                });
                var newResult = yield newRevision.save();

                //save the result
                if ( newResult ) {
                    socket.emit("code saved", {
                        bin: data.bin,
                        revision: newResult.hash,
                        createdAt: newResult.createdAt
                    });
                }

            }
        } catch ( e ) {
            socket.emit("error saving", {bin: data.bin, revision: data.revision});
        }
    }));

    socket.on('code change', co.wrap(function* ( data ) {
        try {
            //TODO Since this is a pure function, we could memoize it for performance
            var result = babel.transform(data, {
                presets: ['react', 'es2015', 'stage-1']
            });
            socket.emit("code transformed", result.code);

        } catch ( e ) {
            socket.emit("code error", e.message);
        }
    }));

}));

mongoose.connect(process.env.MONGOLAB_URI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    //load our models
    models = require("./models")(mongoose);
    // we're connected!
    console.log('connected');
    //start the server
    var port = process.env.PORT || 3000;
    server.listen(port);
});


