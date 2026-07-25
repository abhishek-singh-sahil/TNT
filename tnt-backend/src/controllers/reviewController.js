import { prisma } from '../config/prisma.js';

export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reviews, totalCount, publishedCount, pendingCount, rejectedCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            include: { images: { where: { isPrimary: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { userId } }),
      prisma.review.count({ where: { userId, status: 'PUBLISHED' } }),
      prisma.review.count({ where: { userId, status: 'PENDING' } }),
      prisma.review.count({ where: { userId, status: 'REJECTED' } }),
    ]);

    return res.json({
      success: true,
      stats: {
        total: totalCount,
        published: publishedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantInfo, rating, title, comment } = req.body;

    const newReview = await prisma.review.create({
      data: {
        userId,
        productId,
        variantInfo,
        rating: parseInt(rating),
        title,
        comment,
        status: 'PENDING', // default pending review approval
      },
    });

    return res.status(201).json({ success: true, message: 'Review submitted for moderation', review: newReview });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const updated = await prisma.review.update({
      where: { id: reviewId, userId: req.user.id },
      data: { rating: parseInt(rating), title, comment, status: 'PENDING' },
    });

    return res.json({ success: true, message: 'Review updated', review: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    await prisma.review.delete({
      where: { id: reviewId, userId: req.user.id },
    });

    return res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
  }
};
