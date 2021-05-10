const express = require('express');
var fs = require('fs');
const app = express();
const httpServer = require("http").createServer(app);
const port = 8080;
const io = require("socket.io")(httpServer);
if ((!process.env.DATABASE_TYPE) || (process.env.DATABASE_TYPE = "")) {
    //default k8s
    var databaseType = "k8s";
} else {
    var databaseType = process.env.DATABASE_TYPE;
}
const datastore = require("./databases/" + databaseType + ".js");
//deprecated: used to create initial couchdb databases
//if (databaseType == "couchdb"){
//    datastore.initdb();
//}
console.log(datastore);
io.on('connection', function(socket){
    socket.hwid = socket.handshake.auth.hwid;
    console.log('client connected: ' + socket.hwid);
    socket.on('device_enroll', (data) => {
        datastore.searchdevice(data.hwid, function(device){
            datastore.searchtemplate(data.token, function(templatedb){
                if((templatedb) && (templatedb != "template_not_found")){
                    datastore.searchuser(templatedb.owner, function(userdb){
                        if(userdb){
                            buildcfg(data, device, templatedb, userdb, function(devcfg){
                                if ((!device) || (device == "device_not_found")) {
                                    devcfg.name = templatedb.device_name;
                                    devcfg.description = templatedb.description;
                                    var newdevice = { name: templatedb.device_name,
                                        _id: data.hwid,
                                        hwid: data.hwid,
                                        token: data.token,
                                        description: templatedb.description
                                    };
                                    datastore.insertdb('devices', newdevice);
                                    socket.emit("devicecfg", devcfg);
                                } else {
                                    socket.emit("devicecfg", devcfg);
                                }
                            });
                        }else{
                            console.log("user not found.");
                        }
                    });
                }else{
                    console.log("token not found.");
                }
            });
        });
    });
    socket.on('disconnect', reason => {
        console.log("client disconnected.");
        console.log(reason);
    });
    socket.on('update_plugins', (updateData) =>{
        datastore.setdevicestatus(socket.hwid,updateData);
    });
});
io.use((socket, next) => {
    console.log("connection incomming");
    const token = socket.handshake.auth.token;
    console.log("token: " + token);
    console.log("hwid: " + socket.handshake.auth.hwid);
    datastore.searchtemplate(token, function(template){
        console.log(template);
        if(template){
            datastore.searchuser(template.owner, function(user){
                if(user){
                    next();
                }
            });
        }
    });
});
httpServer.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
var buildcfg = function (req, device, template, user, callback){
    var deviceconfig = JSON.parse(JSON.stringify(template));
    deviceconfig.name = device.name;
    deviceconfig.description = device.description;
    ['_id','_rev','uid','token','owner', 'device_name','credentials'].forEach(e => delete deviceconfig[e]);
    return callback(deviceconfig);
}