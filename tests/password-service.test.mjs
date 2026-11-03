import {test} from 'node:test';
import assert from 'node:assert/strict';
import {passwordService,validatePasswordChange,needsPasswordSetup} from '../src/password-service.js';
const current='Starter-example-1',next='My-example-password-2';
function fixture({signedOut=false,wrong=false,switched=false,updateError=false}={}){
 const calls=[];let account={id:'own-user',email:'student@example.test',user_metadata:{display_name:'Test Student'}};
 const client={auth:{
  async getUser(){calls.push('getUser');return {data:{user:signedOut?null:account}};},
  async signInWithPassword(credentials){calls.push(['verify',credentials]);if(wrong)return{error:{code:'invalid_credentials',message:'Invalid login credentials'}};return{data:{user:{...account,id:switched?'other-user':account.id}}};},
  async updateUser(attributes){calls.push(['update',attributes]);if(updateError)return{error:Error('Password rejected by server policy')};account={...account,user_metadata:{...account.user_metadata,...attributes.data}};return{data:{user:account}};}
 }};return{client,calls};
}
test('validation rejects empty, short, blank, mismatched and reused passwords',()=>{
 for(const args of [['',next,next],[current,'short','short'],[current,'        ','        '],[current,next,'different'],[current,current,current]])assert.throws(()=>validatePasswordChange(...args));
 assert.doesNotThrow(()=>validatePasswordChange(current,next,next));
});
test('invalid form values never call Auth',async()=>{
 const {client,calls}=fixture();await assert.rejects(passwordService(client).change(current,next,'mismatch'));assert.equal(calls.length,0);
});
test('signed-out users and missing configuration cannot change a password',async()=>{
 await assert.rejects(passwordService(null).user(),/setup/);
 const {client,calls}=fixture({signedOut:true});await assert.rejects(passwordService(client).change(current,next,next),/Sign in again/);assert.deepEqual(calls,['getUser']);
});
test('incorrect current password never triggers an update',async()=>{
 const {client,calls}=fixture({wrong:true});await assert.rejects(passwordService(client).change(current,next,next),/current password is incorrect/);assert.equal(calls.some(c=>Array.isArray(c)&&c[0]==='update'),false);
});
test('reauthentication uses the server-verified account email, then updates only the same account',async()=>{
 const {client,calls}=fixture();const updated=await passwordService(client).change(current,next,next);
 assert.deepEqual(calls.slice(0,3),['getUser',['verify',{email:'student@example.test',password:current}],'getUser']);
 const attributes=calls[3][1];assert.equal(attributes.password,next);assert.equal(attributes.current_password,current);assert.equal('email' in attributes,false);assert.ok(!Number.isNaN(Date.parse(attributes.data.mobius_password_changed_at)));assert.equal(updated.user_metadata.display_name,'Test Student');
});
test('an account identity mismatch stops the change',async()=>{
 const {client,calls}=fixture({switched:true});await assert.rejects(passwordService(client).change(current,next,next),/account changed/);assert.equal(calls.some(c=>Array.isArray(c)&&c[0]==='update'),false);
});
test('server errors are surfaced and never return success',async()=>{
 const {client}=fixture({updateError:true});await assert.rejects(passwordService(client).change(current,next,next),/server policy/);
});
test('onboarding reminder uses only a cosmetic marker and does not require a shared password in code',()=>{
 assert.equal(needsPasswordSetup({user_metadata:{}}),true);assert.equal(needsPasswordSetup({user_metadata:{mobius_password_changed_at:'2026-11-03T00:00:00Z'}}),false);
});
