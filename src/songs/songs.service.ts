import { Injectable, StreamableFile } from '@nestjs/common'
import { createReadStream } from 'fs'
import { extname, join } from 'path'
import { PrismaService } from 'src/prisma/prisma.service'
import { UtilsService } from 'src/utils/utils.service'
import { MIME_TYPE_MAP } from 'src/utils/musicExtensions'

@Injectable()
export class SongsService {
    constructor(
        private prisma: PrismaService,
        private utils: UtilsService
    ) {}

    private readonly musicDir = join(process.cwd(), 'music')

    // 扫描所有歌曲
    async scanAllSongs(scanAll: boolean = false) {
        const result = await this.utils.scanDir(this.musicDir, scanAll)
        return result
    }

    // 获取歌曲流
    async getStreamById(id: number): Promise<StreamableFile> {
        const song = await this.prisma.song.findUnique({ where: { id } })
        if (!song) {
            throw new Error('Song not found')
        }
        const file = createReadStream(song.filePath)
        const ext = extname(song.filePath).toLowerCase()
        const type = MIME_TYPE_MAP[ext] || 'application/octet-stream'
        return new StreamableFile(file, {
            type,
            disposition: `inline; filename="${encodeURIComponent(song.title)}"`
        })
    }

    // 获取歌曲列表
    async getSongsList() {
        return this.prisma.song.findMany()
    }

    // // 增加播放次数
    // async addPlayCount(id: number) {
    //     return this.prisma.song.update({
    //         where: { id },
    //         data: { playCount: { increment: 1 } }
    //     })
    // }

    // // 获取播放次数最少的歌曲
    // async getMinPlayCountSong(ids: string) {
    //     return this.prisma.song.findFirst({
    //         where: {
    //             id: {
    //                 in: ids.split(',').map((id) => Number(id))
    //             }
    //         },
    //         orderBy: {
    //             playCount: 'asc'
    //         }
    //     })
    // }

    // 获取歌曲详情
    async getSongDetail(id: number) {
        return this.prisma.song.findUnique({ where: { id } })
    }
}
