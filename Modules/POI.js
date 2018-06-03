var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router=express.Router();
var DButilsAzure = require('../DButils');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var   superSecret="NetaAndNir";
var course=require('cors');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use(morgan('dev'));
module.exports = router;
//verify token
router.use('/reg', function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
    // verifies secret and checks exp
        jwt.verify(token, superSecret, function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            }
            else {
// if everything is good, save to request for use in other routes
// get the decoded payload and header
                var decoded = jwt.decode(token, {complete: true});
                req.decoded = decoded; // decoded.payload , decoded.header
                next();
            }
        })
    }
});

//get POI by ID
router.get('/getPOI/:id', function(req,res){
    var POiId=req.params.id;
    DButilsAzure.execQuery("select * from POl where ID= '"+POiId+"'")
        .then(function (result) {
            if (result.length>0)
                {
                    res.send(result[0]);
                }
                else
            {
                res.send("POI not exist");
            }
            res.send(data);
        }).catch(function (err) {
        console.log(err)

    })
});
//getAllPOI
router.get('/getAllPOI', function(req,res){
    DButilsAzure.execQuery("select * from POl ")
        .then(function (result) {
            res.send(result);
        }).catch(function (err) {
        console.log(err)

    })
});
// getPopular POI by minimum rank and amount
router.get('/getPopularPOI', function(req,res){
    var rank=req.param("rank");
    var amount=req.param("amount");

    DButilsAzure.execQuery("select * from POl where rank>='"+rank+"'")
        .then(function (result) {
            if (result.length>amount)
            {
                var toReturn= [];
                var randNumsArray= [];
                for(let i=0; i<amount;i++)
                {
                    var randVal= Math.floor((Math.random()*result.length));
                    while(randNumsArray.includes(randVal))
                    {
                        randVal= Math.floor((Math.random()*result.length));
                    }
                    randNumsArray.push(randVal);
                }
                for(let j=0;j<randNumsArray.length;j++)
                {
                    toReturn[j]= result[randNumsArray[j]];
                }
                res.send(toReturn);
            }
            else
            {
                res.send(result);
            }

        }).catch(function (err) {
        console.log(err)

    })
});
// get Last Uploaded POI
router.get('/getLastUploadedPOI/:amount', function(req,res){
    var amount=req.params.amount;
    DButilsAzure.execQuery("select * from POl Order By uploadTime DESC ")
        .then(function (result) {
            var toReturn=[];
            for (let i=0;i<amount;i++)
            {
                toReturn.push(result[i]);
            }
            res.send(toReturn);
        }).catch(function (err) {
        console.log(err)

    })
});
// get POI by Category
router.get('/getPOIbyCategory/:category', function(req,res){
    var category=req.params.category;
    DButilsAzure.execQuery("select * from POICategories JOIN POl ON  POICategories.POID=POl.ID  where POICategories.category = '"+category+"'")
        .then(function (result) {
            res.send(result);
        }).catch(function (err) {
        console.log(err)

    })
});
function get2POIFromCategory(categoryID)
{
    DButilsAzure.execQuery("select * from POICategories JOIN POl ON  POICategories.POID=POl.ID  where POICategories.category = '"+categoryID+"'")
        .then(function (result) {
            var poiToReturn=[];
            var randVal= Math.floor((Math.random()*result.length));
             poiToReturn[0]=result[randVal];
            var randVal2= Math.floor((Math.random()*result.length));
            while (randVal==randVal2)
                randVal2= Math.floor((Math.random()*result.length));
             poiToReturn[1]=result[randVal2];
            return poiToReturn;
        }).catch(function (err) {
        console.log(err)

    })
}
// Save POI to DB
router.post('/reg/savePOIToDb', function(req,res){
    var username= req.decoded.payload.userName;
  //  var username=req.body.username;
    var poiID=req.body.id;
    var timeStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    DButilsAzure.execQuery("Insert into savedPOI (POIID,username,Time) VALUES ( '"+poiID+"','"+username+"','"+timeStamp+"')")
        .then(function (result) {
            res.send("POI "+ poiID +" has been saved for user  "+ username);
        }).catch(function (err) {
        console.log(err)
        res.send("error");

    })
});
//getPOIRank
router.get('/getPOIRank/:id', function(req,res){
    var poiID=req.params.id;
    DButilsAzure.execQuery("select rank from POl where ID = '"+poiID+"'")
        .then(function (result) {
            res.send(result);
        }).catch(function (err) {
        console.log(err)

    })
});
//getPOIByName
router.get('/getPOIByName/:name', function(req,res){
    var poiName=req.params.name;
    DButilsAzure.execQuery("select * from POl where name = '"+poiName+"'")
        .then(function (result) {
            res.send(result);
        }).catch(function (err) {
        console.log(err)

    })
});
//deletePOIFromFavorits
router.delete('/reg/deletePOIFromFavorits',function(req,res){
    var userName= req.decoded.payload.userName;
    var poiID=req.body.id;
    DButilsAzure.execQuery("delete from savedPOI where username = '"+userName+"' and POIID='"+poiID+"'")
        .then(function (result) {
            res.send("POI "+poiID + " has been removed from favorites of username "+userName);
        }).catch(function (err) {
        console.log(err)
        res.send("error");

    })

});
//postPOIReviwe
router.post('/reg/postPOIReviwe', function(req,res){
    var poiID=req.body.id;
    var userName= req.decoded.payload.userName;
    var POIreviwe=req.body.reviwe;
    DButilsAzure.execQuery("select * from POIReviews where username = '"+ userName+"' and POID='"+poiID+"'")
        .then(function (result) {
            if ( result.length>0)
            {
                res.send("user name allready ranked this POI")
            }
            else {
                DButilsAzure.execQuery("Insert into POIReviews (POID,username,review) VALUES ( '" + poiID + "','" + userName + "','" + POIreviwe + "')")
                    .then(function (result) {
                        res.send("Review has been uploaded");
                    }).catch(function (err) {
                    res.send("error");
                })
            }
        }).catch(function (err) {
        res.send("error");
    })
});
//posrPOIRank
router.post('/reg/postPOIRank', function(req,res){
    var poiID=req.body.id;
    var userName= req.decoded.payload.userName;
    var POIrank=req.body.rank;

    DButilsAzure.execQuery("select * from POIRank where username = '"+ userName+"' and POID='"+poiID+"'")
        .then(function (result) {
            if ( result.length>0)
            {
                res.send("user name allready ranked this POI")
            }
            else {
                DButilsAzure.execQuery("Insert into POIRank (POID,username,rank) VALUES ( '" + poiID + "','" + userName + "','" + POIrank + "')")
                    .then(function (result) {
                    }).catch(function (err) {
                    console.log(err)
                })
                var newRank = 0;
                DButilsAzure.execQuery("Select rank from POIRank where POID='" + poiID + "'")
                    .then(function (result) {
                        var sum = 0;
                        for (let i = 0; i < result.length; i++) {
                            sum = sum + result[i].rank;
                        }
                        newRank = sum / result.length;
                        DButilsAzure.execQuery("Update POl set rank='" + newRank + "' where ID='" + poiID + "'")
                            .then(function (result) {
                                res.send("rank has been uploaded");
                            }).catch(function (err) {
                            res.send("error");
                        })
                    }).catch(function (err) {
                    res.send("error");
                })
            }
        }).catch(function (err) {
        res.send("error");
    })
});
//getSavedPOI
router.get('/reg/getSavedPOI', function(req,res){
    var userName= req.decoded.payload.userName;
    var toReturn=[];
    DButilsAzure.execQuery("select POIID from savedPOI where username = '"+userName+"'")
        .then(function (result) {
            for(let i=0;i<result.length;i++)
            {
                DButilsAzure.execQuery("select * from POl where ID= '"+result[i].POIID+"'")
                    .then(function (result) {
                        toReturn.push(result[0])
                        if (i==result.length)
                            res.send(toReturn);
                    }).catch(function (err) {
                        console.log(err)
                })
            }
            if (result.length==0)
                res.send("there are no saved categories")
        }).catch(function (err) {
        console.log(err)
         })
});

