import { MeetingTravel } from "../../models/locationTracking/meetingLocationSchema.js";
import { calculateDistance } from "../../utils/locationUtils.js";
import axios from 'axios';
import { io } from '../../Socket/socket.js';


// Utility function for reverse geocoding with rate limiting and caching
const geocodingCache = new Map();
const getPlaceName = async (latitude, longitude) => {
  try {
    // Check cache first
    const cacheKey = `${latitude},${longitude}`;
    if (geocodingCache.has(cacheKey)) {
      return geocodingCache.get(cacheKey);
    }

    // Add delay to respect rate limits (1 second between requests)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'YourAppName/1.0' // Required by Nominatim
        }
      }
    );

    const address = response.data.address;
    const result = {
      fullAddress: response.data.display_name,
      city: address.city || address.town || address.village || 'Unknown City',
      state: address.state || 'Unknown State',
      country: address.country || 'Unknown Country'
    };

    // Cache the result
    geocodingCache.set(cacheKey, result);

    // Clear old cache entries if cache gets too large
    if (geocodingCache.size > 1000) {
      const oldestKey = geocodingCache.keys().next().value;
      geocodingCache.delete(oldestKey);
    }

    return result;
  } catch (error) {
    console.error('Error getting place name:', error);
    return {
      fullAddress: 'Location name unavailable',
      city: 'Unknown City',
      state: 'Unknown State',
      country: 'Unknown Country'
    };
  }
};

