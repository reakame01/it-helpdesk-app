import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export type AuthedUser = {
  userId: string;
  email: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthedUser }>();
    return request.user as AuthedUser;
  },
);
