import { asyncErrorHandler } from '../../middlewares/asyncErrorHandler.js';
import {
  ErrorBadRequestResponseWithData,
  successResponse,
  ErrorResponse,
  ErrorResponseWithData,
  validationErrorWithData,
  successResponseWithData,
} from '../../helpers/apiResponse.js';
import { GramSamitiInfo } from '../../models/gramSamiti/gramSamitiInfoSchema.js';
import { GramSamiti } from '../../models/gramSamiti/gramSamitiSchema.js';
import { User } from '../../models/userRoles/userSchema.js';
import { UpSanchAreaNew } from '../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { SanchAreaNew } from '../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';
import { SankulAreaNew } from '../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { AnchalAreaNew } from '../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';
import mongoose from 'mongoose';

import fs from 'fs';
import validator from 'validator';


export const createGramSamitiMembers = asyncErrorHandler(
  async (req, res, next) => {
    const {
      
      district,
      subDistrict,
      village,
      pincode,
      gramPanchayat,
      gramSamitiId,
      // Extract area IDs properly from the request
      upSanchAreaId,
      sanchAreaId,
      sankulAreaId,
      anchalAreaId
    } = req.body;

    // Use destructured value or fall back to req.user value if not provided
    const effectiveUpSanchAreaId = upSanchAreaId || req.user.upSanchAreaId;

    let { members } = req.body;
    const createdBy = req.user_id;

    // Handle file upload for new Gram Samiti creation
    const agreementVideo = req.files && req.files.agreementVideo && req.files.agreementVideo[0]
      ? req.files.agreementVideo[0].path
      : null;

    // Different validation based on whether we're creating or updating
    if (!gramSamitiId) {
      const missingFields = [];

   
      if (!district) missingFields.push('district');
      if (!subDistrict) missingFields.push('subDistrict');
      if (!village) missingFields.push('village');
      if (!pincode) missingFields.push('pincode');
      if (!gramPanchayat) missingFields.push('gramPanchayat');
      if (!agreementVideo) missingFields.push('agreementVideo');
      // Use effectiveUpSanchAreaId for validation
      if (!effectiveUpSanchAreaId) missingFields.push('upSanchAreaId');

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        return validationErrorWithData(
          res,
          'missing_detail',
          `Please fill all the required common fields: ${missingFields.join(', ')}`
        );
      }
    }

    // Parse members if provided as string
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (error) {
        return validationErrorWithData(
          res,
          'invalid_members_format',
          'Members data should be a valid JSON array'
        );
      }
    }

    // Validate members array
    if (!members || !Array.isArray(members) || members.length === 0) {
      return validationErrorWithData(
        res,
        'invalid_members_data',
        'Please provide information for at least one Gram Samiti member'
      );
    }

    const expectedRoles = [
      'Pradhan',
      'Uppradhan',
      'Sachiv',
      'Upsachiv',
      'Sadasya1',
      'Sadasya2',
      'Sadasya3',
    ];

    // Validate that provided roles are valid
    const providedRoles = members.map(member => member.designationInSvpGramSamii);
    const invalidRoles = providedRoles.filter(role => !expectedRoles.includes(role));

    if (invalidRoles.length > 0) {
      return validationErrorWithData(
        res,
        'invalid_roles',
        `Invalid roles provided: ${invalidRoles.join(', ')}`
      );
    }

    // Check for duplicate roles in the request
    const roleCounts = {};
    providedRoles.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const duplicateRoles = Object.entries(roleCounts)
      .filter(([_, count]) => count > 1)
      .map(([role]) => role);

    if (duplicateRoles.length > 0) {
      return validationErrorWithData(
        res,
        'duplicate_roles',
        `Duplicate roles provided: ${duplicateRoles.join(', ')}`
      );
    }

    // Check for unique emails
    const emails = new Set();

    // Get member photos from request
    const memberPhotos = req.files && req.files.memberPhotos 
      ? req.files.memberPhotos 
      : [];
    
    console.log('Member photos received:', memberPhotos.length);

    // Validate each member's data
    for (const member of members) {
      const {
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        gender,
        contactNo,
        emailId,
        designationInSvpGramSamii,
        education,
        otherEducation,
        occupation,
      } = member;

      if (education === 'Other' && !otherEducation) {
        return validationErrorWithData(
          res,
          'missing_other_education',
          `Please specify education details for ${designationInSvpGramSamii} when 'Other' is selected`
        );
      }

      if (
        !firstName ||
        !lastName ||
        !dateOfBirth ||
        !gender ||
        !contactNo ||
        !emailId ||
        !designationInSvpGramSamii ||
        !education ||
        !occupation
      ) {
        return validationErrorWithData(
          res,
          'missing_member_detail',
          `Please fill all required fields for ${designationInSvpGramSamii || 'member'}`
        );
      }

      if (contactNo.length > 10) {
        return validationErrorWithData(
          res,
          'invalid_contact',
          `Contact number for ${designationInSvpGramSamii} cannot exceed 10 digits`
        );
      }

      if (!validator.isEmail(emailId)) {
        return validationErrorWithData(
          res,
          'invalid_email',
          `Please provide a valid email address for ${designationInSvpGramSamii}`
        );
      }

      if (emails.has(emailId)) {
        return validationErrorWithData(
          res,
          'duplicate_email',
          `Duplicate email ${emailId} found in submission`
        );
      }

      emails.add(emailId);

      // Check if the email already exists (except for updates to the same member)
      const existingGsMember = await GramSamitiInfo.findOne({
        emailId,
        ...(member._id ? { _id: { $ne: member._id } } : {})
      });

      if (existingGsMember) {
        return ErrorBadRequestResponseWithData(
          res,
          'gs_member_already_exist',
          `Gram Samiti Member already exists with email: ${emailId}`
        );
      }
    }

    try {
      console.log('GramSamitiInfo model check:', !!GramSamitiInfo);
      console.log('GramSamiti model check:', !!GramSamiti);

      let gramSamiti;

      // Automatically retrieve higher area IDs if only upSanchAreaId is provided
      let actualSanchAreaId = sanchAreaId;
      let actualSankulAreaId = sankulAreaId;
      let actualAnchalAreaId = anchalAreaId;

      if (effectiveUpSanchAreaId && (!sanchAreaId || !sankulAreaId || !anchalAreaId)) {
        console.log('Finding hierarchy for upSanchAreaId:', effectiveUpSanchAreaId);

        // Find the upSanch area
        const upSanchArea = await UpSanchAreaNew.findById(effectiveUpSanchAreaId).populate('sanchName');

        // And then update the references below:
        if (upSanchArea && upSanchArea.sanchName) {
          actualSanchAreaId = upSanchArea.sanchName._id;

          // Find the sankulArea
          const sanchArea = await SanchAreaNew.findById(actualSanchAreaId);
          if (sanchArea && sanchArea.sankulName) { // Assuming it's sankulName here too
            actualSankulAreaId = sanchArea.sankulName;

            // Find the anchalArea
            const sankulArea = await SankulAreaNew.findById(actualSankulAreaId);
            if (sankulArea && sankulArea.anchalName) { // Assuming it's anchalName
              actualAnchalAreaId = sankulArea.anchalName;
            }
          }
        }
        console.log('Complete hierarchy found:', {
          upSanchAreaId: effectiveUpSanchAreaId,
          sanchAreaId: actualSanchAreaId,
          sankulAreaId: actualSankulAreaId,
          anchalAreaId: actualAnchalAreaId
        });
      }

      // Create or find Gram Samiti
      if (gramSamitiId) {
        // Update existing Gram Samiti
        gramSamiti = await GramSamiti.findById(gramSamitiId);

        if (!gramSamiti) {
          return ErrorNotFoundResponseWithData(
            res,
            'gram_samiti_not_found',
            'Gram Samiti not found with the provided ID'
          );
        }

        // Update area IDs if they're provided
        if (effectiveUpSanchAreaId || sanchAreaId || sankulAreaId || anchalAreaId) {
          gramSamiti.upSanchAreaId = effectiveUpSanchAreaId || gramSamiti.upSanchAreaId;
          gramSamiti.sanchAreaId = actualSanchAreaId || gramSamiti.sanchAreaId;
          gramSamiti.sankulAreaId = actualSankulAreaId || gramSamiti.sankulAreaId;
          gramSamiti.anchalAreaId = actualAnchalAreaId || gramSamiti.anchalAreaId;
          await gramSamiti.save();
        }
      } else {
        // Create new Gram Samiti with SVP ID
        const svpId = await generateSvpId();

        gramSamiti = await GramSamiti.create({
          svpId,
         
          district,
          subDistrict,
          village,
          pincode,
          gramPanchayat,
          agreementVideo,
          createdBy,
          isComplete: false, // Initially not complete
          isActive: true, // Always start as active

          // Add area IDs to the Gram Samiti document
          upSanchAreaId: effectiveUpSanchAreaId,
          sanchAreaId: actualSanchAreaId,
          sankulAreaId: actualSankulAreaId,
          anchalAreaId: actualAnchalAreaId
        });
      }

      console.log('Gram Samiti created/found:', gramSamiti._id.toString());

      // Create or update members - tracking results directly
      const createdMembers = [];

      // Create a mapping of role to photo path
      const roleToPhotoMapping = {};
      
      // Process member photos and assign to roles
      if (memberPhotos && memberPhotos.length > 0) {
        // Extract role information from file names if possible
        memberPhotos.forEach(photo => {
          const fileName = photo.originalname.toLowerCase();
          
          // Try to match file name with role
          for (const role of expectedRoles) {
            if (fileName.includes(role.toLowerCase())) {
              roleToPhotoMapping[role] = photo.path;
              console.log(`Mapped photo ${photo.path} to role ${role} based on filename`);
              break;
            }
          }
        });
        
        // If no role matches were found in filenames, assign photos sequentially based on member index
        if (Object.keys(roleToPhotoMapping).length === 0) {
          members.forEach((member, index) => {
            if (index < memberPhotos.length) {
              roleToPhotoMapping[member.designationInSvpGramSamii] = memberPhotos[index].path;
              console.log(`Mapped photo ${memberPhotos[index].path} to role ${member.designationInSvpGramSamii} sequentially`);
            }
          });
        }
      }

      for (const member of members) {
        const memberData = {
          gramSamitiId: gramSamiti._id,
        
          district: gramSamiti.district,
          subDistrict: gramSamiti.subDistrict,
          village: gramSamiti.village,
          pincode: gramSamiti.pincode,
          gramPanchayat: gramSamiti.gramPanchayat,
          createdBy,

          // Individual member details
          firstName: member.firstName,
          middleName: member.middleName || '',
          lastName: member.lastName,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
          contactNo: member.contactNo,
          emailId: member.emailId,
          designationInSvpGramSamii: member.designationInSvpGramSamii,
          education: member.education,
          ...(member.education === 'Other' ? { otherEducation: member.otherEducation } : {}),
          occupation: member.occupation,
          
          // Add photo path if available
          memberPhoto: roleToPhotoMapping[member.designationInSvpGramSamii] || null
        };

        try {
          let result;
          if (member._id) {
            // If member already has a photo and no new one provided, keep the existing one
            if (!memberData.memberPhoto) {
              const existingMember = await GramSamitiInfo.findById(member._id);
              if (existingMember && existingMember.memberPhoto) {
                memberData.memberPhoto = existingMember.memberPhoto;
              }
            }
            
            result = await GramSamitiInfo.findByIdAndUpdate(
              member._id,
              memberData,
              { new: true }
            );
          } else {
            result = await GramSamitiInfo.create(memberData);
          }
          console.log(`Successfully saved member with role ${member.designationInSvpGramSamii}, ID: ${result._id}`);
          createdMembers.push(result);
        } catch (error) {
          console.error(`Error saving member with role ${member.designationInSvpGramSamii}:`, error);
          return next(error);
        }
      }

      console.log(`Directly created/updated ${createdMembers.length} members`);

      // Add a small delay to ensure DB operations are complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Double-check by fetching all members for this Gram Samiti
      const allGramSamitiMembers = await GramSamitiInfo.find({
        gramSamitiId: gramSamiti._id
      }).lean();

      console.log(`Found ${allGramSamitiMembers.length} members in database for Gram Samiti ${gramSamiti._id}`);
      console.log('Member details from DB:', JSON.stringify(allGramSamitiMembers.map(m => ({
        id: m._id.toString(),
        role: m.designationInSvpGramSamii,
        hasPhoto: !!m.memberPhoto
      })), null, 2));

      // Create map of role to member ID using the directly created members first
      const memberIdsByRole = {};

      // Use the members we just created/updated
      createdMembers.forEach(member => {
        if (member && member.designationInSvpGramSamii) {
          memberIdsByRole[member.designationInSvpGramSamii] = member._id;
          console.log(`Added member ID ${member._id} for role ${member.designationInSvpGramSamii} from createdMembers`);
        }
      });

      // Fallback to using all fetched members if needed
      if (Object.keys(memberIdsByRole).length < createdMembers.length) {
        console.log('Using fallback - mapping from allGramSamitiMembers');
        allGramSamitiMembers.forEach(member => {
          if (member && member.designationInSvpGramSamii) {
            memberIdsByRole[member.designationInSvpGramSamii] = member._id;
            console.log(`Added member ID ${member._id} for role ${member.designationInSvpGramSamii} from allGramSamitiMembers`);
          }
        });
      }

      console.log('Final memberIdsByRole mapping:', memberIdsByRole);

      // Prepare the update data with explicit type conversion if needed
      const updateData = {
        gsMemberPradhanId: memberIdsByRole['Pradhan'] || null,
        gsMemberUppradhanId: memberIdsByRole['Uppradhan'] || null,
        gsMemberSachivId: memberIdsByRole['Sachiv'] || null,
        gsMemberUpsachivId: memberIdsByRole['Upsachiv'] || null,
        gsMemberSadasya1Id: memberIdsByRole['Sadasya1'] || null,
        gsMemberSadasya2Id: memberIdsByRole['Sadasya2'] || null,
        gsMemberSadasya3Id: memberIdsByRole['Sadasya3'] || null,
      };

      console.log('Update data for Gram Samiti:', updateData);

      // Check if all roles are filled
      const isComplete = expectedRoles.every(role => !!memberIdsByRole[role]);
      updateData.isComplete = isComplete;

      // Update the Gram Samiti with member references
      const updatedGramSamiti = await GramSamiti.findByIdAndUpdate(
        gramSamiti._id,
        updateData,
        { new: true }
      );

      console.log('Gram Samiti updated:', updatedGramSamiti._id.toString());
      console.log('Updated Gram Samiti member IDs:', {
        pradhan: updatedGramSamiti.gsMemberPradhanId,
        uppradhan: updatedGramSamiti.gsMemberUppradhanId,
        sachiv: updatedGramSamiti.gsMemberSachivId,
        upsachiv: updatedGramSamiti.gsMemberUpsachivId,
        sadasya1: updatedGramSamiti.gsMemberSadasya1Id,
        sadasya2: updatedGramSamiti.gsMemberSadasya2Id,
        sadasya3: updatedGramSamiti.gsMemberSadasya3Id
      });

      // Return success response
      return successResponseWithData(
        res,
        gramSamitiId ? 'gram_samiti_updated_successfully' : 'gram_samiti_created_successfully',
        `Gram Samiti ${gramSamitiId ? 'updated' : 'created'} successfully with ${createdMembers.length} member(s). ${isComplete ? 'All roles filled.' : `${expectedRoles.length - Object.keys(memberIdsByRole).length} roles still pending.`}`,
        {
          gramSamiti: updatedGramSamiti,
          members: createdMembers,
          isComplete,
          pendingRoles: expectedRoles.filter(role => !memberIdsByRole[role])
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      return next(error);
    }
  }
);

