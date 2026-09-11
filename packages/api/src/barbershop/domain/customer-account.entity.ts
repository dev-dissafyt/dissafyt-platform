import { Profile } from '@dissafyt/database';

export class CustomerAccountEntity {
  constructor(
    public readonly id: string,
    public email: string,
    public fullName: string | null,
    public phone: string | null,
    public activeSubscriptionPlan: string | null = null,
    public availableQuotaCuts: number = 0
  ) {}

  static fromDTO(
    profile: Profile,
    activeSubscriptionPlan?: string | null,
    availableQuotaCuts: number = 0
  ): CustomerAccountEntity {
    return new CustomerAccountEntity(
      profile.id,
      profile.email || '',
      profile.full_name || null,
      profile.phone || null,
      activeSubscriptionPlan || null,
      availableQuotaCuts
    );
  }

  hasActiveSubscription(): boolean {
    return Boolean(this.activeSubscriptionPlan && this.availableQuotaCuts > 0);
  }

  canRedeemCut(): boolean {
    return this.availableQuotaCuts > 0;
  }

  getDisplayName(): string {
    return this.fullName || this.email.split('@')[0];
  }
}
