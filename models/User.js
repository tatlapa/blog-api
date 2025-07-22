const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      minlength: [3, "Le nom d'utilisateur doit contenir au moins 3 caractères"],
      maxlength: [30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères"],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false, // Ne pas inclure le mot de passe dans les requêtes par défaut
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'La bio ne peut pas dépasser 500 caractères'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual pour les articles de l'utilisateur
userSchema.virtual('articles', {
  ref: 'Article',
  localField: '_id',
  foreignField: 'author',
});

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour générer un token JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Méthode statique pour trouver un utilisateur par email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).select('+password');
};

// Méthode statique pour trouver un utilisateur par username
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

module.exports = mongoose.model('User', userSchema);
