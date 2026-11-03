import {supabase} from './supabase.js';
import {escapeHtml as esc} from './enrollment.js';
import {passwordService} from './password-service.js';
export async function mountPasswordSettings(root,{client=supabase,onChanged=()=>{},onContinue=()=>{}}={}){
 const service=passwordService(client);let busy=false;
 root.innerHTML='<p role="status">Loading account security…</p>';
 let account;
 try{account=await service.user();if(!root.isConnected)return;}
 catch(error){if(!root.isConnected)return;root.innerHTML=`<section class="panel score-form"><h2>Change password</h2><p role="alert">${esc(error.message)}</p></section>`;return;}
 const eye='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 const field=(id,label,autocomplete)=>`<div class="field"><label for="${id}">${label}</label><div class="password-control"><input class="form-select" type="password" id="${id}" autocomplete="${autocomplete}" required ${id==='currentPassword'?'placeholder="••••••••" aria-describedby="currentPasswordHint"':'minlength="8" aria-describedby="passwordHint"'}><button class="password-visibility" type="button" aria-label="Show ${label.toLowerCase()}" aria-controls="${id}" aria-pressed="false">${eye}</button></div></div>`;
 root.innerHTML=`<section class="panel score-form password-settings"><span class="eyebrow">ACCOUNT SECURITY</span><h2>Password</h2><p>Choose a password only you know.</p><p class="password-account">Signed in as <strong>${esc(account.email)}</strong></p><form id="passwordChangeForm"><div class="password-current-row">${field('currentPassword','Current password','current-password')}<button class="secondary-btn" type="button" id="passwordEdit" aria-expanded="false" aria-controls="newPasswordFields">Change password</button></div><p class="field-hint" id="currentPasswordHint">Enter your current password. The eye reveals only what you type.</p><fieldset id="newPasswordFields" hidden disabled>${field('newPassword','New password','new-password')}${field('confirmPassword','Confirm new password','new-password')}<p class="field-hint" id="passwordHint">Use at least 8 characters. A longer, unique password is better.</p><button class="primary-btn" type="submit" id="changePassword">Save new password</button></fieldset><p id="passwordChangeError" class="form-error" role="alert"></p><p id="passwordChangeStatus" role="status"></p></form><div id="passwordChanged" hidden tabindex="-1"><h3>Password changed successfully.</h3><p>You can continue using Möbius. Use your new password the next time you sign in.</p><button class="primary-btn" type="button" id="passwordContinue">Back to profile details →</button></div></section>`;
 const form=root.querySelector('form'),status=root.querySelector('#passwordChangeStatus'),error=root.querySelector('#passwordChangeError');
 root.querySelector('#passwordEdit').onclick=()=>{const fields=root.querySelector('#newPasswordFields');fields.hidden=false;fields.disabled=false;root.querySelector('#passwordEdit').hidden=true;root.querySelector('#passwordEdit').setAttribute('aria-expanded','true');root.querySelector('#newPassword').focus();};
 root.querySelectorAll('.password-visibility').forEach(button=>button.onclick=()=>{
  const input=root.querySelector(`#${button.getAttribute('aria-controls')}`),show=input.type==='password';
  input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',`${show?'Hide':'Show'} ${root.querySelector(`label[for="${input.id}"]`).textContent.toLowerCase()}`);
 });
 form.addEventListener('input',()=>{error.textContent='';});
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;if(root.querySelector('#newPasswordFields').hidden){root.querySelector('#passwordEdit').click();return;}busy=true;
  form.querySelectorAll('input,button').forEach(el=>el.disabled=true);error.textContent='';status.textContent='Updating your password…';
  try{
   const updated=await service.change(root.querySelector('#currentPassword').value,root.querySelector('#newPassword').value,root.querySelector('#confirmPassword').value);
   // Clear secrets from the DOM as soon as Supabase confirms the change.
   form.reset();form.hidden=true;status.textContent='';
   const success=root.querySelector('#passwordChanged');success.hidden=false;success.focus();onChanged(updated);
  }catch(cause){
   error.textContent=cause.message||'Your password could not be changed. Please retry.';status.textContent='';
   // Do not retain typed passwords after any failed attempt.
   form.reset();root.querySelectorAll('.password-control input').forEach(input=>input.type='password');
   root.querySelectorAll('.password-visibility').forEach(button=>{button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',`Show ${root.querySelector(`label[for="${button.getAttribute('aria-controls')}"]`).textContent.toLowerCase()}`);});
  }finally{busy=false;form.querySelectorAll('input,button').forEach(el=>el.disabled=false);}
 };
 root.querySelector('#passwordContinue').onclick=onContinue;
}
