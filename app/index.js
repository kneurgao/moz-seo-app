'use strict';

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded());

var crypto = require('crypto');
var http = require('http');
// `bigJs` is used for number-precision when summing the bitFlag values
var bigJs = require('big.js');

// Set your expires times for several minutes into the future.
// An expires time excessively far in the future will not be honored by the Mozscape API.
// Divide the result of Date.now() by 1000 to make sure your result is in seconds.
var expires = Math.floor((Date.now() / 1000)) + 300;
var accessId = 'mozscape-7e741b7560';
var secretKey = '7ddf584df61b4282cb915eeec465001';

// `bitFlagExampleValues` is a list of bitFlag values as strings that we'll
// loop over and sum together using helper function: `sumColumnValues`
var bitFlagExampleValues = ['4', '16384', '536870912', '34359738368', '68719476736'];
var sumColumnValues = function (bitFlagValues) {
    return bitFlagValues.reduce(function (accu, bitFlag) {
        var accuValBig = new bigJs(accu);
        var bitFlagBig = new bigJs(bitFlag);
        var bigSum = accuValBig.plus(bitFlagBig);

        return bigSum.toString();
    }, 0);
};

// 'cols' is the sum of the bit flags representing each field you want returned.
// Learn more here: https://moz.com/help/guides/moz-api/mozscape/api-reference/url-metrics
// returns "144115291155070976"
var cols = sumColumnValues(bitFlagExampleValues);

// Put each parameter on a new line.
var stringToSign = accessId + "\n" + expires;

//create the hmac hash and Base64-encode it.
var signature = crypto.createHmac('sha1', secretKey).update(stringToSign).digest('base64');
//URL-encode the result of the above.
signature = encodeURIComponent(signature);

// var postData = JSON.stringify(['www.moz.com', 'www.apple.com', 'www.pizza.com']);

app.post('/moz/url', function (req, res) {
    var body = req.body;
    console.debug('body=' + JSON.stringify(body));
    var url = body.text;

    var options = {
        hostname: 'lsapi.seomoz.com',
        path: '/linkscape/url-metrics/' + url + '?Cols=' +
            cols + '&AccessID=' + accessId +
            '&Expires=' + expires + '&Signature=' + signature,
        method: 'GET',
        // headers: {
        //     'Content-Type': 'application/json',
        //     'Content-Length': url.length
        // }
    };

    // var urls = [];
    // var url = body.text;
    // urls.push(url);
    // var postData = JSON.stringify(urls);
    // options.headers['Content-Length'] = postData.length;
    
    var mozRequest = http.request(options, function (mozResponse) {
        var data = "";
        mozResponse.setEncoding('utf8');
        mozResponse.on('data', function (chunk) {
            data += chunk;
        });
        mozResponse.on('end', function () {
            console.log('data=' + data);
            var urlMetrics = JSON.parse(data);
            res.status(200).send(urlMetrics);
        });
    });

    //Make the request.
    // mozRequest.write();
    mozRequest.end();
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Your app server is running...');
});
