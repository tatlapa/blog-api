const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Le contenu est requis'],
      minlength: [50, 'Le contenu doit contenir au moins 50 caractères'],
    },
    excerpt: {
      type: String,
      maxlength: [300, "L'extrait ne peut pas dépasser 300 caractères"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'auteur est requis"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    featuredImage: {
      type: String,
      default: '',
    },
    readTime: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, 'Le titre meta ne peut pas dépasser 60 caractères'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'La description meta ne peut pas dépasser 160 caractères'],
      },
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
articleSchema.index({ title: 'text', content: 'text' });
articleSchema.index({ slug: 1 });
articleSchema.index({ author: 1 });
articleSchema.index({ status: 1 });
articleSchema.index({ createdAt: -1 });

// Virtual pour le nombre de likes
articleSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

// Virtual pour le nombre de commentaires
articleSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

// Virtual pour l'URL de l'article
articleSchema.virtual('url').get(function () {
  return `/articles/${this.slug}`;
});

// Middleware pour générer le slug avant sauvegarde
articleSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();

  // Générer un slug basé sur le titre
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Remplacer les tirets multiples par un seul
    .trim('-'); // Supprimer les tirets en début et fin

  // Calculer le temps de lecture (environ 200 mots par minute)
  const wordCount = this.content.split(/\s+/).length;
  this.readTime = Math.ceil(wordCount / 200);

  // Générer l'extrait si non fourni
  if (!this.excerpt) {
    this.excerpt =
      this.content
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .substring(0, 150)
        .trim() + '...';
  }

  // Générer les meta tags SEO si non fournis
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title;
  }

  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt;
  }

  next();
});

// Méthode pour incrémenter les vues
articleSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Méthode pour ajouter/retirer un like
articleSchema.methods.toggleLike = function (userId) {
  const likeIndex = this.likes.indexOf(userId);

  if (likeIndex === -1) {
    // Ajouter le like
    this.likes.push(userId);
  } else {
    // Retirer le like
    this.likes.splice(likeIndex, 1);
  }

  return this.save();
};

// Méthode pour ajouter un commentaire
articleSchema.methods.addComment = function (userId, content) {
  this.comments.push({
    user: userId,
    content: content,
  });

  return this.save();
};

// Méthode statique pour trouver les articles publiés
articleSchema.statics.findPublished = function () {
  return this.find({ status: 'published' })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 });
};

// Méthode statique pour trouver les articles par catégorie
articleSchema.statics.findByCategory = function (category) {
  return this.find({
    category: category,
    status: 'published',
  })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 });
};

// Méthode statique pour rechercher des articles
articleSchema.statics.search = function (query) {
  return this.find({
    $text: { $search: query },
    status: 'published',
  })
    .populate('author', 'username avatar')
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Article', articleSchema);
