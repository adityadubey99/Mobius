// This flag controls an onboarding reminder only, never access or authorization.
export const needsPasswordSetup=user=>!user?.user_metadata?.mobius_password_changed_at;
export function validatePasswordChange(current,password,confirmation){
 if(!current)throw Error('Enter your current password.');
 if(typeof password!=='string'||password.length<8||!password.trim())throw Error('Choose a password with at least 8 characters.');
 if(password!==confirmation)throw Error('The new passwords do not match.');
 if(password===current)throw Error('Choose a different password from your current one.');
}
export function passwordService(client){
 const check=result=>{if(result.error)throw result.error;return result.data;};
 async function user(){
  if(!client)throw Error('Student login is awaiting setup.');
  const {user}=check(await client.auth.getUser());
  if(!user?.id||!user.email)throw Error('Your session has expired. Sign in again to change your password.');
  return user;
 }
 return {
  user,
  async change(current,password,confirmation){
   validatePasswordChange(current,password,confirmation);
   const before=await user();
   // Re-enter the signed-in account's password. A fresh session also meets
   // Supabase's recent-login requirement without an email recovery flow.
   const verified=await client.auth.signInWithPassword({email:before.email,password:current});
   if(verified.error){
    if(verified.error.code==='invalid_credentials')throw Error('Your current password is incorrect.');
    throw verified.error;
   }
   if(verified.data?.user?.id!==before.id)throw Error('Your account changed. Sign in again and retry.');
   const active=await user();
   if(active.id!==before.id)throw Error('Your account changed. Sign in again and retry.');
   const {user:updated}=check(await client.auth.updateUser({
    password,current_password:current,
    data:{mobius_password_changed_at:new Date().toISOString()}
   }));
   if(!updated||updated.id!==before.id)throw Error('Could not confirm the password update. Please sign in again.');
   return updated;
  }
 };
}