export const updateGramSamitiDetails = asyncErrorHandler(
  async (req, res, next) => {
    const {
    
      district,
      subDistrict,
      village,
      pincode,
      gramPanchayat,
      gramSamitiId,
      // Extract area IDs properly from the request
      upSanchAreaId,
      sanchAreaId,
      sankulAreaId,
      anchalAreaId
    } = req.body;

    // Use destructured value or fall back to req.user value if not provided
    const effectiveUpSanchAreaId = upSanchAreaId || req.user.upSanchAreaId;

    let { members } = req.body;
    const createdBy = req.user_id;

    // Handle file upload for new Gram Samiti creation
    const agreementVideo = req.files && req.files.agreementVideo && req.files.agreementVideo[0]
      ? req.files.agreementVideo[0].path
      : null;

    // Different validation based on whether we're creating or updating
    if (!gramSamitiId) {
      const missingFields = [];

      if (!district) missingFields.push('district');
      if (!subDistrict) missingFields.push('subDistrict');
      if (!village) missingFields.push('village');
      if (!pincode) missingFields.push('pincode');
      if (!gramPanchayat) missingFields.push('gramPanchayat');
      if (!agreementVideo) missingFields.push('agreementVideo');
      // Use effectiveUpSanchAreaId for validation
      if (!effectiveUpSanchAreaId) missingFields.push('upSanchAreaId');

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        return validationErrorWithData(
          res,
          'missing_detail',
          `Please fill all the required common fields: ${missingFields.join(', ')}`
        );
      }
    }

    // Parse members if provided as string
    if (typeof members === 'string') {
      try {
        members = JSON.parse(members);
      } catch (error) {
        return validationErrorWithData(
          res,
          'invalid_members_format',
          'Members data should be a valid JSON array'
        );
      }
    }

    // Validate members array
    if (!members || !Array.isArray(members) || members.length === 0) {
      return validationErrorWithData(
        res,
        'invalid_members_data',
        'Please provide information for at least one Gram Samiti member'
      );
    }

    const expectedRoles = [
      'Pradhan',
      'Uppradhan',
      'Sachiv',
      'Upsachiv',
      'Sadasya1',
      'Sadasya2',
      'Sadasya3',
    ];

    // Validate that provided roles are valid
    const providedRoles = members.map(member => member.designationInSvpGramSamii);
    const invalidRoles = providedRoles.filter(role => !expectedRoles.includes(role));

    if (invalidRoles.length > 0) {
      return validationErrorWithData(
        res,
        'invalid_roles',
        `Invalid roles provided: ${invalidRoles.join(', ')}`
      );
    }

    // Check for duplicate roles in the request
    const roleCounts = {};
    providedRoles.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const duplicateRoles = Object.entries(roleCounts)
      .filter(([_, count]) => count > 1)
      .map(([role]) => role);

    if (duplicateRoles.length > 0) {
      return validationErrorWithData(
        res,
        'duplicate_roles',
        `Duplicate roles provided: ${duplicateRoles.join(', ')}`
      );
    }

    // Check for unique emails
    const emails = new Set();

    // Get member photos from request
    const memberIdToPhotoMapping = {};
    const memberPhotos = req.files && req.files.memberPhotos ? req.files.memberPhotos : [];
    // First pass: try to match photos to specific member IDs
    memberPhotos.forEach(photo => {
      const fileName = photo.originalname.toLowerCase();
      
      // Look for member ID in the filename (assuming frontend adds it)
      for (const member of members) {
        if (member._id && fileName.includes(member._id.toString().toLowerCase())) {
          memberIdToPhotoMapping[member._id.toString()] = photo.path;
          console.log(`Mapped photo ${photo.path} to member ID ${member._id}`);
          break;
        }
      }
    });
    
    console.log('Member photos received:', memberPhotos.length);

    // Validate each member's data
    for (const member of members) {
      const {
        firstName,
        middleName,
        lastName,
        dateOfBirth,
        gender,
        contactNo,
        emailId,
        designationInSvpGramSamii,
        education,
        otherEducation,
        occupation,
      } = member;

      if (education === 'Other' && !otherEducation) {
        return validationErrorWithData(
          res,
          'missing_other_education',
          `Please specify education details for ${designationInSvpGramSamii} when 'Other' is selected`
        );
      }

      if (
        !firstName ||
        !lastName ||
        !dateOfBirth ||
        !gender ||
        !contactNo ||
        !emailId ||
        !designationInSvpGramSamii ||
        !education ||
        !occupation
      ) {
        return validationErrorWithData(
          res,
          'missing_member_detail',
          `Please fill all required fields for ${designationInSvpGramSamii || 'member'}`
        );
      }

      if (contactNo.length > 10) {
        return validationErrorWithData(
          res,
          'invalid_contact',
          `Contact number for ${designationInSvpGramSamii} cannot exceed 10 digits`
        );
      }

      if (!validator.isEmail(emailId)) {
        return validationErrorWithData(
          res,
          'invalid_email',
          `Please provide a valid email address for ${designationInSvpGramSamii}`
        );
      }

      if (emails.has(emailId)) {
        return validationErrorWithData(
          res,
          'duplicate_email',
          `Duplicate email ${emailId} found in submission`
        );
      }

      emails.add(emailId);

      // Check if the email already exists (except for updates to the same member)
      const existingGsMember = await GramSamitiInfo.findOne({
        emailId,
        ...(member._id ? { _id: { $ne: member._id } } : {})
      });

      if (existingGsMember) {
        return ErrorBadRequestResponseWithData(
          res,
          'gs_member_already_exist',
          `Gram Samiti Member already exists with email: ${emailId}`
        );
      }
    }

    try {
      console.log('GramSamitiInfo model check:', !!GramSamitiInfo);
      console.log('GramSamiti model check:', !!GramSamiti);

      let gramSamiti;

      // Automatically retrieve higher area IDs if only upSanchAreaId is provided
      let actualSanchAreaId = sanchAreaId;
      let actualSankulAreaId = sankulAreaId;
      let actualAnchalAreaId = anchalAreaId;

      if (effectiveUpSanchAreaId && (!sanchAreaId || !sankulAreaId || !anchalAreaId)) {
        console.log('Finding hierarchy for upSanchAreaId:', effectiveUpSanchAreaId);

        // Find the upSanch area
        const upSanchArea = await UpSanchAreaNew.findById(effectiveUpSanchAreaId).populate('sanchName');

        // And then update the references below:
        if (upSanchArea && upSanchArea.sanchName) {
          actualSanchAreaId = upSanchArea.sanchName._id;

          // Find the sankulArea
          const sanchArea = await SanchAreaNew.findById(actualSanchAreaId);
          if (sanchArea && sanchArea.sankulName) { // Assuming it's sankulName here too
            actualSankulAreaId = sanchArea.sankulName;

            // Find the anchalArea
            const sankulArea = await SankulAreaNew.findById(actualSankulAreaId);
            if (sankulArea && sankulArea.anchalName) { // Assuming it's anchalName
              actualAnchalAreaId = sankulArea.anchalName;
            }
          }
        }
        console.log('Complete hierarchy found:', {
          upSanchAreaId: effectiveUpSanchAreaId,
          sanchAreaId: actualSanchAreaId,
          sankulAreaId: actualSankulAreaId,
          anchalAreaId: actualAnchalAreaId
        });
      }

      // Create or find Gram Samiti
      if (gramSamitiId) {
        // Update existing Gram Samiti
        gramSamiti = await GramSamiti.findById(gramSamitiId);

        if (!gramSamiti) {
          return ErrorNotFoundResponseWithData(
            res,
            'gram_samiti_not_found',
            'Gram Samiti not found with the provided ID'
          );
        }

        // Update area IDs if they're provided
        if (effectiveUpSanchAreaId || sanchAreaId || sankulAreaId || anchalAreaId) {
          gramSamiti.upSanchAreaId = effectiveUpSanchAreaId || gramSamiti.upSanchAreaId;
          gramSamiti.sanchAreaId = actualSanchAreaId || gramSamiti.sanchAreaId;
          gramSamiti.sankulAreaId = actualSankulAreaId || gramSamiti.sankulAreaId;
          gramSamiti.anchalAreaId = actualAnchalAreaId || gramSamiti.anchalAreaId;
          await gramSamiti.save();
        }
      } else {
        // Create new Gram Samiti with SVP ID
        const svpId = await generateSvpId();

        gramSamiti = await GramSamiti.create({
          svpId,
       
          district,
          subDistrict,
          village,
          pincode,
          gramPanchayat,
          agreementVideo,
          createdBy,
          isComplete: false, // Initially not complete
          isActive: true, // Always start as active

          // Add area IDs to the Gram Samiti document
          upSanchAreaId: effectiveUpSanchAreaId,
          sanchAreaId: actualSanchAreaId,
          sankulAreaId: actualSankulAreaId,
          anchalAreaId: actualAnchalAreaId
        });
      }

      console.log('Gram Samiti created/found:', gramSamiti._id.toString());

      // Create or update members - tracking results directly
      const createdMembers = [];

      // Create a mapping of role to photo path
      const roleToPhotoMapping = {};
      
      // Process member photos and assign to roles
      if (memberPhotos && memberPhotos.length > 0) {
        // Extract role information from file names if possible
        memberPhotos.forEach(photo => {
          const fileName = photo.originalname.toLowerCase();
          
          // Try to match file name with role
          for (const role of expectedRoles) {
            if (fileName.includes(role.toLowerCase())) {
              roleToPhotoMapping[role] = photo.path;
              console.log(`Mapped photo ${photo.path} to role ${role} based on filename`);
              break;
            }
          }
        });
        
        // If no role matches were found in filenames, assign photos sequentially based on member index
        if (Object.keys(roleToPhotoMapping).length === 0) {
          members.forEach((member, index) => {
            if (index < memberPhotos.length) {
              roleToPhotoMapping[member.designationInSvpGramSamii] = memberPhotos[index].path;
              console.log(`Mapped photo ${memberPhotos[index].path} to role ${member.designationInSvpGramSamii} sequentially`);
            }
          });
        }
      }

      for (const member of members) {
        const memberData = {
          gramSamitiId: gramSamiti._id,
          
          district: gramSamiti.district,
          subDistrict: gramSamiti.subDistrict,
          village: gramSamiti.village,
          pincode: gramSamiti.pincode,
          gramPanchayat: gramSamiti.gramPanchayat,
          createdBy,

          // Individual member details
          firstName: member.firstName,
          middleName: member.middleName || '',
          lastName: member.lastName,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
          contactNo: member.contactNo,
          emailId: member.emailId,
          designationInSvpGramSamii: member.designationInSvpGramSamii,
          education: member.education,
          ...(member.education === 'Other' ? { otherEducation: member.otherEducation } : {}),
          occupation: member.occupation,
          
          // Add photo path if available
          memberPhoto: memberIdToPhotoMapping[member._id?.toString()] || 
          roleToPhotoMapping[member.designationInSvpGramSamii] || 
          null
        };

        try {
          let result;
          if (member._id) {
            // If member already has a photo and no new one provided, keep the existing one
            if (!memberData.memberPhoto) {
              const existingMember = await GramSamitiInfo.findById(member._id);
              if (existingMember && existingMember.memberPhoto) {
                memberData.memberPhoto = existingMember.memberPhoto;
              }
            }
            
            result = await GramSamitiInfo.findByIdAndUpdate(
              member._id,
              memberData,
              { new: true }
            );
          } else {
            result = await GramSamitiInfo.create(memberData);
          }
          console.log(`Successfully saved member with role ${member.designationInSvpGramSamii}, ID: ${result._id}`);
          createdMembers.push(result);
        } catch (error) {
          console.error(`Error saving member with role ${member.designationInSvpGramSamii}:`, error);
          return next(error);
        }
      }

      console.log(`Directly created/updated ${createdMembers.length} members`);

      // Add a small delay to ensure DB operations are complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Double-check by fetching all members for this Gram Samiti
      const allGramSamitiMembers = await GramSamitiInfo.find({
        gramSamitiId: gramSamiti._id
      }).lean();

      console.log(`Found ${allGramSamitiMembers.length} members in database for Gram Samiti ${gramSamiti._id}`);
      console.log('Member details from DB:', JSON.stringify(allGramSamitiMembers.map(m => ({
        id: m._id.toString(),
        role: m.designationInSvpGramSamii,
        hasPhoto: !!m.memberPhoto
      })), null, 2));

      // Create map of role to member ID using the directly created members first
      const memberIdsByRole = {};

      // Use the members we just created/updated
      createdMembers.forEach(member => {
        if (member && member.designationInSvpGramSamii) {
          memberIdsByRole[member.designationInSvpGramSamii] = member._id;
          console.log(`Added member ID ${member._id} for role ${member.designationInSvpGramSamii} from createdMembers`);
        }
      });

      // Fallback to using all fetched members if needed
      if (Object.keys(memberIdsByRole).length < createdMembers.length) {
        console.log('Using fallback - mapping from allGramSamitiMembers');
        allGramSamitiMembers.forEach(member => {
          if (member && member.designationInSvpGramSamii) {
            memberIdsByRole[member.designationInSvpGramSamii] = member._id;
            console.log(`Added member ID ${member._id} for role ${member.designationInSvpGramSamii} from allGramSamitiMembers`);
          }
        });
      }

      console.log('Final memberIdsByRole mapping:', memberIdsByRole);

      // Prepare the update data with explicit type conversion if needed
      const updateData = {
        gsMemberPradhanId: memberIdsByRole['Pradhan'] || null,
        gsMemberUppradhanId: memberIdsByRole['Uppradhan'] || null,
        gsMemberSachivId: memberIdsByRole['Sachiv'] || null,
        gsMemberUpsachivId: memberIdsByRole['Upsachiv'] || null,
        gsMemberSadasya1Id: memberIdsByRole['Sadasya1'] || null,
        gsMemberSadasya2Id: memberIdsByRole['Sadasya2'] || null,
        gsMemberSadasya3Id: memberIdsByRole['Sadasya3'] || null,
      };

      console.log('Update data for Gram Samiti:', updateData);

      // Check if all roles are filled
      const isComplete = expectedRoles.every(role => !!memberIdsByRole[role]);
      updateData.isComplete = isComplete;

      // Update the Gram Samiti with member references
      const updatedGramSamiti = await GramSamiti.findByIdAndUpdate(
        gramSamiti._id,
        updateData,
        { new: true }
      );

      console.log('Gram Samiti updated:', updatedGramSamiti._id.toString());
      console.log('Updated Gram Samiti member IDs:', {
        pradhan: updatedGramSamiti.gsMemberPradhanId,
        uppradhan: updatedGramSamiti.gsMemberUppradhanId,
        sachiv: updatedGramSamiti.gsMemberSachivId,
        upsachiv: updatedGramSamiti.gsMemberUpsachivId,
        sadasya1: updatedGramSamiti.gsMemberSadasya1Id,
        sadasya2: updatedGramSamiti.gsMemberSadasya2Id,
        sadasya3: updatedGramSamiti.gsMemberSadasya3Id
      });

      // Return success response
      return successResponseWithData(
        res,
        gramSamitiId ? 'gram_samiti_updated_successfully' : 'gram_samiti_created_successfully',
        `Gram Samiti ${gramSamitiId ? 'updated' : 'created'} successfully with ${createdMembers.length} member(s). ${isComplete ? 'All roles filled.' : `${expectedRoles.length - Object.keys(memberIdsByRole).length} roles still pending.`}`,
        {
          gramSamiti: updatedGramSamiti,
          members: createdMembers,
          isComplete,
          pendingRoles: expectedRoles.filter(role => !memberIdsByRole[role])
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      return next(error);
    }
  }
);

export const getHierarchicalGramSamitiData = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { role, anchalAreaId, sankulAreaId, sanchAreaId, upSanchAreaId } = req.user;
      
      // Base query based on user's role in the hierarchy
      let query = { isActive: true };
      let hierarchyData = {};
      
      // Filter based on user's role and hierarchy level
      if (role === 'anchalPramukh' && anchalAreaId) {
        query.anchalAreaId = anchalAreaId;
        
        // For Anchal login - fetch Sankul -> Sanch -> UpSanch -> SVP IDs hierarchy
        const sankuls = await SankulAreaNew.find({ anchalAreaId, isActive: true }).select('_id sankulName');
        
        const sankulIds = sankuls.map(sankul => sankul._id);
        const sanchs = await SanchAreaNew.find({ sankulAreaId: { $in: sankulIds }, isActive: true }).select('_id sanchName sankulAreaId');
        
        const sanchIds = sanchs.map(sanch => sanch._id);
        const upSanchs = await UpSanchAreaNew.find({ sanchAreaId: { $in: sanchIds }, isActive: true }).select('_id upSanchName sanchAreaId');
        
        const upSanchIds = upSanchs.map(upSanch => upSanch._id);
        const gramSamitis = await GramSamiti.find({ upSanchAreaId: { $in: upSanchIds }, isActive: true }).select('_id svpId upSanchAreaId');
        
        // Build hierarchical structure
        hierarchyData = {
          sankuls: sankuls.map(sankul => {
            const sankul_id = sankul._id.toString();
            return {
              _id: sankul._id,
              sankulName: sankul.sankulName,
              sanchs: sanchs
                .filter(sanch => sanch.sankulAreaId.toString() === sankul_id)
                .map(sanch => {
                  const sanch_id = sanch._id.toString();
                  return {
                    _id: sanch._id,
                    sanchName: sanch.sanchName,
                    upSanchs: upSanchs
                      .filter(upSanch => upSanch.sanchAreaId.toString() === sanch_id)
                      .map(upSanch => {
                        const upSanch_id = upSanch._id.toString();
                        return {
                          _id: upSanch._id,
                          upSanchName: upSanch.upSanchName,
                          gramSamitis: gramSamitis
                            .filter(gs => gs.upSanchAreaId.toString() === upSanch_id)
                            .map(gs => ({
                              _id: gs._id,
                              svpId: gs.svpId
                            }))
                        };
                      })
                  };
                })
            };
          })
        };

      } else if (role === 'sankulPramukh' && sankulAreaId) {
        query.sankulAreaId = sankulAreaId;
        
        // For Sankul login - fetch Sanch -> UpSanch -> SVP IDs hierarchy
        const sanchs = await SanchAreaNew.find({ sankulAreaId, isActive: true }).select('_id sanchName');
        
        const sanchIds = sanchs.map(sanch => sanch._id);
        const upSanchs = await UpSanchAreaNew.find({ sanchAreaId: { $in: sanchIds }, isActive: true }).select('_id upSanchName sanchAreaId');
        
        const upSanchIds = upSanchs.map(upSanch => upSanch._id);
        const gramSamitis = await GramSamiti.find({ upSanchAreaId: { $in: upSanchIds }, isActive: true }).select('_id svpId upSanchAreaId');
        
        // Build hierarchical structure
        hierarchyData = {
          sanchs: sanchs.map(sanch => {
            const sanch_id = sanch._id.toString();
            return {
              _id: sanch._id,
              sanchName: sanch.sanchName,
              upSanchs: upSanchs
                .filter(upSanch => upSanch.sanchAreaId.toString() === sanch_id)
                .map(upSanch => {
                  const upSanch_id = upSanch._id.toString();
                  return {
                    _id: upSanch._id,
                    upSanchName: upSanch.upSanchName,
                    gramSamitis: gramSamitis
                      .filter(gs => gs.upSanchAreaId.toString() === upSanch_id)
                      .map(gs => ({
                        _id: gs._id,
                        svpId: gs.svpId
                      }))
                  };
                })
            };
          })
        };

      } else if (role === 'sanchPramukh' && sanchAreaId) {
        query.sanchAreaId = sanchAreaId;
        
        // For Sanch login - fetch UpSanch -> SVP IDs hierarchy
        const upSanchs = await UpSanchAreaNew.find({ sanchAreaId, isActive: true }).select('_id upSanchName');
        
        const upSanchIds = upSanchs.map(upSanch => upSanch._id);
        const gramSamitis = await GramSamiti.find({ upSanchAreaId: { $in: upSanchIds }, isActive: true }).select('_id svpId upSanchAreaId');
        
        // Build hierarchical structure
        hierarchyData = {
          upSanchs: upSanchs.map(upSanch => {
            const upSanch_id = upSanch._id.toString();
            return {
              _id: upSanch._id,
              upSanchName: upSanch.upSanchName,
              gramSamitis: gramSamitis
                .filter(gs => gs.upSanchAreaId.toString() === upSanch_id)
                .map(gs => ({
                  _id: gs._id,
                  svpId: gs.svpId
                }))
            };
          })
        };

      } else if (role === 'upSanchPramukh' && upSanchAreaId) {
        query.upSanchAreaId = upSanchAreaId;
        
        // For UpSanch login - fetch only SVP IDs under this UpSanch
        const gramSamitis = await GramSamiti.find({ upSanchAreaId, isActive: true }).select('_id svpId');
        
        // Build simple list structure
        hierarchyData = {
          gramSamitis: gramSamitis.map(gs => ({
            _id: gs._id,
            svpId: gs.svpId
          }))
        };
      } else if (role === 'superAdmin' || role === 'systemAdmin') {
        // For admin/superadmin, fetch complete hierarchy
        const anchals = await AnchalAreaNew.find({ isActive: true }).select('_id anchalName');
        
        const anchalIds = anchals.map(anchal => anchal._id);
        const sankuls = await SankulAreaNew.find({ anchalAreaId: { $in: anchalIds }, isActive: true }).select('_id sankulName anchalAreaId');
        
        const sankulIds = sankuls.map(sankul => sankul._id);
        const sanchs = await SanchAreaNew.find({ sankulAreaId: { $in: sankulIds }, isActive: true }).select('_id sanchName sankulAreaId');
        
        const sanchIds = sanchs.map(sanch => sanch._id);
        const upSanchs = await UpSanchAreaNew.find({ sanchAreaId: { $in: sanchIds }, isActive: true }).select('_id upSanchName sanchAreaId');
        
        const upSanchIds = upSanchs.map(upSanch => upSanch._id);
        const gramSamitis = await GramSamiti.find({ upSanchAreaId: { $in: upSanchIds }, isActive: true }).select('_id svpId upSanchAreaId');
        
        // Build complete hierarchical structure
        hierarchyData = {
          anchals: anchals.map(anchal => {
            const anchal_id = anchal._id.toString();
            return {
              _id: anchal._id,
              anchalName: anchal.anchalName,
              sankuls: sankuls
                .filter(sankul => sankul.anchalAreaId.toString() === anchal_id)
                .map(sankul => {
                  const sankul_id = sankul._id.toString();
                  return {
                    _id: sankul._id,
                    sankulName: sankul.sankulName,
                    sanchs: sanchs
                      .filter(sanch => sanch.sankulAreaId.toString() === sankul_id)
                      .map(sanch => {
                        const sanch_id = sanch._id.toString();
                        return {
                          _id: sanch._id,
                          sanchName: sanch.sanchName,
                          upSanchs: upSanchs
                            .filter(upSanch => upSanch.sanchAreaId.toString() === sanch_id)
                            .map(upSanch => {
                              const upSanch_id = upSanch._id.toString();
                              return {
                                _id: upSanch._id,
                                upSanchName: upSanch.upSanchName,
                                gramSamitis: gramSamitis
                                  .filter(gs => gs.upSanchAreaId.toString() === upSanch_id)
                                  .map(gs => ({
                                    _id: gs._id,
                                    svpId: gs.svpId
                                  }))
                              };
                            })
                        };
                      })
                  };
                })
            };
          })
        };
      } else {
        return next(new ErrorHandler('User role not authorized for this operation', 403));
      }

      // Add summary statistics
      const countGramSamitis = (data) => {
        let count = 0;
        
        if (data.gramSamitis) {
          count += data.gramSamitis.length;
        }
        
        if (data.upSanchs) {
          data.upSanchs.forEach(upSanch => {
            count += upSanch.gramSamitis ? upSanch.gramSamitis.length : 0;
          });
        }
        
        if (data.sanchs) {
          data.sanchs.forEach(sanch => {
            if (sanch.upSanchs) {
              sanch.upSanchs.forEach(upSanch => {
                count += upSanch.gramSamitis ? upSanch.gramSamitis.length : 0;
              });
            }
          });
        }
        
        if (data.sankuls) {
          data.sankuls.forEach(sankul => {
            if (sankul.sanchs) {
              sankul.sanchs.forEach(sanch => {
                if (sanch.upSanchs) {
                  sanch.upSanchs.forEach(upSanch => {
                    count += upSanch.gramSamitis ? upSanch.gramSamitis.length : 0;
                  });
                }
              });
            }
          });
        }
        
        if (data.anchals) {
          data.anchals.forEach(anchal => {
            if (anchal.sankuls) {
              anchal.sankuls.forEach(sankul => {
                if (sankul.sanchs) {
                  sankul.sanchs.forEach(sanch => {
                    if (sanch.upSanchs) {
                      sanch.upSanchs.forEach(upSanch => {
                        count += upSanch.gramSamitis ? upSanch.gramSamitis.length : 0;
                      });
                    }
                  });
                }
              });
            }
          });
        }
        
        return count;
      };

      // Add total count to response
      const totalGramSamitis = countGramSamitis(hierarchyData);

      // Return hierarchical data structure based on user role
      return res.status(200).json({
        result: true,
        message: 'hierarchical_gram_samiti_data',
        responseMessage: `Hierarchical data fetched for ${role}`,
        responseData: {
          ...hierarchyData,
          totalCount: totalGramSamitis
        }
      });
    } catch (error) {
      console.error("Error fetching hierarchical Gram Samiti data:", error);
      return next(new ErrorHandler('Error fetching hierarchical data', 500));
    }
  }
);
// API to get Gram Samiti members by SVP ID
export const getGramSamitiMembersBySvpId = async (req, res, next) => {
  try {
    const { svpId } = req.params;
    
    // Check if user exists before destructuring
    if (!req.user) {
      return ErrorResponse(res, 'Authentication required', 401);
    }
    
    const { role, anchalAreaId, sankulAreaId, sanchAreaId, upSanchAreaId } = req.user;

    if (!svpId) {
      return ErrorBadRequestResponseWithData(res, 'SVP ID is required');
    }

    // First, find the Gram Samiti with the specified SVP ID
    const gramSamiti = await GramSamiti.findOne({ svpId });

    if (!gramSamiti) {
      return ErrorResponse(res, 'Gram Samiti not found with the provided SVP ID', 404);
    }

    // Verify user has permission to access this Gram Samiti based on their role
    let hasPermission = false;
    
    switch (role) {
      case 'anchalPramukh':
        hasPermission = gramSamiti.anchalAreaId?.toString() === anchalAreaId?.toString();
        break;
      case 'sankulPramukh':
        hasPermission = gramSamiti.sankulAreaId?.toString() === sankulAreaId?.toString();
        break;
      case 'sanchPramukh':
        hasPermission = gramSamiti.sanchAreaId?.toString() === sanchAreaId?.toString();
        break;
      case 'upSanchPramukh':
        hasPermission = gramSamiti.upSanchAreaId?.toString() === upSanchAreaId?.toString();
        break;
      case 'superAdmin':
      case 'systemAdmin':
        hasPermission = true;
        break;
      default:
        hasPermission = false;
    }

    if (!hasPermission) {
      return ErrorResponse(res, 'You do not have permission to access this Gram Samiti', 403);
    }

    // Now fetch the full data with populated members
    const gramSamitiWithMembers = await GramSamiti.findOne({ svpId })
      .populate([
        { path: 'gsMemberPradhanId', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberUppradhanId', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberSachivId', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberUpsachivId', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberSadasya1Id', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberSadasya2Id', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'gsMemberSadasya3Id', select: 'firstName middleName lastName dateOfBirth gender contactNo emailId designationInSvpGramSamii education occupation' },
        { path: 'upSanchAreaId', select: 'upSanchName' },
        { path: 'sanchAreaId', select: 'sanchName' },
        { path: 'sankulAreaId', select: 'sankulName' },
        { path: 'anchalAreaId', select: 'anchalName' }
      ]);

    // Collect all members into an array
    const members = [
      gramSamitiWithMembers.gsMemberPradhanId ? { ...gramSamitiWithMembers.gsMemberPradhanId._doc, role: 'Pradhan' } : null,
      gramSamitiWithMembers.gsMemberUppradhanId ? { ...gramSamitiWithMembers.gsMemberUppradhanId._doc, role: 'Uppradhan' } : null,
      gramSamitiWithMembers.gsMemberSachivId ? { ...gramSamitiWithMembers.gsMemberSachivId._doc, role: 'Sachiv' } : null,
      gramSamitiWithMembers.gsMemberUpsachivId ? { ...gramSamitiWithMembers.gsMemberUpsachivId._doc, role: 'Upsachiv' } : null,
      gramSamitiWithMembers.gsMemberSadasya1Id ? { ...gramSamitiWithMembers.gsMemberSadasya1Id._doc, role: 'Sadasya1' } : null,
      gramSamitiWithMembers.gsMemberSadasya2Id ? { ...gramSamitiWithMembers.gsMemberSadasya2Id._doc, role: 'Sadasya2' } : null,
      gramSamitiWithMembers.gsMemberSadasya3Id ? { ...gramSamitiWithMembers.gsMemberSadasya3Id._doc, role: 'Sadasya3' } : null
    ].filter(member => member); // Remove null entries

    const responseData = {
      svpId: gramSamitiWithMembers.svpId,
      isComplete: gramSamitiWithMembers.isComplete,
      location: {
        state: gramSamitiWithMembers.state,
        district: gramSamitiWithMembers.district,
        subDistrict: gramSamitiWithMembers.subDistrict,
        village: gramSamitiWithMembers.village,
        gramPanchayat: gramSamitiWithMembers.gramPanchayat,
        pincode: gramSamitiWithMembers.pincode
      },
      hierarchyInfo: {
        upSanchName: gramSamitiWithMembers.upSanchAreaId?.upSanchName || 'Unknown',
        sanchName: gramSamitiWithMembers.sanchAreaId?.sanchName || 'Unknown',
        sankulName: gramSamitiWithMembers.sankulAreaId?.sankulName || 'Unknown',
        anchalName: gramSamitiWithMembers.anchalAreaId?.anchalName || 'Unknown'
      },
      members,
      filledRoles: members.length,
      completionPercentage: Math.round((members.length / 7) * 100)
    };

    return successResponseWithData(res, 'Gram Samiti members retrieved successfully', {
      result: true,
      message: 'gram_samiti_members',
      responseMessage: 'Gram Samiti members retrieved successfully',
      responseData
    });
  } catch (error) {
    console.error("Error fetching Gram Samiti members:", error);
    return ErrorResponse(res, 'Error fetching Gram Samiti members', 500);
  }
};

const generateSvpId = async () => {
  const currentYear = new Date().getFullYear();
  // Use regex to match the current year's SVP IDs and sort in descending order
  const lastGramSamiti = await GramSamiti.findOne({
    svpId: { $regex: `^SVP${currentYear}` }
  }).sort({ svpId: -1 });

  let sequenceNumber = 1;
  if (lastGramSamiti && lastGramSamiti.svpId) {
    // Extract the sequence number from the last SVP ID
    const lastSequence = parseInt(lastGramSamiti.svpId.substring(7), 10);
    if (!isNaN(lastSequence)) {
      sequenceNumber = lastSequence + 1;
    }
  }

  // Generate the new SVP ID with padded zeros
  const generatedId = `SVP${currentYear}${sequenceNumber.toString().padStart(3, '0')}`;
  console.log("Generated SVP ID:", generatedId);
  return generatedId;
};

// Endpoint to generate SVP ID
export const generateSvpIdForGramSamiti = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const svpId = await generateSvpId();

      return res.status(200).json({
        result: true,
        message: "svp_id_generated",
        responseData: {
          message: "SVP ID generated successfully",
          svpId: svpId
        }
      });
    } catch (error) {
      console.error("Error generating SVP ID:", error);
      return next(error);
    }
  }
);
// New endpoint to get pending Gram Samiti report
export const getPendingGramSamitiReport = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { role, upSanchAreaId, sanchAreaId, sankulAreaId, anchalAreaId } = req.user;
      const { reportType = 'all' } = req.query; // 'all', 'pending', or 'complete'

      // Base query
      let query = {};

      // Set isComplete filter based on reportType
      if (reportType === 'pending') {
        query.isComplete = false;
      } else if (reportType === 'complete') {
        query.isComplete = true;
      }
      // For 'all', we don't filter by isComplete

      // Filter based on user's role and hierarchy
      if (role === 'upSanchPramukh' && upSanchAreaId) {
        // UpSanchPramukh can only view Gram Samitis in their upSanch area
        const upSanchArea = await UpSanchAreaNew.findById(upSanchAreaId);
        if (!upSanchArea) {
          return next(new ErrorHandler('UpSanch area not found', 404));
        }
        query.upSanchAreaId = upSanchAreaId;
      } else if (role === 'sanchPramukh' && sanchAreaId) {
        // SanchPramukh can view all Gram Samitis within their Sanch
        query.sanchAreaId = sanchAreaId;
      } else if (role === 'sankulPramukh' && sankulAreaId) {
        // SankulPramukh can view all Gram Samitis within their Sankul
        query.sankulAreaId = sankulAreaId;
      } else if (role === 'anchalPramukh' && anchalAreaId) {
        // AnchalPramukh can view all Gram Samitis within their Anchal
        query.anchalAreaId = anchalAreaId;
      }
      // For superAdmin and systemAdmin, no additional filters are needed - they can see all

      // Find Gram Samitis based on the constructed query
      const gramSamitis = await GramSamiti.find(query)
        .populate([
          { path: 'gsMemberPradhanId', select: 'firstName emailId lastName designationInSvpGramSamii' },
          { path: 'gsMemberUppradhanId', select: 'firstName emailId lastName designationInSvpGramSamii' },
          { path: 'gsMemberSachivId', select: 'firstName lastName designationInSvpGramSamii' },
          { path: 'gsMemberUpsachivId', select: 'firstName lastName designationInSvpGramSamii' },
          { path: 'gsMemberSadasya1Id', select: 'firstName lastName designationInSvpGramSamii' },
          { path: 'gsMemberSadasya2Id', select: 'firstName lastName designationInSvpGramSamii' },
          { path: 'gsMemberSadasya3Id', select: 'firstName lastName designationInSvpGramSamii' },
          { path: 'createdBy', select: 'userName svpEmail role' },
          { path: 'upSanchAreaId', select: 'upSanchName' },
          { path: 'sanchAreaId', select: 'sanchName' },
          { path: 'sankulAreaId', select: 'sankulName' },
          { path: 'anchalAreaId', select: 'anchalName' }
        ]);

      // Format each Gram Samiti with status information
      const formattedGramSamitis = gramSamitis.map(gs => {
        const pendingRoles = [];

        if (!gs.gsMemberPradhanId) pendingRoles.push('Pradhan');
        if (!gs.gsMemberUppradhanId) pendingRoles.push('Uppradhan');
        if (!gs.gsMemberSachivId) pendingRoles.push('Sachiv');
        if (!gs.gsMemberUpsachivId) pendingRoles.push('Upsachiv');
        if (!gs.gsMemberSadasya1Id) pendingRoles.push('Sadasya1');
        if (!gs.gsMemberSadasya2Id) pendingRoles.push('Sadasya2');
        if (!gs.gsMemberSadasya3Id) pendingRoles.push('Sadasya3');

        return {
          _id: gs._id,
          svpId: gs.svpId,
          location: {
            state: gs.state,
            district: gs.district,
            subDistrict: gs.subDistrict,
            village: gs.village,
            gramPanchayat: gs.gramPanchayat,
            pincode: gs.pincode
          },
          hierarchyInfo: {
            upSanchName: gs.upSanchAreaId?.upSanchName || 'Unknown',
            upSanchId: gs.upSanchAreaId?._id || null,
            sanchName: gs.sanchAreaId?.sanchName || 'Unknown',
            sanchId: gs.sanchAreaId?._id || null,
            sankulName: gs.sankulAreaId?.sankulName || 'Unknown',
            sankulId: gs.sankulAreaId?._id || null,
            anchalName: gs.anchalAreaId?.anchalName || 'Unknown',
            anchalId: gs.anchalAreaId?._id || null
          },
          isComplete: gs.isComplete,
          createdAt: gs.createdAt,
          createdBy: gs.createdBy,
          pendingRoles,
          filledRoles: 7 - pendingRoles.length,
          completionPercentage: Math.round(((7 - pendingRoles.length) / 7) * 100),
          existingMembers: [
            gs.gsMemberPradhanId,
            gs.gsMemberUppradhanId,
            gs.gsMemberSachivId,
            gs.gsMemberUpsachivId,
            gs.gsMemberSadasya1Id,
            gs.gsMemberSadasya2Id,
            gs.gsMemberSadasya3Id
          ].filter(member => member)
        };
      });

      // Organize into hierarchical structure
      const hierarchicalStructure = {};
      const summaryStats = {
        total: formattedGramSamitis.length,
        totalComplete: formattedGramSamitis.filter(gs => gs.isComplete).length,
        totalIncomplete: formattedGramSamitis.filter(gs => !gs.isComplete).length,
        totalByAnchal: {}
      };

      // Group by Anchal → Sankul → Sanch → UpSanch
      formattedGramSamitis.forEach(gs => {
        const { hierarchyInfo } = gs;
        const anchalId = hierarchyInfo.anchalId?.toString() || 'unknown';
        const sankulId = hierarchyInfo.sankulId?.toString() || 'unknown';
        const sanchId = hierarchyInfo.sanchId?.toString() || 'unknown';
        const upSanchId = hierarchyInfo.upSanchId?.toString() || 'unknown';

        // Initialize anchal if not exists
        if (!hierarchicalStructure[anchalId]) {
          hierarchicalStructure[anchalId] = {
            name: hierarchyInfo.anchalName,
            _id: hierarchyInfo.anchalId,
            sankuls: {},
            total: 0,
            complete: 0,
            incomplete: 0
          };
          summaryStats.totalByAnchal[anchalId] = {
            total: 0, 
            complete: 0,
            incomplete: 0
          };
        }

        // Initialize sankul if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId] = {
            name: hierarchyInfo.sankulName,
            _id: hierarchyInfo.sankulId,
            sanchs: {},
            total: 0,
            complete: 0,
            incomplete: 0
          };
        }

        // Initialize sanch if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId] = {
            name: hierarchyInfo.sanchName,
            _id: hierarchyInfo.sanchId,
            upSanchs: {},
            total: 0,
            complete: 0,
            incomplete: 0
          };
        }

        // Initialize upSanch if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId] = {
            name: hierarchyInfo.upSanchName,
            _id: hierarchyInfo.upSanchId,
            gramSamitis: [],
            total: 0,
            complete: 0,
            incomplete: 0
          };
        }

        // Add Gram Samiti to the upSanch
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].gramSamitis.push(gs);

        // Increment counters
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].total++;
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].total++;
        hierarchicalStructure[anchalId].sankuls[sankulId].total++;
        hierarchicalStructure[anchalId].total++;
        summaryStats.totalByAnchal[anchalId].total++;

        // Increment complete/incomplete counters
        if (gs.isComplete) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].complete++;
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].complete++;
          hierarchicalStructure[anchalId].sankuls[sankulId].complete++;
          hierarchicalStructure[anchalId].complete++;
          summaryStats.totalByAnchal[anchalId].complete++;
        } else {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].incomplete++;
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].incomplete++;
          hierarchicalStructure[anchalId].sankuls[sankulId].incomplete++;
          hierarchicalStructure[anchalId].incomplete++;
          summaryStats.totalByAnchal[anchalId].incomplete++;
        }
      });

      // Convert the nested objects to arrays for easier consumption by clients
      const hierarchicalResult = Object.values(hierarchicalStructure).map(anchal => {
        return {
          ...anchal,
          sankuls: Object.values(anchal.sankuls).map(sankul => {
            return {
              ...sankul,
              sanchs: Object.values(sankul.sanchs).map(sanch => {
                return {
                  ...sanch,
                  upSanchs: Object.values(sanch.upSanchs)
                };
              })
            };
          })
        };
      });

      // Return data in hierarchical format
      return res.status(200).json({
        result: true,
        message: 'gram_samiti_report',
        responseMessage: 'Gram Samiti report generated successfully',
        responseData: {
          summary: summaryStats,
          hierarchicalView: hierarchicalResult,
          flatList: formattedGramSamitis  // Include the flat list as well for compatibility
        }
      });
    } catch (error) {
      console.error("Error generating Gram Samiti report:", error);
      return next(new ErrorHandler('Error generating report', 500));
    }
  }
);

