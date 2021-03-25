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
    _data.read('users', phone, function(err, data) {
      if(err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if(hashedPassword) {
        // Create user object
        const userObject = {
          firstName,
          lastName,
          phone,
          hashedPassword,
          tosAgreement: true
        }

        // Store the user
        _data.create('users', phone, userObject, function(err) {
          if(!err) {
            callback(200);
          } else {
            console.log(err);
            callback(500, {'Error':'A user with that number already exists'})
          }
        })
        } else {
          callback(500, {'Error':'Could not hash the user\'s password'})
        }
      } else {
        // User already exists
        callback(400,{'Error':'A user with that phone already exists'})
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
    _data.read('users',phone,function(err, data) {
      if(!err && data) {
        // Remove hashed password from user object
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }

}

// Users - put
// Required data: phone
// Optional data: firstName, lastname, password (at least one must be specified)
//@TODO Only let an authentificated user can update their object, dont't let them update anyone elses
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
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, function(err, userData) {
        if(!err && userData) {
          // Update the fields necessary
          if(firstName) {
            userData.firstName = firstName
          }
          if(lastName) {
            userData.lastName = lastName
          }
          if(password) {
            userData.password = helpers.hash(password)
          }

          // Store the user updates
          _data.update('users', phone, userData,function(err, data) {
            if(!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Field':'Could not update the user'})
            }
          })
        } else {
          callback(400, {'Error': 'The specified user does not exist'})
        }
      })
    } else {
      callback(400, {'Error':'Missingfields to update'})
    }
  } else {
    callback(400, {'Error':'Missing required field'})
  }
}

// Users - delete
// Required data: phone
//@TODO Only let an authentificated user can delete their object, dont't let them delete anyone elses
//@TODO Cleanup (delete) any oter data fields associated with this user
handlers._users.delete = function (data, callback) {
  // Check valid of provided phone
  const phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10
    ? data.queryStringObject.phone.trim()
    : false;
  if (phone) {
    _data.read('users', phone,function(err, data) {
      if(!err && data) {
        _data.delete('users', phone, function(err) {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error':'Could not delete the specified user'})
          }
        })

      } else {
        callback(400, {'Error':'Could not find the specified user'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
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
