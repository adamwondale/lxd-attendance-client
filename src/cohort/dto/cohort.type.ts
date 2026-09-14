import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CohortSession {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  startTime: string;

  @Field(() => Int)
  gracePeriodMinutes: number;

  @Field(() => [String])
  recurrenceDays: string[];

  @Field(() => Int)
  latePenaltyAmount: number;

  @Field(() => Int)
  escalationThresholdMinutes: number;

  @Field(() => Int)
  escalationRate: number;

  @Field(() => Int)
  escalationIntervalMinutes: number;
}

@ObjectType()
export class CohortMembership {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  cohortId: string;

  @Field(() => ID)
  sessionId: string;

  @Field()
  status: string;

  @Field(() => CohortSession, { nullable: true })
  session?: CohortSession;

  @Field(() => Cohort)
  cohort?: any;

  @Field(() => require('../../users/dto/user.type').User, { nullable: true })
  user?: any;
}

@ObjectType()
export class Cohort {
  @Field(() => ID)
  id: string;

  @Field()
  tenantId: string;

  @Field()
  name: string;

  @Field()
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field()
  isActive: boolean;

  @Field(() => [CohortSession], { nullable: true })
  sessions?: CohortSession[];

  @Field(() => CohortSession, { nullable: true })
  joinedSession?: CohortSession;
}
