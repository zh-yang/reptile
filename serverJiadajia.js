// 一些依赖库
var http = require("http"),
    fs = require("fs"),
    xlsx = require('node-xlsx'),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy');

var ep = new eventproxy(),
    pageUrls = [],  //存放收集文章页面网站
    pageNum = 5,	//要爬取文章的页数
    pageStart = 1,  //爬取起始页数
    deleteRepeat = [], //去重哈希组
    catchData = [], //存放爬去的数据
    endDate = false; //结束时间

for (var i = pageStart; i <= pageNum; i++) {
    // url拼接
    pageUrls.push('http://jiadajia.cn/?index=' + i);
}

//抓取昵称、入园年龄、粉丝数、关注数
function personInfo(appUrl) {
    superagent.get(appUrl).end(function (err, res) {
        if (err) {
            console.log(err);
            return;
        }
        var $ = cheerio.load(res.text),
            $info = $('.history .content ul li'),
            len = $info.length;

        for (var j = 0; j < len; j++) {
            var $errorType = $info.eq(j).find('span.text-red'),
                $username = $info.eq(j).find('strong');
            var infoArray = {};

            if($username){
                infoArray.errorType = [$errorType.text().replace(/[\s【】]/g,"")];
                infoArray.userType = '淘宝账号';
                infoArray.username = $username.text();
                infoArray.times = 1;
                if(!isRepeat(infoArray)){
                    var samename = false,theIdx = 0;
                    try {
                        catchData.forEach(function (item,idx) {
                            if(item.username == infoArray.username){
                                samename = true;
                                theIdx = idx;
                                throw new Error("EndIterative");
                            }
                        });
                    } catch (e) {
                        if(e.message != "EndIterative"){
                            throw e;
                        }
                    }
                    if(samename){
                        if(catchData[theIdx].errorType.indexOf(infoArray.errorType[0] >= 0)){

                        }else{
                            catchData[theIdx].errorType.push(infoArray.errorType[0]);
                        }
                    }else{
                        catchData.push(infoArray);
                    }
                }
            }else {
                continue;
            }
        }
    })
}

// 判断作者是否重复
function isRepeat(infoArray) {
    var num = deleteRepeat.indexOf(infoArray);
    if (num >= 0) {
        return 1;
    } else{
        return 0;
    }
}

// 主start程序
function start() {
    function onRequest(req, response) {
        // 设置字符编码(去掉中文会乱码)
        // response.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        response.writeHead(200, {'Content-Type': 'application/json'});
        var startTime = new Date();
        console.log('start:',startTime);
        // 控制并发数
        var curCount = 0;
        var reptileMove = function (url, callback) {
            //延迟毫秒数
            var delay = parseInt(Math.random() * 1000, 10) + 5000;
            curCount++;
            console.log("现在的并发数是", curCount, "，正在抓取的是", url, "，耗时" + delay + "毫秒");

            //收集数据
            personInfo(url);

            //延时处理
            setTimeout(function () {
                curCount--;
                callback(null, url + "Call back content");
            }, delay);
        }

        // 使用async控制异步抓取
        // mapLimit(arr, limit, iterator, [callback])
        // 异步回调
        async.mapLimit(pageUrls, 5, function f(url, callback) {
            reptileMove(url, callback);
        }, function f1(err, result) {
            //URL 访问完成的回调函数
            // ...
            endDate = new Date();

            console.log('final:',endDate);
            console.log(result);
            var len = catchData.length;

            setTimeout(function () {
                response.end(JSON.stringify(catchData));
            },10000);


        });


    }

    http.createServer(onRequest).listen(3001);
    console.log("Open http://127.0.0.1:3001");
}
exports.start = start;
