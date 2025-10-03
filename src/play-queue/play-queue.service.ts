import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class PlayQueueService {
    constructor(private readonly prisma: PrismaService) {}

    private shuffle(arr) {
        const shuffledArr = [...arr]
        for (let i = shuffledArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]]
        }
        return shuffledArr
    }

    async addToPlayQueue(songIds: string, user: any) {
        const maxPositionItem = await this.prisma.playQueue.findFirst({
            where: { userId: user.id },
            orderBy: { originalPosition: 'desc' }
        })
        let nextPosition = maxPositionItem
            ? maxPositionItem.originalPosition + 1
            : 0
        const songIdList = songIds.split(',')
        const data = songIdList.map((songId, index) => ({
            userId: user.id,
            songId: Number(songId),
            originalPosition: nextPosition + index,
            shufflePosition: nextPosition + index
        }))
        for (const item of data) {
            await this.prisma.playQueue.upsert({
                where: {
                    userId_songId: {
                        userId: item.userId,
                        songId: item.songId
                    }
                },
                update: {},
                create: item
            })
        }
        return {
            code: 200,
            message: '添加成功'
        }
    }

    async addAllSongsToQueue(user: any) {
        await this.prisma.playQueue.deleteMany({
            where: { userId: user.id }
        })
        const allSongs = await this.prisma.song.findMany({
            select: { id: true },
            orderBy: { id: 'asc' }
        })
        const shuffledAllSongs = this.shuffle(allSongs)
        await this.prisma.playQueue.createMany({
            data: shuffledAllSongs.map((song, index) => ({
                userId: user.id,
                songId: song.id,
                shufflePosition: index,
                originalPosition: allSongs.findIndex(
                    (item) => item.id === song.id
                )
            }))
        })
        return {
            code: 200,
            message: '添加成功'
        }
    }

    async getPlayQueue(user: any) {
        const { id: userId } = user
        const playQueue = await this.prisma.playQueue.findMany({
            where: { userId },
            orderBy: { shufflePosition: 'asc' },
            select: {
                id: true,
                song: {
                    select: {
                        id: true,
                        title: true,
                        artist: true,
                        album: true
                    }
                }
            }
        })
        return {
            code: 200,
            message: '获取播放队列成功',
            data: {
                items: playQueue
            }
        }
    }

    async getNextQueueItem(currentSongId: number, playMode: string, user: any) {
        const currentItem = await this.prisma.playQueue.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: currentSongId
                }
            },
            select: {
                shufflePosition: true,
                originalPosition: true
            }
        })
        if (!currentItem) {
            return null
        }

        // 根据播放模式选择使用的位置字段
        const positionField =
            playMode === 'orderPlay' ? 'originalPosition' : 'shufflePosition'
        const currentPosition =
            playMode === 'orderPlay'
                ? currentItem.originalPosition
                : currentItem.shufflePosition

        const nextSong = await this.prisma.playQueue.findFirst({
            where: {
                userId: user.id,
                [positionField]: currentPosition + 1
            },
            select: {
                songId: true
            }
        })

        if (!nextSong) {
            // 循环到第一首
            const firstSong = await this.prisma.playQueue.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    [positionField]: 'asc'
                },
                select: {
                    songId: true
                }
            })
            return firstSong?.songId || null
        }
        return nextSong.songId
    }

    async getPreviousQueueItem(
        currentSongId: number,
        playMode: string,
        user: any
    ) {
        const currentItem = await this.prisma.playQueue.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: currentSongId
                }
            },
            select: {
                shufflePosition: true,
                originalPosition: true
            }
        })
        if (!currentItem) {
            return null
        }

        // 根据播放模式选择使用的位置字段
        const positionField =
            playMode === 'orderPlay' ? 'originalPosition' : 'shufflePosition'
        const currentPosition =
            playMode === 'orderPlay'
                ? currentItem.originalPosition
                : currentItem.shufflePosition

        const previousSong = await this.prisma.playQueue.findFirst({
            where: {
                userId: user.id,
                [positionField]: currentPosition - 1
            },
            select: {
                songId: true
            }
        })

        if (!previousSong) {
            // 循环到最后一首
            const lastSong = await this.prisma.playQueue.findFirst({
                where: {
                    userId: user.id
                },
                orderBy: {
                    [positionField]: 'desc'
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

        const queueItem = await this.prisma.playQueue.findFirst({
            where: {
                id: queueItemId,
                userId
            }
        })

        if (!queueItem) {
            throw new Error('队列项不存在')
        }

        await this.prisma.playQueue.delete({
            where: {
                id: queueItemId
            }
        })

        await this.reorderPositions(userId, queueItem.shufflePosition)

        return { message: '删除成功' }
    }

    async clearQueue(user: any) {
        const { id: userId } = user

        await this.prisma.playQueue.deleteMany({
            where: { userId }
        })

        return { message: '清空队列成功' }
    }

    async updatePosition(queueItemId: number, newPosition: number, user: any) {
        const { id: userId } = user

        const queueItem = await this.prisma.playQueue.findFirst({
            where: {
                id: queueItemId,
                userId
            }
        })

        if (!queueItem) {
            throw new Error('队列项不存在')
        }

        const oldPosition = queueItem.shufflePosition

        const maxPosition =
            (await this.prisma.playQueue.count({
                where: { userId }
            })) - 1

        if (newPosition < 0 || newPosition > maxPosition) {
            throw new Error('位置超出范围')
        }

        if (oldPosition === newPosition) {
            return { message: '位置未改变' }
        }

        if (oldPosition < newPosition) {
            await this.prisma.playQueue.updateMany({
                where: {
                    userId,
                    shufflePosition: {
                        gt: oldPosition,
                        lte: newPosition
                    }
                },
                data: {
                    shufflePosition: {
                        decrement: 1
                    }
                }
            })
        } else {
            await this.prisma.playQueue.updateMany({
                where: {
                    userId,
                    shufflePosition: {
                        gte: newPosition,
                        lt: oldPosition
                    }
                },
                data: {
                    shufflePosition: {
                        increment: 1
                    }
                }
            })
        }

        await this.prisma.playQueue.update({
            where: {
                id: queueItemId
            },
            data: {
                shufflePosition: newPosition
            }
        })

        return { message: '位置更新成功' }
    }

    async shuffleQueue(user: any) {
        const { id: userId } = user

        const queueItems = await this.prisma.playQueue.findMany({
            where: { userId },
            select: { id: true },
            orderBy: { shufflePosition: 'asc' }
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
            await this.prisma.playQueue.update({
                where: { id: shuffledIds[i] },
                data: { shufflePosition: i }
            })
        }

        return { message: '队列已洗牌' }
    }

    private async reorderPositions(userId: number, deletedPosition: number) {
        await this.prisma.playQueue.updateMany({
            where: {
                userId,
                shufflePosition: {
                    gt: deletedPosition
                }
            },
            data: {
                shufflePosition: {
                    decrement: 1
                }
            }
        })
    }
}
