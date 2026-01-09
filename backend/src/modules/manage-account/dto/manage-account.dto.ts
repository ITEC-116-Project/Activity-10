export type AccountRole = 'admin' | 'organizer' | 'attendees';

export class CreateManageAccountDto {
  email: string;
  username?: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: AccountRole;
  phone?: string;
  companyName?: string;
  university?: string;
}

export class UpdateManageAccountDto {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  university?: string;
  isActive?: boolean;
}
