# Financely


## Description
A simple website/application to buy and sell stock shares.
 
## User Stories

- **404** - As a user I want to see a nice 404 page when I go to a page that doesn’t exist so that I know it was my fault 
- **500** - As a user I want to see a nice error page when the super team screws it up so that I know that is not my fault
- **homepage** - As a user I want to be able to access the homepage so that I see what the app is about and login and signup
- **sign up** - As a user I want to sign up on the webpage so that I can see all the shares that I can buy
- **login** - As a user I want to be able to log in on the webpage so that I can get back to my account and check my portfolio + a list of my favourites stocks. 
- **logout** - As a user I want to be able to log out from the webpage so that I can make sure no one will access my account
- **stock list** - As a user I want to see all the stocks available, their current price and any recent % changes 
- **stocks create** - As a user I want to be able to buy and sell stocks to create a my own portfolio
- **stock detail** - As a user I want to see the stock details and a list of the characteristics of the stock so that I can decide if I want to buy or sell.


## Backlog

List of other features outside of the MVPs scope

User profile:
- see my profile
- upload my profile picture
- table that sorts stocks based on different parameters
- list all the transactions the user has made

Graphs Section:
- add graphs showing the evolution of a stock over time

Company Information:
- Description of the company + latest news related with the company that could affect how the stock will evolve


Homepage
- ...


## ROUTES:

- GET / 
  - renders the homepage
- GET /auth/signup
  - redirects to / if user logged in
  - renders the signup form (with flash msg)
- POST /auth/signup
  - redirects to / if user logged in
  - body:
    - username
    - email
    - password
- GET /auth/login
  - redirects to / if user logged in
  - renders the login form (with flash msg)
- POST /auth/login
  - redirects to / if user logged in
  - body:
    - username
    - password
- POST /auth/logout
  - body: (empty)

- GET /stocks
  - renders the stock table
- POST /stocks/transaction 
  - redirects to / if user is logged in
  - body: 
    - nº of stocks
    - date
    - symbol
- GET /user/portfolio
  - renders the user portfolio page
  - includes the list of stocks the user has traded with
  - trade button if user wants to make a transaction, redirects him to /stocks/transaction

- GET /user/favourite
    - renders the user favourite stocks


## Models

User model
 
```
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    creditCard: {
      type: String
    },
    experience: {
      type: String,
      required: true,
      enum: ['Zero experience', 'Some experience', 'Professional', 'Broker']
    },
    favorites: {
      type: [String],
    }
  },
  {
    timestamps: true
  }
)

```
Transaction model

```
const transactionSchema = new Schema(
    {
      symbol: {
        type: String,
        required: true
      },
      entryPrice: {
        type: Number,
        required: true
      },
      shares: {
        type: Number,
        required: true
      },
      exitPrice: Number,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    {
        timestamps: true
    }
  )
``` 

## Links

### Trello

[Link to your trello board](https://trello.com/b/gpBQNttQ/financely) or picture of your physical board

### Git

The url to your repository and to your deployed project

[Repository Link](http://github.com)

[Deploy Link](http://heroku.com)

### Slides

The url to your presentation slides

[Slides Link](http://slides.com)
