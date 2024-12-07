import Section from '../models/Section.js';

// Fetch all sections
export const getSections = async (req, res) => {
  try {
    const sections = await Section.find();
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sections', error });
  }
};

// Create a new section
export const createSection = async (req, res) => {
  const { title, img, icon, description, subDescriptions } = req.body;

  if (!title || !img || !icon || !description || !subDescriptions) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newSection = new Section({
      title,
      img,
      icon,
      description,
      subDescriptions,
    });

    await newSection.save();
    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create section', error });
  }
};

// Update an existing section
export const updateSection = async (req, res) => {
  const { id } = req.params;
  const { title, img, icon, description, subDescriptions } = req.body;

  try {
    const updatedSection = await Section.findByIdAndUpdate(
      id,
      { title, img, icon, description, subDescriptions },
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json(updatedSection);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update section', error });
  }
};

// Delete a section
export const deleteSection = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSection = await Section.findByIdAndDelete(id);

    if (!deletedSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.status(200).json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete section', error });
  }
};
