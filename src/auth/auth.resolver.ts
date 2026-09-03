import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.dto';
import { RegisterAdminArgs } from './dto/register-admin.args';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => String)
  async registerAdmin(
    @Args() args: RegisterAdminArgs
  ) {
    const user = await this.authService.registerAdmin(
      args.email, 
      args.password, 
      args.name, 
      args.tenantName, 
      args.companyPhone, 
      args.username, 
      args.companyEmail
    );
    return user.id;
  }

  @Query(() => Boolean)
  async hasCompanyProfile() {
    return this.authService.hasCompanyProfile();
  }

  @Mutation(() => AuthResponse)
  async loginAdmin(@Args('email') email: string, @Args('password') passwordRaw: string) {
    return this.authService.loginAdmin(email, passwordRaw);
  }

  @Mutation(() => AuthResponse)
  async loginWithGoogle(@Args('idToken') idToken: string) {
    return this.authService.loginWithGoogle(idToken);
  }

  @Mutation(() => String)
  async registerStudent(
    @Args('email') email: string,
    @Args('password') passwordRaw: string,
    @Args('name') name: string,
    @Args('phone') phone: string,
    @Args('username') username: string,
    @Args('cohortId', { nullable: true }) cohortId?: string,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @Args('cohortPin', { nullable: true }) cohortPin?: string,
  ) {
    const user = await this.authService.registerStudent(
      email,
      passwordRaw,
      name,
      phone,
      username,
      cohortId,
      sessionId,
      cohortPin,
    );
    return user.id;
  }

  @Mutation(() => AuthResponse)
  async loginStudent(@Args('identifier') identifier: string, @Args('password') passwordRaw: string) {
    return this.authService.loginStudent(identifier, passwordRaw);
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Args('email') email: string, 
    @Args('role') role: string
  ) {
    return this.authService.forgotPassword(email, role as 'ADMIN' | 'STUDENT');
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('token') token: string, 
    @Args('password') passwordRaw: string
  ) {
    return this.authService.resetPassword(token, passwordRaw);
  }
}
