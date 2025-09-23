import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class QueueItemsService {
    constructor(private readonly prisma: PrismaService) {}

    private async getRandomSongByWeight(currentQueueItemId: number, user: any) {
        const queueItems = await this.prisma.queueItem.findMany({
            where: {
                userId: user.id,
                songId: {
                    not: currentQueueItemId
                }
            },
            select: {
                songId: true
            },
            orderBy: {
                position: 'asc'
            }
        })
        if (queueItems.length === 0) {
            return null
        }
        const songIds = queueItems.map((item) => item.songId)

        // 获取最近播放的歌曲（最近30分钟内播放的）
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
        const recentlyPlayedSongs = await this.prisma.playRecord.findMany({
            where: {
                userId: user.id,
                songId: {
                    in: songIds
                },
                updatedAt: {
                    gte: thirtyMinutesAgo
                }
            },
            select: {
                songId: true
            }
        })
        const recentlyPlayedSongIds = recentlyPlayedSongs.map(
            (record) => record.songId
        )

        // 获取所有歌曲的播放记录，包括未播放的歌曲
        const playRecords = await this.prisma.playRecord.findMany({
            where: {
                userId: user.id,
                songId: {
                    in: songIds
                }
            },
            select: {
                songId: true,
                playCount: true
            }
        })

        // 创建播放次数映射
        const playCountMap = new Map()
        playRecords.forEach((record) => {
            playCountMap.set(record.songId, record.playCount)
        })

        // 计算所有歌曲的权重
        const songWeights = songIds.map((songId) => {
            const playCount = playCountMap.get(songId) || 0
            let weight = 1 / (playCount + 1)

            // 如果是最近播放过的歌曲，大幅降低权重
            if (recentlyPlayedSongIds.includes(songId)) {
                weight *= 0.1 // 权重降低到原来的10%
            }

            return { songId, weight }
        })

        // 计算总权重
        const totalWeight = songWeights.reduce(
            (sum, item) => sum + item.weight,
            0
        )

        // 随机选择
        const random = Math.random() * totalWeight
        let currentWeight = 0
        let selectedSongId = songIds[0] // 默认值

        for (const item of songWeights) {
            currentWeight += item.weight
            if (random <= currentWeight) {
                selectedSongId = item.songId
                break
            }
        }

        const song = await this.prisma.song.findUnique({
            where: {
                id: selectedSongId
            },
            select: {
                id: true
            }
        })
        return song
    }

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
        return { message: '添加成功' }
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

    async getNextQueueItem(
        currentQueueItemId: number,
        playMode: string,
        user: any
    ) {
        if (playMode === 'orderPlay') {
            const currentItem = await this.prisma.queueItem.findUnique({
                where: {
                    userId_songId: {
                        userId: user.id,
                        songId: currentQueueItemId
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
                include: {
                    song: {
                        select: {
                            id: true
                        }
                    }
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
                    include: {
                        song: {
                            select: {
                                id: true
                            }
                        }
                    }
                })
                return firstSong?.song
            }
            return nextSong?.song
        } else if (playMode === 'randomPlay') {
            return await this.getRandomSongByWeight(currentQueueItemId, user)
        }
    }

    async getPreviousQueueItem(
        currentQueueItemId: number,
        playMode: string,
        user: any
    ) {
        if (playMode === 'orderPlay') {
            const currentItem = await this.prisma.queueItem.findUnique({
                where: {
                    userId_songId: {
                        userId: user.id,
                        songId: currentQueueItemId
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
                include: {
                    song: {
                        select: {
                            id: true
                        }
                    }
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
                    include: {
                        song: {
                            select: {
                                id: true
                            }
                        }
                    }
                })
                return lastSong?.song
            }
            return previousSong?.song
        } else if (playMode === 'randomPlay') {
            return await this.getRandomSongByWeight(currentQueueItemId, user)
        }
    }
}
