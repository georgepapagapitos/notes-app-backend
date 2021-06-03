require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const Note = require('./models/note');

app.use(express.static('build'));
app.use(express.json());
app.use(cors());

// middleware to log every request
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method);
  console.log('Path:  ', request.path);
  console.log('Body:  ', request.body);
  console.log('---');
  next();
};
app.use(requestLogger);
// end middleware


// GET all notes from DB
app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes);
  });
}); // end GET

// GET note by id
app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id).then(note => {
    if (note) {
      response.json(note);
    } else {
      response.status(404).end();
    }
  })
    .catch(error => next(error));
}); // end GET

// POST a new note
app.post('/api/notes', (request, response, next) => {
  const body = request.body;
  if (body.content === undefined) {
    return response.status(400).json({ error: 'content missing' });
  }
  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  });
  note
    .save()
    .then(savedNote => savedNote.toJSON())
    .then(savedAndFormattedNote => response.json(savedAndFormattedNote))
    .catch(error => next(error));
}); // end POST

// DELETE a note by id
app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end();
    })
    .catch(error => next(error));
}); // end DELETE

// PUT update a note
app.put('/api/notes/:id', (request, response, next) => {
  const body = request.body;
  const note = {
    content: body.content,
    important: body.important
  };
  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote);
    })
    .catch(error => next(error));
}); // end PUT

// middleware to respond to unknown endpoints
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};
app.use(unknownEndpoint);
// end middleware

// middleware to handle specific errors
const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'invalid id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};
app.use(errorHandler);
// end middleware

// set up connection to server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});