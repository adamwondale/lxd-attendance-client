import { Resolver, Query, Mutation, Args, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { CohortMembership } from '../cohort/dto/cohort.type';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { GqlAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { User } from './dto/user.type';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: any) {
    return this.usersService.me(user.userId);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  updateProfile(
    @CurrentUser() user: any,
    @Args('name', { nullable: true }) name?: string,
    @Args('username', { nullable: true }) username?: string,
  ) {
    return this.usersService.updateProfile(user.userId, name, username);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  listStudents(@CurrentUser() user: any) {
    return this.usersService.listStudents(user.tenantId);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminCreateStudent(
    @CurrentUser() userCtx: any,
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('phone') phone: string,
    @Args('username') username: string,
    @Args('password') password: string,
    @Args('cohortId', { nullable: true }) cohortId?: string,
    @Args('sessionId', { nullable: true }) sessionId?: string,
  ) {
    const created = await this.usersService.adminCreateStudent(name, email, userCtx.tenantId, phone, username, password, cohortId, sessionId, userCtx.tenantId);
    this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    return created;
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminUpdateStudent(
    @CurrentUser() userCtx: any,
    @Args('id') id: string,
    @Args('name', { nullable: true }) name?: string,
    @Args('email', { nullable: true }) email?: string,
  ) {
    const updated = await this.usersService.adminUpdateStudent(id, name, email, userCtx.tenantId);
    this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    return updated;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminDeleteStudent(@CurrentUser() userCtx: any, @Args('id') id: string) {
    const deleted = await this.usersService.adminDeleteStudent(id, userCtx.tenantId);
    if (deleted) {
      this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    }
    return deleted;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminEnrollStudent(
    @CurrentUser() userCtx: any,
    @Args('userId') userId: string,
    @Args('cohortId') cohortId: string,
    @Args('sessionId') sessionId: string,
  ) {
    await this.usersService.adminEnrollStudent(userId, cohortId, sessionId, userCtx.tenantId);
    this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminUpdateStudentMembership(
    @CurrentUser() userCtx: any,
    @Args('userId') userId: string,
    @Args('cohortId') cohortId: string,
    @Args('sessionId') sessionId: string,
  ) {
    await this.usersService.adminUpdateStudentMembership(userId, cohortId, sessionId, userCtx.tenantId);
    this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async adminRemoveStudentFromCohort(
    @CurrentUser() userCtx: any,
    @Args('userId') userId: string,
    @Args('cohortId') cohortId: string,
  ) {
    await this.usersService.adminRemoveStudentFromCohort(userId, cohortId, userCtx.tenantId);
    this.pubSub.publish('studentsUpdated', { onStudentsUpdated: true });
    return true;
  }

  @Subscription(() => Boolean)
  onStudentsUpdated() {
    return this.pubSub.asyncIterableIterator('studentsUpdated');
  }

  @ResolveField('memberships', () => [CohortMembership], { nullable: true })
  async memberships(@Parent() user: User) {
    return this.usersService.getMemberships(user.id);
  }
}
