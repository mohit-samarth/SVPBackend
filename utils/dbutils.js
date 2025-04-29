// Place this in a utility file like utils/dbUtils.js
import mongoose from 'mongoose';

export const removeUniqueIndex = async () => {
  try {
    mongoose.connection.once('open', async () => {
      console.log('Connected to MongoDB');
      
      // List all collections to verify the correct name
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
      
      // Get the collection name that most closely matches what we're looking for
      const targetCollection = collections.find(c => 
        c.name.toLowerCase().includes('acharya') && 
        c.name.toLowerCase().includes('kif')
      );
      
      if (targetCollection) {
        console.log(`Found collection: ${targetCollection.name}`);
        await removeUniqueIndex(targetCollection.name, 'svpId');
      } else {
        console.log('Could not find the acharyakifdetails collection');
      }
    });
  }
  catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};