export const updateSvpIdStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { gramSamitiId, isActive, inactiveReason } = req.body;

    if (!gramSamitiId) {
      return validationErrorWithData(
        res,
        'missing_id',
        'Gram Samiti ID is required'
      );
    }

    // Type check for isActive to ensure it's a boolean
    if (typeof isActive !== 'boolean') {
      return validationErrorWithData(
        res,
        'invalid_status',
        'isActive must be a boolean value'
      );
    }

    // If marking as inactive, reason is required
    if (isActive === false && !inactiveReason) {
      return validationErrorWithData(
        res,
        'missing_reason',
        'Reason is required when marking a Gram Samiti as inactive'
      );
    }

    try {
      const gramSamiti = await GramSamiti.findById(gramSamitiId);

      if (!gramSamiti) {
        return ErrorNotFoundResponseWithData(
          res,
          'gram_samiti_not_found',
          'Gram Samiti not found with the provided ID'
        );
      }

      // Update status and related fields
      const updateData = {
        isActive: isActive
      };

      if (!isActive) {
        updateData.inactiveReason = inactiveReason;
        updateData.inactiveDate = new Date();
        updateData.inactivatedBy = req.user_id;
      } else {
        // If reactivating, clear inactive fields
        updateData.inactiveReason = null;
        updateData.inactiveDate = null;
        updateData.inactivatedBy = null;
      }

      const updatedGramSamiti = await GramSamiti.findByIdAndUpdate(
        gramSamitiId,
        updateData,
        { new: true }
      );

      return successResponseWithData(
        res,
        isActive ? 'gram_samiti_activated' : 'gram_samiti_deactivated',
        `Gram Samiti was successfully ${isActive ? 'activated' : 'deactivated'}`,
        {
          gramSamiti: updatedGramSamiti
        }
      );
    } catch (error) {
      console.error('Error updating Gram Samiti status:', error);
      return next(error);
    }
  }
);

