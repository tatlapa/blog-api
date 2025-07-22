const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Les mots de passe ne correspondent pas');
    }
    return true;
  }),
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),

  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Le nom d'utilisateur doit contenir entre 3 et 30 caractères")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères'),

  body('avatar').optional().isURL().withMessage("L'avatar doit être une URL valide"),
];

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array(),
      });
    }

    const { email, password, bio, avatar } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      email,
      password,
      bio: bio || '',
      avatar: avatar || '',
    });

    await user.save();

    // Générer le token JWT
    const token = user.generateAuthToken();

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      user: user.getPublicProfile(),
      access_token: token,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur par email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Générer le token JWT
    const token = user.generateAuthToken();

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    res.json({
      user: user.getPublicProfile(),
      access_token: token,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Récupérer le profil de l'utilisateur connecté
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('articles', 'title slug status createdAt')
      .select('-password');

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil de l'utilisateur
// @access  Private
router.put('/profile', authenticateToken, updateProfileValidation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array(),
      });
    }

    const { username, bio, avatar } = req.body;
    const userId = req.user._id;

    // Vérifier si le nouveau username est déjà pris
    if (username && username !== req.user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Ce nom d'utilisateur est déjà pris",
        });
      }
    }

    // Mettre à jour le profil
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username: username || req.user.username,
        bio: bio !== undefined ? bio : req.user.bio,
        avatar: avatar || req.user.avatar,
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Changer le mot de passe
// @access  Private
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),

    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
      ),

    body('confirmNewPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Les nouveaux mots de passe ne correspondent pas');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Récupérer l'utilisateur avec le mot de passe
      const user = await User.findById(userId).select('+password');

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel est incorrect',
        });
      }

      // Mettre à jour le mot de passe
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du changement de mot de passe',
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Déconnexion (côté client)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

module.exports = router;
