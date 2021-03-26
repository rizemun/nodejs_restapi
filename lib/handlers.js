/*
 * Request handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
const handlers = {};


// Users
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) !== -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastname, phone, password, tosAgreement
//Optional data: none
handlers._users.post = function (data, callback) {
  // Check that all required fields out
  const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim()
    : false;
  const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim()
    : false;
  const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;
  const tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesent exists
    _data.read('users', phone, function (err, data) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // Create user object
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement: true
          }

          // Store the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error': 'A user with that number already exists'})
            }
          })
        } else {
          callback(500, {'Error': 'Could not hash the user\'s password'})
        }
      } else {
        // User already exists
        callback(400, {'Error': 'A user with that phone already exists'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }

}

// Users - get
// Required data: phone
// Optional data: none
//@TODO Only let an authentificated user access their object, dont't let them access anyone elses
handlers._users.get = function (data, callback) {
  // Check valid of provided phone
  const phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;
  if (phone) {
    // Get the token form the headers
    const token = typeof (data.headers.token) === 'string'
      ? data.headers.token
      : false;
    // Verify that the token if valid for te phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            // Remove hashed password from user object
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        })
      } else {
        callback(403, {'Error': 'Missing required token or token is expired'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }

}

// Users - put
// Required data: phone
// Optional data: firstName, lastname, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // Check valid of provided phone
  const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;
  const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim()
    : false;
  const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim()
    : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;

  if (phone) {
    // Get the token form the headers
    const token = typeof (data.headers.token) === 'string'
      ? data.headers.token
      : false;

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if(tokenIsValid) {
        if (firstName || lastName || password) {
          // Lookup the user
          _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName
              }
              if (lastName) {
                userData.lastName = lastName
              }
              if (password) {
                userData.password = helpers.hash(password)
              }

              // Store the user updates
              _data.update('users', phone, userData, function (err, data) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Field': 'Could not update the user'})
                }
              })
            } else {
              callback(400, {'Error': 'The specified user does not exist'})
            }
          })
        } else {
          callback(400, {'Error': 'Missingfields to update'})
        }
      } else {
        callback(403, {'Error': 'Missing required token or token is expired'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Users - delete
// Required data: phone
// Optional data: none
//@TODO Cleanup (delete) any oter data fields associated with this user
handlers._users.delete = function (data, callback) {
  // Check valid of provided phone
  const phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;
  if (phone) {
    // Get the token form the headers
    const token = typeof (data.headers.token) === 'string'
      ? data.headers.token
      : false;

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if(tokenIsValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            _data.delete('users', phone, function (err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, {'Error': 'Could not delete the specified user'})
              }
            })
          } else {
            callback(400, {'Error': 'Could not find the specified user'});
          }
        })
      } else {
        callback(403, {'Error': 'Missing required token or token is expired'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Tokens
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) !== -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

//Container for all te tokens methods
handlers._tokens = {};

//Tokens - post
//Required data: phone, password
//Otional data: none
handlers._tokens.post = function (data, callback) {
  const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;

  if (phone && password) {
    // Lookup the user who matches that phone number
    _data.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare with saved user password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            id: tokenId,
            expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create token'})
            }
          })
        } else {
          callback(400, {'Error': 'Password did not match the specified user\'s stored password'});
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'})
  }

}

//Tokens - get
//Required data: id
//Otional data: none
handlers._tokens.get = function (data, callback) {
  // Check that id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20
    ? data.queryStringObject.id.trim()
    : false;
  if (id) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Lookup the token
        delete data.hashedPassword;
        callback(200, tokenData);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}
//Tokens - put
//Required data: id, extend
//Otional data: none
handlers._tokens.put = function (data, callback) {
  const id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20
    ? data.payload.id.trim()
    : false;
  const extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend === true;

  if (id && extend) {
    //Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to the make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the ne updates
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error': 'Could not update the token\'s expiration'})
            }
          })
        } else {
          callback(400, {'Error': 'Token is already expired and cannot be extended'})
        }

      } else {
        callback(400, {'Error': 'Specified tokens does not exist'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'})
  }

}
//Tokens - delete
//Required data: id
//Optional data: none
handlers._tokens.delete = function (data, callback) {
  // Check that id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20
    ? data.queryStringObject.id.trim()
    : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete the specified token'})
          }
        })
      } else {
        callback(400, {'Error': 'Could not find the specified token'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }


}


// Verify if a given token id is currntly valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
  // Lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for given user and has not expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false)
      }
    } else {
      callback(false);
    }
  })
}


// Ping handler
handlers.ping = function (data, callback) {
  // Callback a http status code, and a payload object
  callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
