const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const { initialNotes, nonExistingId, notesInDb } = require('./test_helper');
const Note = require('../models/note');

beforeEach(async () => {
  await Note.deleteMany({});

  let noteObject = new Note(initialNotes[0]);
  await noteObject.save();

  noteObject = new Note(initialNotes[1]);
  await noteObject.save();
});

test('all notes are returned as json', async () => {
  await api
    .get('/api/notes')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all notes are returned', async () => {
  const response = await api.get('/api/notes');

  expect(response.body).toHaveLength(initialNotes.length);
});

test('a specific note is within the returned notes', async () => {
  const notesAtStart = await notesInDb();

  const noteToView = notesAtStart[0];

  const resultNote = await api
    .get(`/api/notes/${noteToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const processedNoteToView = JSON.parse(JSON.stringify(noteToView));
  expect(resultNote.body).toEqual(processedNoteToView);
});

test('a valid note can be added', async () => {
  const newNote = {
    content: 'async/await simplifies making async calls',
    important: true
  };

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const notesAtEnd = await notesInDb();
  expect(notesAtEnd).toHaveLength(initialNotes.length + 1);

  const contents = notesAtEnd.map(note => note.content);
  expect(contents).toContain(
    'async/await simplifies making async calls'
  );
});

test('note without content is not added', async () => {
  const newNote = {
    important: true
  };
  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400);

  const notesAtEnd = await notesInDb();
  expect(notesAtEnd).toHaveLength(initialNotes.length);
});

test('a note can be deleted', async () => {
  const notesAtStart = await notesInDb();
  const noteToDelete = notesAtStart[0];

  await api
    .delete(`/api/notes/${noteToDelete.id}`)
    .expect(204);

  const notesAtEnd = await notesInDb();

  expect(notesAtEnd).toHaveLength(initialNotes.length - 1);

  const contents = notesAtEnd.map(note => note.content);

  expect(contents).not.toContain(noteToDelete.content);
});

afterAll(() => {
  mongoose.connection.close();
});