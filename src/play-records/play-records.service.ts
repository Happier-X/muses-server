import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class PlayRecordsService {
    constructor(private readonly prisma: PrismaService) {}

    async addPlayRecord(songId: number, user: any) {
        await this.prisma.playRecord.upsert({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId
                }
            },
            update: {
                playCount: {
                    increment: 1
                }
            },
            create: {
                userId: user.id,
                songId
            }
        })
        return {
            message: '添加成功'
        }
    }
}