// 3. Create a dashboard endpoint for UpSanch to see SVP ID statistics
export const getSvpIdDashboard = asyncErrorHandler(
  async (req, res, next) => {
    try {
      // Get the user's area ID if they are an UpSanch
      const user = await User.findById(req.user_id);

      if (!user || user.role !== 'upSanchPramukh') {
        return validationErrorWithData(
          res,
          'unauthorized',
          'Only UpSanch Pramukh can access this dashboard'
        );
      }

      // Find all Gram Samitis in the user's area
      const query = {
        // Filter by the user's area
        subDistrict: user.upSanchAreaFromUser
      };

      // Get all Gram Samitis
      const allGramSamitis = await GramSamiti.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // Count statistics
      const totalSvpIds = allGramSamitis.length;
      const activeSvpIds = allGramSamitis.filter(gs => gs.isActive).length;
      const inactiveSvpIds = allGramSamitis.filter(gs => !gs.isActive).length;

      // Group inactive by reasons for analysis
      const inactiveReasons = {};
      allGramSamitis.filter(gs => !gs.isActive).forEach(gs => {
        const reason = gs.inactiveReason || 'Unknown';
        inactiveReasons[reason] = (inactiveReasons[reason] || 0) + 1;
      });

      // For the dashboard, get recent SVP IDs (limit to 10)
      const recentSvpIds = await GramSamiti.find(query)
        .select('svpId village gramPanchayat isActive inactiveReason createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return successResponseWithData(
        res,
        'dashboard_data_fetched',
        'Dashboard data fetched successfully',
        {
          totalSvpIds,
          activeSvpIds,
          inactiveSvpIds,
          inactiveReasons,
          recentSvpIds
        }
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return next(error);
    }
  }
);

export const getAllGramSamiti = asyncErrorHandler(async (req, res, next) => {
  try {
    const gramSamitis = await GramSamiti.find()
      .populate({
        path: 'gsMemberPradhanId gsMemberUppradhanId gsMemberSachivId gsMemberUpsachivId gsMemberSadasya1Id gsMemberSadasya2Id gsMemberSadasya3Id',
        model: 'GramSamitiInfo',
      })
      .populate({
        path: 'createdBy',
        select: 'userName svpEmail',
        options: { strictPopulate: false },
      });

    // If no records found
    if (!gramSamitis || gramSamitis.length === 0) {
      return res.status(400).json({
        result: false,
        message: 'gram_samiti_not_found',
        responseData: 'No Gram Samiti records found',
      });
    }

    return res.status(200).json({
      result: true,
      message: 'gram_samiti_retrieved',
      responseData: {
        message: 'All Gram Samiti records retrieved successfully',
        data: gramSamitis,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export const getSvpIdList = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;

      // Get the user's area ID if they are an UpSanch
      const user = await User.findById(req.user_id);

      if (!user) {
        return validationErrorWithData(
          res,
          'unauthorized',
          'User not found'
        );
      }

      // Build the query based on user role and filters
      const query = {};
      
      // Base query for total active count (we'll use this later)
      const activeCountQuery = { isActive: true };

      // Filter by area based on user role
      if (user.role === 'upSanchPramukh' && user.upSanchAreaFromUser) {
        query.subDistrict = user.upSanchAreaFromUser;
        activeCountQuery.subDistrict = user.upSanchAreaFromUser;
      } else if (user.role === 'sanchPramukh' && user.sanchAreaFromUser) {
        query.district = user.sanchAreaFromUser;
        activeCountQuery.district = user.sanchAreaFromUser;
      } else if (user.role === 'sankulPramukh' && user.sankulAreaFromUser) {
        query.state = user.sankulAreaFromUser;
        activeCountQuery.state = user.sankulAreaFromUser;
      } else if (!['superAdmin', 'systemAdmin'].includes(user.role)) {
        // If none of the above roles and not admin, return empty result
        return successResponseWithData(
          res,
          'svp_id_list_fetched',
          'No SVP IDs available for this user role',
          {
            totalSvpIds: 0,
            totalActiveSvpIds: 0,
            svpIds: [],
            pagination: {
              totalDocs: 0,
              totalPages: 0,
              currentPage: parseInt(page),
              limit: parseInt(limit)
            }
          }
        );
      }

      // Filter by status if provided
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      // Filter by date range if provided
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) {
          query.createdAt.$gte = new Date(fromDate);
        }
        if (toDate) {
          // Add 1 day to include the end date fully
          const endDate = new Date(toDate);
          endDate.setDate(endDate.getDate() + 1);
          query.createdAt.$lt = endDate;
        }
      }

      // Count total matching documents for pagination
      const totalDocs = await GramSamiti.countDocuments(query);
      
      // Get total active SVP count based on user's permissions
      const totalActiveSvpIds = await GramSamiti.countDocuments(activeCountQuery);

      // Calculate pagination values
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalPages = Math.ceil(totalDocs / parseInt(limit));

      // Get SVP IDs with pagination
      const svpIds = await GramSamiti.find(query)
        .select('svpId state district subDistrict village gramPanchayat isActive inactiveReason createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      return successResponseWithData(
        res,
        'svp_id_list_fetched',
        'SVP ID list fetched successfully',
        {
          totalSvpIds: totalDocs,
          totalActiveSvpIds,
          svpIds,
          pagination: {
            totalDocs,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      );
    } catch (error) {
      console.error('Error fetching SVP ID list:', error);
      return next(error);
    }
  }
);

// Controller to get all Gram Samiti members with basic information
export const getAllGramSamitiMembersSimple = asyncErrorHandler(
  async (req, res, next) => {
    try {
      // Get all members with populated creator information
      const members = await GramSamitiInfo.find().populate({
        path: 'createdBy',
        select: 'userName svpEmail',
        // Don't skip if createdBy not found
        options: { strictPopulate: false },
      });

      if (!members || members.length === 0) {
        return ErrorBadRequestResponseWithData(
          res,
          'members_not_found',
          'No Gram Samiti members found'
        );
      }

      return successResponseWithData(
        res,
        'gram_samiti_members_retrieved',
        'All Gram Samiti members retrieved successfully',
        members
      );
    } catch (error) {
      return next(error);
    }
  }
);

export const getGramSamitiMemberByMemberId = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { memberId } = req.params;

      if (!memberId) {
        return res.status(400).json({
          result: false,
          message: 'member_id_required',
          responseData: 'Member ID is required',
        });
      }

      // Find the member by ID
      const member = await GramSamitiInfo.findById(memberId).populate({
        path: 'createdBy',
        select: 'userName svpEmail',
        options: { strictPopulate: false },
      });

      if (!member) {
        return res.status(400).json({
          result: false,
          message: 'member_not_found',
          responseData: 'Gram Samiti member not found',
        });
      }

      const query = {
        $or: [
          { gsMemberPradhanId: memberId },
          { gsMemberUppradhanId: memberId },
          { gsMemberSachivId: memberId },
          { gsMemberUpsachivId: memberId },
          { gsMemberSadasya1Id: memberId },
          { gsMemberSadasya2Id: memberId },
          { gsMemberSadasya3Id: memberId },
        ],
      };

      const gramSamitis = await GramSamiti.find(query)
        .populate(
          'gsMemberPradhanId gsMemberUppradhanId gsMemberSachivId gsMemberUpsachivId gsMemberSadasya1Id gsMemberSadasya2Id gsMemberSadasya3Id'
        )
        .populate({
          path: 'createdBy',
          select: 'userName svpEmail',
          options: { strictPopulate: false },
        });

      return res.status(200).json({
        result: true,
        message: 'gram_samiti_member_details',
        responseData: {
          message: 'Gram Samiti member details retrieved successfully',
          data: {
            memberDetails: member,
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

export const getGramSamitiById = asyncErrorHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ErrorBadRequestResponseWithData(
        res,
        'gram_samiti_id_required',
        'Gram Samiti ID is required'
      );
    }

    const gramSamiti = await GramSamiti.findById(id)
      .populate(
        'gsMemberPradhanId gsMemberUppradhanId gsMemberSachivId gsMemberUpsachivId gsMemberSadasya1Id gsMemberSadasya2Id gsMemberSadasya3Id'
      )
      .populate({
        path: 'createdBy',
        select: 'userName svpEmail',
        options: { strictPopulate: false },
      });

    if (!gramSamiti) {
      return ErrorBadRequestResponseWithData(
        res,
        'gram_samiti_not_found',
        'Gram Samiti not found'
      );
    }

    return successResponseWithData(
      res,
      'gram_samiti_retrieved',
      'Gram Samiti retrieved successfully',
      gramSamiti
    );
  } catch (error) {
    return next(error);
  }
});

export const getSpecificGramSamitiMember = asyncErrorHandler(async (req, res, next) => {
  try {
    const { memberId } = req.params; // Assuming you're passing the member ID as a URL parameter

    // Find gram samitis where the specified member exists
    const gramSamitis = await GramSamiti.find({
      $or: [
        { gsMemberPradhanId: memberId },
        { gsMemberUppradhanId: memberId },
        { gsMemberSachivId: memberId },
        { gsMemberUpsachivId: memberId },
        { gsMemberSadasya1Id: memberId },
        { gsMemberSadasya2Id: memberId },
        { gsMemberSadasya3Id: memberId }
      ]
    }).populate({
      path: 'gsMemberPradhanId gsMemberUppradhanId gsMemberSachivId gsMemberUpsachivId gsMemberSadasya1Id gsMemberSadasya2Id gsMemberSadasya3Id',
      model: 'GramSamitiInfo',
      select: 'name contactNumber email position state district subdistrict village pincode svpId',
    }).populate({
      path: 'createdBy',
      select: 'userName svpEmail',
      options: { strictPopulate: false },
    });

    // If no records found
    if (!gramSamitis || gramSamitis.length === 0) {
      return res.status(400).json({
        result: false,
        message: 'gram_samiti_member_not_found',
        responseData: 'No Gram Samiti records found with this member',
      });
    }

    return res.status(200).json({
      result: true,
      message: 'gram_samiti_member_retrieved',
      responseData: {
        message: 'Gram Samiti member details retrieved successfully',
        data: gramSamitis,
      },
    });
  } catch (error) {
    return next(error);
  }
});


/**************************************************************************    */

export const getSvpsByUpSanchArea = asyncErrorHandler(async (req, res, next) => {
  try {
    const { upSanchAreaId } = req.params;
    
    if (!upSanchAreaId || !mongoose.Types.ObjectId.isValid(upSanchAreaId)) {
      return res.status(400).json({
        result: false,
        message: "invalid_upsanch_id",
        responseData: {
          message: "Please provide a valid UpSanch Area ID"
        }
      });
    }
    
    // Find all SVPs belonging to the specific UpSanch
    const svpList = await GramSamiti.find({ 
      upSanchAreaId: new mongoose.Types.ObjectId(upSanchAreaId) 
    })
    .select('svpId state district village gramPanchayat isActive isComplete inactiveReason inactiveDate createdAt')
    .populate({
      path: 'inactivatedBy',
      select: 'name email'
    })
    .sort({ createdAt: -1 });
    
    // Get summary counts
    const activeCount = svpList.filter(svp => svp.isActive).length;
    const inactiveCount = svpList.filter(svp => !svp.isActive).length;
    const completeCount = svpList.filter(svp => svp.isComplete).length;
    
    return res.status(200).json({
      result: true,
      message: "upsanch_svp_list_fetched",
      responseData: {
        upSanchAreaId,
        counts: {
          total: svpList.length,
          active: activeCount,
          inactive: inactiveCount,
          complete: completeCount
        },
        svpList
      }
    });
  } catch (error) {
    console.error("Error fetching SVPs by UpSanch:", error);
    return next(error);
  }
});


export const toggleSvpActiveStatus = asyncErrorHandler(async (req, res, next) => {
  try {
    const { svpId } = req.params;
    const { isActive, inactiveReason } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        result: false,
        message: "missing_status_parameter",
        responseData: {
          message: "isActive parameter is required"
        }
      });
    }
    
    // Find the Gram Samiti by SVP ID
    const gramSamiti = await GramSamiti.findOne({ svpId });
    
    if (!gramSamiti) {
      return res.status(404).json({
        result: false,
        message: "svp_not_found",
        responseData: {
          message: "No Gram Samiti found with the provided SVP ID"
        }
      });
    }
    
    // If status is already what we're trying to set, return early
    if (gramSamiti.isActive === isActive) {
      return res.status(200).json({
        result: true,
        message: "no_change_required",
        responseData: {
          message: `Gram Samiti is already ${isActive ? 'active' : 'inactive'}`,
          svpId: gramSamiti.svpId,
          isActive: gramSamiti.isActive
        }
      });
    }
    
    // Update the active status
    gramSamiti.isActive = isActive;
    
    // If deactivating, set the reason and date
    if (isActive === false) {
      if (!inactiveReason) {
        return res.status(400).json({
          result: false,
          message: "missing_inactive_reason",
          responseData: {
            message: "inactiveReason is required when deactivating a Gram Samiti"
          }
        });
      }
      
      gramSamiti.inactiveReason = inactiveReason;
      gramSamiti.inactiveDate = new Date();
      
      // Check if req.user exists (user should be authenticated)
      if (req.user && req.user._id) {
        gramSamiti.inactivatedBy = req.user._id;
      } else {
        return res.status(401).json({
          result: false,
          message: "authentication_required",
          responseData: {
            message: "Authentication required to deactivate a Gram Samiti"
          }
        });
      }
    } else {
      // If activating, clear the inactive fields
      gramSamiti.inactiveReason = null;
      gramSamiti.inactiveDate = null;
      gramSamiti.inactivatedBy = null;
    }
    
    await gramSamiti.save();
    
    return res.status(200).json({
      result: true,
      message: isActive ? "svp_activated" : "svp_deactivated",
      responseData: {
        message: isActive 
          ? "Gram Samiti has been activated successfully" 
          : "Gram Samiti has been deactivated successfully",
        svpId: gramSamiti.svpId,
        isActive: gramSamiti.isActive,
        inactiveReason: gramSamiti.inactiveReason,
        inactiveDate: gramSamiti.inactiveDate
      }
    });
  } catch (error) {
    console.error("Error toggling SVP active status:", error);
    return next(error);
  }
});


export const batchToggleSvpStatusByUpSanch = asyncErrorHandler(async (req, res, next) => {
  try {
    const { upSanchAreaId } = req.params;
    const { isActive, inactiveReason, svpIds } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        result: false,
        message: "missing_status_parameter",
        responseData: {
          message: "isActive parameter is required"
        }
      });
    }
    
    if (!upSanchAreaId || !mongoose.Types.ObjectId.isValid(upSanchAreaId)) {
      return res.status(400).json({
        result: false,
        message: "invalid_upsanch_id",
        responseData: {
          message: "Please provide a valid UpSanch Area ID"
        }
      });
    }
    
    // Build the query
    const query = { upSanchAreaId: new mongoose.Types.ObjectId(upSanchAreaId) };
    
    // If specific SVP IDs are provided, add them to the query
    if (svpIds && Array.isArray(svpIds) && svpIds.length > 0) {
      query.svpId = { $in: svpIds };
    }
    
    // If deactivating, need reason and authenticated user
    if (isActive === false) {
      if (!inactiveReason) {
        return res.status(400).json({
          result: false,
          message: "missing_inactive_reason",
          responseData: {
            message: "inactiveReason is required when deactivating Gram Samitis"
          }
        });
      }
      
      // Check if req.user exists (user should be authenticated)
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          result: false,
          message: "authentication_required",
          responseData: {
            message: "Authentication required to deactivate Gram Samitis"
          }
        });
      }
      
      // Update document to deactivate
      const updateData = {
        isActive: false,
        inactiveReason: inactiveReason,
        inactiveDate: new Date(),
        inactivatedBy: req.user._id
      };
      
      const result = await GramSamiti.updateMany(query, updateData);
      
      return res.status(200).json({
        result: true,
        message: "batch_svp_deactivated",
        responseData: {
          message: `${result.modifiedCount} Gram Samitis have been deactivated successfully`,
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
          upSanchAreaId
        }
      });
    } else {
      // Activating SVPs - clear inactive fields
      const updateData = {
        isActive: true,
        inactiveReason: null,
        inactiveDate: null,
        inactivatedBy: null
      };
      
      const result = await GramSamiti.updateMany(query, updateData);
      
      return res.status(200).json({
        result: true,
        message: "batch_svp_activated",
        responseData: {
          message: `${result.modifiedCount} Gram Samitis have been activated successfully`,
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
          upSanchAreaId
        }
      });
    }
  } catch (error) {
    console.error("Error batch toggling SVP status:", error);
    return next(error);
  }
});


