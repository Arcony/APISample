var bcrypt = require('bcryptjs');
var models = require('../models');
var jwtUtils = require('../utils/jwt.utils');
var asyncLib = require('async');
const EMAIL_REGEX     = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX  = /^(?=.*\d).{4,8}$/;
//routes

module.exports = {
  register: function(req,res) {
    //Params
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var bio = req.body.bio;

    if (email == null || username == null || password == null) {
      return res.status(400).json({ 'error': 'missing parameters' });
    }

    if(username.length >= 13 || username.length <= 4) {
      return res.status(400).json({ 'error': 'Username Too short/long'});
    }

    if(!EMAIL_REGEX.test(email)){
        return res.status(400).json({ 'error': 'Email Wrong'});
    }

    if(!PASSWORD_REGEX.test(email)){
        return res.status(400).json({ 'error': 'Password Wrong'});
    }

    asyncLib.waterfall([
     function(done) {
       models.User.findOne({
         attributes: ['email'],
         where: { email: email }
       })
       .then(function(userFound) {
         done(null, userFound);
       })
       .catch(function(err) {
         return res.status(500).json({ 'error': 'unable to verify user' });
       });
     },
     function(userFound, done) {
       if (!userFound) {
         bcrypt.hash(password, 5, function( err, bcryptedPassword ) {
           done(null, userFound, bcryptedPassword);
         });
       } else {
         return res.status(409).json({ 'error': 'user already exist' });
       }
     },
     function(userFound, bcryptedPassword, done) {
       var newUser = models.User.create({
         email: email,
         username: username,
         password: bcryptedPassword,
         bio: bio,
         isAdmin: 0
       })
       .then(function(newUser) {
         done(newUser);
       })
       .catch(function(err) {
         return res.status(500).json({ 'error': 'cannot add user' });
       });
     }
   ], function(newUser) {
     if (newUser) {
       return res.status(201).json({
         'userId': newUser.id
       });
     } else {
       return res.status(500).json({ 'error': 'cannot add user' });
     }
   });
 },

  login: function(req,res) {
    var email = req.body.email;
    var password = req.body.password;

    if(email == null || password == null) {
      return res.status(400).json({'error': 'missing parameters' });
    }

    models.User.findOne({
      where: {email: email }
    })
    .then(function(userFound) {
      if(userFound){
        bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt){
          if(resBycrypt) {
            return res.status(200).json({
              'userId': userFound.id,
              'token': jwtUtils.generateTokenForUser(userFound)
            });
          } else {
            return res.status(403).json({'error': 'invalid password'});
          }
        });
      }
      else {
        return res.status(404).json({'error': 'User not Exist in DB'});
      }
    })
    .catch(function(err) {
      return res.status(500).json({ 'error': 'unable to verify user'});
    });
  },

  getUserProfile : function(req, res) {
    var headerAuth = req.headers['authorization'];
    var userId = jwtUtils.getUserId(headerAuth);

    if(userId < 0)
      return res.status(400).json({'error': 'wrong token'});
    models.User.findOne({
      attributes: [ 'id', 'email', 'username', 'bio' ],
      where: {id : userId}
    }).then(function(user) {
      if (user) {
        res.status(201).json(user);
      } else {
        res.status(404).json({'error': 'user not found'});
      }
    }).catch(function(err) {
      res.status(500).json({'error': 'cannot fetch user'});
    })
  }
}
