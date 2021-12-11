const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
var cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
  "b2XVn1": {
    longURL: "http://www.yahoo.com",
    userID: "cc"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "cc": {
    id: "cc", 
    email: "c@c.com", 
    password: "test"
  }
}

function generateRandomString() {
  return (Math.random() + 1).toString(36).substring(6);
}

function urlsForUser(id) {
  const urls = {};
  Object.keys(urlDatabase).forEach((shortURL) => {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  });
  return urls;
}

const bcrypt = require('bcryptjs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Xy12345Fv'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Bad Request');
    return;
  }

  const user = getUserByEmail(req.body.email, users);
  if (user) {
    res.status(400).send('Bad Request');
    return;
  }
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send('Unauthorized');
    return;
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  delete req.session.user_id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: user.id
  };
  res.redirect(`/u/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  const urlEntry = urlDatabase[shortURL];
  if (urlEntry && urlEntry.userID === user.id) {
    console.log('Before short url delete');
    console.log(urlDatabase);
    delete urlDatabase[shortURL];
    console.log('After short url delete');
    console.log(urlDatabase);
    res.send('OK');
    return;
  }
  res.status(404).send('Not Found');
});


app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  const urlEntry = urlDatabase[shortURL];
  if (urlEntry && urlEntry.userID === user.id) {
    console.log('Before short url update');
    console.log(urlDatabase);
    urlDatabase[shortURL].longURL = req.body.longURL;
    console.log('After short url delete');
    console.log(urlDatabase);
    res.send('OK');
    return;
  }
  res.status(404).send('Not Found');
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_login", { user });
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_registration", { user });
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const urls = urlsForUser(user.id);
  const templateVars = {
    urls,
    user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", { user });
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const entry = urlDatabase[req.params.shortURL];
  if (!entry || entry.userID !== user.id) {
    res.status(404).send("Not Found");
    return;
  }
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: entry.longURL,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const entry = urlDatabase[req.params.shortURL];
  if (!entry) {
    res.status(404).send("Not Found");
    return;
  }
  res.redirect(entry.longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});