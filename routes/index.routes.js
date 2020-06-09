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
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {_id: userId} = req.session.loggedInUser;
    let promises;
    let favoriteNews = [];
    UserModel.findById(userId)
    .then( ({favorites}) => {
        let promises = favorites.map( fav =>{
            return axios.get(`https://cloud.iexapis.com/stable/stock/${fav}/news/last/2?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
            .then( ({data: news}) => {
                favoriteNews.push({symbol: fav, news})
            })
            .catch(err=>{
                console.error(err)
            })
            })
        let stockHistory = [];
        let promisesCharts = favorites.map( fav => {
            return axios.get(`https://cloud.iexapis.com/stable/stock/${fav}/chart/5d?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                .then( ({data}) => {
                    stockHistory.push({symbol: fav, dayArray: data})
                    
                })
                .catch( err => console.log(err))
        })
        Promise.all(promises)
        .then( () => {
            res.render('index.hbs', {favoriteNews, stockHistory})
        })
        .catch( err => console.error(err))
    })
        .catch( err=> console.error(err))
});

router.get('/stocks', (req, res) => {
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    let moneyLeft = req.session.loggedInUser.money;
    const id = req.session.id;
    let promises = nasdaqStocks.map((elem)=>{
        return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
   })

   Promise.all(promises)
       .then((results)=>{
           let arrPromises = results.map((element, index) => {
                element.data.notFavorite = true;
                element.data.changePercent *= 100;
                element.data.changePercent = element.data.changePercent.toFixed(2)
                element.data.changeGreen = element.data.changePercent >= 0;
                console.log(element.data)
                return UserModel.findById(req.session.loggedInUser._id)
                .then( user => {
                    moneyLeft = Number((user.money).toFixed(2));
                    user.favorites.forEach((elem)=>{
                        if(elem === element.data.symbol){
                            element.data.notFavorite = false;
                        }
                    })
                })
                .catch( err => res.send(err))
            })
            Promise.all(arrPromises)
                .then(() => {
                    res.render('stocks',{results, moneyLeft})
                })
        })
       .catch((error)=>res.send(error))
})
router.get('/stock', (req, res) => {
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {symbol} = req.query;
    const {email, passwordHash} = req.session.loggedInUser;
    let error = false;
    let data = {stockData: '', companyData: '', error, news: []}
    let promises = []
    promises.push(
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
        .then( ({data: stockData}) => {
            data.stockData = stockData;
            data.stockData.changePercent *= 100;
            data.stockData.changePercent = data.stockData.changePercent.toFixed(2)
            data.stockData.changeGreen = data.stockData.changePercent >= 0;
        })
        .catch(err=>{
            console.error(err)
            error += 'stock info for '+symbol+' not found'
        })
    )
    promises.push(
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/company?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
        .then( ({data: companyData}) => {
            data.companyData = companyData;
        })
        .catch(err=>{
            console.error(err)
        })
    )
    promises.push(
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/news/last/4?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
        .then( ({data: news}) => {
            data.news = news;
        })
        .catch(err=>{
            console.error(err)
        })
    )
    data.notFavorite = true;
    promises.push(
         UserModel.findById(req.session.loggedInUser._id)
                .then( user => {
                    data.moneyLeft = Number((user.money).toFixed(2))
                    user.favorites.forEach((elem)=>{
                        if(elem === symbol){
                            data.notFavorite = false;
                        }
                    })
                })
                .catch( err => res.send(err))
    )



    Promise.all(promises)
        .then( () => {
            res.render('stock', data)
        })
        .catch( err => console.error(err))
})


