const mongoose = require("mongoose");
const env = require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("connected");
  });
const groupSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
  admin: [String],
  chat: [
    {
      sender: String,
      message: String,
      sendAt: { type: Date, default: Date.now }
    }
  ],
  users: [String]
});

const chatSchema = new mongoose.Schema({
  participants: [String],
  conversation: [
    {
      sender: String,
      txt: String,
      created_at: { type: Date, default: Date.now },
      visible: { type: Boolean, default: true }
    }
  ]
});
const userSchema = new mongoose.Schema({
  username: { type: String, trim: true },
  tokens: [{ type: String }], // for notification
  avatar: String,
  private: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  email: String,
  fullname: String,
  block: [mongoose.ObjectId],
  blocked: [mongoose.ObjectId],
  following: [mongoose.ObjectId],
  followers: [mongoose.ObjectId],
  sentreq: [mongoose.ObjectId],
  requests: [mongoose.ObjectId]
});

const Group = mongoose.model("GroupChat", groupSchema);
const Chat = mongoose.model("Chat", chatSchema);
const User = mongoose.model("Users", userSchema);

exports.groupModel = Group;
exports.chatModel = Chat;
exports.userModel = User;
