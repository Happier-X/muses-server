import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req): string | null => {
                    if (req.url.includes('/songs/stream')) {
                        const searchParams = new URLSearchParams(
                            req.url.split('?')[1]
                        )
                        const accessToken = searchParams.get('accessToken')
                        return accessToken
                    }
                    return null
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET')!
        })
    }
    validate(payload: any) {
        return {
            id: payload.sub,
            username: payload.username
        }
    }
}
