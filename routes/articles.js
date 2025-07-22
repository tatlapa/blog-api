const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Article = require('../models/Article');
const { authenticateToken, authorizeOwner } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création/modification d'articles
const articleValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères')
    .trim(),

  body('content')
    .isLength({ min: 50 })
    .withMessage('Le contenu doit contenir au moins 50 caractères'),

  body('excerpt')
    .optional()
    .isLength({ max: 300 })
    .withMessage("L'extrait ne peut pas dépasser 300 caractères"),

  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Statut invalide'),

  body('tags').optional().isArray().withMessage('Les tags doivent être un tableau'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Chaque tag doit contenir entre 1 et 20 caractères'),

  body('featuredImage').optional().isURL().withMessage("L'image doit être une URL valide"),

  body('seo.metaTitle')
    .optional()
    .isLength({ max: 60 })
    .withMessage('Le titre meta ne peut pas dépasser 60 caractères'),

  body('seo.metaDescription')
    .optional()
    .isLength({ max: 160 })
    .withMessage('La description meta ne peut pas dépasser 160 caractères'),

  body('seo.keywords').optional().isArray().withMessage('Les mots-clés doivent être un tableau'),
];

// @route   GET /api/articles
// @desc    Récupérer tous les articles (avec pagination et filtres)
// @access  Private
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('La limite doit être entre 1 et 50'),

    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage('La recherche doit contenir au moins 2 caractères'),
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

      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Construire le filtre
      const filter = { author: req.user._id };

      if (search) {
        filter.$text = { $search: search };
      }

      // Construire l'objet de tri
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculer la pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Récupérer les articles
      const articles = await Article.find(filter)
        .populate('author', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');

      // Compter le total d'articles
      const total = await Article.countDocuments(filter);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des articles',
      });
    }
  }
);

// @route   GET /api/articles/public
// @desc    Récupérer les articles publics (pour les visiteurs)
// @access  Public
router.get(
  '/public',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('La limite doit être entre 1 et 20'),

    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage('La recherche doit contenir au moins 2 caractères'),
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

      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Construire le filtre (seulement les articles publiés)
      const filter = { status: 'published' };

      if (search) {
        filter.$text = { $search: search };
      }

      // Construire l'objet de tri
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculer la pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Récupérer les articles
      const articles = await Article.find(filter)
        .populate('author', 'username avatar bio')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');

      // Compter le total d'articles
      const total = await Article.countDocuments(filter);

      // Calculer les métadonnées de pagination
      const totalPages = Math.ceil(total / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des articles publics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des articles',
      });
    }
  }
);

// @route   GET /api/articles/:id
// @desc    Récupérer un article spécifique
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('comments.user', 'username avatar')
      .select('-__v');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé',
      });
    }

    // Vérifier si l'utilisateur est l'auteur ou si l'article est publié
    if (
      article.author._id.toString() !== req.user._id.toString() &&
      article.status !== 'published'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Incrémenter les vues si l'article est publié
    if (article.status === 'published') {
      await article.incrementViews();
    }

    res.json({
      success: true,
      data: {
        article,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'article",
    });
  }
});

// @route   POST /api/articles
// @desc    Créer un nouvel article
// @access  Private
router.post('/', articleValidation, async (req, res) => {
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

    const {
      title,
      content,
      excerpt,
      status = 'draft',
      tags = [],
      featuredImage,
      seo = {},
    } = req.body;

    // Créer le nouvel article
    const article = new Article({
      title,
      content,
      excerpt,
      status,
      tags,
      featuredImage,
      seo,
      author: req.user._id,
    });

    await article.save();

    // Récupérer l'article avec les informations de l'auteur
    const populatedArticle = await Article.findById(article._id)
      .populate('author', 'username avatar')
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: {
        article: populatedArticle,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'article",
    });
  }
});

// @route   PUT /api/articles/:id
// @desc    Mettre à jour un article
// @access  Private
router.put('/:id', articleValidation, authorizeOwner(Article), async (req, res) => {
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

    const { title, content, excerpt, status, tags, featuredImage, seo } = req.body;

    // Mettre à jour l'article
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        excerpt,
        status,
        tags,
        featuredImage,
        seo,
      },
      { new: true, runValidators: true }
    )
      .populate('author', 'username avatar')
      .select('-__v');

    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: {
        article: updatedArticle,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'article",
    });
  }
});

// @route   DELETE /api/articles/:id
// @desc    Supprimer un article
// @access  Private
router.delete('/:id', authorizeOwner(Article), async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Article supprimé avec succès',
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'article",
    });
  }
});

// @route   POST /api/articles/:id/like
// @desc    Ajouter/retirer un like sur un article
// @access  Private
router.post('/:id/like', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé',
      });
    }

    // Vérifier si l'utilisateur peut voir l'article
    if (article.author.toString() !== req.user._id.toString() && article.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Toggle le like
    await article.toggleLike(req.user._id);

    res.json({
      success: true,
      message: 'Like mis à jour avec succès',
      data: {
        likesCount: article.likes.length,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du like:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du like',
    });
  }
});

// @route   POST /api/articles/:id/comments
// @desc    Ajouter un commentaire à un article
// @access  Private
router.post(
  '/:id/comments',
  [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Le commentaire doit contenir entre 1 et 1000 caractères')
      .trim(),
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

      const article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article non trouvé',
        });
      }

      // Vérifier si l'utilisateur peut commenter l'article
      if (article.author.toString() !== req.user._id.toString() && article.status !== 'published') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé',
        });
      }

      // Ajouter le commentaire
      await article.addComment(req.user._id, req.body.content);

      // Récupérer l'article avec les commentaires
      const updatedArticle = await Article.findById(req.params.id)
        .populate('comments.user', 'username avatar')
        .select('-__v');

      res.json({
        success: true,
        message: 'Commentaire ajouté avec succès',
        data: {
          article: updatedArticle,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajout du commentaire",
      });
    }
  }
);

module.exports = router;
