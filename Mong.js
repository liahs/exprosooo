const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// admin initailiaze firebase need .json file , goto to firebase project>click on settings>user permisssions>secure accounts>copy the code and click on generate new key to get json file
//var admin = require('firebase-admin');
//// need to install package firebase-admin
//var serviceAccount = require(__dirname+"/notify-9b2f1-firebase-adminsdk-35wfj-f7f6f51e8b.json");
//admin.initializeApp({
//  credential: admin.credential.cert(serviceAccount),
//  databaseURL: "https://notify-9b2f1.firebaseio.com"
//});
//

// Middleware start
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(function(req, res, next) {
  console.log(req.method, req.path, "-", req.ip);
  next();
});

// MiddleWare Ends

// Model assiginng
const Group = require("./models").groupModel;
const Chat = require("./models").chatModel;
const User = require("./models").userModel;

// Add token to user for FCM
const addTokenToUser = function(user, token) {
  User.findOne({ name: user }, function(err, u) {
    if (err) return console.log(err);
    if (!u.tokens.includes(token)) {
      u.tokens.push(token);
      u.save(function(err, data) {
        if (err) console.log(err);
        console.log("Succefully added token");
      });
    } else {
      console.log("token already exited!!!");
    }
  });
};

const CreateGroup = function(name, admin) {
  const g = new Group({
    name: name
  });
  g.admin.push(admin);
  g.users.push(admin);
  g.users.push("Rohit");
  g.users.push("Shail");
  g.save(function(err, data) {
    if (err) return console.error(err);
    console.log("Group: ", data.name, "Created successfully");
  });
};

io.on("connection", socket => {
  console.log("a user connected");

  socket.on("msgAdded", () => {
    io.emit("msgAdded");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// get request to default route
app.get("/", function(req, res) {
  res.send(
    "Server is Running!!!<br> Post /CreateGroup body:name,admin <br> Get /showAllGChat"
  );
});

// Group Api
app.get("/CreateGroup/:name/:admin", async function(req, res) {
  const name = req.params.name; //for testing purpose using params.name else use body.name
  const admin = req.params.admin;
  await CreateGroup(name, admin);
  await res.redirect("/showAllGChat");
});

app.get("/:group/showAllGChat", async function(req, res) {
  const gAll = await Group.findOne({ name: req.params.group }, function(
    err,
    data
  ) {
    if (err) return console.error(err);
    console.log(data);
  });
  return res.json(gAll);
});

app
  .route("/updateGChatList")
  .get(function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  })
  .post(function(req, res) {
    const sender = req.body.sender;
    const message = req.body.message;
    console.log(req.body);
    Group.findOne({ name: "Developers" }, function(err, group) {
      if (err) return console.log(err);
      group.chat.push({ sender: sender, message: message });
      group.save(function(err, data) {
        if (err) return console.log(err);
        console.log("successFully  add Chat");
        io.emit("msgAdded");
      });
    });
    res.send("add to GroupChat");
  });
// End Group Api

// User Api and Chat

const chatCreate = function(sender, receiver) {
  const c = new Chat({
    participants: [sender.toLowerCase(), receiver.toLowerCase()].sort()
  });
  c.save(function(err, data) {
    if (err) return console.log(err);
    console.log(data, "Successfully created");
  });
};
app.get("/createChat/:p1/:p2", function(req, res) {
  chatCreate(req.params.p1, req.params.p2);
  res.send("Done");
});
const showAllChat = async function() {
  return await Chat.find({});
};

app.get("/showAllChat", async function(req, res) {
  res.json(await showAllChat());
});

const userCreate = function(user) {
  const u1 = new User({ username: user.toLowerCase() });
  u1.save(function(err, data) {
    if (err) console.log(err);
    console.log(data.username, "Successfully created!!");
  });
};

async function showAllUser() {
  return await User.find({});
}

app
  .route("/addUser")
  .get(function(req, res) {
    res.sendFile(__dirname + "/public/addUser.html");
  })
  .post(async function(req, res) {
    await userCreate(req.body.user);
    await res.json(await showAllUser());
  });
app.get("/showUsers", async function(req, res) {
  res.json(await showAllUser());
});

app
  .route("/updateChatList")
  .get(function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
  })
  .post(function(req, res) {
    const sender = req.body.sender;
    const message = req.body.message;
    const receiver = req.body.receiver;
    Chat.findOne(
      { participants: [sender.toLowerCase(), receiver.toLowerCase()].sort() },
      function(err, chat) {
        if (err) res.send(err);
        if (chat) {
          chat.conversation.push({ sender: sender, txt: message });
          chat.save(function(err, data) {
            if (err) return console.log(err);
            res.send("successFully  add Chat");
            io.emit("msgAdded");
          });
        } else {
          res.send("Doesnot have any chat");
        }
      }
    );
  });

app.get("/showChat/:p1/:p2/:n", async function(req, res) {
  const c = await Chat.findOne({
    participants: [req.params.p1, req.params.p2].sort()
  });
  if (c) {
    res.json(
      c.conversation.length >= req.params.n
        ? c.conversation.slice(c.conversation.length - req.params.n)
        : c.conversation
    );
  } else {
    res.json({ status: "NOTok" });
  }
});

app.delete("/delMessage", function(req, res) {
  const sender = req.body.sender;
  const receiver = req.body.receiver;
  const id = req.body.id;
  console.log(id, sender, receiver);
  Chat.findOne(
    {
      participants: [sender, receiver].sort()
    },
    function(err, chat) {
      if (err) return console.log(err);
      if (chat) {
        chat.conversation = [
          ...chat.conversation.map(x => {
            if (x._id.toString() == id) {
              x.visible = false;
              console.log("Done");
            }
            return x;
          })
        ];
        chat.save(function(err, data) {
          if (err) return console.log(err);
          console.log("Changes visibility!!");
          res.json(
            chat.conversation.length >= req.body.n
              ? chat.conversation.slice(chat.conversation.length - req.body.n)
              : chat.conversation
          );
        });
      }
    }
  );
});

// Append

// Notification Api for server side
// assigning token to users
app.post("/addToken", function(req, res) {
  const name = req.body.user;
  const token = req.body.token;
  addTokenToUser(name, token); //above in file
  res.send("added token");
});

// using firebase admin to send message to devices with saved tokens from database
app
  .route("/sendMessage")
  .post(function(req, res) {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const message = req.body.message;
    User.findOne({ name: receiver }, async function(err, user) {
      if (err) return console.log(err);
      admin
        .messaging()
        .sendToDevice(
          user.tokens,
          {
            notification: {
              title: sender,
              body: message
            },
            data: {
              type: "Chat"
            }
          },
          {
            contentAvailable: true,
            priority: "high"
          }
        )
        .then(function(response) {
          console.log("Successfully sent message:", response);
          res.send("Good sent");
        })
        .catch(function(error) {
          console.log("Error sending message:", error);
        });
    });
  })
  .get(function(req, res) {
    res.sendFile(__dirname + "/public/sendMessage.html");
  });

http.listen(3000, () => {
  console.log("server is runing");
});
