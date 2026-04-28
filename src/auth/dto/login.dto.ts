import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (
    object: { email?: string; phoneNumber?: string },
    propertyName: string,
  ) {
    registerDecorator({
      name: 'isEmailOrPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as { email?: string; phoneNumber?: string };
          return !!obj.email || !!obj.phoneNumber;
        },
        defaultMessage() {
          return 'Either email or phoneNumber must be provided';
        },
      },
    });
  };
}
export class LoginDto {
  @IsEmailOrPhone({ message: 'Either email or phoneNumber is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @IsPhoneNumber('IN')
  @IsOptional()
  phoneNumber?: string;

  @IsEmailOrPhone({ message: 'Either email or phoneNumber is required' })
  contactCheck?: string;

  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be strong (include uppercase, lowercase, number, and symbol)',
    },
  )
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