//get 2 popular poi by 2 difrent user categories
router.get('/reg/get2PopularByUserCat', function(req,res){
    var userName= req.decoded.payload.userName;
   // var userName= req.params.userName;
    DButilsAzure.execQuery("select * from UserCategories where userame= '"+userName+"'")
        .then(function (result) {
            var randVal= Math.floor((Math.random()*result.length));
            var firstCat=result[randVal].category;
            var randVal2= Math.floor((Math.random()*result.length));
            while (randVal==randVal2)
                randVal2= Math.floor((Math.random()*result.length));
            var secCat=result[randVal2].category;
            var toReturn=[];
            DButilsAzure.execQuery("select * from POICategories JOIN POl ON  POICategories.POID=POl.ID  where POICategories.category = '"+firstCat+"'")
                .then(function (result1) {
                    var poiToReturn=[];
                    var randVal= Math.floor((Math.random()*result1.length));
                    poiToReturn[0]=result1[randVal];
                    var randVal2= Math.floor((Math.random()*result1.length));
                    while (randVal==randVal2)
                        randVal2= Math.floor((Math.random()*result1.length));
                    poiToReturn[1]=result1[randVal2];
                    toReturn[0]=poiToReturn;
                }).catch(function (err) {
                console.log(err)

            })
            DButilsAzure.execQuery("select * from POICategories JOIN POl ON  POICategories.POID=POl.ID  where POICategories.category = '"+secCat+"'")
                .then(function (result2) {
                    var poiToReturn=[];
                    var randVal= Math.floor((Math.random()*result2.length));
                    poiToReturn[0]=result2[randVal];
                    var randVal2= Math.floor((Math.random()*result2.length));
                    while (randVal==randVal2)
                        randVal2= Math.floor((Math.random()*result2.length));
                    poiToReturn[1]=result2[randVal2];
                    toReturn[1]=poiToReturn;
                    res.send(toReturn);
                }).catch(function (err) {
                console.log(err)

            })


        }).catch(function (err) {
        console.log(err)

    })
});

// updateViews
router.post('/updateViews/:poiID', function(req,res){
    var id=req.params.poiID;
    DButilsAzure.execQuery("select views from POl where ID='" + id + "'")
        .then(function (result) {
            var views=result[0].views+1;
            DButilsAzure.execQuery("Update POl set views='" + views + "' where ID='" + id + "'")
          .then(function (result1) {
              res.send("views for poID "+id + " has been updated ");
         }).catch(function (err) {
         console.log(err)
                res.send("error");
           })
        }).catch(function (err) {
        console.log(err)
        res.send("error");

    })
});
