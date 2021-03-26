/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config')

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
  if (typeof (str) === 'string' && str.length > 0) {
    return crypto.createHash('sha256', config.hashingSecret).update(str).digest('hex');
  }
  return false;
}

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return {};
  }
}

// Create a string of random alphanumeric characters of a given lengt
helpers.createRandomString = function(strLength) {
  if(strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    //Start the final string
    let str ='';
    for (let i = 0; i < strLength; i++) {
      // Get a randomcharacter from the possibleCharacters string
      const randomCharacter =  possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));

      // Append this character to the final string
      str += randomCharacter;
    }

    return str;
  } else {
    return false
  }
}

// Export the module
module.exports = helpers;
