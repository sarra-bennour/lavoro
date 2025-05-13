// models/index.js
const mongoose = require('mongoose');

// Import all models
const User = require('./user');
const Role = require('./role');
const Project = require('./Project');
const Team = require('./team');
const Task = require('./Task');
const Chat = require('./chat');
const ChatGroup = require('./chatGroup');
const GroupMessage = require('./groupMessage');
const Notification = require('./Notification');
const Archive = require('./Archive');
const ProjectHistory = require('./ProjectHistory');
const TaskHistory = require('./TaskHistory');
const AccountActivityLog = require('./accountActivityLog');

// Export all models
module.exports = {
  User,
  Role,
  Project,
  Team,
  Task,
  Chat,
  ChatGroup,
  GroupMessage,
  Notification,
  Archive,
  ProjectHistory,
  TaskHistory,
  AccountActivityLog
};
