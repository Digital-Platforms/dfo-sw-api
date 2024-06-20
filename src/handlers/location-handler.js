// Create clients and set shared const values outside of the handler.
const { LocationClient, BatchGetDevicePositionCommand } = require('@aws-sdk/client-location');


const locClient = new LocationClient("ca-central-1");

exports.getAssetLastLocation = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAssetLastLocation only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All console.info/log statements are written to CloudWatch
    console.info('****************************');
   // console.info('received event:', JSON.stringify(event));
    console.info('****************************');

    var qsAssetIds = "";
    var trackerName = "";
    var alertThreshold = 0;
    
    if (event.queryStringParameters.hasOwnProperty('tracker')){
        trackerName = event.queryStringParameters.tracker;
        if (event.queryStringParameters.hasOwnProperty('assetIds')){
            qsAssetIds = event.queryStringParameters.assetIds;
        }else{
            throw new Error("Request missing required 'assetIds' querystring parameter");
        }
    }else{
        throw new Error("Request missing required querystring 'tracker' parameter");
    }
    if (event.queryStringParameters.hasOwnProperty('threshold')){
        alertThreshold = event.queryStringParameters.threshold;
    }
    
    let response = {};
    var assetIdArray = qsAssetIds.split(",");

    console.info(assetIdArray);

    var params = {
        DeviceIds: assetIdArray,
        TrackerName: trackerName
    };

    try{
        const resp = await locClient.send(new BatchGetDevicePositionCommand(params));
        console.log(JSON.stringify(resp));
        var respArray = resp.DevicePositions; //JSON.parse(resp);
        const mappedResponse = respArray.map(item=>{
            const deviceObj = item;
            deviceObj.OutOfRange = 0;
            //console.log("SampleTime: " + item.SampleTime);
            let readingDate = new Date(item.SampleTime);
            let today = Date.now();
            //console.log("readingDate in ms: " + readingDate.getTime());
            //console.log("Now in ms:" + today);
            
            if (today - readingDate.getTime() > (1000*60*60*48)){
                deviceObj.OutOfRange = 1;
            }
            return deviceObj;
        });
        console.log(JSON.stringify(mappedResponse));
        
        //let resp_obj = Object.assign({}, { locations: mappedResponse });
        response.statusCode = 200;
        response.body = JSON.stringify(mappedResponse);
    }
    catch(e){
        //TODO: Improve error handling to tell when error is with client side request(missing querystring arguments) or the server side...
        console.info(e);
        console.error(`Failed trying to listAssociatedAssets for Sitewise Asset. Error ${e}`);
        response.statusCode = 500;
        response.body = JSON.stringify({"msg": "FAILED"});
    }
    
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode}`);

    return response;
}
