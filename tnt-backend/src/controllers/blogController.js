import { prisma } from '../config/prisma.js';

export const getBlogs = async (req, res) => {
  try {
    const { search } = req.query;
    const blogs = await prisma.blog.findMany({
      where: search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      orderBy: { publishedAt: 'desc' }
    });
    return res.json({ success: true, blogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch blogs', error: error.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { slug }
    });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }
    return res.json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch blog post', error: error.message });
  }
};

export const createBlogAdmin = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, author } = req.body;
    if (!title || !excerpt || !content || !coverImage) {
      return res.status(400).json({ success: false, message: 'Missing required fields for blog post' });
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const existing = await prisma.blog.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content,
        coverImage,
        author: author || 'TNT Editorial'
      }
    });
    return res.status(201).json({ success: true, message: 'Blog post published successfully', blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create blog post', error: error.message });
  }
};

export const updateBlogAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, coverImage, author } = req.body;
    
    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        excerpt,
        content,
        coverImage,
        author
      }
    });
    return res.json({ success: true, message: 'Blog post updated successfully', blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update blog post', error: error.message });
  }
};

export const deleteBlogAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blog.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete blog post', error: error.message });
  }
};
