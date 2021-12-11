const getUserByEmail = function(email, database) {
  let user;
  Object.keys(database).some((userId) => {
    if (database[userId].email === email) {
      user = database[userId];
      return true;
    }
    return false;
  });
  return user;
};

module.exports = { getUserByEmail };