const getUserByEmail = function(email, database) {
  let user;
  for (const userId in database) {
    if (database[userId].email === email) {
      user = database[userId];
      break;
    }
  }
  return user;
};

function urlsForUser(id, urlDatabase) {
  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

function generateRandomString(refDatabase) {
  // This generates a random word of size 6 from [0-9a-zA-Z]
  let result;
  // check if the random string generated already exists
  // random until does not exist.
  do {
    result = (Math.random() + 1).toString(36).substring(6);
  } while(refDatabase[result]);
  return result;
}

function autoPrefixHttp(url) {
  if (url && !(url.startsWith('http://') || url.startsWith('https://'))) {
    return `http://${url}`;
  }
  return url;
}

module.exports = { autoPrefixHttp, getUserByEmail, generateRandomString, urlsForUser };