export const getSvpStatistics = asyncErrorHandler(async (req, res, next) => {
  try {
    const { upSanchAreaId, sanchAreaId, sankulAreaId, anchalAreaId } = req.query;
    
    // Build the filter based on provided query parameters
    const filter = {};
    
    if (upSanchAreaId) {
      filter.upSanchAreaId = new mongoose.Types.ObjectId(upSanchAreaId);
    }
    
    if (sanchAreaId) {
      filter.sanchAreaId = new mongoose.Types.ObjectId(sanchAreaId);
    }
    
    if (sankulAreaId) {
      filter.sankulAreaId = new mongoose.Types.ObjectId(sankulAreaId);
    }
    
    if (anchalAreaId) {
      filter.anchalAreaId = new mongoose.Types.ObjectId(anchalAreaId);
    }
    
    // Get count of active SVPs
    const activeCount = await GramSamiti.countDocuments({
      ...filter,
      isActive: true
    });
    
    // Get count of inactive SVPs
    const inactiveCount = await GramSamiti.countDocuments({
      ...filter,
      isActive: false
    });
    
    // Get count of complete SVPs
    const completeCount = await GramSamiti.countDocuments({
      ...filter,
      isComplete: true
    });
    
    // Get count of incomplete SVPs
    const incompleteCount = await GramSamiti.countDocuments({
      ...filter,
      isComplete: false
    });
    
    // Get total SVPs
    const totalCount = activeCount + inactiveCount;
    
    // Calculate percentages for the main counts
    const activePercentage = totalCount > 0 ? (activeCount / totalCount * 100).toFixed(2) : 0;
    const inactivePercentage = totalCount > 0 ? (inactiveCount / totalCount * 100).toFixed(2) : 0;
    const completePercentage = totalCount > 0 ? (completeCount / totalCount * 100).toFixed(2) : 0;
    const incompletePercentage = totalCount > 0 ? (incompleteCount / totalCount * 100).toFixed(2) : 0;
    
    // Get the latest 5 SVP IDs generated
    const latestSvpIds = await GramSamiti.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('svpId svpName state district village gramPanchayat isActive createdAt');
    
    // Get recently activated/deactivated SVPs (last 5)
    const recentlyDeactivated = await GramSamiti.find({
      ...filter,
      isActive: false,
      inactiveDate: { $ne: null }
    })
      .sort({ inactiveDate: -1 })
      .limit(5)
      .select('svpId svpName state district village gramPanchayat inactiveDate inactiveReason');

    // Hierarchy-wise counts
    // For Anchal level counts
    const anchalCounts = await GramSamiti.aggregate([
      { $match: { anchalAreaId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$anchalAreaId",
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveCount: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          },
          completeCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", true] }, 1, 0] }
          },
          incompleteCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", false] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "anchalAreas", // Make sure this matches your actual collection name
          localField: "_id",
          foreignField: "_id",
          as: "anchalInfo"
        }
      },
      {
        $project: {
          _id: 1,
          anchalName: { $arrayElemAt: ["$anchalInfo.name", 0] },
          totalCount: 1,
          activeCount: 1,
          inactiveCount: 1,
          completeCount: 1,
          incompleteCount: 1,
          activePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$activeCount", "$totalCount"] }, 100] }
            ]
          },
          inactivePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$inactiveCount", "$totalCount"] }, 100] }
            ]
          },
          completePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$completeCount", "$totalCount"] }, 100] }
            ]
          },
          incompletePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$incompleteCount", "$totalCount"] }, 100] }
            ]
          }
        }
      }
    ]);

    // For Sankul level counts
    const sankulCounts = await GramSamiti.aggregate([
      { $match: { sankulAreaId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$sankulAreaId",
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveCount: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          },
          completeCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", true] }, 1, 0] }
          },
          incompleteCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", false] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "sankulAreas", // Make sure this matches your actual collection name
          localField: "_id",
          foreignField: "_id",
          as: "sankulInfo"
        }
      },
      {
        $project: {
          _id: 1,
          sankulName: { $arrayElemAt: ["$sankulInfo.name", 0] },
          anchalAreaId: { $arrayElemAt: ["$sankulInfo.anchalAreaId", 0] },
          totalCount: 1,
          activeCount: 1,
          inactiveCount: 1,
          completeCount: 1,
          incompleteCount: 1,
          activePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$activeCount", "$totalCount"] }, 100] }
            ]
          },
          inactivePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$inactiveCount", "$totalCount"] }, 100] }
            ]
          },
          completePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$completeCount", "$totalCount"] }, 100] }
            ]
          },
          incompletePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$incompleteCount", "$totalCount"] }, 100] }
            ]
          }
        }
      }
    ]);

    // For Sanch level counts
    const sanchCounts = await GramSamiti.aggregate([
      { $match: { sanchAreaId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$sanchAreaId",
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveCount: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          },
          completeCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", true] }, 1, 0] }
          },
          incompleteCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", false] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "sanchAreas", // Make sure this matches your actual collection name
          localField: "_id",
          foreignField: "_id",
          as: "sanchInfo"
        }
      },
      {
        $project: {
          _id: 1,
          sanchName: { $arrayElemAt: ["$sanchInfo.name", 0] },
          sankulAreaId: { $arrayElemAt: ["$sanchInfo.sankulAreaId", 0] },
          totalCount: 1,
          activeCount: 1,
          inactiveCount: 1,
          completeCount: 1,
          incompleteCount: 1,
          activePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$activeCount", "$totalCount"] }, 100] }
            ]
          },
          inactivePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$inactiveCount", "$totalCount"] }, 100] }
            ]
          },
          completePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$completeCount", "$totalCount"] }, 100] }
            ]
          },
          incompletePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$incompleteCount", "$totalCount"] }, 100] }
            ]
          }
        }
      }
    ]);

    // For UpSanch level counts
    const upSanchCounts = await GramSamiti.aggregate([
      { $match: { upSanchAreaId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$upSanchAreaId",
          totalCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveCount: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          },
          completeCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", true] }, 1, 0] }
          },
          incompleteCount: {
            $sum: { $cond: [{ $eq: ["$isComplete", false] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "upSanchAreas", // Make sure this matches your actual collection name
          localField: "_id",
          foreignField: "_id",
          as: "upSanchInfo"
        }
      },
      {
        $project: {
          _id: 1,
          upSanchName: { $arrayElemAt: ["$upSanchInfo.name", 0] },
          sanchAreaId: { $arrayElemAt: ["$upSanchInfo.sanchAreaId", 0] },
          totalCount: 1,
          activeCount: 1,
          inactiveCount: 1,
          completeCount: 1,
          incompleteCount: 1,
          activePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$activeCount", "$totalCount"] }, 100] }
            ]
          },
          inactivePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$inactiveCount", "$totalCount"] }, 100] }
            ]
          },
          completePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$completeCount", "$totalCount"] }, 100] }
            ]
          },
          incompletePercentage: {
            $cond: [
              { $eq: ["$totalCount", 0] },
              0,
              { $multiply: [{ $divide: ["$incompleteCount", "$totalCount"] }, 100] }
            ]
          }
        }
      }
    ]);
    
    return res.status(200).json({
      result: true,
      message: "svp_statistics_fetched",
      responseData: {
        counts: {
          active: activeCount,
          inactive: inactiveCount,
          total: totalCount,
          complete: completeCount,
          incomplete: incompleteCount,
          percentages: {
            active: parseFloat(activePercentage),
            inactive: parseFloat(inactivePercentage),
            complete: parseFloat(completePercentage),
            incomplete: parseFloat(incompletePercentage)
          }
        },
        hierarchyCounts: {
          anchalCounts,
          sankulCounts,
          sanchCounts,
          upSanchCounts
        },
        latestSvpIds,
        recentlyDeactivated,
        filter: {
          upSanchAreaId: upSanchAreaId || null,
          sanchAreaId: sanchAreaId || null,
          sankulAreaId: sankulAreaId || null,
          anchalAreaId: anchalAreaId || null
        }
      }
    });
  } catch (error) {
    console.error("Error fetching SVP statistics:", error);
    return next(error);
  }
});


