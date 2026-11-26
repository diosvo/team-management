'use server';

import { forbidden, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ESTABLISHED_DATE } from '@/utils/constants';
import { isPlaceholderEmail, placeholderEmail } from '@/utils/email';
import type { CoachPosition, PlayerPosition } from '@/utils/enum';
import { hasPermissions } from '@/utils/permissions';
import { ResponseFactory } from '@/utils/response';

import auth from '@/lib/auth';
import { sendPasswordSetup } from '@/lib/password-setup';

import {
  deletePasswordLinks,
  deleteSessions,
  isHistoryRecorded,
  isPasswordSet,
  selectAccounts,
} from '@/db/account';
import { insertCoach } from '@/db/coach';
import { getDbErrorMessage, isUniqueViolation } from '@/db/pg-error';
import { insertPlayer } from '@/db/player';
import { deleteUser, selectUserById, updateUser } from '@/db/user';
import { insertMembership } from '@/db/user-team';
import type { User } from '@/drizzle/schema/user';
import type { UpdateAccountValues } from '@/schemas/account';
import type { AddUserValues } from '@/schemas/user';

import { withResource } from './auth';
import { revalidate } from './cache';

const accounts = withResource('accounts');

/** The target member, or 404 when they don't exist or sit on another team. */
async function findTeamMember({ team_id }: User, user_id: string) {
  const target = await selectUserById(user_id);
  if (!target || target.team_id !== team_id) notFound();
  return target;
}

/** Accounts on the admin's team, with how far each got with signing in. */
export const getAccounts = accounts(['view'], async function list({ team_id }) {
  return await selectAccounts(team_id);
});

/**
 * Creates a member without a password. With an email, they get a link to set
 * one; without, they're kept as "No email" until an admin adds it.
 */
export const createAccount = accounts(
  ['create'],
  async function invite({ team_id }, values: AddUserValues) {
    // TODO: check rate limiting first
    const t = await getTranslations('actions.account');

    try {
      // `join_date` opens the membership stint rather than sitting on the user
      const { join_date, dob, position, email, ...details } = values;
      const realEmail = email?.trim().toLowerCase() || null;
      const { isPlayer, isCoach } = hasPermissions(details.role);

      // Created without a password: nobody can sign in as the invitee until
      // they set one from the email. `resetPassword` adds the credential
      // account on first use.
      const { internalAdapter } = await auth.$context;
      const created = await internalAdapter.createUser(
        {
          ...details,
          email: realEmail ?? placeholderEmail(),
          team_id,
          emailVerified: false,
        },
        // An admin provisions the member, as the admin plugin does
        { method: 'admin' },
      );

      // The auth adapter drops fields it doesn't know, such as `dob`
      if (dob) await updateUser(created.id, { dob });

      await insertMembership(
        created.id,
        team_id,
        join_date ?? ESTABLISHED_DATE,
      );

      if (isPlayer) {
        await insertPlayer({
          id: created.id,
          position: position as PlayerPosition,
        });
      }

      if (isCoach) {
        await insertCoach({
          id: created.id,
          position: position as CoachPosition,
        });
      }

      if (realEmail) await sendPasswordSetup(realEmail);

      revalidate.roster();
      revalidate.accounts();

      return ResponseFactory.success(
        realEmail ? t('invited') : t('addedNoEmail', { name: created.name }),
      );
    } catch (error) {
      if (isUniqueViolation(error, 'user_email_unique')) {
        return ResponseFactory.error(t('emailTaken'));
      }
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }
  },
);

/**
 * Corrects the name or sign-in email. The user id never changes, so every
 * record stays with the member. A new email voids links sent to the old one
 * and, until a password is set, gets a fresh link: that's how a "No email"
 * member is invited.
 */
export const updateAccount = accounts(
  ['edit'],
  async function update(user, user_id: string, values: UpdateAccountValues) {
    // Your own account is read-only here
    if (user.id === user_id) forbidden();
    const t = await getTranslations('actions.account');
    const target = await findTeamMember(user, user_id);

    const wanted = values.email?.trim().toLowerCase() ?? '';
    // Blank keeps a placeholder; a real email can't be taken away
    if (!wanted && !isPlaceholderEmail(target.email)) {
      return ResponseFactory.error(t('emailRequired'));
    }

    const email = wanted || target.email;
    const emailChanged = email !== target.email;

    try {
      await updateUser(user_id, {
        name: values.name,
        email,
        ...(emailChanged && { emailVerified: false }),
      });
      if (emailChanged) await deletePasswordLinks(user_id);

      revalidate.accounts();
      revalidate.roster();
      revalidate.user(user_id);
    } catch (error) {
      if (isUniqueViolation(error, 'user_email_unique')) {
        return ResponseFactory.error(t('emailTaken'));
      }
      const { message } = getDbErrorMessage(error);
      return ResponseFactory.error(message);
    }

    if (!emailChanged || (await isPasswordSet(user_id))) {
      return ResponseFactory.success(t('updated'));
    }

    try {
      await sendPasswordSetup(email);
      return ResponseFactory.success(t('linkSent', { email }));
    } catch {
      return ResponseFactory.error(t('updatedLinkFailed'));
    }
  },
);

/** Emails a fresh "Create a new password" link: a re-invite or a reset. */
export const sendPasswordLink = accounts(
  ['edit'],
  async function sendLink(user, user_id: string) {
    if (user.id === user_id) forbidden();
    const t = await getTranslations('actions.account');
    const target = await findTeamMember(user, user_id);

    if (isPlaceholderEmail(target.email)) {
      return ResponseFactory.error(t('noEmail', { name: target.name }));
    }

    try {
      await sendPasswordSetup(target.email);

      revalidate.accounts();

      return ResponseFactory.success(t('linkSent', { email: target.email }));
    } catch {
      return ResponseFactory.error(t('linkFailed'));
    }
  },
);

/**
 * Ends every session of another member. Takes effect on their next request,
 * since `verifySession` reads the session table (no cookie cache).
 */
export const removeSessions = accounts(
  ['edit'],
  async function signOut(user, user_id: string) {
    // Use the avatar menu to sign yourself out
    if (user.id === user_id) forbidden();
    const target = await findTeamMember(user, user_id);

    const t = await getTranslations('actions.account');

    try {
      await deleteSessions(user_id);

      revalidate.accounts();

      return ResponseFactory.success(t('signedOut', { name: target.name }));
    } catch {
      return ResponseFactory.error(t('signOutFailed'));
    }
  },
);

/**
 * Deletes a member added by mistake. Anyone with recorded history is kept:
 * deleting would cascade it away, so they're set Inactive instead.
 */
export const removeAccount = accounts(
  ['delete'],
  async function remove(user, user_id: string) {
    // An admin can't lock themselves out
    if (user.id === user_id) forbidden();
    const target = await findTeamMember(user, user_id);

    const t = await getTranslations('actions.account');

    if (await isHistoryRecorded(user_id)) {
      return ResponseFactory.error(t('hasHistory', { name: target.name }));
    }

    try {
      await deleteUser(user_id);

      revalidate.accounts();
      revalidate.roster();

      return ResponseFactory.success(t('deleted'));
    } catch {
      return ResponseFactory.error(t('deleteFailed'));
    }
  },
);
