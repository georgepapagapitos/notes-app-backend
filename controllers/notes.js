const notesRouter = require('express').Router();
const Note = require('../models/note');

// POST a new note
notesRouter.post('/', async (request, response) => {
  const body = request.body;

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  });

  const savedNote = await note.save();
  response.json(savedNote);
}); // end POST

// GET all notes from DB
notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({});
  response.json(notes);
}); // end GET

// GET note by id
notesRouter.get('/:id', async (request, response, next) => {
  try {
    const note = await Note.findById(request.params.id);
    if (note) {
      response.json(note);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
}); // end GET

// PUT update a note
notesRouter.put('/:id', (request, response, next) => {
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

// DELETE a note by id
notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndRemove(request.params.id);
  response.status(204).end();
}); // end DELETE

module.exports = notesRouter;