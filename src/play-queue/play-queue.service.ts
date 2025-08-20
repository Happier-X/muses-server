import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class PlayQueueService {
    constructor(private readonly prisma: PrismaService) {}

    async addToPlayQueue(songIdList: string[], user: any) {
        const { id: userId } = user
        const maxPositionItem = await this.prisma.queueItem.findFirst({
            where: { userId },
            orderBy: { position: 'desc' }
        })
        let nextPosition = maxPositionItem ? maxPositionItem.position + 1 : 0
        for (let item of songIdList) {
            const existingItem = await this.prisma.queueItem.findUnique({
                where: {
                    userId_songId: {
                        userId,
                        songId: parseInt(item)
                    }
                }
            })
            if (!existingItem) {
                await this.prisma.queueItem.create({
                    data: {
                        userId,
                        songId: parseInt(item),
                        position: nextPosition++
                    }
                })
            }
        }
    }

    async getPlayQueue(user: any) {
        const { id: userId } = user
        return this.prisma.queueItem.findMany({
            where: { userId },
            orderBy: { position: 'asc' },
            include: {
                song: {
                    select: {
                        title: true,
                        artist: true,
                        album: true,
                        cover: true,
                        duration: true
                    }
                }
            }
        })
    }
}
