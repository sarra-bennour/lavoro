require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongo = require('mongoose');
const http = require('http');
const bodyparser = require('body-parser');
const db = require('./config/dbConnection.json');
const session = require('express-session');
const transporter = require('./utils/emailConfig'); // Import the transporter from middleware
const MongoStore = require('connect-mongo');
const cors = require('cors');
const Chat = require('./models/chat');
const ChatGroup = require('./models/chatGroup');
const GroupMessage = require('./models/groupMessage');
const User = require('./models/user');
const meetRouter = require('./routes/meets');
// Connect to MongoDB
mongo
  .connect(db.url)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

const usersRouter = require('./routes/users');
const taskRouter=require('./routes/Task')
const profileRouter = require('./routes/profile');
const projectRouter = require('./routes/project');
const notifroute = require('./routes/notification');
const chatRouter = require('./routes/chat');
const teamRouter = require('./routes/teams');
const teamMemberRouter = require('./routes/teamMember');
const skillsRouter = require('./routes/skills');
const userSkillsRouter = require('./routes/userSkills');
const taskAssignmentRoutes = require('./routes/taskAssignmentRoutes');
// const homeRouter = require('./routes/home');
const adminRouter = require('./routes/admin');
const emailRouter = require('./routes/emails');
const reportRouter = require('./routes/reports');
const deleteReportRouter = require('./routes/deleteReport');
const taskPrioritizationRoutes = require('./routes/taskPrioritizationRoutes');
const predictRouter = require('./routes/predictMember');
const fileRouter = require('./routes/file');

const notificationRoutes = require('./routes/notificationRoutes');


const app = express();
const socketIo = require('socket.io');
const server = http.createServer(app);

// Configuration de Socket.io avec CORS
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:5173", // URL du frontend
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true
//   }
// });

const cors = require('cors');

const allowedOrigins = [
  'https://lavorofront.vercel.app',
  'https://lavorofront-m96tgvoe7-xyzt123456s-projects.vercel.app',
  'https://lavoro-back.onrender.com',
  'http://localhost:5173'
];


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// Socket.io
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    transports: ['websocket', 'polling'],
    credentials: true
  }
});
// app.use(cors({
//   origin: 'http://localhost:5173', // Frontend URL
//   credentials: true, // Allow cookies to be sent/received
// }));



// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');



// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a secure secret key
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: db.url, // MongoDB connection URL
      ttl: 24 * 60 * 60, // Session TTL (1 day)
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      sameSite: 'lax', // Prevent CSRF attacks
    },
  })
);

app.use ('/files',fileRouter);
app.use('/notifications',notifroute);

app.use('/meet', meetRouter);
// Routes
app.use('/users', usersRouter);
// app.use('/', homeRouter);
app.use('/admin',adminRouter);
app.use('/email',emailRouter);

app.set('io', io);

app.use('/tasks',taskRouter);
app.use('/chat', chatRouter);
app.use('/predict', predictRouter);

app.use('/notifications', notificationRoutes);



app.use('/project',projectRouter);
app.use('/teamMember', teamMemberRouter);
app.use('/skills', skillsRouter);
app.use('/userSkills', userSkillsRouter);
app.use('/ai-assignment', taskAssignmentRoutes);

app.use('/profiles', profileRouter);
app.use('/teams', teamRouter);

app.use('/ai-prioritization', taskPrioritizationRoutes);
app.use('/reports', reportRouter);
app.use('/delete-report', deleteReportRouter);


app.post("/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;

  try {
    const response = await axios.post("https://libretranslate.com/translate", {
      q: text,
      source: "auto",
      target: targetLanguage,
    });

    const translatedText = response.data.translatedText;
    res.json({ translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle user joining with their ID
  socket.on('user_connected', (userId) => {
    console.log(`User ${userId} connected`);

    // Join a room with the user's ID to enable direct messaging
    socket.join(userId);

    // Update user's online status
    // You can implement this with your user model
  });

  // Handle private message
  socket.on('private_message', async (data) => {
    const { sender_id, receiver_id, message, attachment, attachment_type } = data;

    try {
      // Create and save the message
      const newMessage = new Chat({
        sender_id,
        receiver_id,
        message,
        attachment,
        attachment_type,
        sent_at: new Date(),
        is_read: false
      });

      await newMessage.save();

      // Emit to the receiver
      const senderInfo = await User.findById(sender_id).select('name email profileImage');
      io.to(receiver_id).emit('new_message', {
        message: newMessage,
        sender: senderInfo
      });

      // Confirm to the sender
      socket.emit('message_sent', newMessage);
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle group message
  socket.on('group_message', async (data) => {
    const { group_id, sender_id, message, attachment, attachment_type } = data;

    try {
      // Create and save the message
      const newMessage = new GroupMessage({
        group_id,
        sender_id,
        message,
        attachment,
        attachment_type,
        sent_at: new Date(),
        read_by: [sender_id]
      });

      await newMessage.save();

      // Update group's last message timestamp
      await ChatGroup.findByIdAndUpdate(group_id, {
        last_message: new Date()
      });

      // Get group members
      const group = await ChatGroup.findById(group_id);

      // Emit to all group members except sender
      const senderInfo = await User.findById(sender_id).select('name email profileImage');
      for (const memberId of group.members) {
        if (memberId.toString() !== sender_id) {
          io.to(memberId.toString()).emit('new_group_message', {
            message: newMessage,
            sender: senderInfo,
            group: group
          });
        }
      }

      // Confirm to the sender
      socket.emit('group_message_sent', newMessage);
    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('message_error', { error: 'Failed to send group message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { sender_id, receiver_id } = data;
    io.to(receiver_id).emit('user_typing', { sender_id });
  });

  // Handle stop typing
  socket.on('stop_typing', (data) => {
    const { sender_id, receiver_id } = data;
    io.to(receiver_id).emit('user_stop_typing', { sender_id });
  });

  // Handle read receipt
  socket.on('message_read', async (data) => {
    const { message_id, reader_id } = data;

    try {
      // Update message read status
      const message = await Chat.findByIdAndUpdate(
        message_id,
        { is_read: true },
        { new: true }
      );

      if (message) {
        // Notify the sender
        io.to(message.sender_id.toString()).emit('message_read_receipt', {
          message_id,
          reader_id
        });
      }
    } catch (error) {
      console.error('Error updating read receipt:', error);
    }
  });

  // Handle group message read
  socket.on('group_message_read', async (data) => {
    const { message_id, reader_id } = data;

    try {
      // Update message read status
      const message = await GroupMessage.findByIdAndUpdate(
        message_id,
        { $addToSet: { read_by: reader_id } },
        { new: true }
      );

      if (message) {
        // Notify the sender
        io.to(message.sender_id.toString()).emit('group_message_read_receipt', {
          message_id,
          reader_id,
          group_id: message.group_id
        });
      }
    } catch (error) {
      console.error('Error updating group read receipt:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Update user's offline status
    // You can implement this with your user model
  });
});
// Start server

// server.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });

const PORT =  3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
});