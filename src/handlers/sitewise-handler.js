// Create clients and set shared const values outside of the handler.
const { IoTSiteWiseClient, ListAssociatedAssetsCommand, BatchGetAssetPropertyValueCommand } = require('@aws-sdk/client-iotsitewise');
const { getAssetLastLocation } = require('./location-handler');


const swClient = new IoTSiteWiseClient("ca-central-1");

exports.getAssociatedAssets = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAssociatedAssets only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All console.info/log statements are written to CloudWatch
    console.info('****************************');
    //console.info('received event:', JSON.stringify(event));
    console.info('****************************');

    var qsAssetIds = "";
    if (event.queryStringParameters.hasOwnProperty('assetIds')){
        qsAssetIds = event.queryStringParameters.assetIds;
    }else{
        throw new Error("Request missing required 'assetIds' querystring parameter");
    }
    
    let response = {};
    
    var assetIdArray = qsAssetIds.split(",");
    var resp_obj = {};
    var resp_array = [];
    try{
        for (const assetid of assetIdArray){
            try{
                console.info("asset_id=", assetid);
                let asset_id = assetid;
                if(assetid === "dfo-root"){
                    asset_id = "externalId:" + assetid;
                }
                var params = { // ListAssociatedAssetsRequest
                    assetId: asset_id, // required
                    traversalDirection: "CHILD",
                    maxResults: 100,
                };
                const resp = await swClient.send(new ListAssociatedAssetsCommand(params));
                console.info("iteration result=", JSON.stringify(resp));
                for(const asset of resp.assetSummaries){
                    resp_array.push(asset)
                }
            }
            catch(e){
                console.info(e);
                throw(e);
            }
        };
        //end of loop
        console.info("Loop done...did it wait?");
        //resp_obj = Object.assign({}, { assets: resp_array } );
        response.statusCode = 200;
        response.body = JSON.stringify(resp_array);

    }catch(e){
        console.error(`Failed trying to listAssociatedAssets for Sitewise Asset. Error ${e}`);
        response.statusCode = 500;
        response.body = JSON.stringify({"msg": "FAILED"});
    }
    
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode}`);

    return response;
}

/*
exports.getAssetProperty = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAssetProperty only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All console.info/log statements are written to CloudWatch
    console.info('****************************');
    //console.info('received event:', JSON.stringify(event));
    console.info('****************************');

    var qsAssetIds = "";
    var qsAssetPropertyName = "";
    if (event.queryStringParameters.hasOwnProperty('assetIds')){
        qsAssetIds = event.queryStringParameters.assetIds;
    }else{
        throw new Error("Request missing required 'assetIds' querystring parameter");
    }
    if (event.queryStringParameters.hasOwnProperty('assetPropertyName')){
        qsAssetPropertyName = event.queryStringParameters.assetPropertyName;
    }else{
        throw new Error("Request missing required 'assetPropertyName' querystring parameter");
    }
    
    let response = {};
    var assetIdArray = qsAssetIds.split(",");

    var params = { // BatchGetAssetPropertyValueRequest
        entries: [ 
          {
            entryId: "STRING_VALUE", // required
            assetId: "STRING_VALUE",
            propertyId: "STRING_VALUE",
            propertyAlias: "STRING_VALUE",
          },
        ],
        nextToken: "STRING_VALUE",
      };

    try{
        const resp = await swClient.send(new BatchGetAssetPropertyValueCommand(params));
//      console.log(JSON.stringify(result));
        let resp_obj = Object.assign({}, { dfoRegions: resp.assetSummaries });
        response.statusCode = 200;
        //response.count = result.Count;
        response.body = JSON.stringify(resp.assetSummaries);
    }
    catch(e){
        console.info(e);
        console.error(`Failed trying to listAssociatedAssets for Sitewise Asset. Error ${e}`);
        response.statusCode = 500;
        response.body = JSON.stringify({"msg": "FAILED"});
    }
    
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode}`);

    return response;
}
*/