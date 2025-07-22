import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest, IUser } from '../types';

// Middleware pour vérifier le token JWT
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token d'accès requis",
      });
      return;
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'fallback_secret') as any;

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
      return;
    }

    // Ajouter l'utilisateur à l'objet request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token invalide',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expiré',
      });
      return;
    }

    console.error("Erreur d'authentification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
    });
  }
};