router.post('/stocks',(req,res)=>{
    let {symbol} = req.body;
    
    UserModel.updateOne({_id:req.session.loggedInUser._id},{ $pull: {favorites: symbol}
    })
        .then((response)=>{
            UserModel.findOne({_id:req.session.loggedInUser._id})
                .then((updatedUser)=>{
                    req.session.loggedInUser= updatedUser;
                    res.redirect('stocks')
                })
                .catch(()=>{
                    console.log('id not found')
                })
        })
        .catch((err)=>{
            console.log(err)
        })
    
})
router.get('/profile/transactions', (req, res) => {
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {_id: userId, email, passwordHash} = req.session.loggedInUser;
    let {error, success} = req.session
    req.session.error = false
    req.session.success = false
    const promises = [];

    TransactionModel.find({user: userId})
        .sort({ createdAt: -1})
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
                        const now = new Date();
                        let minutesPassed= (now - transactions[index].createdAt)/(60*1000)
                        if(minutesPassed < 5){
                            transactions[index].canUndo = true;
                            transactions[index].timeLeft = 5 - Math.floor(minutesPassed)
                        }
                        else{
                            transactions[index].canUndo = false;
                        }
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
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {symbol, price, shares} = req.body;
    const {_id: userId, email, passwordHash} = req.session.loggedInUser;
    const transactionCost = Number((-shares*price).toFixed(2));
    if(shares <= 0){
        req.session.error = 'Can\'t buy 0 shares';
        res.redirect('profile/transactions')
        return
    }
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
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {transactionId, profit, currentPrice, shares} = req.body
    const {_id: userId} = req.session.loggedInUser
    const closeTransactionPrice = Number((shares*currentPrice).toFixed(2))
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
    if(!req.session.loggedInUser){
        res.render('users/profile.hbs')
        return
    }
    const {_id: userId} = req.session.loggedInUser;
    UserModel.findById(userId)
        .then( userData => {
            res.render('users/profile.hbs', {userData});
        })
        .catch( err => console.error(err))
})
router.post('/undo', (req, res) => {
    if(!req.session.loggedInUser){
        res.render('users/profile.hbs')
        return
    }
    const {_id: userId} = req.session.loggedInUser;
    const {transactionId} = req.body;
    const now = new Date();
    TransactionModel.findById(transactionId)
        .populate('')
        .then( transaction => {
            let minutesPassed= (now - transaction.createdAt)/(60*1000);           
            if(transaction.user._id == userId){
                if(minutesPassed < 5){
                    let refund = Number((transaction.entryPrice * transaction.shares).toFixed(2));
                    TransactionModel.findByIdAndDelete(transactionId)
                        .then( response => {
                            UserModel.findByIdAndUpdate(userId, {$inc: {money: refund}})
                                .then( () => {
                                    req.session.success = 'Transaction cancelled, you got $' + refund + ' back!';
                                    res.redirect('/profile/transactions');
                                })
                                .catch( err => {
                                    req.session.error = 'Couldn\'t refund your money... ' + err;
                                    res.redirect('/profile/transactions')
                                })
                            
                        })
                        .catch( err => console.log(err))
                }
                else{
                    req.session.error = 'Too late.. ' + Math.floor(minutesPassed) + ' minutes passed';
                    res.redirect('/profile/transactions')
                }
            }
            else{
                console.log(transaction.user, transaction.user._id)
                req.session.error = 'That transaction isn\'t yours...';
                res.redirect('/profile/transactions')
            }
            
        })
        .catch( err => console.log(err))
})
router.post('/profile/add-funds', (req, res) => {
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
    const {_id: userId} = req.session.loggedInUser;
    const {dollars} =req.body;
    UserModel.findByIdAndUpdate(userId, {$inc: { money: dollars} })
        .then( () => 
            res.redirect('/profile')
        )
        .catch( err => console.error(err))
})

router.post('/favorites',(req,res)=>{
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }
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
                                        stockI.forEach( elem => {
                                        elem.data.changePercent = (elem.data.changePercent*100).toFixed(2);
                                        elem.data.changeGreen = elem.data.changePercent >= 0;
                                        })
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
                                            stockI.forEach( elem => {
                                            elem.data.changePercent = (elem.data.changePercent*100).toFixed(2);
                                            elem.data.changeGreen = elem.data.changePercent >= 0;
                                            })
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

router.get('/favorites',(req,res)=>{
    if(!req.session.loggedInUser){
        res.redirect('/profile')
        return
    }

    if(!req.session.loggedInUser){
        res.send('Login first')
        return
    }
    const id = req.session.loggedInUser._id;
    UserModel.findById(id)
        .then((user)=>{
            console.log(user.favorites)
            
            let promises = user.favorites.map((elem)=>{
                if(elem!==null){
                    return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
                }
            })
            Promise.all(promises)
                .then((stockI)=>{
                    stockI.forEach( elem => {
                    elem.data.changePercent = (elem.data.changePercent*100).toFixed(2);
                    elem.data.changeGreen = elem.data.changePercent >= 0;
                    })
                    res.render('users/favorites',{stockI})
                })
                .catch((err)=>{
                    console.log(err)
                })
        })
        .catch((err)=>console.log('cannot find user'))
})

router.get(('/auth/logout'), (req,res)=>{
    UserModel.findById(req.session.loggedInUser._id)
        .then((user)=>{
            res.render('./auth/logout.hbs',{user})
        })
        .catch((err)=>{
            console.log('no user found')
        })
})
router.post(('/auth/logout'), (req,res)=>{
    let {id} = req.body
    req.session.destroy()
    res.render('users/profile')
})
module.exports = router;
