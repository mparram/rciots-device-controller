var exampledevice = require('./../example_data/exampledevice.json');
var exampletemplate = require('./../example_data/exampletemplate.json');
var exampleuser = require('./../example_data/exampleuser.json');
var couchdbConnection = "http://" + process.env.COUCHDB_USER + ":" + process.env.COUCHDB_PASS + "@" + process.env.COUCHDB_SRV + ":" + process.env.COUCHDB_PORT;
var nano = require('nano')(couchdbConnection);
var initdb = function(){
    nano.db.list(function(list_err,list_body) {
        if(!list_err){
            list_body.forEach(database => {
                nano.db.destroy(database, function(destroy_err,destroy_ok) {
                    if (list_body[list_body.length - 1] === database) {
                        creardb('devices', exampledevice);
                        creardb('users', exampleuser);
                        creardb('templates', exampletemplate);
                    } else {
                        // something else
                    }
                });
            }); 
        } else {
            creardb('devices', exampledevice);
            creardb('users', exampleuser);
            creardb('templates', exampletemplate);
        }
    });
}
var creardb = function(db,doc){
    nano.db.create(db, function(err, body) {
        if (err) {
            console.log(err);
        } else {
            console.log('database ' + db + ' created!');
            const database = nano.use(db);
            if (Array.isArray(doc)){
                doc.forEach(element => {
                    database.insert(element, element._id, function(err,foo){
                        if(!err) {
                            } else {
                            console.log(err);
                            }
                    });         
                });
            } else {
                database.insert(doc, doc._id, function(err,foo){
                    if(!err) {
                        } else {
                        console.log(err);
                        }
                });
            }       
        }
    });    
}
var insertdb = function(db, doc){
    const database = nano.use(db);
    database.insert(doc, doc._id, function(err,foo){
        if(!err) {
        } else {
            console.log(err);
        }
    });            
}
var searchdevice = function(data, callback){
    const database = nano.use('devices');
    database.get(data, function(err,device){
        if(!err && device) {
            return callback(device);
        } else {
            return callback("device_not_found");
        }
    });          
}
var searchuser = function(data, callback){
    const database = nano.use('users');
    database.get(data, function(err,user){
        if(!err && user) {
            return callback(user);
        } else {
            if (err && err.code) {
                err.message = `${err.message} ${err.code}`;
              }
              if (err && err.description) {
                err.message = `${err.message} ${err.description}`;
              }
            console.log(err);
            return callback(false);
        }
    });          
}
var searchtemplate = function(data, callback){
    const database = nano.use('templates');
    database.get(data, function(err,template){
        if(!err && template) {
            return callback(template);
        } else {
            return callback(false);
        }
    });          
}
module.exports = {
    initdb,
    creardb,
    insertdb,
    searchdevice,
    searchuser,
    searchtemplate
}