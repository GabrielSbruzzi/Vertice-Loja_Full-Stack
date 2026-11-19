const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error('Este e-mail já está cadastrado.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      stores: { create: { name: `Loja de ${name.trim()}` } }
    },
    select: { id: true, name: true, email: true, role: true }
  });
  return issueToken(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('E-mail ou senha incorretos.');
    error.status = 401;
    throw error;
  }

  return issueToken({ id: user.id, name: user.name, email: user.email, role: user.role });
}

function issueToken(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { token, user };
}

module.exports = { register, login };