export const meetingTravelController = {
  startTracking: async (req, res) => {
    try {
      console.log("Start tracking request received:", req.body);

      const { meetingType, transportMode, latitude, longitude, gramSurvey } = req.body;
      
      if (!meetingType || !transportMode || !latitude || !longitude) {
        console.error("Missing required fields:", req.body);
        return res.status(400).json({ success: false, message: "All fields are required" });
      }
      const startPlace = await getPlaceName(latitude, longitude);

      const newTravel = await MeetingTravel.create({
        userId: req.user._id,
        meetingType,
        transportMode,
        isGramSurvey: !!gramSurvey, // Add gram survey flag
        startLocation: {
          latitude,
          longitude,
          placeName: startPlace.fullAddress,
          city: startPlace.city,
          state: startPlace.state,
          country: startPlace.country
        },
        travelPath: [{
          latitude,
          longitude,
          timestamp: new Date(),
          placeName: startPlace.fullAddress,
          city: startPlace.city,
          state: startPlace.state,
          country: startPlace.country
        }]
      });

      // Notify via socket that a new travel has started
      io.emit('travelStarted', {
        travelId: newTravel._id,
        userId: req.user._id,
        userName: req.user.userName,
        startLocation: newTravel.startLocation
      });

      res.status(201).json({
        success: true,
        data: newTravel
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  updateLocation: async (req, res) => {
    try {
      const { travelId } = req.params;
      const { latitude, longitude, isOffline } = req.body;

      const travel = await MeetingTravel.findById(travelId);

      if (!travel) {
        return res.status(404).json({
          success: false,
          message: "Travel record not found"
        });
      }

      // Check if the user is the owner of this travel record
      if (travel.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this travel record"
        });
      }

      const place = await getPlaceName(latitude, longitude);
      const locationData = {
        latitude,
        longitude,
        placeName: place.fullAddress,
        city: place.city,
        state: place.state,
        country: place.country,
        timestamp: new Date()
      };

      if (isOffline) {
        travel.offlineLocations.push(locationData);
      } else {
        travel.travelPath.push(locationData);

        const lastPoint = travel.travelPath[travel.travelPath.length - 2];
        const newDistance = calculateDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          latitude,
          longitude
        );
        travel.distanceCovered += newDistance;

        // Emit real-time location update via socket
        io.to(`travel_${travelId}`).emit('locationUpdated', {
          travelId,
          userId: req.user._id,
          userName: req.user.userName,
          location: locationData,
          currentDistance: travel.distanceCovered
        });
      }

      await travel.save();

      res.status(200).json({
        success: true,
        data: travel
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  syncOfflineData: async (req, res) => {
    try {
      const { travelId } = req.params;
      const { locations } = req.body;
      
      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Valid locations array is required"
        });
      }
      
      const travel = await MeetingTravel.findById(travelId);
      
      if (!travel) {
        return res.status(404).json({
          success: false,
          message: "Travel record not found"
        });
      }
      
      // Add all offline points to the offlineLocations array
      travel.offlineLocations.push(...locations);
      await travel.save();
      
      res.status(200).json({
        success: true,
        message: `${locations.length} offline locations synced successfully`,
        data: travel
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  endTracking: async (req, res) => {
    try {
      const { travelId } = req.params;
      const { latitude, longitude } = req.body;
  
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "End location latitude and longitude are required"
        });
      }
  
      const travel = await MeetingTravel.findById(travelId);
  
      if (!travel) {
        return res.status(404).json({
          success: false,
          message: "Travel record not found"
        });
      }
  
      const endPlace = await getPlaceName(latitude, longitude);
      travel.endLocation = {
        latitude,
        longitude,
        placeName: endPlace.fullAddress,
        city: endPlace.city,
        state: endPlace.state,
        country: endPlace.country
      };
  
      travel.status = "completed";
  
      if (travel.offlineLocations && travel.offlineLocations.length > 0) {
        // Sort offline locations by timestamp
        travel.offlineLocations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Filter out any invalid locations before processing
        const validOfflineLocations = travel.offlineLocations.filter(loc => 
          loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
        );
  
        for (const loc of validOfflineLocations) {
          try {
            const place = await getPlaceName(loc.latitude, loc.longitude);
            travel.travelPath.push({
              latitude: loc.latitude,
              longitude: loc.longitude,
              timestamp: loc.timestamp,
              placeName: place.fullAddress,
              city: place.city,
              state: place.state,
              country: place.country
            });
          } catch (error) {
            console.error(`Error processing location: ${error.message}`);
            // Continue with next location if one fails
            continue;
          }
        }
        
        travel.offlineLocations = [];
  
        // Calculate distance only if we have valid points
        if (travel.travelPath.length >= 2) {
          // Sort path by timestamp to ensure correct distance calculation
          travel.travelPath.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          let totalDistance = 0;
          
          for (let i = 1; i < travel.travelPath.length; i++) {
            const prevPoint = travel.travelPath[i - 1];
            const currentPoint = travel.travelPath[i];
            
            // Validate points before calculation
            if (prevPoint.latitude && prevPoint.longitude && 
                currentPoint.latitude && currentPoint.longitude) {
              const distance = calculateDistance(
                prevPoint.latitude,
                prevPoint.longitude,
                currentPoint.latitude,
                currentPoint.longitude
              );
              
              // Only add if distance is a valid number
              if (!isNaN(distance)) {
                totalDistance += distance;
              }
            }
          }
          
          travel.distanceCovered = totalDistance;
        } else {
          travel.distanceCovered = 0;
        }
      }
  
      // Validate before saving
      if (isNaN(travel.distanceCovered)) {
        travel.distanceCovered = 0;
      }
  
      await travel.save();
      
      // Notify via socket that travel has ended
      io.to(`travel_${travelId}`).emit('travelEnded', {
        travelId,
        userId: req.user._id,
        endLocation: travel.endLocation,
        totalDistance: travel.distanceCovered,
        totalExpense: travel.travelExpense
      });
  
      res.status(200).json({
        success: true,
        data: travel
      });
    } catch (error) {
      console.error('Error in endTracking:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  getAllTravels: async (req, res) => {
    try {
      const travels = await MeetingTravel.find()
        .populate("userId", "userName role");

      res.status(200).json({
        success: true,
        data: travels
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};