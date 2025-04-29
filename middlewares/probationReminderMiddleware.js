import cron from 'cron';
import { User, UserTemporary } from '../models/userRoles/userSchema.js';
import { sendEmail } from '../middlewares/nodemailerEmail.js';

// Schedule a cron job to run daily to check for probation periods ending in 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    // Get current date
    const now = new Date();

    // Calculate date 24 hours from now
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set time boundaries for the day after (start and end of day)
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Find all temporary users whose probation ends tomorrow
    const temporaryUsers = await UserTemporary.find({
      role: 'anchalPramukh',
      probationStatus: 'temporary',
      probationPeriod: {
        $gte: startOfTomorrow,
        $lte: endOfTomorrow,
      },
    }).populate('permanentUserRefId');

    // Get all superAdmins to notify
    const superAdmins = await User.find({ role: 'superAdmin' });

    if (temporaryUsers.length > 0 && superAdmins.length > 0) {
      // For each user whose probation ends tomorrow, notify all superAdmins
      for (const tempUser of temporaryUsers) {
        for (const admin of superAdmins) {
          const emailOptions = {
            to: admin.svpEmail,
            subject: 'Action Required: Anchal Pramukh Probation Period Ending',
            text: `
              Dear Super Admin,

              This is to inform you that the probation period for ${
                tempUser.userName
              } (${tempUser.svpEmail}) as Anchal Pramukh will end tomorrow.

              Probation Details:
              - User: ${tempUser.userName}
              - Email: ${tempUser.svpEmail}
              - Anchal Area: ${tempUser.anchalAreaFromUser}
              - Probation End Date: ${tempUser.probationPeriod.toDateString()}
              - Permanent User Reference: ${
                tempUser.permanentUserRefId
                  ? tempUser.permanentUserRefId.userName
                  : 'Not Available'
              }

              Please review their performance and take appropriate action. You can promote them to permanent status by using the admin panel or API endpoint.

              Best regards,
              SVP System
            `,
          };

          await sendEmail(emailOptions);
          console.log(
            `Notification sent to ${admin.svpEmail} for probation end of ${tempUser.svpEmail}`
          );
        }
      }
    }
  } catch (error) {
    console.error('Error in probation notification cron job:', error);
  }
});
