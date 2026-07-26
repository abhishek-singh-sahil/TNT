import { prisma } from '../config/prisma.js';

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({
      where: { userId }
    });
    return res.json({ success: true, addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch addresses', error: error.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, fullName, phone, street, locality, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: 'Missing required address fields' });
    }

    if (isDefault) {
      // Unset previous default address
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        type: type || 'Home',
        fullName,
        phone,
        street,
        locality,
        city,
        state,
        postalCode,
        country: country || 'India',
        isDefault: Boolean(isDefault)
      }
    });

    return res.status(201).json({ success: true, message: 'Address created successfully', address });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create address', error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { type, fullName, phone, street, locality, city, state, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      // Unset previous default address
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        type,
        fullName,
        phone,
        street,
        locality,
        city,
        state,
        postalCode,
        country,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined
      }
    });

    return res.json({ success: true, message: 'Address updated successfully', address });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update address', error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({
      where: { id }
    });
    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete address', error: error.message });
  }
};
