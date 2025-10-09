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
        const playQueue = await this.prisma.playQueue.findMany({
            where: { userId: user.id },
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
        const items = playQueue.map((item) => ({
            id: String(item.id),
            song: {
                id: String(item.song.id),
                title: item.song.title,
                artist: item.song.artist,
                album: item.song.album
            }
        }))
        return {
            code: 200,
            message: '获取播放队列成功',
            data: {
                items
            }
        }
    }

    async getNextQueueItem(currentSongId: string, playMode: string, user: any) {
        const currentItem = await this.prisma.playQueue.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: Number(currentSongId)
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
        const positionField =
            playMode === 'orderPlay' ? 'originalPosition' : 'shufflePosition'
        const currentPosition = currentItem[positionField]
        let nextSong = await this.prisma.playQueue.findFirst({
            where: {
                userId: user.id,
                [positionField]: {
                    gt: currentPosition
                }
            },
            orderBy: {
                [positionField]: 'asc'
            },
            select: {
                songId: true
            }
        })
        if (!nextSong) {
            nextSong = await this.prisma.playQueue.findFirst({
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
        }
        return {
            code: 200,
            message: '获取下一首成功',
            data: {
                songId: String(nextSong?.songId)
            }
        }
    }

    async getPreviousQueueItem(
        currentSongId: string,
        playMode: string,
        user: any
    ) {
        const currentItem = await this.prisma.playQueue.findUnique({
            where: {
                userId_songId: {
                    userId: user.id,
                    songId: Number(currentSongId)
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
        const positionField =
            playMode === 'orderPlay' ? 'originalPosition' : 'shufflePosition'
        const currentPosition = currentItem[positionField]

        let previousSong = await this.prisma.playQueue.findFirst({
            where: {
                userId: user.id,
                [positionField]: {
                    lt: currentPosition
                }
            },
            orderBy: {
                [positionField]: 'desc'
            },
            select: {
                songId: true
            }
        })

        if (!previousSong) {
            // 循环到最后一首
            previousSong = await this.prisma.playQueue.findFirst({
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
        }
        return {
            code: 200,
            message: '获取上一首成功',
            data: {
                songId: String(previousSong?.songId)
            }
        }
    }

    async removeFromQueue(queueItemId: string, user: any) {
        const { id: userId } = user

        const queueItem = await this.prisma.playQueue.findFirst({
            where: {
                id: Number(queueItemId),
                userId
            }
        })

        if (!queueItem) {
            throw new Error('队列项不存在')
        }

        await this.prisma.playQueue.delete({
            where: {
                id: Number(queueItemId)
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

    async updatePosition(queueItemId: string, newPosition: number, user: any) {
        const { id: userId } = user

        const queueItem = await this.prisma.playQueue.findFirst({
            where: {
                id: Number(queueItemId),
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
                id: Number(queueItemId)
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
