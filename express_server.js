const express = require("express");
var cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const { autoPrefixHttp, getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

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

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Xy12345Fv'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

/**
 * Register a user with password to our application db
 * Password will be hashed.
 */
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
  const userId = generateRandomString(users);
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
  // If no user found or mismatching password, reject unauthorized.
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send('Unauthorized');
    return;
  }
  // If user found and password is ok, redirect to urls view.
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

/**
 * Add a new tiny url to our application db.
 */
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = generateRandomString(urlDatabase);
  urlDatabase[shortURL] = {
    longURL: autoPrefixHttp(req.body.longURL),
    userID: user.id
  };
  res.redirect(`/urls/${shortURL}`);
});

/**
 * Delete a short url entry
 */
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  const urlEntry = urlDatabase[shortURL];
  // check first if urlEntry is defined to prevent error
  // for attempting to read value from undefined.
  if (urlEntry && urlEntry.userID === user.id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
    return;
  }
  res.status(404).send('Not Found');
});

/**
 * Amend existing tiny url to another site
 */
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  const urlEntry = urlDatabase[shortURL];
  // check first if urlEntry is defined to prevent error
  // for attempting to read value from undefined.
  if (urlEntry && urlEntry.userID === user.id) {
    urlDatabase[shortURL].longURL = autoPrefixHttp(req.body.longURL);
    res.redirect("/urls");
    return;
  }
  res.status(404).send('Not Found');
});

/**
 * Load landing page and redirect to urls listing page
 * if session exists
 */
app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

/**
 * Render login page
 */
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_login", { user });
});

/**
 * Render register page
 */
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_registration", { user });
});

/**
 * Render url listing page
 */
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const urls = urlsForUser(user.id, urlDatabase);
  const templateVars = {
    urls,
    user
  };
  res.render("urls_index", templateVars);
});

/**
 * Render tiny url addition page
 */
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", { user });
});

/**
 * Render tiny url info and modification page
 */
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

/**
 * Redirect to long url based on given short url
 */
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