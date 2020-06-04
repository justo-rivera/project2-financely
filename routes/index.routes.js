const express = require('express');
const router = express.Router();
const axios = require('axios');
const UserModel = require('../models/User.model')
const SessionModel = require('../models/Session.model')
const TransactionModel = require('../models/Transaction.model')
const nasdaqStocks = require('../info/nasdaq')
const nyseStocks = require('../info/nyse')

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
    let promises = nasdaqStocks.map((elem)=>{

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
    const {email, passwordHash} = req.session.loggedInUser;
    axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
        .then( ({data}) => {
            res.render('stock', {/*userData, */stockData: data});
        })
        .catch(()=>res.send('error '+symbol+' not found'))
})
router.post('/buy', (req, res) => {
    const {symbol, price, shares} = req.body;
    const {_id, email, passwordHash} = req.session.loggedInUser;
    TransactionModel.create({
        symbol,
        entryPrice: price,
        shares,
        user: _id
    })
        .then( () => {
            res.redirect('profile/transactions')
        })
        .catch( err => console.error(err))
})
router.get('/profile/transactions', (req, res) => {
    const {_id, email, passwordHash} = req.session.loggedInUser;
    const promises = [];
    TransactionModel.find({user: _id})
        .then( transactions => {
            for(let index in transactions){
                promises.push(axios.get(`https://cloud.iexapis.com/stable/stock/${transactions[index].symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                    .then( ({data}) => {
                        transactions[index].companyName = data.companyName;
                        transactions[index].currentPrice = data.latestPrice;
                        if(!transactions[index].closed){                            
                            transactions[index].profit = ( (data.latestPrice- transactions[index].entryPrice)*transactions[index].shares ).toFixed(2)
                        }
                        transactions[index].positiveProfit = transactions[index].profit >= 0
                    })
                    .catch( err => console.error(err))
                )
            }
            Promise.all(promises)
                .then( () => {
                    res.render('users/transactions', {transactions})
                })
                .catch( err => console.error(err))
        })
        .catch( err => console.error(err))
})
router.post('/sell', (req, res) => {
    const {transactionId, profit, currentPrice} = req.body
    TransactionModel.findByIdAndUpdate(transactionId, {$set: {exitPrice: currentPrice, profit, closed: true}})
        .then( () => {
            UserModel.findByIdAndUpdate(req.session.loggedInUser._id, {$add: {profit}} )
                .then( () => {
                    res.redirect('profile/transactions')
                })
                .catch( err => console.error(err))
        })
        .catch( err => console.error(err))
})
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs', {userData: req.session.loggedInUser});
})
module.exports = router;
