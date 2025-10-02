import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class PlayQueueService {
    constructor(private readonly prisma: PrismaService) {}

    async addToPlayQueue(songIdList: string[], user: any) {
        const { id: userId } = user

        // 检查队列是否为空
        const queueCount = await this.prisma.playQueue.count({
            where: { userId }
        })

        const isEmptyQueue = queueCount === 0

        const maxPositionItem = await this.prisma.playQueue.findFirst({
            where: { userId },
            orderBy: { shufflePosition: 'desc' }
        })
        let nextPosition = maxPositionItem
            ? maxPositionItem.shufflePosition + 1
            : 0

        // 如果队列为空，先随机化歌曲顺序
        let songsToAdd = songIdList.map((id) => parseInt(id))
        if (isEmptyQueue && songsToAdd.length > 1) {
            // Fisher-Yates 洗牌算法
            for (let i = songsToAdd.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[songsToAdd[i], songsToAdd[j]] = [songsToAdd[j], songsToAdd[i]]
            }
        }

        for (let songId of songsToAdd) {
            const existingItem = await this.prisma.playQueue.findUnique({
                where: {
                    userId_songId: {
                        userId,
                        songId
                    }
                }
            })
            if (!existingItem) {
                await this.prisma.playQueue.create({
                    data: {
                        userId,
                        songId,
                        shufflePosition: nextPosition,
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
        await this.prisma.playQueue.deleteMany({
            where: { userId }
        })

        // 随机化歌曲顺序 (Fisher-Yates 洗牌算法)
        const shuffledSongs = [...allSongs]
        for (let i = shuffledSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledSongs[i], shuffledSongs[j]] = [
                shuffledSongs[j],
                shuffledSongs[i]
            ]
        }

        // 批量创建队列项
        const queueItems = shuffledSongs.map((song, index) => ({
            userId,
            songId: song.id,
            shufflePosition: index,
            originalPosition: index
        }))

        await this.prisma.playQueue.createMany({
            data: queueItems
        })

        return {
            code: 200,
            message: '添加成功',
            count: allSongs.length
        }
    }

    async getPlayQueue(user: any) {
        const { id: userId } = user
        return this.prisma.playQueue.findMany({
            where: { userId },
            orderBy: { shufflePosition: 'asc' },
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
            playMode === 'order' ? 'originalPosition' : 'shufflePosition'
        const currentPosition =
            playMode === 'order'
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
            playMode === 'order' ? 'originalPosition' : 'shufflePosition'
        const currentPosition =
            playMode === 'order'
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
