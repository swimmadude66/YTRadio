var crypto = require('crypto');

module.exports = {
	encrypt: function(plaintext){
		//TODO implement Encryption
		return plaintext;
	},
  decrypt: function(enctext){
		//TODO implement Decryption
		return enctext;
	},
  hash:function(plaintext){
		var shasum = crypto.createHash('sha256'); //sufficient for now
		shasum.update(plaintext);
		return shasum.digest('hex');
	}
};
