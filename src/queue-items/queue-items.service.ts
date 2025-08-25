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

    async getNextSong(currentSongId: number, playMode: string, user: any) {
        if (playMode === 'orderPlay') {
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
                include: {
                    song: {
                        select: {
                            id: true,
                            title: true,
                            artist: true,
                            album: true,
                            cover: true,
                            duration: true
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
                                id: true,
                                title: true,
                                artist: true,
                                album: true,
                                cover: true,
                                duration: true
                            }
                        }
                    }
                })
                return firstSong?.song
            }
            return nextSong?.song
        } else if (playMode === 'randomPlay') {
            const queueItems = await this.prisma.queueItem.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        not: currentSongId
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
            const playedSongs = await this.prisma.playRecord.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        in: songIds
                    }
                },
                select: {
                    songId: true
                }
            })
            const playedSongIds = playedSongs.map((item) => item.songId)
            const unplayedSongs = songIds.filter(
                (id) => !playedSongIds.includes(id)
            )
            if (unplayedSongs.length > 0) {
                const randomIndex = Math.floor(
                    Math.random() * unplayedSongs.length
                )
                const songId = unplayedSongs[randomIndex]
                const song = await this.prisma.song.findUnique({
                    where: {
                        id: songId
                    },
                    select: {
                        id: true,
                        title: true,
                        artist: true,
                        album: true,
                        cover: true,
                        duration: true
                    }
                })
                return song
            }
            const lastPlayedSongs = await this.prisma.playRecord.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        in: songIds
                    }
                },
                orderBy: {
                    playCount: 'asc'
                },
                select: {
                    song: {
                        select: {
                            id: true,
                            title: true,
                            artist: true,
                            album: true,
                            cover: true,
                            duration: true
                        }
                    }
                }
            })
            if (lastPlayedSongs.length > 0) {
                const randomIndex = Math.floor(
                    Math.random() * lastPlayedSongs.length
                )
                return lastPlayedSongs[randomIndex].song
            }
            return null
        }
    }

    async getPreviousSong(currentSongId: number, playMode: string, user: any) {
        if (playMode === 'orderPlay') {
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
                include: {
                    song: {
                        select: {
                            id: true,
                            title: true,
                            artist: true,
                            album: true,
                            cover: true,
                            duration: true
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
                                id: true,
                                title: true,
                                artist: true,
                                album: true,
                                cover: true,
                                duration: true
                            }
                        }
                    }
                })
                return lastSong?.song
            }
            return previousSong?.song
        } else if (playMode === 'randomPlay') {
            const queueItems = await this.prisma.queueItem.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        not: currentSongId
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
            const playedSongs = await this.prisma.playRecord.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        in: songIds
                    }
                },
                select: {
                    songId: true
                }
            })
            const playedSongIds = playedSongs.map((item) => item.songId)
            const unplayedSongs = songIds.filter(
                (id) => !playedSongIds.includes(id)
            )
            if (unplayedSongs.length > 0) {
                const randomIndex = Math.floor(
                    Math.random() * unplayedSongs.length
                )
                const songId = unplayedSongs[randomIndex]
                const song = await this.prisma.song.findUnique({
                    where: {
                        id: songId
                    },
                    select: {
                        id: true,
                        title: true,
                        artist: true,
                        album: true,
                        cover: true,
                        duration: true
                    }
                })
                return song
            }
            const lastPlayedSongs = await this.prisma.playRecord.findMany({
                where: {
                    userId: user.id,
                    songId: {
                        in: songIds
                    }
                },
                orderBy: {
                    playCount: 'asc'
                },
                select: {
                    song: {
                        select: {
                            id: true,
                            title: true,
                            artist: true,
                            album: true,
                            cover: true,
                            duration: true
                        }
                    }
                }
            })
            if (lastPlayedSongs.length > 0) {
                const randomIndex = Math.floor(
                    Math.random() * lastPlayedSongs.length
                )
                return lastPlayedSongs[randomIndex].song
            }
            return null
        }
    }
}
