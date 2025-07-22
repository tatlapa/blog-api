import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import Article from '../models/Article';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest, IArticle, ArticlesResponse, PaginationInfo } from '../types';

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
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage("L'image de couverture doit être une URL valide"),
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
    query('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Statut invalide'),
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage('La recherche doit contenir au moins 2 caractères'),
    query('sortBy')
      .optional()
      .isIn(['title', 'createdAt', 'updatedAt', 'views', 'readTime'])
      .withMessage('Champ de tri invalide'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filter: any = { author: req.user?._id };
      if (status) filter.status = status;
      if (search) {
        filter.$text = { $search: search as string };
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const articles = await Article.find(filter)
        .populate('author', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-__v');

      const total = await Article.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit as string));

      const pagination: PaginationInfo = {
        currentPage: parseInt(page as string),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit as string),
        hasNextPage: parseInt(page as string) < totalPages,
        hasPrevPage: parseInt(page as string) > 1,
      };

      const response: ArticlesResponse = {
        articles,
        pagination,
      };

      res.json({
        success: true,
        data: response,
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
    query('sortBy')
      .optional()
      .isIn(['title', 'createdAt', 'updatedAt', 'views', 'readTime'])
      .withMessage('Champ de tri invalide'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordre de tri invalide'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreurs de validation',
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const filter: any = { status: 'published' };
      if (search) {
        filter.$text = { $search: search as string };
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const articles = await Article.find(filter)
        .populate('author', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-__v');

      const total = await Article.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit as string));

      const pagination: PaginationInfo = {
        currentPage: parseInt(page as string),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit as string),
        hasNextPage: parseInt(page as string) < totalPages,
        hasPrevPage: parseInt(page as string) > 1,
      };

      const response: ArticlesResponse = {
        articles,
        pagination,
      };

      res.json({
        success: true,
        data: response,
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

// @route   POST /api/articles
// @desc    Créer un nouvel article
// @access  Private
router.post('/', articleValidation, async (req: AuthRequest, res: Response) => {
  try {
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

    const article = new Article({
      title,
      content,
      excerpt,
      status,
      tags,
      featuredImage,
      seo,
      author: req.user?._id,
    });

    await article.save();
    await article.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: {
        article,
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
router.put('/:id', articleValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array(),
      });
    }

    const { title, content, excerpt, status, tags, featuredImage, seo } = req.body;

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params['id'],
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
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await Article.findByIdAndDelete(req.params['id']);

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

export default router;
