const bcrypt = require('bcrypt');

async function passwordHash() {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
}

module.exports = passwordHash;
