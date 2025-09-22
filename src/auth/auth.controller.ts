import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Res,
    Req,
    UseGuards
} from '@nestjs/common'
import { Request, Response } from 'express'
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
    async login(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const { accessToken, refreshToken } = await this.authService.login(
            req.user
        )
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000
        })
        return {
            code: HttpStatus.OK,
            message: '登录成功',
            data: {
                accessToken,
                refreshToken
            }
        }
    }

    @Public()
    @Post('register')
    register(@Body() registerObj: RegisterDto) {
        return this.authService.register(registerObj)
    }

    @Public()
    @Get('refresh-token')
    refreshToken(@Req() req: Request) {
        return this.authService.refreshToken(
            req.headers['refresh-token'] as string
        )
    }
}
