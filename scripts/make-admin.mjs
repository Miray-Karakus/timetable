// Usage: node make-admin.mjs <email> [password]
// Grants the admin role to an existing Firebase Auth user.
// If the user doesn't exist and a password is given, the user is created first.
import { auth, db } from './admin.mjs';

const [email, password] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node make-admin.mjs <email> [password]');
  process.exit(2);
}

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error?.code !== 'auth/user-not-found' || !password) {
    console.error(error?.code === 'auth/user-not-found' ? `No user with email ${email}. Pass a password to create one.` : error);
    process.exit(1);
  }
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`Created user ${email}`);
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'admin' });
await db.collection('admins').doc(user.uid).set({ email, grantedAt: new Date().toISOString() });
console.log(`${email} (uid ${user.uid}) is now an admin. Sign out and back in to pick up the role.`);
process.exit(0);
