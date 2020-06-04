const express = require('express');
const router = express.Router();
const axios = require('axios');
const UserModel = require('../models/User.model')
const SessionModel = require('../models/Session.model')
const TransactionModel = require('../models/Transaction.model')
const FavoriteModel = require('../models/Favorite.model')
const nasdaqStocks = require('../info/nasdaq')
const nyseStocks = require('../info/nyse')

let promises = []
let stockData = []



/* GET home page */
router.get('/', (req, res) => {
    // if(!req.session.loggedInUser){
    //     res.send('Login first')
    //     return
    // }
    // const id = req.session.loggedInUser._id;
    // SessionModel.findById(id)
    //     .then( res => console.log(res))
    //     .catch( err => console.error(err))

    
    res.render('index', { title: 'financely 🚀' })
});

router.get('/stock', (req, res) => {
    //const {symbol} = req.query;
    //const {userData} = req.session.loggedInUser;
    promises = nasdaqStocks.map((elem)=>{

         return axios.get(`https://cloud.iexapis.com/stable/stock/${elem}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
            // .then( ({data}) => {
            //     stockData.push({data});
            //     return 
            // })
            // .catch((err)=>{
            //     console.log(err)
            // })
            //.catch(()=>res.send('error '+elem+' not found'))
    })

    Promise.all(promises)
        .then((results)=>{
            console.log(results)
            res.render('stock', {/*userData, */results: results}); 
        })
        .catch((err)=>console.log(err))

    // axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_3d08c1fd646a4e4ba1b6b3de24f003df`)
    //     .then( ({data}) => {
    //         res.render('stock', {/*userData, */stockData: data});
    //     })
    //     .catch(()=>res.send('error '+symbol+' not found'))
})
router.get('/profile', (req, res) => {
    res.render('users/profile.hbs', {userData: req.session.loggedInUser});
})
module.exports = router;