export const getGramSamitiForEditForm = asyncErrorHandler(
  async (req, res, next) => {
    const { gramSamitiId } = req.params;
    
    if (!gramSamitiId) {
      return validationErrorWithData(
        res,
        'missing_id',
        'GramSamiti ID is required'
      );
    }

    try {
      // Find the GramSamiti with all member fields populated
      const gramSamiti = await GramSamiti.findById(gramSamitiId)
        .populate('gsMemberPradhanId')
        .populate('gsMemberUppradhanId')
        .populate('gsMemberSachivId')
        .populate('gsMemberUpsachivId')
        .populate('gsMemberSadasya1Id')
        .populate('gsMemberSadasya2Id')
        .populate('gsMemberSadasya3Id');
      
      if (!gramSamiti) {
        return ErrorNotFoundResponseWithData(
          res,
          'gram_samiti_not_found',
          'Gram Samiti not found with the provided ID'
        );
      }

      // Collect all the member references that exist
      const members = [];
      
      // Add each member to the array if they exist
      if (gramSamiti.gsMemberPradhanId) {
        const member = gramSamiti.gsMemberPradhanId.toObject();
        member.designationInSvpGramSamii = 'Pradhan'; // Ensure designation is set
        members.push(member);
      }
      
      if (gramSamiti.gsMemberUppradhanId) {
        const member = gramSamiti.gsMemberUppradhanId.toObject();
        member.designationInSvpGramSamii = 'Uppradhan';
        members.push(member);
      }
      
      if (gramSamiti.gsMemberSachivId) {
        const member = gramSamiti.gsMemberSachivId.toObject();
        member.designationInSvpGramSamii = 'Sachiv';
        members.push(member);
      }
      
      if (gramSamiti.gsMemberUpsachivId) {
        const member = gramSamiti.gsMemberUpsachivId.toObject();
        member.designationInSvpGramSamii = 'Upsachiv';
        members.push(member);
      }
      
      if (gramSamiti.gsMemberSadasya1Id) {
        const member = gramSamiti.gsMemberSadasya1Id.toObject();
        member.designationInSvpGramSamii = 'Sadasya1';
        members.push(member);
      }
      
      if (gramSamiti.gsMemberSadasya2Id) {
        const member = gramSamiti.gsMemberSadasya2Id.toObject();
        member.designationInSvpGramSamii = 'Sadasya2';
        members.push(member);
      }
      
      if (gramSamiti.gsMemberSadasya3Id) {
        const member = gramSamiti.gsMemberSadasya3Id.toObject();
        member.designationInSvpGramSamii = 'Sadasya3';
        members.push(member);
      }

      // Format the response specifically for the edit form
      const formData = {
        gramSamiti: {
          _id: gramSamiti._id,
          svpId: gramSamiti.svpId,
          state: gramSamiti.state,
          district: gramSamiti.district,
          subDistrict: gramSamiti.subDistrict,
          village: gramSamiti.village,
          pincode: gramSamiti.pincode,
          gramPanchayat: gramSamiti.gramPanchayat,
          agreementVideo: gramSamiti.agreementVideo,
          upSanchAreaId: gramSamiti.upSanchAreaId,
          sanchAreaId: gramSamiti.sanchAreaId,
          sankulAreaId: gramSamiti.sankulAreaId,
          anchalAreaId: gramSamiti.anchalAreaId,
        },
        members: members.map(member => ({
          _id: member._id,
          firstName: member.firstName,
          middleName: member.middleName || '',
          lastName: member.lastName,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
          contactNo: member.contactNo,
          emailId: member.emailId,
          designationInSvpGramSamii: member.designationInSvpGramSamii,
          education: member.education,
          occupation: member.occupation
        }))
      };

      // Return the formatted data for the edit form
      return res.status(200).json({
        result: true,
        message: "Gram Samiti data retrieved successfully for editing",
        data: formData
      });
    } catch (error) {
      console.error('Error retrieving GramSamiti edit form data:', error);
      return next(error);
    }
  }
);

