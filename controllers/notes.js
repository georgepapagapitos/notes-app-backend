const notesRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Note = require('../models/note');
const User = require('../models/user');

const getTokenFrom = request => {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    return authorization.substring(7);
  }
  return null;
};

// GET all notes from DB
notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({}).populate('user', { username: 1, name: 1 });
  response.json(notes);
}); // end GET

// GET note by id
notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id);
  if (note) {
    response.json(note);
  } else {
    response.status(404).end();
  }
}); // end GET

// POST a new note
notesRouter.post('/', async (request, response) => {
  const body = request.body;
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const user = await User.findById(decodedToken.id);

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
    user: user._id
  });

  const savedNote = await note.save();
  user.notes = user.notes.concat(savedNote._id);
  await user.save();
  response.json(savedNote);
}); // end POST

// PUT update a note
notesRouter.put('/:id', async (request, response) => {
  const body = request.body;
  const note = {
    content: body.content,
    important: body.important
  };
  const updatedNote = await Note.findByIdAndUpdate(request.params.id, note, { new: true });
  response.json(updatedNote);
}); // end PUT

// DELETE a note by id
notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndRemove(request.params.id);
  response.status(204).end();
}); // end DELETE

module.exports = notesRouter;