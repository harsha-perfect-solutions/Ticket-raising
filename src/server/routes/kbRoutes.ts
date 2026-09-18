import { Router, Request, Response } from 'express';
import { searchKnowledgeBase, getArticleById } from '../services/knowledgeBaseService';

const router = Router();

/**
 * GET /api/v1/kb/search?q=...&category=...
 */
router.get('/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || (req.query.query as string) || '';
    const category = (req.query.category as string) || '';
    const articles = searchKnowledgeBase(q, category);
    res.json({ success: true, articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to search knowledge base', error: error.message });
  }
});

/**
 * GET /api/v1/kb/articles/:id
 */
router.get('/articles/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const article = getArticleById(id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }
    res.json({ success: true, article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve article', error: error.message });
  }
});

export default router;
