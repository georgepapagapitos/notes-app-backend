const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const { initialNotes, notesInDb, nonExistingId, usersInDb } = require('./test_helper');

const Note = require('../models/note');
const User = require('../models/user');

beforeEach(async () => {
  await Note.deleteMany({});
  await Note.insertMany(initialNotes);
});

describe('when there are initially some notes saved', () => {
  test('test notes are returned as json', async () => {
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
    const response = await api.get('/api/notes');
    const contents = response.body.map(note => note.content);
    expect(contents).toContain('Browser can only execute JavaScript');
  });
});

describe('viewing a specific note', () => {
  test('succeeds with a valid id', async () => {
    const notesAtStart = await notesInDb();

    const noteToView = notesAtStart[0];

    const resultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const processedNoteToView = JSON.parse(JSON.stringify(noteToView));
    expect(resultNote.body).toEqual(processedNoteToView);
  });

  test('fails with status 404 if note does not exist', async () => {
    const validNonExistingId = await nonExistingId();

    await api
      .get(`/api/notes/${validNonExistingId}`)
      .expect(404);
  });

  test('fails with status 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445';
    await api
      .get(`/api/notes/${invalidId}`)
      .expect(400);
  });
});

describe('adding a new note', () => {
  test('succeeds with valid data', async () => {
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

  test('fails with status 400 if data is invalid', async () => {
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
});

describe('deletion of a note', () => {
  test('succeeds with a status of 204 if id is valid', async () => {
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
});

describe('where there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('secret', 10);
    const user = new User({ username: 'admin', passwordHash });
    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await usersInDb();
    const newUser = {
      username: 'goodboy',
      name: 'George Papagapitos',
      password: 'password',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map(user => user.username);
    expect(usernames).toContain(newUser.username);
  });
});

afterAll(() => {
  mongoose.connection.close();
});