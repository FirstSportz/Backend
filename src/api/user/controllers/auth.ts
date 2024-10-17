import { Context } from 'koa';
import { sanitize } from '@strapi/utils';
import crypto from 'crypto';

interface User {
  id: number;
  email: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;
}

export default {
  async sendResetPasswordEmail(ctx: Context) {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Missing email');
    }

    // Find user by email
    const user: User | null = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email },
    });

    if (!user) {
      return ctx.badRequest('Email not found');
    }

    // Generate a 5-digit token
    const resetToken: string = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit number

    // Set token expiration date (1 hour from now)
    const tokenExpiration: Date = new Date(Date.now() + 3600000); // 1 hour expiration

    // Update user with the reset token and expiration
    await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpires: tokenExpiration,
      },
    });

    // Send the email
    await strapi.plugin('email').service('email').send({
      to: user.email,
      subject: 'Password Reset',
      text: `Use this code to reset your password: ${resetToken}`,
      html: `<p>Use this code to reset your password: <strong>${resetToken}</strong></p>`,
    });

    return ctx.send({ message: 'Password reset email sent' });
  },
};