export const updateSvpName = asyncErrorHandler(async (req, res, next) => {
  const { gramSamitiId, svpName } = req.body;
  const updatedBy = req.user_id;

  // Validate required fields
  if (!gramSamitiId) {
    return validationErrorWithData(
      res,
      'missing_gram_samiti_id',
      'Gram Samiti ID is required'
    );
  }

  if (!svpName || svpName.trim() === '') {
    return validationErrorWithData(
      res,
      'missing_svp_name',
      'SVP Name is required and cannot be empty'
    );
  }

  try {
    // Find the Gram Samiti
    const gramSamiti = await GramSamiti.findById(gramSamitiId);

    if (!gramSamiti) {
      return ErrorNotFoundResponseWithData(
        res,
        'gram_samiti_not_found',
        'Gram Samiti not found with the provided ID'
      );
    }

    // Check if user is authorized (Pradhan of this Gram Samiti)
    const pradhanMember = await GramSamitiInfo.findById(gramSamiti.gsMemberPradhanId);
    
    if (!pradhanMember || pradhanMember.createdBy?.toString() !== updatedBy?.toString()) {
      return ErrorUnauthorizedResponseWithData(
        res,
        'unauthorized_access',
        'Only the Pradhan can update the SVP Name'
      );
    }

    // Update the SVP Name
    gramSamiti.svpName = svpName;
    await gramSamiti.save();

    // Return success response
    return successResponseWithData(
      res,
      'svp_name_updated_successfully',
      'SVP Name has been updated successfully',
      {
        gramSamiti: {
          _id: gramSamiti._id,
          svpId: gramSamiti.svpId,
          svpName: gramSamiti.svpName,
        }
      }
    );
  } catch (error) {
    console.error('Error updating SVP Name:', error);
    return next(error);
  }
});

