var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router=express.Router();
var DButilsAzure = require('../DButils');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var superSecret="NetaAndNir";


router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
module.exports = router;
router.use(morgan('dev'));
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
//register
router.post('/register',function(req,res){
     var userName=req.body.userName;
     var userPassword=req.body.userPassword;
     var firstName=req.body.firstName;
     var lastName = req.body.lastName;
     var city=req.body.city;
     var country=req.body.country;
     var email=req.body.email;
     var verifyQuestion1=req.body.verifyQuestion1;
    var verifyAnswers1=req.body.verifyAnswer1;
    var verifyQuestion2=req.body.verifyQuestion2;
    var verifyAnswers2=req.body.verifyAnswer2;
    var categories=req.body.categories;
    DButilsAzure.execQuery("select * from Users where username = '"+userName+ "'")
        .then(function (result) {
            if (result.length!=0) {
               res.send('UserName Allready exist');
            }
            else
            {
                DButilsAzure.execQuery("insert into Users (username, password, firstName, lastName, city, country, mail, verification_question1, verification_answer1, verification_question2, verification_answer2 ) " +
                    "VALUES ( '" +userName +"','"+userPassword+"','"+firstName+"','"+lastName+"','"+city+"','"+country+"','"+email+"','"+verifyQuestion1+"','"+verifyAnswers1+"','"+verifyQuestion2+"','"+verifyAnswers2+"')")
                    .then(function (result) {

                    }).catch(function (err) {
                        console.log(err)

                    })
                for (let i=0;i<categories.length;i++) {
                    DButilsAzure.execQuery("insert into UserCategories (userame, category) " +
                        "VALUES ( '" + userName + "','" + categories[i] + "')")
                        .then(function (result) {
                            if (i=categories.length)
                                res.send("success");

                        }).catch(function (err) {
                        res.send("eror");
                    })
                }
            }
        })
        .catch(function (err) {
            res.send("eror");
        })
});
//getVerificationQuestions
router.get('/getVerificationQuestions', function(req,res){
    var userName=req.param("userName");
    DButilsAzure.execQuery("select * from Users where username= '"+userName+"'")
        .then(function (result) {
            var data ={
             ver_quest1:   result[0].verification_question1,
             ver_quest2:   result[0].verification_question2
            }
            res.send(data);
        }).catch(function (err) {
        console.log(err)

    })
});
//getPassword
router.post('/getPassword', function(req,res){
        var userName=req.body.userName;
        var verifyAnswers1=req.body.verifyAnswer1;
        var verifyAnswers2=req.body.verifyAnswer2;
    DButilsAzure.execQuery("select * from Users where username= '"+userName+"'")
        .then(function (result) {
            if (result[0].verification_answer1==verifyAnswers1&&result[0].verification_answer2==verifyAnswers2)
            {
                res.send(result[0].password);
            }
            else
            {
                res.send("please try again with another answer");
            }
        }).catch(function (err) {
        res.send("error");

    })
});
//login
router.post('/login', function(req,res){

   var userName=req.body.userName;
   var userPas=req.body.password;
    DButilsAzure.execQuery("select password from Users where username= '"+userName+"'")
        .then(function (result) {
            if (result.length>0&&result[0].password==userPas)
            {
                SignToken(userName,res);
            }
            else
            {
                if (result.length==0)
                    res.send("user name does not exist");
                else
                    res.send("Wrong Password");
            }

        }).catch(function (err) {
    console.log(err)

})

});
//SignToken
function SignToken(userName,res) {
    var payload = {
        userName: userName
    }
    var token = jwt.sign(payload, superSecret, {
        expiresIn: "1d"
    });
    //JSON
    res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
    });

}
//getUserFavoriteCategories
router.get('/reg/getUserFavoriteCategories', function(req,res){
    var userName= req.decoded.payload.userName;
    DButilsAzure.execQuery("select * from UserCategories where userame= '"+userName+"'")
        .then(function (result) {
            var toReturn=[];
            for (let i=0;i<result.length;i++)
            {
                toReturn.push(result[i].category);
            }
            res.send(toReturn);
        }).catch(function (err) {
        console.log(err)

    })
});
