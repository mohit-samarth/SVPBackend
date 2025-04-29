import GramSamarasta from '../../models/gramsurvey/gramsamrastaSchema.js';

export const createGramSamarasta = async (req, res) => {
  try {
    const newEntry = new GramSamarasta(req.body);
    const savedEntry = await newEntry.save();
    
    res.status(201).json({
      status: 'success',
      data: savedEntry
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getGramSamarastaById = async (req, res) => {
  try {
    const entry = await GramSamarasta.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateGramSamarasta = async (req, res) => {
  try {
    const updatedEntry = await GramSamarasta.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: updatedEntry
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

export const deleteGramSamarasta = async (req, res) => {
  try {
    const deletedEntry = await GramSamarasta.findByIdAndDelete(req.params.id);
    
    if (!deletedEntry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllGramSamarasta = async (req, res) => {
  try {
    const entries = await GramSamarasta.find();
    
    res.status(200).json({
      status: 'success',
      results: entries.length,
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};