const { pool } = require('./src/database/connection');

async function activateMembership() {
  try {
    console.log('Activating membership for member account...');

    // Member user ID
    const memberUserId = '5896f4b7-7af9-45ea-bdeb-47c565c7909d';

    // Update the membership status to 'active'
    const updateQuery = `
      UPDATE memberships
      SET status = 'active', updated_at = NOW()
      WHERE user_id = $1 AND status = 'pending'
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [memberUserId]);
    console.log('Membership activation result:', result.rows[0]);

    // Verify the active membership
    const Membership = require('./src/models/Membership');
    const activeMembership = await Membership.getActiveMembership(memberUserId);
    console.log('Active membership verification:', activeMembership);

  } catch (error) {
    console.error('Error activating membership:', error);
  } finally {
    await pool.end();
  }
}

activateMembership();