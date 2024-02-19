import {
  Controller,
  Post,
  UseGuards,
  Body,
  Inject,
  Req,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  UsePipes,
  ValidationPipe,
  UnprocessableEntityException,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserDto } from './dto/user.dto';
import { LoginGuard } from '../common/guards/login.guard';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ReqUser } from '../common/decorators/user.decorator';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/user.entity';
import { ErrorDto } from '../common/dto/error.dto';

@Controller('auth')
@ApiTags('Auth')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    errorHttpStatusCode: 422,
    exceptionFactory: (errors) => {
      throw new UnprocessableEntityException(
        Object.values(errors[0].constraints)[0],
      );
    },
    validationError: {
      target: true,
      value: true,
    },
  }),
)
export class AuthController {
  constructor(
    @Inject(UsersService) private readonly userService: UsersService,
  ) {}

  @Get('user')
  @ApiSecurity('cookie-session')
  @UseGuards(AuthenticatedGuard)
  @ApiOperation({ summary: 'Получение пользователя сессии' })
  @ApiOkResponse({
    description: 'Пользователь сессии',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован или сессия не валидна',
  })
  async user(@ReqUser() user: UserEntity): Promise<UserDto> {
    return new UserDto(user);
  }

  @UseGuards(LoginGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Авторизация по логину и паролю в сессии',
  })
  @ApiOkResponse({
    description: 'Пользователь авторизован и добавлен в сессию',
    type: UserDto,
  })
  @ApiForbiddenResponse({
    description: 'Неверные учётные данные',
  })
  async login(
    @ReqUser() user: UserEntity,
    @Body() loginDto: LoginDto, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UserDto> {
    return new UserDto(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiCreatedResponse({
    description: 'Пользователь зарегистрирован',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description:
      'Невозможно создать пользователя - пользователь с таким Email уже существует',
    type: ErrorDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Ошибка валидации',
    type: ErrorDto,
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.userService.createUser(registerUserDto);
    return new UserDto(user);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Удаление сессии' })
  logout(@Req() req) {
    req.logout();
  }
}