export const getSvpList = asyncErrorHandler(
  async (req, res, next) => {
    try {
      const { role, upSanchAreaId, sanchAreaId, sankulAreaId, anchalAreaId } = req.user;
      const { status = 'all' } = req.query; // 'all', 'active', or 'inactive'

      // Base query
      let query = {};

      // Set isActive filter based on status parameter
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      // For 'all', we don't filter by isActive

      // Filter based on user's role and hierarchy
      if (role === 'upSanchPramukh' && upSanchAreaId) {
        // UpSanchPramukh can only view SVPs in their upSanch area
        const upSanchArea = await UpSanchAreaNew.findById(upSanchAreaId);
        if (!upSanchArea) {
          return next(new ErrorHandler('UpSanch area not found', 404));
        }
        query.upSanchAreaId = upSanchAreaId;
      } else if (role === 'sanchPramukh' && sanchAreaId) {
        // SanchPramukh can view all SVPs within their Sanch
        query.sanchAreaId = sanchAreaId;
      } else if (role === 'sankulPramukh' && sankulAreaId) {
        // SankulPramukh can view all SVPs within their Sankul
        query.sankulAreaId = sankulAreaId;
      } else if (role === 'anchalPramukh' && anchalAreaId) {
        // AnchalPramukh can view all SVPs within their Anchal
        query.anchalAreaId = anchalAreaId;
      }
      // For superAdmin and systemAdmin, no additional filters are needed - they can see all

      // Find SVPs based on the constructed query
      const svpList = await GramSamiti.find(query)
        .populate([
          { path: 'createdBy', select: 'userName svpEmail role' },
          { path: 'inactivatedBy', select: 'userName svpEmail role' },
          { path: 'upSanchAreaId', select: 'upSanchName' },
          { path: 'sanchAreaId', select: 'sanchName' },
          { path: 'sankulAreaId', select: 'sankulName' },
          { path: 'anchalAreaId', select: 'anchalName' }
        ]);

      // Format each SVP with relevant information
      const formattedSvpList = svpList.map(svp => {
        return {
          _id: svp._id,
          svpId: svp.svpId,
          svpName: svp.svpName,
          location: {
            state: svp.state,
            district: svp.district,
            subDistrict: svp.subDistrict,
            village: svp.village,
            gramPanchayat: svp.gramPanchayat,
            pincode: svp.pincode
          },
          hierarchyInfo: {
            upSanchName: svp.upSanchAreaId?.upSanchName || 'Unknown',
            upSanchId: svp.upSanchAreaId?._id || null,
            sanchName: svp.sanchAreaId?.sanchName || 'Unknown',
            sanchId: svp.sanchAreaId?._id || null,
            sankulName: svp.sankulAreaId?.sankulName || 'Unknown',
            sankulId: svp.sankulAreaId?._id || null,
            anchalName: svp.anchalAreaId?.anchalName || 'Unknown',
            anchalId: svp.anchalAreaId?._id || null
          },
          isActive: svp.isActive,
          inactiveReason: svp.inactiveReason,
          inactiveDate: svp.inactiveDate,
          inactivatedBy: svp.inactivatedBy,
          createdAt: svp.createdAt,
          createdBy: svp.createdBy,
          gramSamitiComplete: svp.isComplete
        };
      });

      // Organize into hierarchical structure
      const hierarchicalStructure = {};
      const summaryStats = {
        total: formattedSvpList.length,
        totalActive: formattedSvpList.filter(svp => svp.isActive).length,
        totalInactive: formattedSvpList.filter(svp => !svp.isActive).length,
        activePercentage: formattedSvpList.length > 0 
          ? Math.round((formattedSvpList.filter(svp => svp.isActive).length / formattedSvpList.length) * 100) 
          : 0,
        inactivePercentage: formattedSvpList.length > 0 
          ? Math.round((formattedSvpList.filter(svp => !svp.isActive).length / formattedSvpList.length) * 100) 
          : 0,
        totalByAnchal: {}
      };

      // Group by Anchal → Sankul → Sanch → UpSanch
      formattedSvpList.forEach(svp => {
        const { hierarchyInfo } = svp;
        const anchalId = hierarchyInfo.anchalId?.toString() || 'unknown';
        const sankulId = hierarchyInfo.sankulId?.toString() || 'unknown';
        const sanchId = hierarchyInfo.sanchId?.toString() || 'unknown';
        const upSanchId = hierarchyInfo.upSanchId?.toString() || 'unknown';

        // Initialize anchal if not exists
        if (!hierarchicalStructure[anchalId]) {
          hierarchicalStructure[anchalId] = {
            name: hierarchyInfo.anchalName,
            _id: hierarchyInfo.anchalId,
            sankuls: {},
            total: 0,
            active: 0,
            inactive: 0,
            activePercentage: 0,
            inactivePercentage: 0
          };
          summaryStats.totalByAnchal[anchalId] = {
            total: 0, 
            active: 0,
            inactive: 0,
            activePercentage: 0,
            inactivePercentage: 0
          };
        }

        // Initialize sankul if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId] = {
            name: hierarchyInfo.sankulName,
            _id: hierarchyInfo.sankulId,
            sanchs: {},
            total: 0,
            active: 0,
            inactive: 0,
            activePercentage: 0,
            inactivePercentage: 0
          };
        }

        // Initialize sanch if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId] = {
            name: hierarchyInfo.sanchName,
            _id: hierarchyInfo.sanchId,
            upSanchs: {},
            total: 0,
            active: 0,
            inactive: 0,
            activePercentage: 0,
            inactivePercentage: 0
          };
        }

        // Initialize upSanch if not exists
        if (!hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId]) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId] = {
            name: hierarchyInfo.upSanchName,
            _id: hierarchyInfo.upSanchId,
            svpList: [],
            total: 0,
            active: 0,
            inactive: 0,
            activePercentage: 0,
            inactivePercentage: 0
          };
        }

        // Add SVP to the upSanch
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].svpList.push(svp);

        // Increment counters for total
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].total++;
        hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].total++;
        hierarchicalStructure[anchalId].sankuls[sankulId].total++;
        hierarchicalStructure[anchalId].total++;
        summaryStats.totalByAnchal[anchalId].total++;

        // Increment active/inactive counters
        if (svp.isActive) {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].active++;
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].active++;
          hierarchicalStructure[anchalId].sankuls[sankulId].active++;
          hierarchicalStructure[anchalId].active++;
          summaryStats.totalByAnchal[anchalId].active++;
        } else {
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].upSanchs[upSanchId].inactive++;
          hierarchicalStructure[anchalId].sankuls[sankulId].sanchs[sanchId].inactive++;
          hierarchicalStructure[anchalId].sankuls[sankulId].inactive++;
          hierarchicalStructure[anchalId].inactive++;
          summaryStats.totalByAnchal[anchalId].inactive++;
        }
      });

      // Calculate percentages for each level
      Object.values(hierarchicalStructure).forEach(anchal => {
        // Calculate percentages for anchal
        anchal.activePercentage = anchal.total > 0 ? Math.round((anchal.active / anchal.total) * 100) : 0;
        anchal.inactivePercentage = anchal.total > 0 ? Math.round((anchal.inactive / anchal.total) * 100) : 0;
        
        // Update summary stats for anchal
        const anchalId = anchal._id?.toString() || 'unknown';
        if (summaryStats.totalByAnchal[anchalId]) {
          summaryStats.totalByAnchal[anchalId].activePercentage = anchal.activePercentage;
          summaryStats.totalByAnchal[anchalId].inactivePercentage = anchal.inactivePercentage;
        }

        // Calculate percentages for each sankul
        Object.values(anchal.sankuls).forEach(sankul => {
          sankul.activePercentage = sankul.total > 0 ? Math.round((sankul.active / sankul.total) * 100) : 0;
          sankul.inactivePercentage = sankul.total > 0 ? Math.round((sankul.inactive / sankul.total) * 100) : 0;

          // Calculate percentages for each sanch
          Object.values(sankul.sanchs).forEach(sanch => {
            sanch.activePercentage = sanch.total > 0 ? Math.round((sanch.active / sanch.total) * 100) : 0;
            sanch.inactivePercentage = sanch.total > 0 ? Math.round((sanch.inactive / sanch.total) * 100) : 0;

            // Calculate percentages for each upSanch
            Object.values(sanch.upSanchs).forEach(upSanch => {
              upSanch.activePercentage = upSanch.total > 0 ? Math.round((upSanch.active / upSanch.total) * 100) : 0;
              upSanch.inactivePercentage = upSanch.total > 0 ? Math.round((upSanch.inactive / upSanch.total) * 100) : 0;
            });
          });
        });
      });

      // Convert the nested objects to arrays for easier consumption by clients
      const hierarchicalResult = Object.values(hierarchicalStructure).map(anchal => {
        return {
          ...anchal,
          sankuls: Object.values(anchal.sankuls).map(sankul => {
            return {
              ...sankul,
              sanchs: Object.values(sankul.sanchs).map(sanch => {
                return {
                  ...sanch,
                  upSanchs: Object.values(sanch.upSanchs)
                };
              })
            };
          })
        };
      });

      // Return data in hierarchical format
      return res.status(200).json({
        result: true,
        message: 'svp_list',
        responseMessage: 'SVP list generated successfully',
        responseData: {
          summary: summaryStats,
          hierarchicalView: hierarchicalResult,
          flatList: formattedSvpList  // Include the flat list as well for easy access
        }
      });
    } catch (error) {
      console.error("Error generating SVP list:", error);
      return next(new ErrorHandler('Error generating SVP list', 500));
    }
  }
);