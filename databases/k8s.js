var exampledevice = require('./../example_data/exampledevice.json');
var exampletemplate = require('./../example_data/exampletemplate.json');
var exampleuser = require('./../example_data/exampleuser.json');
const tokenpath = "/var/run/secrets/kubernetes.io/serviceaccount/token";
var fs = require('fs');
var token = fs.readFileSync(tokenpath,'utf8');
var https = require('https');
if (process.env.NAMESPACE){
    var namespace = process.env.NAMESPACE;
}else{
    var namespace = "user2-qiothackfest";
}
var k8sca = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt', 'utf-8');
var k8shostname = "openshift.default.svc.cluster.local";

const templatesConn = {
    hostname: k8shostname,
    port: process.env.KUBERNETES_SERVICE_PORT,
    path: '/apis/rciots.com/v1/namespaces/' + namespace + '/edgetemplates/',
    headers: {
       Authorization: 'Bearer ' + token
    },
    ca: k8sca,
    rejectUnauthorized: true
};
const devicesConn = {
    hostname: k8shostname,
    port: process.env.KUBERNETES_SERVICE_PORT,
    path: '/apis/rciots.com/v1/namespaces/' + namespace + '/edgedevices/',
    headers: {
       Authorization: 'Bearer ' + token
    },
    ca: k8sca,
    rejectUnauthorized: true
};
var initdb = function(){
// nothing to do.
}
var creardb = function (db,doc){
// nothing to do.
}
var insertdb = function (db,doc){
    if (db === "templates"){
        var optionsConn = JSON.parse(JSON.stringify(templatesConn));
    } else if (db === "devices"){
        var optionsConn = JSON.parse(JSON.stringify(devicesConn));
        var tempDevice = {};
        var name = doc.name + " " + Math.random() * (10000 - 1) + 1;
        tempDevice.apiVersion = "rciots.com/v1";
        tempDevice.kind = "EdgeDevice";
        tempDevice.metadata = {};
        tempDevice.metadata.name = doc.hwid;
        tempDevice.metadata.namespace = namespace;
        delete doc._id;
        tempDevice.spec = doc;
        tempDevice.spec.name = name;
        tempDevice.spec.owner = "test.user";
        optionsConn.path = optionsConn.path + doc.hwid;
        var data = JSON.stringify(tempDevice);

    } else{
        return("invalid db type.");
    }
    optionsConn.method = "POST";
    const req = https.request(optionsConn, res => {
        res.on('data', d => {
          process.stdout.write(d);
        })
      })
      req.on('error', error => {
        console.error(error);
      });
      req.write(data);
      req.end();     
}
var searchuser = function (data, callback){
    return callback(data);         
}
var searchtemplate = function (data, callback){
    console.log("run k8s searchtemplate");
    var optionsConn = JSON.parse(JSON.stringify(templatesConn));
    optionsConn.method = "GET";
    optionsConn.path = optionsConn.path + data;
    const req = https.request(optionsConn, res => {
        var datareq = [];
        res.on('data', d => {

            datareq.push(d);
        }).on('end', function() {
            //at this point data is an array of Buffers
            //so Buffer.concat() can make us a new Buffer
            //of all of them together
            if (res.statusCode == "404"){
                console.log ("statuscode: " + res.statusCode);
                return callback("template_not_found");
            }
            var buffer = Buffer.concat(datareq);
            return callback(JSON.parse(buffer).spec);
        });
        req.on('error', error => {
            console.error(error);
            return callback("template_not_found");
        });
    });
    req.end();
}
var searchdevice = function(data, callback){
    var optionsConn = JSON.parse(JSON.stringify(devicesConn));
    optionsConn.method = "GET";
    optionsConn.path = optionsConn.path + data;
    const req = https.request(optionsConn, res => {
        var datareq = [];
        res.on('data', d => {
          datareq.push(d);
        }).on('end', function() {
            //at this point data is an array of Buffers
            //so Buffer.concat() can make us a new Buffer
            //of all of them together
            if (res.statusCode == "404"){
                return callback("device_not_found");
            }
            var buffer = Buffer.concat(datareq);
            return callback(JSON.parse(buffer).spec);
        });
        req.on('error', error => {
            console.error(error);
            return callback("device_not_found");
        });
    });
    req.end();         
}
var setdevicestatus = function (hwid,doc){
    var optionsConn = JSON.parse(JSON.stringify(devicesConn));
    var tempDevice = {};
    tempDevice.apiVersion = "rciots.com/v1";
    tempDevice.kind = "EdgeDevice";
    tempDevice.metadata = {};
    tempDevice.metadata.name = hwid;
    tempDevice.metadata.namespace = namespace;
    var tempDevice2 = JSON.parse(JSON.stringify(tempDevice));
    tempDevice2.status = new Object;


    doc.forEach(plugin => {
        console.log("status.name: ");
        console.log(plugin.name);
        tempDevice2.status[plugin.name] = plugin;
    });
    optionsConn.path = optionsConn.path + hwid;
    var optionsConn2 = JSON.parse(JSON.stringify(optionsConn));
    var data = JSON.stringify(tempDevice);
    optionsConn.method = "GET";
    optionsConn2.method = "PUT";
    const req = https.request(optionsConn, res => {
        var datareq = [];
        res.on('data', d => {
            datareq.push(d);
        }).on('end', function() {
            //at this point data is an array of Buffers
            //so Buffer.concat() can make us a new Buffer
            //of all of them together
            var buffer = Buffer.concat(datareq);
            tempDevice2.metadata.resourceVersion = JSON.parse(buffer).metadata.resourceVersion;
            tempDevice2.spec = JSON.parse(buffer).spec;
            const req2 = https.request(optionsConn2, res2 => {
                res2.on('data', d2 => {
                    process.stdout.write(d2);
                })
            })
            req2.on('error', error2 => {
                console.error(error2);
              });
            req2.write(JSON.stringify(tempDevice2));
            req2.end();
        });
    })
      req.on('error', error => {
        console.error(error);
      });
      req.end();      
}
module.exports = {
    initdb,
    creardb,
    insertdb,
    searchuser,
    searchtemplate,
    searchdevice,
    setdevicestatus
}