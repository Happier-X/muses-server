import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class QueueItemsService {
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
                        position: nextPosition,
                        originalPosition: nextPosition
                    }
                })
                nextPosition++
            }
        }
        return { message: '添加成功' }
    }

    async addAllSongsToQueue(user: any) {
        const { id: userId } = user

        // 获取所有歌曲
        const allSongs = await this.prisma.song.findMany({
            select: { id: true },
            orderBy: { id: 'asc' }
        })

        if (allSongs.length === 0) {
            return { message: '没有可添加的歌曲' }
        }

        // 先清空当前队列
        await this.prisma.queueItem.deleteMany({
            where: { userId }
        })

        // 批量创建队列项
        const queueItems = allSongs.map((song, index) => ({
            userId,
            songId: song.id,
            position: index,
            originalPosition: index
        }))

        await this.prisma.queueItem.createMany({
            data: queueItems
        })

        return {
            code: 200,
            message: '添加成功'
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

    async getNextQueueItem(currentSongId: number, user: any) {
        const currentItem = await this.prisma.queueItem.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: currentSongId
                }
            },
            select: {
                position: true
            }
        })
        if (!currentItem) {
            return null
        }
        const nextSong = await this.prisma.queueItem.findFirst({
            where: {
                userId: user.id,
                position: currentItem.position + 1
            },
            select: {
                songId: true
            }
        })
        if (!nextSong) {
            const firstSong = await this.prisma.queueItem.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    position: 'asc'
                },
                select: {
                    songId: true
                }
            })
            return firstSong?.songId || null
        }
        return nextSong.songId
    }

    async getPreviousQueueItem(currentSongId: number, user: any) {
        const currentItem = await this.prisma.queueItem.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: currentSongId
                }
            },
            select: {
                position: true
            }
        })
        if (!currentItem) {
            return null
        }
        const previousSong = await this.prisma.queueItem.findFirst({
            where: {
                userId: user.id,
                position: currentItem.position - 1
            },
            select: {
                songId: true
            }
        })
        if (!previousSong) {
            const lastSong = await this.prisma.queueItem.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    position: 'desc'
                },
                select: {
                    songId: true
                }
            })
            return lastSong?.songId || null
        }
        return previousSong.songId
    }

    async removeFromQueue(queueItemId: number, user: any) {
        const { id: userId } = user

        const queueItem = await this.prisma.queueItem.findFirst({
            where: {
                id: queueItemId,
                userId
            }
        })

        if (!queueItem) {
            throw new Error('队列项不存在')
        }

        await this.prisma.queueItem.delete({
            where: {
                id: queueItemId
            }
        })

        await this.reorderPositions(userId, queueItem.position)

        return { message: '删除成功' }
    }

    async clearQueue(user: any) {
        const { id: userId } = user

        await this.prisma.queueItem.deleteMany({
            where: { userId }
        })

        return { message: '清空队列成功' }
    }

    async updatePosition(queueItemId: number, newPosition: number, user: any) {
        const { id: userId } = user

        const queueItem = await this.prisma.queueItem.findFirst({
            where: {
                id: queueItemId,
                userId
            }
        })

        if (!queueItem) {
            throw new Error('队列项不存在')
        }

        const oldPosition = queueItem.position

        const maxPosition =
            (await this.prisma.queueItem.count({
                where: { userId }
            })) - 1

        if (newPosition < 0 || newPosition > maxPosition) {
            throw new Error('位置超出范围')
        }

        if (oldPosition === newPosition) {
            return { message: '位置未改变' }
        }

        if (oldPosition < newPosition) {
            await this.prisma.queueItem.updateMany({
                where: {
                    userId,
                    position: {
                        gt: oldPosition,
                        lte: newPosition
                    }
                },
                data: {
                    position: {
                        decrement: 1
                    }
                }
            })
        } else {
            await this.prisma.queueItem.updateMany({
                where: {
                    userId,
                    position: {
                        gte: newPosition,
                        lt: oldPosition
                    }
                },
                data: {
                    position: {
                        increment: 1
                    }
                }
            })
        }

        await this.prisma.queueItem.update({
            where: {
                id: queueItemId
            },
            data: {
                position: newPosition
            }
        })

        return { message: '位置更新成功' }
    }

    async shuffleQueue(user: any) {
        const { id: userId } = user

        const queueItems = await this.prisma.queueItem.findMany({
            where: { userId },
            select: { id: true },
            orderBy: { position: 'asc' }
        })

        if (queueItems.length === 0) {
            return { message: '队列为空' }
        }

        // Fisher-Yates 洗牌算法
        const shuffledIds = queueItems.map((item) => item.id)
        for (let i = shuffledIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]]
        }

        // 更新位置
        for (let i = 0; i < shuffledIds.length; i++) {
            await this.prisma.queueItem.update({
                where: { id: shuffledIds[i] },
                data: { position: i }
            })
        }

        return { message: '队列已洗牌' }
    }

    async restoreOriginalOrder(user: any) {
        const { id: userId } = user

        const queueItems = await this.prisma.queueItem.findMany({
            where: { userId },
            select: { id: true, originalPosition: true },
            orderBy: { originalPosition: 'asc' }
        })

        if (queueItems.length === 0) {
            return { message: '队列为空' }
        }

        // 按原始位置恢复顺序
        for (let i = 0; i < queueItems.length; i++) {
            await this.prisma.queueItem.update({
                where: { id: queueItems[i].id },
                data: { position: queueItems[i].originalPosition }
            })
        }

        return { message: '已恢复原始顺序' }
    }

    private async reorderPositions(userId: number, deletedPosition: number) {
        await this.prisma.queueItem.updateMany({
            where: {
                userId,
                position: {
                    gt: deletedPosition
                }
            },
            data: {
                position: {
                    decrement: 1
                }
            }
        })
    }
}
