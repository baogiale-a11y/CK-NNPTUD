require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../schemas/role.schema');
const User = require('../schemas/user.schema');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const roles = ['admin', 'teacher', 'student'];
  const createdRoles = {};

  for (const name of roles) {
    let role = await Role.findOne({ name });
    if (!role) role = await Role.create({ name, description: `${name} role` });
    createdRoles[name] = role;
  }

  const adminEmail = 'legiabao1928@gmail.com';
  const adminExists = await User.findOne({ email: adminEmail });

  if (!adminExists) {
    await User.create({
      username: 'admin',
      email: adminEmail,
      password: await bcrypt.hash('Admin@123', 10),
      role: createdRoles.admin._id,
    });
    console.log('Admin created: legiabao1928@gmail.com / Admin@123');
  } else {
    console.log('Admin already exists');
  }

  await mongoose.disconnect();
};

seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  });
