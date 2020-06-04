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
    const id = req.session.id;
    SessionModel.findById(id)
        .then( res => console.log(res))
        .catch( err => console.error(err))
    promises = nasdaqStocks.map((elem)=>{

        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
   })

   Promise.all(promises)
       .then((results)=>{
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
router.post('/buy', (req, res) => {
    const {symbol, price, shares} = req.body;
    const {userData} = req.session.loggedInUser;
    TransactionModel.create({
        symbol,
        entryPrice: price,
        shares,
        user: userData._id
    })
        .then( () => {
            res.redirect('profile/transactions')
        })
        .catch( err => console.error(err))
})
router.get('/profile/transactions', (req, res) => {
    const {userData} = req.session.loggedInUser;
    TransactionModel.find({user: userData._id})
        .then( transactions => {
            res.render('users/transactions', {transactions})
        })
        .catch( err => console.error(err))
})
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs', {userData: req.session.loggedInUser});
})
module.exports = router;
