import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Enter the business name.' }) @MaxLength(120) businessName?: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.phone !== null && o.phone !== '')
  @Matches(/^[+()\d\s.-]{7,25}$/, { message: 'Enter a valid phone number (7–15 digits).' })
  phone?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Enter an email like name@example.com.' })
  email?: string | null;

  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine1 !== null) @IsString() @MaxLength(160) addressLine1?: string | null;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine2 !== null) @IsString() @MaxLength(160) addressLine2?: string | null;
  @IsOptional() @IsBoolean() showAddress?: boolean;
  @IsOptional() @IsString() @MaxLength(200) tagline?: string;
  @IsOptional() @IsString() @MaxLength(600, { message: 'Use 600 characters or fewer.' }) credentials?: string;
  @IsOptional() @IsString() @MaxLength(300, { message: 'Use 300 characters or fewer.' }) hours?: string;
  @IsOptional() @IsString() @MaxLength(300, { message: 'Use 300 characters or fewer.' }) emergencyInfo?: string;
  @IsOptional() @IsString() @MaxLength(400, { message: 'Use 400 characters or fewer.' }) followUpNote?: string;
  @IsOptional() @IsString() @MaxLength(2000, { message: 'Use 2,000 characters or fewer.' }) about?: string;
  @IsOptional() @IsString() @MaxLength(4000, { message: 'Use 4,000 characters or fewer.' }) privacyNotice?: string;
  @IsOptional() @IsString() @MaxLength(600) reviewNote?: string;
  @IsOptional() @IsBoolean() showContentFlags?: boolean;
  @IsOptional() @IsBoolean() mobileCallBar?: boolean;
  @IsOptional() @IsBoolean() requestsOpen?: boolean;
}
