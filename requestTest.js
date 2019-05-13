var request = require('request');
var http = require("http");
var requrl = 'http://jandan.net/ooxx/page-1319';


function onRequest(req,res) {
    request(requrl, function (error, response, body) {
        res.writeHead(200, {'Content-Type': 'text/txt;charset=utf-8'});
        if (!error && response.statusCode == 200) {
            res.end('“' + body + '“');
        }
    })
}

http.createServer(onRequest).listen(3002);
console.log("Open http://127.0.0.1:3002");