const bcrypt = require('bcryptjs');
const password = 'haslo123';
bcrypt.hash(password, 10, function(err, hash) {
    console.log(hash);
});