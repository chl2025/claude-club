const { pool } = require('./src/database/connection');
const Membership = require('./src/models/Membership');

async function createMembershipForMember() {
  try {
    console.log('Creating membership for member account...');

    // Member user ID
    const memberUserId = '5896f4b7-7af9-45ea-bdeb-47c565c7909d';

    // Get membership types to find the Basic membership ID
    const membershipTypesResult = await pool.query('SELECT * FROM membership_types WHERE name = $1', ['Basic']);

    if (membershipTypesResult.rows.length === 0) {
      console.error('Basic membership type not found');
      return;
    }

    const basicMembership = membershipTypesResult.rows[0];
    console.log('Found Basic membership type:', basicMembership);

    // Create membership for the member
    const startDate = new Date().toISOString().split('T')[0]; // Today
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

    const membershipData = {
      userId: memberUserId,
      membershipTypeId: basicMembership.id,
      startDate: startDate,
      endDate: endDate.toISOString().split('T')[0],
      paymentMethod: 'credit_card',
      notes: 'Auto-created for testing'
    };

    const membership = await Membership.create(membershipData);
    console.log('Membership created successfully:', membership);

    // Verify the membership was created
    const activeMembership = await Membership.getActiveMembership(memberUserId);
    console.log('Active membership verification:', activeMembership);

  } catch (error) {
    console.error('Error creating membership:', error);
  } finally {
    await pool.end();
  }
}

createMembershipForMember();