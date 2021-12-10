const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
var cookieParser = require('cookie-parser')

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  }
}

function generateRandomString() {
  return (Math.random() + 1).toString(36).substring(6);
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.post("/register", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Bad Request');
    return;
  }

  const isExist = Object.keys(users).some((userId) => {
    return users[userId].email === req.body.email;
  });
  if (isExist) {
    res.status(400).send('Bad Request');
    return;
  }
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let user;
  const isExist = Object.keys(users).some((userId) => {
    if (users[userId].email === req.body.email) {
      user = users[userId];
      return true;
    }
    return false;
  });
  if (!user || user.password !== req.body.password) {
    res.status(403).send('Unauthorized');
    return;
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/u/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
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
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    console.log('Before short url update');
    console.log(urlDatabase);
    urlDatabase[shortURL] = req.body.longURL;
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
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_registration", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404).send('Not Found');
    return;
  }
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});