require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LEGRANDQUIZZ';
const SECRET_KEY = process.env.SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

if (!SECRET_KEY) {
  console.error('[WARN] SECRET_KEY is not set — all authenticated requests will be rejected.');
}

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Socket.io
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB: LEGRANDQUIZZ'))
  .catch((err) => console.error('MongoDB connection error:', err));

// JWT middleware — valide le cookie VGAMES
const requireAuth = (req, res, next) => {
  if (!SECRET_KEY) return res.status(401).json({ error: 'Configuration serveur invalide' });
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ error: 'Non authentifié. Connectez-vous sur VGAMES.' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Session expirée. Reconnectez-vous sur VGAMES.' });
    req.user = decoded;
    next();
  });
};

// Socket.io auth
io.use((socket, next) => {
  if (!SECRET_KEY) return next(new Error('Configuration serveur invalide'));
  const cookieHeader = socket.handshake.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  const token = cookies['jwt'];
  if (!token) return next(new Error('Non authentifié'));
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return next(new Error('Session expirée'));
    socket.user = decoded;
    next();
  });
});

app.get('/api/status', (req, res) => {
  res.json({ message: 'LeGrandQuizz backend is running.' });
});

// Quiz model
const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 1000 },
  category: { type: String, maxlength: 100 },
  timeLimit: { type: Number, default: 15, min: 5, max: 120 },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
  isPublic: { type: Boolean, default: false },
  image: { type: String, default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60' },
  questions: [{
    text: { type: String, maxlength: 500 },
    options: [{ type: String, maxlength: 200 }],
    correctOption: Number
  }]
}, { timestamps: true });
const Quiz = mongoose.model('Quiz', QuizSchema);

// Game History model
const GameHistorySchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizTitle: { type: String, required: true },
  roomCode: String,
  players: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    score: Number,
    avatar: String
  }],
  playedAt: { type: Date, default: Date.now }
});
const GameHistory = mongoose.model('GameHistory', GameHistorySchema);

const validateQuizData = (data) => {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return 'Le titre est requis';
  }
  if (data.title.length > 200) return 'Titre trop long (max 200 caractères)';
  if (data.questions && (!Array.isArray(data.questions) || data.questions.length > 100)) {
    return 'Questions invalides (max 100)';
  }
  return null;
};

// Routes Quiz
app.get('/api/quizzes/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    const quizzes = await Quiz.find({ owner: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/quizzes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID quiz invalide' });
    }
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/quizzes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID quiz invalide' });
    }
    const validationError = validateQuizData(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });
    if (quiz.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { title, description, category, timeLimit, isPublic, image, questions } = req.body;
    quiz.title = title ?? quiz.title;
    quiz.description = description ?? quiz.description;
    quiz.category = category ?? quiz.category;
    quiz.timeLimit = timeLimit ?? quiz.timeLimit;
    quiz.isPublic = isPublic ?? quiz.isPublic;
    quiz.image = image ?? quiz.image;
    quiz.questions = questions ?? quiz.questions;
    await quiz.save();
    res.json({ message: 'Quiz mis à jour', quiz });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/quizzes/create', requireAuth, async (req, res) => {
  try {
    const validationError = validateQuizData(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const quizData = { ...req.body, owner: req.user.id };
    const newQuiz = new Quiz(quizData);
    await newQuiz.save();
    res.status(201).json({ message: 'Quiz créé', quiz: newQuiz });
  } catch (error) {
    console.error('Failed to save quiz:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/history/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }
    const history = await GameHistory.find({ 'players.userId': new mongoose.Types.ObjectId(userId) }).sort({ playedAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Socket.io — logique de salle multijoueur
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, '| VGAMES user:', socket.user?.username);

  socket.on('create-room', async (roomCode, quizId) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) { socket.emit('error', 'Quiz introuvable'); return; }
      socket.join(roomCode);
      rooms.set(roomCode, {
        quizId, quizData: quiz, hostId: socket.id,
        players: [], status: 'lobby', currentQuestionIndex: -1
      });
    } catch (e) {
      console.error('Error creating room:', e);
    }
  });

  socket.on('join-room', (roomCode, player) => {
    const room = rooms.get(roomCode);
    if (!room) { socket.emit('error', 'Salle introuvable'); return; }
    if (room.status !== 'lobby') { socket.emit('error', 'La partie a déjà commencé'); return; }

    const username = typeof player.username === 'string' ? player.username.trim().slice(0, 50) : 'Joueur';

    socket.join(roomCode);
    const newPlayer = {
      id: socket.id, userId: player.id, username,
      avatar: player.avatar, score: 0, hasAnswered: false, currentAnswer: null
    };
    room.players.push(newPlayer);
    io.to(roomCode).emit('player-joined', room.players);
  });

  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id && room.players.length >= 2) {
      room.status = 'playing';
      io.to(roomCode).emit('game-started');
    } else if (room && room.players.length < 2) {
      socket.emit('error', 'Il faut au moins 2 joueurs pour démarrer');
    }
  });

  socket.on('next-question', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      room.currentQuestionIndex++;
      room.players.forEach(p => { p.hasAnswered = false; p.currentAnswer = null; });

      if (room.currentQuestionIndex >= room.quizData.questions.length) {
        room.status = 'finished';
        const leaderboard = [...room.players].sort((a, b) => b.score - a.score);
        io.to(roomCode).emit('game-finished', leaderboard);
        new GameHistory({
          quizId: room.quizId, quizTitle: room.quizData.title, roomCode,
          players: room.players.map(p => ({ userId: p.userId, username: p.username, score: p.score, avatar: p.avatar }))
        }).save().catch(err => console.error('Error saving history:', err));
      } else {
        const question = room.quizData.questions[room.currentQuestionIndex];
        io.to(roomCode).emit('new-question', {
          questionIndex: room.currentQuestionIndex,
          totalQuestions: room.quizData.questions.length,
          question: { text: question.text, timeLimit: question.timeLimit || room.quizData.timeLimit || 15, options: question.options }
        });
      }
    }
  });

  socket.on('submit-answer', (roomCode, answerIndex) => {
    const room = rooms.get(roomCode);
    if (room && room.status === 'playing') {
      const player = room.players.find(p => p.id === socket.id);
      if (player && !player.hasAnswered) {
        player.hasAnswered = true;
        player.currentAnswer = answerIndex;
        const question = room.quizData.questions[room.currentQuestionIndex];
        if (question.correctOption === answerIndex) player.score += 1000;
        io.to(room.hostId).emit('player-answered', { playerId: player.id, username: player.username });
        if (room.players.every(p => p.hasAnswered)) io.to(room.hostId).emit('all-players-answered');
      }
    }
  });

  socket.on('reveal-answer', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.hostId === socket.id) {
      const question = room.quizData.questions[room.currentQuestionIndex];
      io.to(roomCode).emit('answer-revealed', { correctIndex: question.correctOption, players: room.players });
    }
  });

  socket.on('send-message', (roomCode, messageData) => {
    if (typeof messageData?.text === 'string' && messageData.text.length <= 500) {
      io.to(roomCode).emit('chat-message', messageData);
    }
  });

  socket.on('disconnect', () => {
    for (const [roomCode, room] of rooms.entries()) {
      if (room.hostId === socket.id) {
        io.to(roomCode).emit('host-disconnected');
        rooms.delete(roomCode);
      } else {
        const index = room.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          io.to(roomCode).emit('player-left', room.players);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`LeGrandQuizz backend running on http://localhost:${PORT}`);
});
