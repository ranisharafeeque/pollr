const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const WSServer = require("./websocket.js");
const connections = require("./routers/pollWebsocket.js"); // call this to setup the websocket routes

const cookieController = require("../controllers/cookieController");
const userController = require("../controllers/userController");
const sessionController = require("../controllers/sessionController");

const { MONGO_URI, MONGO_TEST_URI, NODE_ENV } = require("../env");

const app = express();

const PORT = 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("server");

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../index.html"));
});

app.get("/style.css", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../style.css"));
});

app.get("/dist/bundle.js", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "../dist/bundle.js"));
});

app.use(express.static(path.join(__dirname, "../dist")));
app.use(express.static(path.join(__dirname, "../")));

app.get("api/login", sessionController.isLoggedIn, (req, res) => {
  if (res.locals.isLoggedIn) {
    res.status(200).json({ tabs: "/landing", userId: res.locals.userId });
  } else res.status(200).redirect("/");
});

//Authentication
app.post(
  "/api/signup",
  userController.createUser,
  cookieController.createCookie,
  sessionController.createSession,
  (req, res) => {
    console.log("end of signup route");
    //response includes 'home' to direct frontend to homepage
    res.status(200).json({ tabs: "/landing", userId: res.locals.userId });
  }
);

app.post(
  "/api/login",
  userController.verifyUser,
  cookieController.createCookie,
  sessionController.createSession,
  (req, res) => {
    if (res.locals.verified) {
      //redirect user in verifUser here
      res.status(200).json({ tabs: "/landing", userId: res.locals.userId });
    } else {
      res.status(200).redirect("/logout");
    }
  }
);

app.post(
  "/api/logout",
  sessionController.deleteSession,
  cookieController.deleteCookie,
  (req, res) => {
    try {
      return res.status(200).redirect("/");
    } catch (err) {
      res.status(200).json({ tabs: "/logout", message: "error in logout" });
    }
  }
);

// app.get("/guest", (req, res) => {
//   return res
//     .status(200)
//     .json({ tabs: "poll", pollId: req.body.id, userId: "guest123" });
// });

// Routers
const pollRouter = require("./routers/poll.js");
app.use("/api/poll", pollRouter);

/**
 * 404 handler
 */
app.use("*", (req, res) => {
  res.status(404).send("Not Found");
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.log("ERROR from global error handler", err.log);
  res.status(err.status || 500).send(err.message);
});

const runServer = async () => {
  await mongoose.connect(
    NODE_ENV === "development" ? MONGO_TEST_URI : MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // sets the name of the DB that our collections are part of
      dbName: "Pollr",
    }
  );

  const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });

  return async () => {
    server.close();
    return WSServer.socket.close();
    // return new Promise(resolve => WSServer.socket.close(() => {
    //   console.log('closing websockets')
    //   resolve();
    // }));
  };
};

module.exports = runServer;
