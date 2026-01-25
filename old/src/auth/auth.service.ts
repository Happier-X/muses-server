import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import * as argon2 from 'argon2'
import { RegisterDto } from './dto/register.dto'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService
    ) {}

    async register(registerObj: RegisterDto) {
        const password = await argon2.hash(registerObj.password)
        return await this.usersService.create(registerObj.username, password)
    }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.usersService.findOne(username)
        if (!user) {
            return null
        }
        const isPasswordValid = await argon2.verify(user.password, password)
        if (!isPasswordValid) {
            return null
        } else {
            const { password, ...result } = user
            return result
        }
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id }
        return {
            code: HttpStatus.OK,
            message: '登录成功',
            data: {
                accessToken: this.jwtService.sign(payload),
                refreshToken: this.jwtService.sign(payload, {
                    expiresIn: '30d'
                })
            }
        }
    }

    async refreshToken(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException({
                code: 40102,
                message: '登录过期，请重新登录'
            })
        }
        try {
            const { sub: userId } = this.jwtService.verify(refreshToken)
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId
                }
            })
            if (user) {
                const payload = { username: user.username, sub: user.id }
                return {
                    code: HttpStatus.OK,
                    message: '刷新成功',
                    data: {
                        accessToken: this.jwtService.sign(payload),
                        refreshToken: this.jwtService.sign(payload, {
                            expiresIn: '30d'
                        })
                    }
                }
            }
        } catch (error) {
            throw new UnauthorizedException({
                code: 40102,
                message: '登录过期，请重新登录'
            })
        }
    }
}
