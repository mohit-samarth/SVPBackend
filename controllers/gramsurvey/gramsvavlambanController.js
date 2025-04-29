import Gramsavalamban from '../../models/gramsurvey/gramsvavlambanSchema.js';

export const createGramsavalamban = async (req, res) => {
  try {
    const gramsavalambanData = new Gramsavalamban(req.body);
    const savedData = await gramsavalambanData.save();
    
    res.status(201).json({
      message: 'Gramsavalamban data created successfully',
      data: savedData
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error creating Gramsavalamban data',
      error: error.message
    });
  }
};

export const getGramsavalamban = async (req, res) => {
  try {
    const { id } = req.params;
    const gramsavalambanData = await Gramsavalamban.findById(id);
    
    if (!gramsavalambanData) {
      return res.status(404).json({
        message: 'Gramsavalamban data not found'
      });
    }
    
    res.status(200).json({
      message: 'Gramsavalamban data retrieved successfully',
      data: gramsavalambanData
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving Gramsavalamban data',
      error: error.message
    });
  }
};

export const updateGramsavalamban = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = await Gramsavalamban.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedData) {
      return res.status(404).json({
        message: 'Gramsavalamban data not found'
      });
    }
    
    res.status(200).json({
      message: 'Gramsavalamban data updated successfully',
      data: updatedData
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error updating Gramsavalamban data',
      error: error.message
    });
  }
};

export const deleteGramsavalamban = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await Gramsavalamban.findByIdAndDelete(id);
    
    if (!deletedData) {
      return res.status(404).json({
        message: 'Gramsavalamban data not found'
      });
    }
    
    res.status(200).json({
      message: 'Gramsavalamban data deleted successfully',
      data: deletedData
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting Gramsavalamban data',
      error: error.message
    });
  }
};

export const getAllGramsavalamban = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const totalDocuments = await Gramsavalamban.countDocuments();
    const gramsavalambanData = await Gramsavalamban.find()
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      message: 'Gramsavalamban data retrieved successfully',
      totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
      currentPage: page,
      data: gramsavalambanData
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving Gramsavalamban data',
      error: error.message
    });
  }
};