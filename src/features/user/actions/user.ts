'use server';

import { Response, ResponseFactory } from '@/utils/response';

import { getUsers } from '../db/user';
import { AddUserValues } from '../schemas/user';

export async function getRoster() {
  return await getUsers();
}

export async function addUsers(users: Array<AddUserValues>): Promise<Response> {
  // Schema validation is done in the client

  try {
    // console.log('Add Users', users);

    // const { email, token } = await generateVerificationToken(data);
    // Send email to require users create their password
    // await sendVerificationEmail(email, token);

    // Only insert user if email was sent successfully
    // await insertUsers(users); WIP

    return ResponseFactory.success("We've sent an email to with instructions");
  } catch {
    return ResponseFactory.error(
      'An error occurred while creating your account.'
    );
  }
}
