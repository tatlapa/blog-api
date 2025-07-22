const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token d'accès requis",
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Compte utilisateur désactivé",
      });
    }

    // Ajouter l'utilisateur à l'objet request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      });
    }

    console.error("Erreur d'authentification:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
    });
  }
};

// Middleware pour vérifier les rôles (optionnel)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est propriétaire de la ressource
const authorizeOwner = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Ressource non trouvée",
        });
      }

      // Vérifier si l'utilisateur est propriétaire ou admin
      if (
        resource.author.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à modifier cette ressource",
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error("Erreur d'autorisation:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur d'autorisation",
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeOwner,
};
