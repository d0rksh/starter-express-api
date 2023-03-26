const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} = require('unique-names-generator')
const cors = require('cors')
const app = express()
app.use(express.json())
app.use(
  cors({
    credentials: true,
  }),
)
app.use(cookieParser())
const postSchema = new mongoose.Schema({
  message: String,
  liked_by: {
    type: [{ type: String }],
    default: [],
  },
  disliked_by: {
    type: [{ type: String }],
    default: [],
  },
  views: {
    type: [{ type: String }],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})
const Posts = mongoose.model('Post', postSchema)
app.get('/login', (req, res) => {
  if (!req.cookies.auth) {
    const shortName = uniqueNamesGenerator({
      dictionaries: [colors, adjectives, animals],
    })
    var expiryDate = new Date(Date.now() + 60 * 60 * 1000)
    return res
      .cookie('auth', shortName, { maxAge: expiryDate })
      .json({ data: 'logged in' })
  } else {
    return res.json({ data: 'already logged in' })
  }
})
app.get('/posts', (req, res) => {
  const user = req.cookies.auth
  var toSet = false
  if (!req.cookies.auth) {
    toSet = true
    var shortName = uniqueNamesGenerator({
      dictionaries: [colors, adjectives, animals],
    })
    var expiryDate = new Date(Date.now() + 60 * 60 * 1000)
  }
  Posts.aggregate([
    {
      $match: {},
    },
    {
      $project: {
        message: 1,
        liked_by_me: {
          $cond: {
            if: { $in: [user, '$liked_by'] },
            then: true,
            else: false,
          },
        },
        disliked_by_me: {
          $cond: {
            if: { $in: [user, '$disliked_by'] },
            then: true,
            else: false,
          },
        },
        views: {
          $size: '$views',
        },
        like_count: {
          $size: '$liked_by',
        },
        dislike_count: {
            $size: '$disliked_by',
          },
        disliked_by: {
          $size: '$disliked_by',
        },
        date: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$created_at" } }
      },
    },
  ])
    .then((doc) => {
      if (toSet) {
        res
          .cookie('auth', shortName, { maxAge: expiryDate })
          .json({ data: doc })
      } else {
        res.json({ data: doc })
      }
    })
    .catch((_) => {
      if (toSet) {
        res
          .cookie('auth', shortName, { maxAge: expiryDate })
          .status(400)
          .json({ data: 'something went wrong' })
      } else {
        res.status(400).json({ data: 'something went wrong' })
      }
    })
})

app.post('/like', (req, res) => {
  const user = req.cookies.auth
  const { id, type } = req.body
  console.log(req.body)
  if (type === 'add') {
     Posts.updateOne({_id:id},{$addToSet:{liked_by:user}}).then(r=>console.log(r))
     res.json({data:'done'})
  } else {
     Posts.updateOne({_id:id},{$pull:{liked_by:user}}).then(r=>console.log(r))
     res.json({data:'done'})
  }
})

app.post('/dislike', (req, res) => {
  const user = req.cookies.auth
  const { id, type } = req.body
  console.log(req.body)
  if (type === 'add') {
    Posts.updateOne({_id:id},{$addToSet:{disliked_by:user}}).then(r=>console.log(r))
    res.json({data:'done'})
 } else {
    Posts.updateOne({_id:id},{$pull:{disliked_by:user}}).then(r=>console.log(r))
    res.json({data:'done'})
 }
})

mongoose
  .connect(
    'mongodb+srv://bharath:waitingforpooja@waiting.dy9o8k0.mongodb.net/waiting',
  )
  .then((r) => {
    app.listen(80, () => {
      console.log('listening on 80')
    })
  })
  .catch((er) => {
    console.log(er)
  })
