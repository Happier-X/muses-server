import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { AuthService } from './auth.service'
import { Public } from './decorator/auth.decorator'
import { RegisterDto } from './dto/register.dto'
import { LocalAuthGuard } from './guard/local-auth.guard'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Req() req: FastifyRequest) {
        return this.authService.login(req.user)
    }

    @Public()
    @Post('register')
    register(@Body() registerObj: RegisterDto) {
        return this.authService.register(registerObj)
    }

    @Public()
    @Get('refresh-token')
    refreshToken(@Req() req: FastifyRequest) {
        return this.authService.refreshToken(
            req.headers['refresh-token'] as string
        )
    }
}
