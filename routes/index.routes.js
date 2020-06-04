const express = require('express');
const router = express.Router();
const axios = require('axios');
const UserModel = require('../models/User.model')
const SessionModel = require('../models/Session.model')
const TransactionModel = require('../models/Transaction.model')
const nasdaqStocks = require('../info/nasdaq')
const nyseStocks = require('../info/nyse')

let promises = []
let stockData = []



/* GET home page */
router.get('/', (req, res) => {
  
    res.render('index')
});

router.get('/stocks', (req, res) => {
    if(!req.session.loggedInUser){
        res.send('Login first')
        return
    }
    const id = req.session.loggedInUser._id;
    SessionModel.findById(id)
        .then( res => console.log(res))
        .catch( err => console.error(err))
    promises = nasdaqStocks.map((elem)=>{

        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
   })

   Promise.all(promises)
       .then((results)=>{
           //console.log(results)
           res.render('stocks', {/*userData, */results: results}); 
       })
       .catch((err)=>console.log(err))
})
router.get('/stock', (req, res) => {
    const {symbol} = req.query;
    const {userData} = req.session.loggedInUser;
    axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
        .then( ({data}) => {
            res.render('stock', {/*userData, */stockData: data});
        })
        .catch(()=>res.send('error '+symbol+' not found'))
})
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs', {userData: req.session.loggedInUser});
})

router.get('/favorites',(req,res)=>{
    res.render('users/favorites.hbs',{userData: req.session.loggedInUser})
})

router.post('/favorites',(req,res)=>{
    let {symbol,remove} = req.body
    console.log(symbol)
    const id = req.session.loggedInUser._id;
    console.log(id)
    if(remove === 'notRemove'){
        console.log('here')
        UserModel.updateOne({_id:id},{ $push: {favorites: symbol}
        })
            .then((response)=>{
                UserModel.findOne({_id:id})
                    .then((updatedUser)=>{
                        console.log(updatedUser)
                        req.session.loggedInUser= updatedUser;
                        res.render('users/favorites',{userData:req.session.loggedInUser})
                    })
            })
            .catch((err)=>{
                console.log(err)
            })
    }else{
        console.log('here2')
        UserModel.updateOne({_id:id},{ $pull: {favorites: symbol}
        })
            .then((response)=>{
                UserModel.findOne({_id:id})
                    .then((updatedUser)=>{
                        console.log(updatedUser)
                        req.session.loggedInUser= updatedUser;
                        res.render('users/favorites',{userData:req.session.loggedInUser})
                    })

            })
            .catch((err)=>{
                console.log(err)
            })
    }

    
})
module.exports = router;
