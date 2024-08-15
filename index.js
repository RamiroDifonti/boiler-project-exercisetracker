const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// mongodb and connection
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// body-parser
const bodyParser = require('body-parser');

// middleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// crear el schema de un usuario
const Schema = mongoose.Schema;

// definir el schema de una persona
const userSchema = new Schema({
  username: {type: String, 
         required: true,
         unique: true
  }
});

const exerciseSchema = new Schema ({
  userId: {type: String,
    require: true
  },
  username: {type: String,
    require: true
  },
  description: {type: String,
    required: true
  },
  duration: {type: Number,
    required: true
  },
  date: {type: String,
    required: true
  }
});


let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function(req, res) {
  const input = req.body.username;
  let newUser = new User({username: input});
  newUser.save((err, user) => {
    if (err) return res.status(500).send({error: err});
    return res.send({username: user.username, _id: user._id});
  });
});

app.post('/api/users/:_id/exercises', function(req, res) {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  
  // Check date
  if (date == "" || date == null) {
    date = new Date();
    date = date.toDateString();
  } else {
    date = new Date(date);
    if (date == "Invalid Date") {
      res.status(500).send({error: 'Invalid Date'});
    } else {
      date = date.toDateString();
    }
  }
  User.findById({_id: id}, function(err, user) {
    if (err) return res.send({error: err});
    let newExercise = new Exercise({
      username: user.username,
      description: description,
      duration: duration,
      date: date,
      userId: user._id
    });
    newExercise.save((err, exercise) => {
      if (err) return res.status(500).send({error: err});
      return res.send({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
        _id: user._id
      });
    });
  });
});

app.get('/api/users', function(req, res) {
  User.find({}, function(err, users) {
    if (err) return res.json({error: err});
    return res.json(users);
  });
  
});

app.get('/api/users/:_id/logs', function(req, res) {
  const id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  const minDate = (from == undefined) ? new Date(0) : new Date(from);
  const maxDate = (to == undefined) ? new Date() : new Date(to);
  
  let logs = {
    username: "",
    count: 0,
    _id: "",
    log: []
  };

  Exercise.find({userId: id}, function(err, exercisesFound) {
    if (err) return res.json({error: err});
    logs.username = exercisesFound[0].username;
    logs._id = exercisesFound[0].userId;
    for (let i = 0; i < exercisesFound.length; ++i) {
      const entry = exercisesFound[i];
      log = {
        description: entry.description,
        duration: entry.duration,
        date: entry.date
      };
      
      if (new Date(log.date) >= minDate && new Date(log.date) <= maxDate) {
        logs.count++;
        logs.log.push(log);
      }
      if (limit != undefined && logs.count >= limit) {
        break;
      }
    };
    return res.json(logs);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
