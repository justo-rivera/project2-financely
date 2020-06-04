const { Schema, model } = require('mongoose');

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
      closed: {
        type: Boolean,
        default: false
      },
      profit: Number,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    {
        timestamps: true
    }
  )

module.exports = model('Transaction', transactionSchema)