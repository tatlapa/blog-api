import { Request } from 'express';
import { Document } from 'mongoose';

// Types pour les utilisateurs
export interface IUser extends Document {
  email: string;
  password: string;
  username?: string;

  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  getPublicProfile(): Partial<IUser>;
}

// Types pour les articles
export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  readTime: number;
  views: number;
  likes: IUser['_id'][];
  comments: IComment[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  incrementViews(): Promise<IArticle>;
  toggleLike(userId: string): Promise<IArticle>;
  addComment(userId: string, content: string): Promise<IArticle>;
}

// Types pour les commentaires
export interface IComment {
  user: IUser['_id'];
  content: string;
  createdAt: Date;
}

// Types pour les requêtes authentifiées
export interface AuthRequest extends Request {
  user?: IUser;
  resource?: IArticle;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Types pour l'authentification
export interface AuthResponse {
  user: Partial<IUser>;
  access_token: string;
}

// Types pour la pagination
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Types pour les articles avec pagination
export interface ArticlesResponse {
  articles: IArticle[];
  pagination: PaginationInfo;
}
