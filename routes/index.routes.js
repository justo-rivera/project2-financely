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
    let promises = nasdaqStocks.map((elem)=>{
        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
   })

   Promise.all(promises)
       .then((results)=>{
           
           let arrPromises = results.map((element, index) => {
                element.data.notFavorite = true;
                console.log(element.data)
                return UserModel.findById(req.session.loggedInUser._id)
                .then( user => {
                    user.favorites.forEach((elem)=>{
                        console.log('Element is ', elem)
                        
                        if(elem === element.data.symbol){
                            element.data.notFavorite = false;
                        }
                    })
                    console.log('Hello')
                    //res.render('stocks',{results})
                })
                .catch( err => res.send(err))
            })
            Promise.all(arrPromises)
                .then(() => {
                    
                    console.log('HELLO', results[0].data.notFavorite)
                    res.render('stocks',{results})
                })
        })
       .catch((error)=>res.send(error))
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
router.get('/profile/transactions', (req, res) => {
    const {_id: userId, email, passwordHash} = req.session.loggedInUser;
    let {error, success} = req.session
    req.session.error = false
    req.session.success = false
    const promises = [];

    TransactionModel.find({user: userId})
        .populate('')
        .then( transactions => {
            for(let index in transactions){
                promises.push(axios.get(`https://cloud.iexapis.com/stable/stock/${transactions[index].symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                    .then( ({data}) => {
                        transactions[index].companyName = data.companyName;
                        transactions[index].currentPrice = data.latestPrice;
                        if(!transactions[index].closed){                            
                            transactions[index].profit = ( (data.latestPrice- transactions[index].entryPrice)*transactions[index].shares ).toFixed(2)
                        }
                        transactions[index].positiveProfit = transactions[index].profit >= 0;
                    })
                    .catch( err => console.error(err))
                )
            }
            Promise.all(promises)
                .then( () => {
                    UserModel.findById(userId)
                        .then( ({money}) => {
                            res.render('users/transactions', {transactions, error, success, money})
                         } )
                        .catch( err => console.error(err))
                })
                .catch( err => console.error(err))
        })
        .catch( err => console.error(err))
})
router.post('/buy', (req, res) => {
    const {symbol, price, shares} = req.body;
    const {_id: userId, email, passwordHash} = req.session.loggedInUser;
    const transactionCost = -shares*price;
    UserModel.findById(userId)
        .then( user => {
            if(user.money >= -transactionCost){
                TransactionModel.create({
                    symbol,
                    entryPrice: price,
                    shares,
                    user: userId
                })
                    .then( () => {
                        UserModel.findByIdAndUpdate(userId, {$inc: {money: transactionCost }})
                            .then( () => {
                                req.session.success = `You bought ${shares} shares of ${symbol}!`
                                res.redirect('profile/transactions')
                            })
                            .catch( err => console.error(err))
                    })
            }
            else{
                req.session.error = 'Not enough money...'
                res.redirect('profile/transactions')
            }
        })
        .catch( err => console.error(err))
})
router.post('/sell', (req, res) => {
    const {transactionId, profit, currentPrice, shares} = req.body
    const {_id: userId} = req.session.loggedInUser
    const closeTransactionPrice = shares*currentPrice
    TransactionModel.findByIdAndUpdate(transactionId, {$set: {exitPrice: currentPrice, profit, closed: true}})
        .then( () => {
            UserModel.findByIdAndUpdate(userId, {$inc: {money: closeTransactionPrice}} )
                .then( () => {
                    res.redirect('profile/transactions')
                })
                .catch( err => console.error(err))
        })
        .catch( err => console.error(err))
})
router.get('/profile', (req, res) => {
    const {_id: userId} = req.session.loggedInUser;
    UserModel.findById(userId)
        .then( userData => {
            res.render('users/profile.hbs', {userData});
        })
        .catch( err => console.error(err))
})

router.post('/profile/add-funds', (req, res) => {
    const {_id: userId} = req.session.loggedInUser;
    const {dollars} = req.body
    UserModel.findByIdAndUpdate(userId, {$inc: { money: dollars} })
        .then( () => 
            res.redirect('/profile')
        )
        .catch( err => console.error(err))
})
router.get('/favorites',(req,res)=>{
    res.render('users/favorites.hbs',{userData: req.session.loggedInUser})
})

router.post('/favorites',(req,res)=>{
    let {symbol,remove} = req.body
    const id = req.session.loggedInUser._id;

    if(!req.session.loggedInUser){
        res.send('Login first')
        return
    }
    console.log(req.session.loggedInUser._id)
    if(remove === 'notRemove'){
        
        UserModel.updateOne({_id:id},{ $push: {favorites: symbol}
        })
            .then((response)=>{
                UserModel.findOne({_id:id})
                    .then((updatedUser)=>{
                        req.session.loggedInUser= updatedUser;
                        console.log(updatedUser)
                        UserModel.findById(updatedUser._id)
                            .then((user)=>{
                                console.log(user.favorites)
                                
                                let promises = user.favorites.map((elem)=>{
                                    if(elem!==null){
                                        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                                    }
                                })
                                Promise.all(promises)
                                    .then((stockI)=>{
                                        res.render('users/favorites',{stockI})
                                    })
                                    .catch((err)=>{
                                        console.log(err)
                                    })
                            })
                            .catch((err)=>console.log('cannot find user'))
                    })
            })
            .catch((err)=>{
                console.log(err)
            })
    }else{
            UserModel.updateOne({_id:id},{ $pull: {favorites: symbol}
            })
                .then((response)=>{
                    console.log(response)
                    UserModel.findOne({_id:id})
                        .then((updatedUser)=>{
                            req.session.loggedInUser= updatedUser;
                            //console.log(updatedUser)
                            UserModel.findById(updatedUser._id)
                                .then((user)=>{
                                    //console.log(user.favorites)
                                    let promises = user.favorites.map((elem)=>{
                                        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                                    })
                                    Promise.all(promises)
                                        .then((stockI)=>{
                                            res.render('users/favorites',{stockI})
                                        })
                                        .catch((err)=>{
                                            console.log(err)
                                        })
                                })
                        })
                })
                .catch((err)=>{
                    console.log(err)
                })
        }

    
})
module.exports = router;
